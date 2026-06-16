import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Project } from "@/lib/types";
import { searchCommunity } from "@/lib/storage";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { CommunityCard } from "@/components/community/CommunityCard";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { breadcrumbLd, collectionLd } from "@/lib/seo/jsonLd";

const SITE = "https://data-reel-maker.lovable.app";

export default function TagPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const tag = slug.toLowerCase();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    if (!tag) return;
    setProjects(null);
    searchCommunity({ tag, sort: "trending", limit: 60 }).then(setProjects);
  }, [tag]);

  const title = `#${tag} — Data Videos`;
  const description = `Animated data videos tagged ${tag}. Browse and remix community charts on ${tag}.`;
  const path = `/tag/${tag}`;

  const items = (projects || []).map((p) => ({
    name: p.settings?.title || p.name,
    url: `${SITE}/community/${p.slug || p.id}`,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={title}
        description={description}
        path={path}
        jsonLd={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Community", path: "/community" },
            { name: `#${tag}`, path },
          ]),
          collectionLd(title, description, `${SITE}${path}`, items),
        ]}
      />
      <div className="max-w-6xl mx-auto px-5 py-6 w-full flex-1">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Community", path: "/community" }, { name: `#${tag}` }]} />
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tag</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">#{tag}</h1>
          <p className="text-muted-foreground mt-2">All community data videos tagged <span className="text-foreground">#{tag}</span>.</p>
        </header>
        {projects === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[16/9] rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-foreground font-semibold">No videos tagged #{tag} yet</p>
            <Link to="/community" className="mt-4 inline-block text-primary font-semibold">Browse community →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => <CommunityCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}