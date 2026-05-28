import { Link } from "react-router-dom";
import { ArrowRight, Wrench } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { TOOLS } from "@/lib/seoContent/tools";

const Tools = () => (
  <div className="min-h-screen flex flex-col">
    <Seo
      title="Free Data Video Tools — CSV to Video, Chart Race & More"
      description="Free online tools to turn data into video: CSV to video, chart race generator, ranking video maker, statistics video generator and more."
      path="/tools"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Data to Video — Tools",
      }}
    />
    <SiteHeader />
    <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
      <header className="max-w-2xl mb-8">
        <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Tools</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Free data video tools</h1>
        <p className="mt-4 text-muted-foreground">Pick a tool, drop in your data, export a vertical MP4 — all in your browser.</p>
      </header>
      <div className="grid sm:grid-cols-2 gap-4">
        {TOOLS.map((t) => (
          <Link key={t.slug} to={`/tools/${t.slug}`} className="group bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Wrench className="w-3.5 h-3.5" /> Free tool
            </div>
            <h2 className="font-bold text-foreground text-lg">{t.h1}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t.intro}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold">
              Open tool <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default Tools;