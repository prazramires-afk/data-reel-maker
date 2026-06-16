import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CollectionDetail, getCollectionBySlug } from "@/lib/storage";
import { Project } from "@/lib/types";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { CommunityCard } from "@/components/community/CommunityCard";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { breadcrumbLd, collectionLd } from "@/lib/seo/jsonLd";

const SITE = "https://data-reel-maker.lovable.app";

export default function CollectionPage() {
  const { username = "", slug = "" } = useParams<{ username: string; slug: string }>();
  const [data, setData] = useState<{ collection: CollectionDetail; items: Project[] } | null | undefined>(undefined);

  useEffect(() => {
    if (!username || !slug) return;
    getCollectionBySlug(username, slug).then((r) => setData(r ?? null));
  }, [username, slug]);

  if (data === undefined) {
    return <div className="min-h-screen" />;
  }
  if (data === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-5">
        <Seo title="Collection not found" description="This collection isn't available." path={`/u/${username}/c/${slug}`} noindex />
        <p className="text-foreground font-semibold">Collection not found</p>
        <Link to={`/u/${username}`} className="mt-4 text-primary font-semibold">@{username} →</Link>
      </div>
    );
  }

  const { collection: c, items } = data;
  const path = `/u/${username}/c/${slug}`;
  const owner = c.owner_display_name || `@${c.owner_username}`;
  const title = `${c.name} — Collection by ${owner}`;
  const description = c.description || `${items.length} data video${items.length === 1 ? "" : "s"} curated by ${owner} on Data to Video.`;

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={title}
        description={description}
        path={path}
        jsonLd={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: `@${c.owner_username}`, path: `/u/${c.owner_username}` },
            { name: c.name, path },
          ]),
          collectionLd(c.name, description, `${SITE}${path}`, items.map((p) => ({
            name: p.settings?.title || p.name,
            url: `${SITE}/community/${p.slug || p.id}`,
          }))),
        ]}
      />
      <div className="max-w-6xl mx-auto px-5 py-6 w-full flex-1">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: `@${c.owner_username}`, path: `/u/${c.owner_username}` }, { name: c.name }]} />
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Collection</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{c.name}</h1>
          {c.description && <p className="text-muted-foreground mt-2 max-w-2xl">{c.description}</p>}
          <p className="text-sm text-muted-foreground mt-2">
            {items.length} video{items.length === 1 ? "" : "s"} · curated by{" "}
            <Link to={`/u/${c.owner_username}`} className="text-primary font-semibold">{owner}</Link>
          </p>
        </header>
        {items.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">Empty collection.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => <CommunityCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}