import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { DatasetCard } from "@/components/dataset/DatasetCard";
import {
  DATASET_CATEGORIES, DATASET_CATEGORY_LABEL,
  searchDatasets, type Dataset, type DatasetCategory,
} from "@/lib/datasets";
import { breadcrumbLd, collectionLd } from "@/lib/seo/jsonLd";
import NotFound from "./NotFound";

const SITE = "https://data-reel-maker.lovable.app";

export default function DatasetCategoryPage() {
  const { category = "" } = useParams<{ category: string }>();
  const cat = category.toLowerCase() as DatasetCategory;
  const valid = (DATASET_CATEGORIES as readonly string[]).includes(cat);
  const [datasets, setDatasets] = useState<Dataset[] | null>(null);

  useEffect(() => {
    if (!valid) return;
    setDatasets(null);
    searchDatasets({ category: cat, sort: "most_used", limit: 60 }).then(setDatasets);
  }, [cat, valid]);

  if (!valid) return <NotFound />;

  const label = DATASET_CATEGORY_LABEL[cat];
  const title = `${label} Datasets — Free CSVs for Animated Videos`;
  const description = `Browse community ${label.toLowerCase()} datasets. Download CSVs and turn any dataset into a viral animated chart video.`;
  const path = `/datasets/category/${cat}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={title}
        description={description}
        path={path}
        jsonLd={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Datasets", path: "/datasets" },
            { name: label, path },
          ]),
          collectionLd(
            `${label} Datasets`,
            description,
            `${SITE}${path}`,
            (datasets ?? []).map((d) => ({ name: d.title, url: `${SITE}/datasets/${d.slug}` })),
          ),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">
        <Breadcrumbs items={[
          { name: "Home", path: "/" },
          { name: "Datasets", path: "/datasets" },
          { name: label },
        ]} />
        <header className="mb-6">
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Category</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{label} datasets</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>
        </header>

        {datasets === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-foreground font-semibold">No {label.toLowerCase()} datasets yet.</p>
            <Link to="/dashboard/datasets/new" className="mt-4 inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Publish the first one
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((d) => <DatasetCard key={d.id} dataset={d} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}