import { Link } from "react-router-dom";
import type { Project } from "@/lib/types";

export function RelatedVideos({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-3">Related videos</h2>
      <ul className="grid sm:grid-cols-2 gap-3">
        {projects.map((p) => (
          <li key={p.id} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors">
            <Link to={`/community/${p.slug || p.id}`} className="block">
              <p className="font-semibold text-foreground line-clamp-2">{p.settings?.title || p.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {p.authorName ? `by ${p.authorName}` : "Community video"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}