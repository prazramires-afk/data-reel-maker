import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Flame, Sparkles } from "lucide-react";
import { Project } from "@/lib/types";
import { CommunitySort, CommunityWindow, getTrendingProjects, searchCommunity } from "@/lib/storage";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CATEGORIES } from "@/lib/seo/categories";

const SORTS: { key: CommunitySort; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "latest", label: "Latest" },
  { key: "views", label: "Most viewed" },
  { key: "likes", label: "Most liked" },
  { key: "remixed", label: "Most remixed" },
  { key: "downloads", label: "Most downloaded" },
];

const WINDOWS: { key: CommunityWindow; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "all", label: "All time" },
];

const Community = () => {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const sort = (sp.get("sort") as CommunitySort) || "trending";
  const win = (sp.get("window") as CommunityWindow) || "7d";
  const category = sp.get("category") || "";
  const [q, setQ] = useState(sp.get("q") || "");
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<Project[] | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    // Keep previous results visible while refetching to avoid flashing
    // an empty/skeleton state when filters change.
    searchCommunity({ q: sp.get("q") || undefined, category: category || undefined, sort, window: win, limit: 48 })
      .then((r) => {
        if (!alive) return;
        setProjects(r);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [sp, sort, win, category]);

  useEffect(() => {
    getTrendingProjects("7d", 6).then(setTrending);
  }, []);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp);
    if (!value) next.delete(key); else next.set(key, value);
    setSp(next, { replace: true });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", q.trim() || null);
  };

  const heading = useMemo(() => {
    if (sp.get("q")) return `Search: ${sp.get("q")}`;
    if (category) {
      const c = CATEGORIES.find((x) => x.slug === category);
      return c ? `${c.name} data videos` : "Community";
    }
    return "Community data videos";
  }, [sp, category]);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Community Data Videos — Trending, Latest, Most Remixed"
        description="Discover trending data videos from creators worldwide. Search, filter and remix animated charts on GDP, sports, population, technology and more."
        path="/community"
      />
      <div className="max-w-6xl mx-auto px-5 py-6 w-full flex-1">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground mb-4 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{heading}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">Real animated charts published by the community. Watch, remix, or share — every video is a remix away.</p>

        <form onSubmit={submitSearch} className="mt-5 relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search GDP, FDI, Messi, Population…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </form>

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Browse community categories">
          <button
            onClick={() => setParam("category", null)}
            className={"px-3 py-1.5 rounded-full text-xs font-semibold border " + (!category ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:border-primary/40")}
          >All</button>
          {CATEGORIES.filter((c) => c.slug !== "other").map((c) => (
            <button key={c.slug} onClick={() => setParam("category", c.slug)} className={"px-3 py-1.5 rounded-full text-xs font-semibold border " + (category === c.slug ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:border-primary/40")}>
              {c.name}
            </button>
          ))}
        </nav>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map((s) => (
              <button key={s.key} onClick={() => setParam("sort", s.key === "trending" ? null : s.key)} className={"px-3 py-1.5 rounded-lg text-xs font-semibold " + ((sort === s.key) ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary")}>
                {s.label}
              </button>
            ))}
          </div>
          {(sort === "trending" || sort === "views" || sort === "likes" || sort === "remixed" || sort === "downloads") && (
            <div className="flex gap-1 ml-auto">
              {WINDOWS.map((w) => (
                <button key={w.key} onClick={() => setParam("window", w.key === "7d" ? null : w.key)} className={"px-2.5 py-1 rounded-md text-[11px] font-semibold " + ((win === w.key) ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60")}>
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {trending && trending.length > 0 && !sp.get("q") && !category && sort === "trending" && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3"><Flame className="w-4 h-4 text-primary" /> Trending this week</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.slice(0, 3).map((p) => <CommunityCard key={p.id} project={p} />)}
            </div>
          </section>
        )}

        <section className="mt-8">
          {projects === null ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[16/9] rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 && !loading ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-foreground font-semibold">No videos match this filter</p>
              <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">Try a different sort, time window, or category — or publish your own.</p>
              <Link to="/create" className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Create a video</Link>
            </div>
          ) : projects.length === 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[16/9] rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className={"grid sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity " + (loading ? "opacity-60" : "opacity-100")}>
              {projects.map((p) => <CommunityCard key={p.id} project={p} />)}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Community;