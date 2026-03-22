import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Project } from "@/lib/types";
import { getProjects, deleteProject } from "@/lib/storage";

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(getProjects());
  };

  return (
    <div className="min-h-screen px-5 py-6 max-w-lg mx-auto">
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
              className="bg-card rounded-xl p-4 flex items-center justify-between opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">{project.name || "Untitled"}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {project.type === "bar_race" ? "Bar Chart Race" : project.type} · {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 ml-3">
                <button
                  onClick={() => navigate(`/create?edit=${project.id}`)}
                  className="p-2.5 rounded-lg bg-secondary active:scale-90 transition-transform"
                >
                  <Pencil className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2.5 rounded-lg bg-destructive/15 active:scale-90 transition-transform"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
