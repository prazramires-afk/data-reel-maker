import { Link } from "react-router-dom";
import { Eye, Heart, Download, Repeat2 } from "lucide-react";
import { Project } from "@/lib/types";
import { CommunityProjectCard } from "@/components/CommunityProjectCard";

function fmt(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return v.toString();
}

/**
 * Richer card: animated preview, stats row, author chip.
 * Wraps the existing canvas preview component.
 */
export function CommunityCard({ project }: { project: Project }) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-colors flex flex-col">
      <CommunityProjectCard project={project} />
      <div className="px-4 pb-4 -mt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {fmt(project.viewCount)}</span>
            <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {fmt(project.likeCount)}</span>
            <span className="inline-flex items-center gap-1"><Download className="w-3 h-3" /> {fmt(project.downloadCount)}</span>
            {(project.remixCount || 0) > 0 && (
              <span className="inline-flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {fmt(project.remixCount)}</span>
            )}
          </div>
        </div>
        {project.authorName && (
          <Link
            to={`/u/${encodeURIComponent(project.authorName.toLowerCase().replace(/[^a-z0-9_]+/g, ""))}`}
            className="block text-[11px] text-muted-foreground mt-1 hover:text-primary truncate"
          >
            by @{project.authorName}
          </Link>
        )}
      </div>
    </div>
  );
}

export default CommunityCard;