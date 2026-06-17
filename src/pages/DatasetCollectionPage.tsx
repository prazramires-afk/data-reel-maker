import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { DatasetCard } from "@/components/dataset/DatasetCard";
import { getDatasetCollectionBySlug, type Dataset, type DatasetCollection } from "@/lib/datasets";
import { breadcrumbLd, collectionLd } from "@/lib/seo/jsonLd";
import NotFound from "./NotFound";

const SITE = "https://data-reel-maker.lovable.app";

export default function DatasetCollectionPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [state, setState] = useState<{ collection: DatasetCollection; items: Dataset[] } | null | undefined>(undefined);

  useEffect(() => {
    setState(undefined);
    getDatasetCollectionBySlug(slug).then((d) => setState(d));
  }, [slug]);

  if (state === undefined) return <div className="min-h-screen" />;
  if (state === null) return <NotFound />;

  const { collection, items } = state;
  const path = `/collections/${collection.slug}`;
  const title = `${collection.name} — Dataset Collection`;
  const description = collection.description || `${items.length} curated datasets in the ${collection.name} collection.`;

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
            { name: "Collections", path: "/datasets" },
            { name: collection.name, path },
          ]),
          collectionLd(
            collection.name,
            description,
            `${SITE}${path}`,
            items.map((d) => ({ name: d.title, url: `${SITE}/datasets/${d.slug}` })),
          ),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">
        <Breadcrumbs items={[
          { name: "Home", path: "/" },
          { name: "Datasets", path: "/datasets" },
          { name: collection.name },
        ]} />
        <header className="mb-6">
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Collection</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{collection.name}</h1>
          {collection.description && (
            <p className="mt-3 text-muted-foreground max-w-2xl">{collection.description}</p>
          )}
        </header>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-foreground font-semibold">This collection is empty.</p>
            <Link to="/datasets" className="mt-4 inline-block text-primary font-semibold">Browse all datasets →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((d) => <DatasetCard key={d.id} dataset={d} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}