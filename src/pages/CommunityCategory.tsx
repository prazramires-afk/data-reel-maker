import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Project } from "@/lib/types";
import { getCommunityProjectsByCategory } from "@/lib/storage";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { CommunityProjectCard } from "@/components/CommunityProjectCard";
import { Breadcrumbs } from "@/components/article/Breadcrumbs";
import { breadcrumbLd, collectionLd } from "@/lib/seo/jsonLd";
import { CATEGORIES, CategoryMeta } from "@/lib/seo/categories";

const SITE = "https://data-reel-maker.lovable.app";

export default function CommunityCategory({ category }: { category: CategoryMeta }) {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    getCommunityProjectsByCategory(category.slug, 48).then(setProjects);
  }, [category.slug]);

  const path = `/community/${category.slug}`;
  const items = (projects || []).map((p) => ({
    name: p.settings?.title || p.name,
    url: `${SITE}/community/${p.slug || p.id}`,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={category.title}
        description={category.description}
        path={path}
        jsonLd={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Community", path: "/community" },
            { name: category.name, path },
          ]),
          collectionLd(category.title, category.description, `${SITE}${path}`, items),
        ]}
      />
      <div className="max-w-6xl mx-auto px-5 py-6 w-full flex-1">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Community", path: "/community" },
            { name: category.name },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{category.name} Data Videos</h1>
          <p className="text-muted-foreground mt-3 max-w-3xl">{category.intro}</p>
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="All categories">
            {CATEGORIES.filter((c) => c.slug !== "other").map((c) => (
              <Link
                key={c.slug}
                to={`/community/${c.slug}`}
                className={
                  "px-3 py-1.5 rounded-full text-xs font-semibold border " +
                  (c.slug === category.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/40")
                }
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </header>
        {projects === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[16/9] rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <p className="text-foreground font-semibold">No videos in {category.name} yet</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
              Be the first to publish a {category.name.toLowerCase()} data video.
            </p>
            <Link to="/create" className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Create a video
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <CommunityProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}