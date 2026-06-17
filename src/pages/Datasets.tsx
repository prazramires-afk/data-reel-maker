import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, TrendingUp, Clock, Flame, Download, Eye } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { DatasetCard } from "@/components/dataset/DatasetCard";
import {
  DATASET_CATEGORIES, DATASET_CATEGORY_LABEL,
  searchDatasets, getTrendingDatasets, listDatasetCollections,
  type Dataset, type DatasetSort, type DatasetCategory, type DatasetCollection,
} from "@/lib/datasets";
import { breadcrumbLd, collectionLd } from "@/lib/seo/jsonLd";

const SITE = "https://data-reel-maker.lovable.app";

const SORTS: { key: DatasetSort; label: string; icon: any }[] = [
  { key: "trending",        label: "Trending",        icon: Flame },
  { key: "most_used",       label: "Most Used",       icon: TrendingUp },
  { key: "most_downloaded", label: "Most Downloaded", icon: Download },
  { key: "most_viewed",     label: "Most Viewed",     icon: Eye },
  { key: "latest",          label: "Latest",          icon: Clock },
];

const Datasets = () => {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const sort = (params.get("sort") as DatasetSort) || "trending";
  const category = (params.get("c") as DatasetCategory) || "";
  const [datasets, setDatasets] = useState<Dataset[] | null>(null);
  const [trending, setTrending] = useState<Dataset[]>([]);
  const [collections, setCollections] = useState<DatasetCollection[]>([]);

  useEffect(() => {
    setDatasets(null);
    searchDatasets({
      q: query || undefined,
      sort,
      category: category || undefined,
      limit: 48,
    }).then(setDatasets);
  }, [query, sort, category]);

  useEffect(() => {
    getTrendingDatasets(6).then(setTrending);
    listDatasetCollections(8).then(setCollections);
  }, []);

  const updateParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const seoTitle = "Free Datasets for Animated Stats Videos — Data to Video";
  const seoDesc = "Browse community datasets on economy, finance, population, sports, technology, history and business. Download CSVs and turn any dataset into an animated chart video.";

  const jsonLd = useMemo(() => [
    breadcrumbLd([{ name: "Home", path: "/" }, { name: "Datasets", path: "/datasets" }]),
    collectionLd(
      "Data to Video — Datasets",
      seoDesc,
      `${SITE}/datasets`,
      (datasets ?? []).slice(0, 30).map((d) => ({ name: d.title, url: `${SITE}/datasets/${d.slug}` })),
    ),
  ], [datasets]);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title={seoTitle} description={seoDesc} path="/datasets" jsonLd={jsonLd} />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Datasets" }]} />
        <header className="mb-8">
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Dataset Network</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">Free datasets, ready to animate</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Search, remix, and animate datasets shared by the Data to Video community. Every dataset is one click away from becoming a vertical TikTok or Reels video.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/dashboard/datasets/new" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
              Publish a dataset
            </Link>
          </div>
        </header>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => updateParam("q", query || null)}
            onKeyDown={(e) => { if (e.key === "Enter") updateParam("q", query || null); }}
            placeholder="Search datasets — GDP, football, population…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Sort tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SORTS.map((s) => {
            const active = sort === s.key;
            return (
              <button
                key={s.key}
                onClick={() => updateParam("sort", s.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:opacity-90"
                }`}
              >
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => updateParam("c", null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${!category ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"}`}
          >
            All
          </button>
          {DATASET_CATEGORIES.filter((c) => c !== "other").map((c) => (
            <Link
              key={c}
              to={`/datasets/category/${c}`}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground hover:opacity-90"
            >
              {DATASET_CATEGORY_LABEL[c]}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {datasets === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-foreground font-semibold">No datasets match your search.</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to publish one.</p>
            <Link to="/dashboard/datasets/new" className="mt-4 inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
              Publish a dataset
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((d) => <DatasetCard key={d.id} dataset={d} />)}
          </div>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground mb-4 inline-flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" /> Trending right now
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((d) => <DatasetCard key={d.id} dataset={d} />)}
            </div>
          </section>
        )}

        {/* Collections */}
        {collections.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground mb-4">Curated collections</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  to={`/collections/${c.slug}`}
                  className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Collection</p>
                  <p className="font-semibold text-foreground mt-1">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Datasets;