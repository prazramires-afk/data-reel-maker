import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Trash2, ExternalLink, Pencil, Save, X, Globe, Lock, Heart, Download, Repeat2 } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Project } from "@/lib/types";
import { deleteProject, getProjects, setProjectPublic, updateProjectMetadata } from "@/lib/storage";
import { CATEGORIES } from "@/lib/seo/categories";
import { toast } from "@/hooks/use-toast";

const DashboardVideos = () => {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const reload = () => getProjects().then(setProjects);
  useEffect(() => { reload(); }, []);

  if (!projects) {
    return <>
      <Seo title="My Videos — Dashboard" description="Manage your videos" path="/dashboard/videos" noindex />
      <div className="h-40" />
    </>;
  }

  return (
    <>
      <Seo title="My Videos — Dashboard" description="Manage your data videos." path="/dashboard/videos" noindex />
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">My Videos</h1>
      <p className="text-muted-foreground mb-6">Hide, unpublish, edit metadata, or delete your videos.</p>
      {projects.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center border border-border/50">
          <p className="text-muted-foreground mb-4">You haven't created any videos yet.</p>
          <Link to="/create?new=1" className="inline-block px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Create one</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <VideoRow key={p.id} project={p} editing={editing === p.id} onEdit={() => setEditing(p.id)} onClose={() => setEditing(null)} onChanged={reload} />
          ))}
        </div>
      )}
    </>
  );
};

function VideoRow({ project, editing, onEdit, onClose, onChanged }: { project: Project; editing: boolean; onEdit: () => void; onClose: () => void; onChanged: () => void }) {
  const [title, setTitle] = useState(project.settings?.title || project.name);
  const [description, setDescription] = useState(project.description || "");
  const [category, setCategory] = useState(project.category || "");
  const [tagsStr, setTagsStr] = useState((project.tags || []).join(", "));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await updateProjectMetadata(project.id, {
      title: title.trim() || "Untitled",
      description: description.trim() || null,
      category: category || null,
      tags: tagsStr.split(",").map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "")).filter(Boolean).slice(0, 12),
    });
    setBusy(false);
    if (ok) { toast({ title: "Saved" }); onChanged(); onClose(); }
    else toast({ title: "Save failed", variant: "destructive" });
  };

  const toggleHidden = async () => {
    const ok = await updateProjectMetadata(project.id, { hidden: !project.hidden });
    if (ok) { toast({ title: project.hidden ? "Video unhidden" : "Video hidden" }); onChanged(); }
  };
  const togglePublic = async () => {
    const next = !project.isPublic;
    const { ok } = await setProjectPublic(project.id, next);
    if (ok) { toast({ title: next ? "Published" : "Unpublished" }); onChanged(); }
  };
  const onDelete = async () => {
    if (!confirm("Delete this video permanently?")) return;
    await deleteProject(project.id);
    toast({ title: "Deleted" });
    onChanged();
  };

  const slug = project.slug || project.id;

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold text-foreground" />
          ) : (
            <div className="font-semibold text-foreground truncate">{project.settings?.title || project.name}</div>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {project.isPublic ? (
              <span className="inline-flex items-center gap-1 text-primary"><Globe className="w-3 h-3" /> Public</span>
            ) : (
              <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
            )}
            {project.hidden && <span className="text-amber-400">Hidden</span>}
            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {project.viewCount?.toLocaleString() ?? 0}</span>
            <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {project.likeCount?.toLocaleString() ?? 0}</span>
            <span className="inline-flex items-center gap-1"><Download className="w-3 h-3" /> {project.downloadCount?.toLocaleString() ?? 0}</span>
            <span className="inline-flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {project.remixCount?.toLocaleString() ?? 0}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {project.isPublic && (
            <Link to={`/community/${slug}`} className="p-2 rounded-lg hover:bg-secondary" title="View public page">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
          <button onClick={editing ? onClose : onEdit} className="p-2 rounded-lg hover:bg-secondary" title="Edit metadata">
            {editing ? <X className="w-4 h-4 text-muted-foreground" /> : <Pencil className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button onClick={togglePublic} className="p-2 rounded-lg hover:bg-secondary" title={project.isPublic ? "Unpublish" : "Publish"}>
            {project.isPublic ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Globe className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button onClick={toggleHidden} className="p-2 rounded-lg hover:bg-secondary" title={project.hidden ? "Unhide" : "Hide"}>
            {project.hidden ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-destructive/15 text-destructive" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {editing && (
        <div className="mt-3 space-y-3">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (used for SEO and previews)" rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="">Uncategorized</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="tags, comma, separated" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
          <div className="flex justify-end">
            <button disabled={busy} onClick={save} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm disabled:opacity-50">
              <Save className="w-4 h-4" /> {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardVideos;