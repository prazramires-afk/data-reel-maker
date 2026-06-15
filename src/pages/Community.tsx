import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Project } from "@/lib/types";
import { getCommunityProjects } from "@/lib/storage";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { CommunityProjectCard } from "@/components/CommunityProjectCard";
import { CATEGORIES } from "@/lib/seo/categories";

const Community = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    getCommunityProjects(48).then(setProjects);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Community Data Videos — Made by Real Creators"
        description="Browse animated data videos published by Data to Video creators. Remix, share or get inspired by the community."
        path="/community"
      />
      <div className="max-w-6xl mx-auto px-5 py-6 w-full flex-1">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground mb-6 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">Community data videos</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">Real charts published by Data to Video creators. Open any one to preview, share, or remix it.</p>
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Browse community categories">
            {CATEGORIES.filter((c) => c.slug !== "other").map((c) => (
              <Link key={c.slug} to={`/community/${c.slug}`} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border hover:border-primary/40">
                {c.name}
              </Link>
            ))}
          </nav>
        </div>

        {projects === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[16/9] rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-foreground font-semibold">Be the first to publish</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">No community videos yet. Create one and hit Publish on the Projects page to share it here.</p>
            <Link to="/create" className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Create a video</Link>
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
};

export default Community;