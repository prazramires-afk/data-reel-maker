import { Link } from "react-router-dom";
import { Database, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { DATASETS } from "@/lib/seoContent/datasets";

const Datasets = () => {
  const byCategory = DATASETS.reduce<Record<string, typeof DATASETS>>((acc, d) => {
    (acc[d.category] ||= []).push(d);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Free Datasets for Animated Stats Videos — Data to Video"
        description="Browse free datasets for GDP, sports, demographics, business and crypto. Drop any dataset into the editor and export a viral animated chart video."
        path="/datasets"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Data to Video — Datasets",
          hasPart: DATASETS.map((d) => ({
            "@type": "Dataset",
            name: d.title,
            description: d.seoDescription,
            url: `https://data-reel-maker.lovable.app/datasets/${d.slug}`,
          })),
        }}
      />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <header className="max-w-2xl mb-10">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Dataset library</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Free datasets for animated stats videos</h1>
          <p className="mt-4 text-muted-foreground">
            Every dataset is curated, formatted and one click away from becoming a vertical TikTok or Reels video.
          </p>
        </header>

        {Object.entries(byCategory).map(([cat, items]) => (
          <section key={cat} className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-4">{cat}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((d) => (
                <Link
                  key={d.slug}
                  to={`/datasets/${d.slug}`}
                  className="group bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Database className="w-3.5 h-3.5" /> {d.unit}
                  </div>
                  <h3 className="font-bold text-foreground">{d.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{d.intro}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold">
                    Open dataset <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default Datasets;