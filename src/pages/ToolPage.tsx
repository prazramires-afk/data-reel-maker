import { useParams, Link } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FaqSection, faqJsonLd } from "@/components/FaqSection";
import { getTool, TOOLS } from "@/lib/seoContent/tools";
import NotFound from "./NotFound";

const SITE = "https://data-reel-maker.lovable.app";

const ToolPage = () => {
  const { slug } = useParams();
  const tool = getTool(slug);
  if (!tool) return <NotFound />;

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={tool.seoTitle}
        description={tool.seoDescription}
        path={`/tools/${tool.slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: tool.h1,
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: tool.h1,
            step: tool.steps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE}/tools` },
              { "@type": "ListItem", position: 3, name: tool.h1, item: `${SITE}/tools/${tool.slug}` },
            ],
          },
          faqJsonLd(tool.faqs),
        ]}
      />
      <SiteHeader />
      <main className="flex-1">
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-6 pt-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> ›{" "}
          <Link to="/tools" className="hover:text-foreground">Tools</Link> ›{" "}
          <span className="text-foreground">{tool.h1}</span>
        </nav>

        <section className="max-w-4xl mx-auto px-6 pt-6 pb-10">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">{tool.keywords[0]}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">{tool.h1}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{tool.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/create?template=${tool.templateId}`} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2">
              <Play className="w-4 h-4" /> Open the tool
            </Link>
            <Link to={`/templates/${tool.templateSlug}`} className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold">
              See template details
            </Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          {tool.paragraphs.map((p, i) => <p key={i} className="text-foreground/90 leading-relaxed">{p}</p>)}
        </section>

        <section className="max-w-3xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-5">How it works</h2>
          <ol className="space-y-3">
            {tool.steps.map((s, i) => (
              <li key={i} className="flex gap-4 bg-card rounded-xl p-4">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-foreground pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <FaqSection faqs={tool.faqs} />

        <section className="max-w-5xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-5">Other tools</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 4).map((t) => (
              <Link key={t.slug} to={`/tools/${t.slug}`} className="bg-card rounded-xl p-5 flex items-center justify-between hover:bg-card/70">
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

export default ToolPage;