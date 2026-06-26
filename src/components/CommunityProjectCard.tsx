import { Link } from "react-router-dom";
import { Project, VideoType } from "@/lib/types";
import LivePreview, { LivePreviewMode } from "@/components/LivePreview";

function toPreviewMode(type: VideoType | undefined): LivePreviewMode {
  switch (type) {
    case "timeline":
      return "timeline";
    case "top10":
      return "top10";
    case "comparison":
      return "comparison";
    case "bar_race":
    default:
      return "bar_race";
  }
}

export function CommunityProjectCard({ project }: { project: Project }) {
  const title = project.settings?.title || project.name || "Untitled";
  const data = project.data && project.data.length ? project.data : undefined;
  return (
    <Link
      to={`/community/${project.slug || project.id}`}
      className="block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-colors"
    >
      <LivePreview mode={toPreviewMode(project.type)} data={data} title={title} />
      <div className="p-4">
        <h3 className="font-bold text-foreground truncate">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {project.authorName ? `by ${project.authorName}` : "by a community creator"}
          {project.publishedAt ? ` · ${new Date(project.publishedAt).toLocaleDateString()}` : ""}
        </p>
      </div>
    </Link>
  );
}

export default CommunityProjectCard;