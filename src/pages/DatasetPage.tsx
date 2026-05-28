import { useParams, Link } from "react-router-dom";
import { ArrowRight, Play, Database } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FaqSection, faqJsonLd } from "@/components/FaqSection";
import { getDataset, DATASETS } from "@/lib/seoContent/datasets";
import { TEMPLATE_LANDINGS } from "@/lib/seoContent/templateLandings";
import { WATCH_PAGES } from "@/lib/seoContent/watchPages";
import NotFound from "./NotFound";

const SITE = "https://data-reel-maker.lovable.app";

const DatasetPage = () => {
  const { slug } = useParams();
  const data = getDataset(slug);
  if (!data) return <NotFound />;

  const templates = TEMPLATE_LANDINGS.filter((t) => data.recommendedTemplates.includes(t.slug));
  const videos = WATCH_PAGES.filter((w) => data.relatedWatch.includes(w.slug));
  const otherDatasets = DATASETS.filter((d) => d.slug !== data.slug).slice(0, 4);
  const firstTemplateId = templates[0]?.templateId ?? "viral-bar-race";

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={data.seoTitle}
        description={data.seoDescription}
        path={`/datasets/${data.slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: data.title,
            description: data.seoDescription,
            url: `${SITE}/datasets/${data.slug}`,
            keywords: data.keywords.join(", "),
            creator: { "@type": "Organization", name: "Data to Video" },
            isAccessibleForFree: true,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Datasets", item: `${SITE}/datasets` },
              { "@type": "ListItem", position: 3, name: data.title, item: `${SITE}/datasets/${data.slug}` },
            ],
          },
          faqJsonLd(data.faqs),
        ]}
      />
      <SiteHeader />
      <main className="flex-1">
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-6 pt-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> ›{" "}
          <Link to="/datasets" className="hover:text-foreground">Datasets</Link> ›{" "}
          <span className="text-foreground">{data.title}</span>
        </nav>

        <section className="max-w-4xl mx-auto px-6 pt-6 pb-10">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">{data.category} dataset</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">{data.h1}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{data.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/create?template=${firstTemplateId}&dataset=${data.slug}`}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Animate this dataset
            </Link>
            <Link to="/datasets" className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold">
              All datasets
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Database className="w-4 h-4" /> Preview · {data.unit} · Source: {data.source}
            </div>
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-left">
                <tr><th className="py-2 font-medium">Label</th><th className="py-2 font-medium">Value</th><th className="py-2 font-medium">Note</th></tr>
              </thead>
              <tbody>
                {data.preview.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-2 text-foreground">{row.label}</td>
                    <td className="py-2 text-foreground font-semibold">{row.value}</td>
                    <td className="py-2 text-muted-foreground">{row.meta ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-8 space-y-5">
          {data.paragraphs.map((p, i) => <p key={i} className="text-foreground/90 leading-relaxed">{p}</p>)}
        </section>

        {templates.length > 0 && (
          <section className="max-w-5xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-foreground mb-5">Templates that use this dataset</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.map((t) => (
                <Link key={t.slug} to={`/templates/${t.slug}`} className="bg-card rounded-xl p-5 flex items-center justify-between hover:bg-card/70">
                  <span className="font-semibold text-foreground">{t.h1}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section className="max-w-5xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-foreground mb-5">Videos made with this data</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {videos.map((w) => (
                <Link key={w.slug} to={`/watch/${w.slug}`} className="bg-card rounded-xl p-5 flex items-center justify-between hover:bg-card/70">
                  <span className="font-semibold text-foreground">{w.title}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <FaqSection faqs={data.faqs} />

        <section className="max-w-5xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-5">Explore other datasets</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherDatasets.map((d) => (
              <Link key={d.slug} to={`/datasets/${d.slug}`} className="bg-card rounded-xl p-4 hover:bg-card/70">
                <p className="text-xs text-muted-foreground">{d.category}</p>
                <p className="font-semibold text-foreground mt-1">{d.title}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DatasetPage;