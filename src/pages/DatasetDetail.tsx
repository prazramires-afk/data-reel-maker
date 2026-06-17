import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { DatasetChart } from "@/components/dataset/DatasetChart";
import { DatasetTableView } from "@/components/dataset/DatasetTableView";
import { DatasetStatsBlock } from "@/components/dataset/DatasetStatsBlock";
import { DatasetActions } from "@/components/dataset/DatasetActions";
import { DatasetCard } from "@/components/dataset/DatasetCard";
import { RelatedDatasetVideos } from "@/components/dataset/RelatedDatasetVideos";
import {
  DATASET_CATEGORY_LABEL,
  getDatasetBySlug, getRelatedDatasets, getVideosForDataset, recordDatasetEvent,
  type Dataset,
} from "@/lib/datasets";
import { breadcrumbLd } from "@/lib/seo/jsonLd";
import NotFound from "./NotFound";

const SITE = "https://data-reel-maker.lovable.app";

export default function DatasetDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [dataset, setDataset] = useState<Dataset | null | undefined>(undefined);
  const [related, setRelated] = useState<Dataset[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    setDataset(undefined);
    getDatasetBySlug(slug).then((d) => {
      if (!alive) return;
      setDataset(d);
      if (d) {
        recordDatasetEvent(d.id, "view");
        getRelatedDatasets(d, 6).then(setRelated);
        getVideosForDataset(d.id, 9).then(setVideos);
      }
    });
    return () => { alive = false; };
  }, [slug]);

  if (dataset === undefined) {
    return <div className="min-h-screen" />;
  }
  if (dataset === null) return <NotFound />;

  const url = `${SITE}/datasets/${dataset.slug}`;
  const description = dataset.description
    || `${dataset.title} dataset — ${dataset.data.length} entries${dataset.unit ? ` in ${dataset.unit}` : ""}. Free download, instant animated video.`;
  const seoTitle = `${dataset.title} — Free Dataset & Animated Video`;

  const years = Array.from(new Set(dataset.data.map((r) => r.year))).sort();
  const labels = Array.from(new Set(dataset.data.map((r) => r.label)));

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: dataset.title,
    description,
    url,
    keywords: [dataset.category, ...dataset.tags].join(", "),
    isAccessibleForFree: true,
    creator: dataset.sourceName ? { "@type": "Organization", name: dataset.sourceName } : undefined,
    variableMeasured: dataset.unit ? `${labels[0] || "value"} (${dataset.unit})` : labels[0] || "value",
    temporalCoverage: years.length > 1 ? `${years[0]}/${years[years.length - 1]}` : years[0] ? String(years[0]) : undefined,
    distribution: [{
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: url,
    }],
  };

  const breadcrumb = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Datasets", path: "/datasets" },
    { name: DATASET_CATEGORY_LABEL[dataset.category], path: `/datasets/category/${dataset.category}` },
    { name: dataset.title, path: `/datasets/${dataset.slug}` },
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title={seoTitle} description={description} path={`/datasets/${dataset.slug}`} jsonLd={[datasetSchema, breadcrumb]} />
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto px-5 py-8 w-full">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Datasets", path: "/datasets" },
            { name: DATASET_CATEGORY_LABEL[dataset.category], path: `/datasets/category/${dataset.category}` },
            { name: dataset.title },
          ]}
        />

        <header className="mb-6">
          <Link
            to={`/datasets/category/${dataset.category}`}
            className="inline-block mb-3 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-semibold bg-primary/10 text-primary"
          >
            {DATASET_CATEGORY_LABEL[dataset.category]}
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{dataset.title}</h1>
          {dataset.description && (
            <p className="mt-3 text-muted-foreground leading-relaxed">{dataset.description}</p>
          )}
          <div className="mt-5">
            <DatasetActions dataset={dataset} />
          </div>
        </header>

        {/* Interactive chart */}
        <section className="mb-6">
          <h2 className="sr-only">Chart</h2>
          <DatasetChart dataset={dataset} />
        </section>

        {/* Stats */}
        <div className="mb-6">
          <DatasetStatsBlock dataset={dataset} />
        </div>

        {/* Source */}
        {(dataset.sourceName || dataset.sourceUrl) && (
          <section className="mb-6 bg-card border border-border rounded-2xl px-5 py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Source</p>
            <p className="text-sm text-foreground mt-1">
              {dataset.sourceName || "External source"}
              {dataset.sourceUrl && (
                <a
                  href={dataset.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  className="ml-2 inline-flex items-center gap-1 text-primary font-semibold"
                >
                  visit <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
          </section>
        )}

        {/* Tags */}
        {dataset.tags.length > 0 && (
          <section className="mb-6">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {dataset.tags.map((t) => (
                <Link
                  key={t}
                  to={`/tag/${t}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground hover:opacity-90"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* HTML table */}
        <div className="mb-8">
          <DatasetTableView dataset={dataset} />
        </div>

        {/* Related videos */}
        {videos.length > 0 && (
          <div className="mb-8">
            <RelatedDatasetVideos videos={videos} />
          </div>
        )}

        {/* Related datasets */}
        {related.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3">Related datasets</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((d) => <DatasetCard key={d.id} dataset={d} />)}
            </div>
          </section>
        )}

        <section className="mt-12 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-bold text-foreground">Animate this dataset</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Drop it into the editor and export a vertical MP4 in under two minutes.
          </p>
          <Link to={`/create?dataset=${dataset.slug}`} className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            Open the editor
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}