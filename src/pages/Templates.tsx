import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";
import { Seo } from "@/components/Seo";
import { TEMPLATE_LANDINGS } from "@/lib/seoContent/templateLandings";
import { Footer } from "@/components/Footer";

const Templates = () => {
  const navigate = useNavigate();

  const landingFor = (templateId: string) =>
    TEMPLATE_LANDINGS.find((l) => l.templateId === templateId);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Free Video Templates — Bar Chart Race, Top 10 & Timeline"
        description="Free, ready-to-use data video templates: bar chart races, top 10 countdowns, animated timelines and head-to-head comparisons for TikTok and Reels."
        path="/templates"
      />
      <div className="max-w-4xl mx-auto px-5 py-6 w-full flex-1">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground mb-6 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">Video templates</h1>
        <p className="text-muted-foreground mb-8">Pre-built data and styles — ready to customize, free to export.</p>

        <div className="grid sm:grid-cols-2 gap-3">
          {TEMPLATES.map((tpl, i) => {
            const landing = landingFor(tpl.id);
            return (
              <article
                key={tpl.id}
                className="bg-card rounded-xl p-5 opacity-0 animate-fade-in border border-border"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-foreground text-lg">{tpl.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{tpl.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/create?template=${tpl.id}`)}
                        className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
                      >
                        Use template
                      </button>
                      {landing && (
                        <Link
                          to={`/templates/${landing.slug}`}
                          className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold inline-flex items-center gap-1"
                        >
                          Learn more <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Templates;
