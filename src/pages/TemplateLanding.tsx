import { useParams, useNavigate, Link } from "react-router-dom";
import { Check, Play, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FaqSection, faqJsonLd } from "@/components/FaqSection";
import { getLanding, TEMPLATE_LANDINGS } from "@/lib/seoContent/templateLandings";
import { DATASETS } from "@/lib/seoContent/datasets";
import { WATCH_PAGES } from "@/lib/seoContent/watchPages";
import NotFound from "./NotFound";

const SITE = "https://data-reel-maker.lovable.app";

const TemplateLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const data = getLanding(slug);
  if (!data) return <NotFound />;
  const relatedDatasets = DATASETS.filter((d) => d.recommendedTemplates.includes(data.slug)).slice(0, 4);
  const relatedVideos = WATCH_PAGES.filter((w) => w.templateSlug === data.slug).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={data.seoTitle}
        description={data.seoDescription}
        path={`/templates/${data.slug}`}
        jsonLd={[
          faqJsonLd(data.faqs),
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: data.h1,
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Templates", item: `${SITE}/templates` },
              { "@type": "ListItem", position: 3, name: data.h1, item: `${SITE}/templates/${data.slug}` },
            ],
          },
        ]}
      />
      <SiteHeader />
      <main className="flex-1">
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-6 pt-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> ›{" "}
          <Link to="/templates" className="hover:text-foreground">Templates</Link> ›{" "}
          <span className="text-foreground">{data.h1}</span>
        </nav>
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">
            {data.keywords[0]}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">{data.h1}</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">{data.intro}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/create?template=${data.templateId}`)}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 justify-center"
            >
              <Play className="w-4 h-4" /> Start Creating Free
            </button>
            <Link
              to="/templates"
              className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold"
            >
              Browse all templates
            </Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-10 space-y-5">
          {data.paragraphs.map((p, i) => (
            <p key={i} className="text-foreground/90 leading-relaxed">{p}</p>
          ))}
        </section>

        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">What you get</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {data.features.map((f) => (
              <li key={f} className="flex items-start gap-3 bg-card rounded-xl p-4">
                <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <FaqSection faqs={data.faqs} />

        {relatedDatasets.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-foreground mb-5">Datasets to try with this template</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {relatedDatasets.map((d) => (
                <Link key={d.slug} to={`/datasets/${d.slug}`} className="bg-card rounded-xl p-5 flex items-center justify-between hover:bg-card/70">
                  <div>
                    <p className="font-semibold text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{d.category} · {d.unit}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedVideos.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-foreground mb-5">Videos made with this template</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {relatedVideos.map((w) => (
                <Link key={w.slug} to={`/watch/${w.slug}`} className="bg-card rounded-xl p-5 flex items-center justify-between hover:bg-card/70">
                  <span className="font-semibold text-foreground">{w.title}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">Other templates</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TEMPLATE_LANDINGS.filter((t) => t.slug !== data.slug).slice(0, 4).map((t) => (
              <Link key={t.slug} to={`/templates/${t.slug}`} className="bg-card rounded-xl p-5 flex items-center justify-between hover:bg-card/70 transition-colors">
                <span className="font-semibold text-foreground">{t.h1}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TemplateLanding;