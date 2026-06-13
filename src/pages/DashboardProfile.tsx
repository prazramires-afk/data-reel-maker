import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Upload, ExternalLink, Check } from "lucide-react";
import { Seo } from "@/components/Seo";
import { toast } from "@/hooks/use-toast";
import {
  Profile,
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  validateUsername,
} from "@/lib/profile";

const DashboardProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    website_url: "",
    twitter_url: "",
    youtube_url: "",
    tiktok_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile().then((p) => {
      if (!p) return;
      setProfile(p);
      setForm({
        username: p.username,
        display_name: p.display_name ?? "",
        bio: p.bio ?? "",
        avatar_url: p.avatar_url ?? "",
        website_url: p.website_url ?? "",
        twitter_url: p.twitter_url ?? "",
        youtube_url: p.youtube_url ?? "",
        tiktok_url: p.tiktok_url ?? "",
      });
    });
  }, []);

  const handleUsernameChange = (v: string) => {
    const lower = v.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setForm((f) => ({ ...f, username: lower }));
    setUsernameError(lower === profile?.username ? null : validateUsername(lower));
  };

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large (max 2MB)" });
      return;
    }
    setUploading(true);
    const url = await uploadAvatar(file);
    setUploading(false);
    if (!url) {
      toast({ title: "Upload failed" });
      return;
    }
    setForm((f) => ({ ...f, avatar_url: url }));
    toast({ title: "Avatar uploaded" });
  };

  const handleSave = async () => {
    if (usernameError) {
      toast({ title: usernameError });
      return;
    }
    setSaving(true);
    const res = await updateMyProfile({
      username: form.username,
      display_name: form.display_name.trim().slice(0, 60) || null,
      bio: form.bio.trim().slice(0, 280) || null,
      avatar_url: form.avatar_url.trim() || null,
      website_url: form.website_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      youtube_url: form.youtube_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: res.error || "Could not save" });
      return;
    }
    toast({ title: "Profile saved" });
    const fresh = await getMyProfile();
    if (fresh) setProfile(fresh);
  };

  const initial = (form.display_name || form.username || "?").slice(0, 1).toUpperCase();

  return (
    <>
      <Seo title="Edit profile — Dashboard" description="Update your creator profile." path="/dashboard/profile" noindex />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile</h1>
        {profile && (
          <Link
            to={`/u/${profile.username}`}
            className="text-xs text-primary inline-flex items-center gap-1 font-semibold"
            target="_blank"
          >
            View public profile <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* Form */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden text-2xl font-bold text-foreground">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <label className="inline-flex items-center gap-2 bg-secondary px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-transform">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading…" : "Upload avatar"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                }}
              />
            </label>
          </div>

          <Field
            label="Username"
            prefix="data-reel-maker.lovable.app/u/"
            value={form.username}
            onChange={handleUsernameChange}
            error={usernameError}
            help="3–24 lowercase letters, numbers, or underscores."
          />

          <Field
            label="Display name"
            value={form.display_name}
            onChange={(v) => setForm((f) => ({ ...f, display_name: v.slice(0, 60) }))}
            placeholder="Your public name"
          />

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 280) }))}
              rows={3}
              maxLength={280}
              placeholder="Tell people what kind of videos you make"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:border-primary"
            />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">{form.bio.length}/280</div>
          </div>

          <Field
            label="Website"
            value={form.website_url}
            onChange={(v) => setForm((f) => ({ ...f, website_url: v }))}
            placeholder="https://"
            type="url"
          />
          <Field
            label="X / Twitter URL"
            value={form.twitter_url}
            onChange={(v) => setForm((f) => ({ ...f, twitter_url: v }))}
            placeholder="https://x.com/yourhandle"
            type="url"
          />
          <Field
            label="YouTube URL"
            value={form.youtube_url}
            onChange={(v) => setForm((f) => ({ ...f, youtube_url: v }))}
            placeholder="https://youtube.com/@yourchannel"
            type="url"
          />
          <Field
            label="TikTok URL"
            value={form.tiktok_url}
            onChange={(v) => setForm((f) => ({ ...f, tiktok_url: v }))}
            placeholder="https://tiktok.com/@yourhandle"
            type="url"
          />

          <button
            onClick={handleSave}
            disabled={saving || !!usernameError}
            className="self-start inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save changes
          </button>
        </div>

        {/* Live preview */}
        <aside className="bg-card rounded-2xl p-5 border border-border/50 h-fit md:sticky md:top-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Live preview
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden text-3xl font-bold text-foreground mb-3">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="font-bold text-lg text-foreground">{form.display_name || form.username}</div>
            <div className="text-xs text-muted-foreground">@{form.username}</div>
            {form.bio && <p className="text-sm text-foreground mt-3 whitespace-pre-line">{form.bio}</p>}
          </div>
        </aside>
      </div>
    </>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  help,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string | null;
  help?: string;
  prefix?: string;
}) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1.5">{label}</label>
    <div className={`flex items-center bg-background border rounded-xl overflow-hidden focus-within:border-primary ${error ? "border-destructive" : "border-border"}`}>
      {prefix && <span className="px-2.5 text-xs text-muted-foreground select-none">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none min-w-0"
      />
    </div>
    {error ? (
      <div className="text-xs text-destructive mt-1">{error}</div>
    ) : help ? (
      <div className="text-xs text-muted-foreground mt-1">{help}</div>
    ) : null}
  </div>
);

export default DashboardProfile;