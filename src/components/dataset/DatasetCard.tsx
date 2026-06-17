import { Link } from "react-router-dom";
import { Database, Eye, Download, Film } from "lucide-react";
import type { Dataset } from "@/lib/datasets";
import { DATASET_CATEGORY_LABEL } from "@/lib/datasets";

export function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <Link
      to={`/datasets/${dataset.slug}`}
      className="group bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-colors flex flex-col"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
          {DATASET_CATEGORY_LABEL[dataset.category] || "Other"}
        </span>
        {dataset.unit && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Database className="w-3 h-3" /> {dataset.unit}
          </span>
        )}
      </div>
      <h3 className="font-bold text-foreground line-clamp-2">{dataset.title}</h3>
      {dataset.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{dataset.description}</p>
      )}
      <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {dataset.viewCount.toLocaleString()}</span>
        <span className="inline-flex items-center gap-1"><Download className="w-3 h-3" /> {dataset.downloadCount.toLocaleString()}</span>
        <span className="inline-flex items-center gap-1"><Film className="w-3 h-3" /> {dataset.useCount.toLocaleString()}</span>
      </div>
    </Link>
  );
}