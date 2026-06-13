import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  created_at: string;
}

export interface PublicProfile extends Profile {
  total_videos: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export async function getPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("get_profile_by_username", {
    _username: username.toLowerCase(),
  });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    ...row,
    total_videos: Number(row.total_videos ?? 0),
    total_views: Number(row.total_views ?? 0),
    total_likes: Number(row.total_likes ?? 0),
    total_shares: Number(row.total_shares ?? 0),
  } as PublicProfile;
}

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export function validateUsername(username: string): string | null {
  const u = username.toLowerCase().trim();
  if (!USERNAME_RE.test(u)) {
    return "Use 3–24 lowercase letters, numbers, or underscores.";
  }
  return null;
}

export async function isUsernameAvailable(username: string, excludeId?: string): Promise<boolean> {
  const u = username.toLowerCase().trim();
  const q = supabase.from("profiles").select("id").eq("username", u).limit(1);
  const { data } = await q;
  if (!data || data.length === 0) return true;
  return excludeId ? data[0].id === excludeId : false;
}

export interface ProfileUpdate {
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
}

export async function updateMyProfile(patch: ProfileUpdate): Promise<{ ok: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (patch.username) {
    const u = patch.username.toLowerCase().trim();
    const v = validateUsername(u);
    if (v) return { ok: false, error: v };
    const avail = await isUsernameAvailable(u, user.id);
    if (!avail) return { ok: false, error: "Username already taken" };
    patch = { ...patch, username: u };
  }
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function uploadAvatar(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/png",
    cacheControl: "3600",
  });
  if (error) {
    console.error("uploadAvatar", error);
    return null;
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function recordProjectEvent(
  projectId: string,
  eventType: "view" | "like" | "share" | "download",
): Promise<void> {
  try {
    let visitorId: string | null = null;
    try {
      visitorId = localStorage.getItem("dtv_visitor_id");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("dtv_visitor_id", visitorId);
      }
    } catch {}
    await supabase.rpc("record_project_event", {
      _project_id: projectId,
      _event_type: eventType,
      _referrer: typeof document !== "undefined" ? document.referrer || null : null,
      _visitor_id: visitorId,
    });
  } catch (e) {
    console.warn("recordProjectEvent failed", e);
  }
}