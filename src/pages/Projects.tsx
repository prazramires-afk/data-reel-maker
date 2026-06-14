import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Globe, Lock, Share2, Copy, Check } from "lucide-react";
import { Project } from "@/lib/types";
import { getProjects, deleteProject, setProjectPublic } from "@/lib/storage";
import { Seo } from "@/components/Seo";
import { communityUrl, copyToClipboard } from "@/lib/share";
import { toast } from "@/hooks/use-toast";

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setProjects(await getProjects());
  };

  const handlePublishToggle = async (project: Project) => {
    setBusyId(project.id);
    const next = !project.isPublic;
    let authorName: string | undefined;
    if (next) {
      const input = window.prompt(
        "Display name to show on the community page (optional, max 60 chars)",
        project.authorName || "",
      );
      if (input === null) {
        setBusyId(null);
        return;
      }
      authorName = input.trim().slice(0, 60) || undefined;
    }
    const res = await setProjectPublic(project.id, next, authorName);
    if (!res.ok) {
      toast({ title: next ? "Could not publish to community" : "Could not unpublish" });
      setBusyId(null);
      return;
    }
    setProjects(await getProjects());
    toast({ title: next ? "Published to community" : "Unpublished" });
    setBusyId(null);
  };

  const handleCopyLink = async (project: Project) => {
    const slugOrId = project.slug || project.id;
    const ok = await copyToClipboard(communityUrl(slugOrId));
    if (ok) {
      setCopiedId(project.id);
      toast({ title: "Community link copied" });
      setTimeout(() => setCopiedId((c) => (c === project.id ? null : c)), 2000);
    } else {
      window.open(communityUrl(slugOrId), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen px-5 py-6 max-w-lg mx-auto">
      <Seo
        title="My projects — Data to Video"
        description="Open, edit, or delete your saved data video projects."
        path="/projects"
        noindex
      />
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground mb-6 active:scale-95 transition-transform">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">My Projects</h1>

      {projects.length === 0 ? (
        <div className="text-center py-20 opacity-0 animate-fade-in">
          <p className="text-muted-foreground text-lg mb-4">No projects yet</p>
          <button
            onClick={() => navigate("/create")}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-95 transition-transform"
          >
            Create your first video
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="bg-card rounded-xl p-4 opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{project.name || "Untitled"}</h3>
                    {project.isPublic && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {project.type === "bar_race" ? "Bar Chart Race" : project.type} · {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/create?edit=${project.id}`)}
                    className="p-2.5 rounded-lg bg-secondary active:scale-90 transition-transform"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2.5 rounded-lg bg-destructive/15 active:scale-90 transition-transform"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePublishToggle(project)}
                  disabled={busyId === project.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform disabled:opacity-60 ${
                    project.isPublic
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {project.isPublic ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                  {project.isPublic ? "Unpublish" : "Publish to community"}
                </button>
                {project.isPublic && (
                  <>
                    <Link
                      to={`/community/${project.slug || project.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95 transition-transform"
                    >
                      <Share2 className="w-3 h-3" /> Open share page
                    </Link>
                    <button
                      onClick={() => handleCopyLink(project)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95 transition-transform"
                    >
                      {copiedId === project.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === project.id ? "Copied" : "Copy link"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
