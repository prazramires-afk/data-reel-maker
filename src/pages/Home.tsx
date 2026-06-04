import { Link, useNavigate } from "react-router-dom";
import { Play, FolderOpen, Layout, LogIn, LogOut, Sparkles, Coins, Shield, BarChart3, Trophy, Globe2, GraduationCap, TrendingUp, Film, ArrowRight, Quote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";
import { Footer } from "@/components/Footer";
import { FaqSection, faqJsonLd } from "@/components/FaqSection";
import { HOME_FAQS } from "@/lib/seoContent/faqs";
import { TEMPLATE_LANDINGS } from "@/lib/seoContent/templateLandings";
import { BLOG_POSTS } from "@/lib/seoContent/blogPosts";
import { LivePreview, LivePreviewMode } from "@/components/LivePreview";
import { TEMPLATES } from "@/lib/templates";
import { getTemplateIcon } from "@/lib/templateIcons";
import { useEffect, useState } from "react";
import { Project } from "@/lib/types";
import { getCommunityProjects } from "@/lib/storage";
import { CommunityProjectCard } from "@/components/CommunityProjectCard";

const Home = () => {
  const navigate = useNavigate();
  const { user, credits, signOut, isAdmin } = useAuth();
  const dailyCap = credits?.is_premium ? 50 : 10;
  const [community, setCommunity] = useState<Project[]>([]);

  useEffect(() => {
    getCommunityProjects(6).then(setCommunity);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Seo
        title="Free Bar Chart Race Maker — Turn Data into Viral TikTok Videos"
        description="Create viral data videos online for free. Bar chart races, top 10 countdowns, animated statistics and CSV-to-video — all in your browser, ready for TikTok and Reels."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Data to Video",
            url: "https://data-reel-maker.lovable.app/",
          },
          faqJsonLd(HOME_FAQS),
        ]}
      />
      <section className="relative px-6 py-12 flex flex-col items-center">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: "hsl(252 85% 60%)" }} />

      {/* Top-right auth area */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {user ? (
          <>
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
              {credits?.is_premium ? (
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Coins className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {credits?.tokens ?? 0}/{dailyCap}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-full bg-secondary text-muted-foreground active:scale-90 transition-transform"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-foreground text-xs font-semibold active:scale-95 transition-transform"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign in
          </button>
        )}
      </div>

      <div className="relative z-10 text-center max-w-2xl w-full mt-8">
        <h1
          className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground opacity-0 animate-fade-in"
          style={{ lineHeight: "1.1" }}
        >
          Create Viral Data Videos Online
        </h1>
        <p className="mt-5 text-muted-foreground text-lg md:text-xl max-w-xl mx-auto opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          Turn statistics, rankings, timelines and charts into animated TikTok and Reels videos in seconds — free, in your browser.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center opacity-0 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform duration-150"
          >
            <Play className="w-5 h-5" />
            Start Creating Free
          </button>
          <button
            onClick={() => navigate("/templates")}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-lg active:scale-[0.97] transition-transform duration-150"
          >
            <Layout className="w-5 h-5" />
            Watch Demo
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <FolderOpen className="w-3 h-3" /> My projects
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground">Blog</Link>
          <span className="text-muted-foreground/40">·</span>
          <Link to="/about" className="text-xs text-muted-foreground hover:text-foreground">About</Link>
        </div>

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="mt-6 flex items-center justify-center gap-3 mx-auto px-6 py-3 rounded-xl border border-primary/40 bg-card text-foreground font-semibold text-sm"
            >
              <Shield className="w-4 h-4 text-primary" />
              Admin Panel
            </button>
          )}

          {user && !credits?.is_premium && (
            <button
              onClick={() => navigate("/create?upgrade=1")}
              className="mt-4 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Premium — $10/mo
            </button>
          )}

        {user && (
          <p className="mt-6 text-xs text-muted-foreground">
            {credits?.is_premium ? "Premium" : "Free"} · {credits?.tokens ?? 0} tokens left today · 5 tokens / video
          </p>
        )}
      </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center">Everything creators need to make data move</h2>
        <p className="text-center text-muted-foreground mt-3 max-w-2xl mx-auto">A complete animated data visualization generator built for TikTok, Reels and YouTube Shorts.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: BarChart3, title: "Animated Bar Chart Race", body: "Smooth reordering bars across years or rounds — the most viral data format on short-form video.", preview: "bar_race" as LivePreviewMode },
            { icon: TrendingUp, title: "Data Storytelling", body: "Built-in titles, viral hooks and reveal animations turn raw numbers into a narrative viewers finish.", preview: "top10" as LivePreviewMode },
            { icon: Trophy, title: "Sports Statistics Videos", body: "Goal scorers, championship races, head-to-head player comparisons — perfect for football and esports pages.", preview: "comparison" as LivePreviewMode },
            { icon: GraduationCap, title: "Educational Timelines", body: "Animate population growth, historical events and demographic data for educational TikTok and YouTube.", preview: "timeline" as LivePreviewMode },
            { icon: Film, title: "TikTok & Reels Export", body: "Every video exports as a vertical 1080×1920 MP4, ready to upload straight to TikTok, Reels and Shorts." },
            { icon: Globe2, title: "Economic Visualization", body: "GDP races, inflation timelines, currency moves — finance creators ship daily content with one template." },
          ].map((f) => (
            <article key={f.title} className="bg-card rounded-2xl p-6 border border-border">
              {f.preview && (
                <div className="mb-4 -mx-2">
                  <LivePreview mode={f.preview} />
                </div>
              )}
              <f.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-bold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Community */}
      <section className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Made by the community</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">Real data videos published by Data to Video creators. Share yours from the Projects page.</p>
          </div>
          <Link to="/community" className="text-sm text-primary font-semibold whitespace-nowrap">Browse all →</Link>
        </div>
        {community.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <p className="text-foreground font-semibold">Be the first to publish a community video</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">Create one, then hit Publish on the Projects page and it will show up here.</p>
            <button
              onClick={() => navigate("/create")}
              className="mt-5 inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Create a video
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {community.map((p) => (
              <CommunityProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* Use cases / Programmatic landing entry */}
      <section className="max-w-6xl mx-auto px-6 py-16 w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center">Templates built for every kind of creator</h2>
        <p className="text-center text-muted-foreground mt-3">Click any template for a dedicated guide and live preview.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATE_LANDINGS.map((t) => (
            <Link key={t.slug} to={`/templates/${t.slug}`} className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/40 transition-colors">
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">{t.keywords[0]}</p>
              <h3 className="mt-2 text-lg font-bold text-foreground">{t.h1}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.intro}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold">
                Open template <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ready-to-use template gallery */}
      <section className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ready-to-use templates</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">Every template comes with real sample data — open one and export instantly.</p>
          </div>
          <Link to="/templates" className="text-sm text-primary font-semibold whitespace-nowrap">Browse all →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => navigate(`/create?template=${tpl.id}`)}
              className="text-left bg-card rounded-2xl p-5 border border-border hover:border-primary/40 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getTemplateIcon(tpl.id);
                  return (
                    <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </span>
                  );
                })()}
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground truncate">{tpl.name}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mt-0.5">{tpl.type.replace("_", " ")}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{tpl.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold">
                Use template <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16 w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center">From data to viral video in 3 steps</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Bring your data", b: "Upload a CSV or paste your numbers. Works with rankings, time series, head-to-head and top 10 lists." },
            { n: "02", t: "Pick a template", b: "Bar chart race, top 10 countdown, timeline or head-to-head — each with dark, light and neon themes." },
            { n: "03", t: "Export vertical MP4", b: "Render locally in your browser at 1080×1920 and post to TikTok, Reels or YouTube Shorts." },
          ].map((s) => (
            <div key={s.n} className="bg-card rounded-2xl p-6 border border-border">
              <p className="text-3xl font-extrabold text-primary">{s.n}</p>
              <h3 className="mt-3 font-bold text-foreground">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-6 py-16 w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center">Loved by short-form creators</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { q: "This helped my TikTok reach 2M views in a week.", a: "@statsdaily" },
            { q: "The easiest way to make football stat videos. I publish daily now.", a: "@goalcharts" },
            { q: "Perfect for educational creators. My students love it.", a: "@historyinmotion" },
          ].map((t) => (
            <figure key={t.a} className="bg-card rounded-2xl p-6 border border-border">
              <Quote className="w-5 h-5 text-primary mb-3" />
              <blockquote className="text-foreground/90">{t.q}</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">{t.a}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Latest from blog */}
      <section className="max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">From the blog</h2>
          <Link to="/blog" className="text-sm text-primary font-semibold">All posts →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {BLOG_POSTS.slice(0, 3).map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="bg-card rounded-2xl p-6 border border-border hover:border-primary/40 transition-colors">
              <p className="text-xs text-muted-foreground">{p.readMinutes} min read</p>
              <h3 className="mt-2 font-bold text-foreground">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      <FaqSection faqs={HOME_FAQS} />

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center w-full">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Start creating your first data video</h2>
        <p className="mt-3 text-muted-foreground">Free forever. No download. No watermark on premium.</p>
        <button
          onClick={() => navigate("/create")}
          className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg"
        >
          <Play className="w-5 h-5" /> Start Creating Free
        </button>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
