import { useParams, Link } from "react-router-dom";
import { Play, Share2, Copy } from "lucide-react";
import { useState } from "react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { WATCH_PAGES, getWatch } from "@/lib/seoContent/watchPages";
import { getDataset } from "@/lib/seoContent/datasets";

const SITE = "https://data-reel-maker.lovable.app";

const Watch = () => {
  const { slug } = useParams();
  const entry = getWatch(slug) ?? WATCH_PAGES[0];
  const dataset = entry.datasetSlug ? getDataset(entry.datasetSlug) : undefined;
  const related = WATCH_PAGES.filter((w) => w.slug !== entry.slug).slice(0, 4);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : `${SITE}/watch/${entry.slug}`;

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
        ogImage={entry.ogImage}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: entry.title,
            description: entry.description,
            uploadDate: entry.uploadDate,
            thumbnailUrl: `${SITE}${entry.ogImage}`,
            contentUrl: `${SITE}/watch/${entry.slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Watch", item: `${SITE}/watch/${entry.slug}` },
            ],
          },
        ]}
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

          <section className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-3">About this video</h2>
            <p className="text-foreground/90 leading-relaxed">{entry.summary}</p>
            {dataset && (
              <p className="mt-3 text-sm text-muted-foreground">
                Data source: <Link to={`/datasets/${dataset.slug}`} className="text-primary hover:underline">{dataset.title}</Link> · {dataset.source}
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-3">Related videos</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {related.map((w) => (
                <Link key={w.slug} to={`/watch/${w.slug}`} className="bg-card rounded-xl p-4 hover:bg-card/70">
                  <p className="font-semibold text-foreground">{w.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{w.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Watch;