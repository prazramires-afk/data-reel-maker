import { useParams, Link } from "react-router-dom";
import { Play, Share2, Copy } from "lucide-react";
import { useState } from "react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { toast } from "@/hooks/use-toast";

interface ShareEntry {
  slug: string;
  title: string;
  description: string;
  templateId: string;
}

const SHARES: ShareEntry[] = [
  { slug: "gdp-race-usa-vs-china", title: "GDP Race: USA vs China (1980–2025)", description: "The animated race between the world's two biggest economies over the last 45 years.", templateId: "viral-bar-race" },
  { slug: "ronaldo-vs-messi-goals", title: "Ronaldo vs Messi — All-Time Goals", description: "Head-to-head animated comparison of every official goal scored by both players.", templateId: "comparison-football" },
  { slug: "top-10-economies-2025", title: "Top 10 Economies in 2025", description: "The world's biggest economies, ranked and revealed one by one.", templateId: "top10-gdp" },
];

const Watch = () => {
  const { slug } = useParams();
  const entry = SHARES.find((s) => s.slug === slug) ?? SHARES[0];
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const onCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied" });
    setTimeout(() => setCopied(false), 1500);
  };
  const onShare = async () => {
    if (navigator.share) await navigator.share({ title: entry.title, url });
    else onCopy();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={`${entry.title} — Data to Video`}
        description={entry.description}
        path={`/watch/${entry.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: entry.title,
          description: entry.description,
          uploadDate: "2026-01-01",
          thumbnailUrl: "https://data-reel-maker.lovable.app/placeholder.svg",
        }}
      />
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <article>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{entry.title}</h1>
          <p className="mt-3 text-muted-foreground">{entry.description}</p>

          <div className="mt-6 aspect-[9/16] max-w-sm mx-auto bg-card rounded-2xl border border-border flex items-center justify-center">
            <div className="text-center px-6">
              <Play className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Animated preview</p>
              <p className="text-xs text-muted-foreground mt-1">Made with Data to Video</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button onClick={onShare} className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-semibold text-sm flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={onCopy} className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-semibold text-sm flex items-center gap-2">
              <Copy className="w-4 h-4" /> {copied ? "Copied" : "Copy link"}
            </button>
            <Link to={`/create?template=${entry.templateId}`} className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              Create your own
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Watch;