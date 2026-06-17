import { Link } from "react-router-dom";
import { Film } from "lucide-react";

export function RelatedDatasetVideos({ videos }: { videos: any[] }) {
  if (!videos.length) return null;
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-3">Videos made with this dataset</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((v) => {
          const title = (v.settings?.title as string) || v.name || "Untitled";
          const slug = v.slug || v.id;
          return (
            <Link
              key={v.id}
              to={`/community/${slug}`}
              className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground line-clamp-2">{title}</p>
                {v.author_name && (
                  <p className="text-xs text-muted-foreground mt-1">by {v.author_name}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}