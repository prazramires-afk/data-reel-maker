import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Share2, Play, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv, recordDatasetEvent, type Dataset } from "@/lib/datasets";
import { copyToClipboard } from "@/lib/share";

const SITE = "https://data-reel-maker.lovable.app";

export function DatasetActions({ dataset }: { dataset: Dataset }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE}/datasets/${dataset.slug}`;

  const handleDownload = async () => {
    downloadCsv(dataset);
    recordDatasetEvent(dataset.id, "download");
    toast.success("CSV downloaded");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: dataset.title, text: dataset.description ?? dataset.title, url });
        return;
      } catch (e: any) {
        if (e?.name !== "AbortError") console.warn(e);
      }
    }
    const ok = await copyToClipboard(url);
    if (ok) { setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 1800); }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to={`/create?dataset=${dataset.slug}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
      >
        <Play className="w-4 h-4" /> Create video
      </Link>
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm active:scale-95 transition-transform"
      >
        <Download className="w-4 h-4" /> Download CSV
      </button>
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm active:scale-95 transition-transform"
      >
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}