import { Project } from "./types";
import { supabase } from "@/integrations/supabase/client";

const PROJECTS_KEY = "dtv_projects";

function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProject(project: Project): void {
  const projects = getLocalProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.push(project);
  }
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    // Storage full — trim oldest projects and retry
    console.warn("Storage quota exceeded, trimming old projects");
    const trimmed = projects.slice(-5);
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(trimmed));
    } catch {
      // Still full — clear and save only current
      localStorage.removeItem(PROJECTS_KEY);
      try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify([project]));
      } catch {
        console.error("Cannot save to localStorage");
      }
    }
  }
}

function deleteLocalProject(id: string): void {
  const projects = getLocalProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (Math.random() * 16) >> (Number(c) / 4)
    ).toString(16),
  );
}

export function isValidProjectId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function rowToProject(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    data: r.data ?? [],
    settings: r.settings ?? {},
    labelImages: r.label_images ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    isPublic: r.is_public ?? false,
    publishedAt: r.published_at ?? null,
    authorName: r.author_name ?? null,
    slug: r.slug ?? null,
  };
}

/** Fetch projects for the current user (or all if admin via RLS). Falls back to localStorage when signed out. */
export async function getProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return getLocalProjects();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("getProjects error", error);
    return getLocalProjects();
  }
  return (data ?? []).map(rowToProject);
}

export async function saveProject(project: Project): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    saveLocalProject(project);
    return true;
  }
  const payload = {
    id: project.id,
    user_id: user.id,
    name: project.name || "Untitled",
    type: project.type,
    data: project.data as any,
    settings: project.settings as any,
    label_images: project.labelImages as any,
  };
  const { error } = await supabase.from("projects").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("saveProject error", error);
    saveLocalProject(project);
    return false;
  }
  return true;
}

export async function deleteProject(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    deleteLocalProject(id);
    return;
  }
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) console.error("deleteProject error", error);
}

/** Admin-only: fetch a single project by id (RLS allows admins). */
export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToProject(data);
}

/** Public — fetch a community project by slug. */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProject(data);
}

/** Resolve a community URL param that may be a slug or a legacy UUID. */
export async function getCommunityProjectByParam(param: string): Promise<Project | null> {
  if (isValidProjectId(param)) {
    const p = await getProjectById(param);
    if (p && p.isPublic) return p;
  }
  return getProjectBySlug(param);
}

/** Admin-only: fetch all projects belonging to a target user. */
export async function getProjectsByUser(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(rowToProject);
}

/** Toggle whether a project is visible to the community. */
export async function setProjectPublic(
  id: string,
  isPublic: boolean,
  authorName?: string,
): Promise<{ ok: boolean; slug?: string | null }> {
  let slug: string | null = null;
  if (isPublic) {
    // Look up the title so we can generate/refresh a readable slug.
    const { data: existing } = await supabase
      .from("projects")
      .select("name,settings,slug")
      .eq("id", id)
      .maybeSingle();
    const title =
      (existing?.settings as any)?.title || existing?.name || "Untitled";
    if (!existing?.slug) {
      try {
        const { data: slugData } = await supabase.rpc("generate_project_slug", {
          _title: title,
          _id: id,
        });
        if (typeof slugData === "string" && slugData.length > 0) slug = slugData;
      } catch (e) {
        console.warn("generate_project_slug failed", e);
      }
    } else {
      slug = existing.slug;
    }
  }
  const patch = {
    is_public: isPublic,
    published_at: isPublic ? new Date().toISOString() : null,
    ...(isPublic && authorName ? { author_name: authorName.slice(0, 60) } : {}),
    ...(isPublic && slug ? { slug } : {}),
  };
  const { data, error } = await supabase
    .from("projects")
    .update(patch as any)
    .eq("id", id)
    .select("id,slug")
    .maybeSingle();
  if (error || !data) {
    console.error("setProjectPublic error", error);
    return { ok: false };
  }
  return { ok: true, slug: (data as any).slug ?? slug };
}

/**
 * Publish a full project to the community in a single upsert.
 * Use this from the Create flow where the row may not yet exist in the DB
 * (e.g. previous save failed or only persisted to localStorage).
 */
export async function publishProject(
  project: Project,
  authorName?: string,
): Promise<{ ok: boolean; slug?: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("publishProject: not signed in");
    return { ok: false };
  }
  const title = project.settings?.title || project.name || "Untitled";
  let slug: string | null = null;
  try {
    const { data: slugData } = await supabase.rpc("generate_project_slug", {
      _title: title,
      _id: project.id,
    });
    if (typeof slugData === "string" && slugData.length > 0) slug = slugData;
  } catch (e) {
    console.warn("generate_project_slug failed, falling back", e);
  }
  const payload = {
    id: project.id,
    user_id: user.id,
    name: project.name || project.settings?.title || "Untitled",
    type: project.type,
    data: project.data as any,
    settings: project.settings as any,
    label_images: project.labelImages as any,
    is_public: true,
    published_at: new Date().toISOString(),
    ...(slug ? { slug } : {}),
    ...(authorName ? { author_name: authorName.slice(0, 60) } : {}),
  };
  const { data, error } = await supabase
    .from("projects")
    .upsert(payload, { onConflict: "id" })
    .select("id,slug")
    .maybeSingle();
  if (error || !data) {
    console.error("publishProject error", error);
    return { ok: false };
  }
  return { ok: true, slug: (data as any).slug ?? slug };
}

/** Public — fetch most recently published community projects. */
export async function getCommunityProjects(limit = 12): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_public", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getCommunityProjects error", error);
    return [];
  }
  return (data ?? []).map(rowToProject);
}
