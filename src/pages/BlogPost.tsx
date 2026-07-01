import { useParams, Link } from "react-router-dom";
import { ArrowRight, Database, Play, Wrench, FileVideo, Lightbulb, Quote } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { FaqSection, faqJsonLd } from "@/components/FaqSection";
import { getPost, withAnchors, tocItems, AUTHORS, type BodyBlock } from "@/lib/seoContent/blogPosts";
import { getLanding } from "@/lib/seoContent/templateLandings";
import { getDataset } from "@/lib/seoContent/datasets";
import { getTool } from "@/lib/seoContent/tools";
import { getWatch } from "@/lib/seoContent/watchPages";
import NotFound from "./NotFound";

const SITE = "https://data-reel-maker.lovable.app";

const EmbedCard = ({ block }: { block: Extract<BodyBlock, { type: "embed" }> }) => {
  if (block.kind === "template") {
    const t = getLanding(block.slug);
    if (!t) return null;
    return (
      <Link to={`/templates/${t.slug}`} className="not-prose flex items-center gap-4 bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"><Play className="w-5 h-5 text-primary" /></div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{block.label ?? "Template"}</p>
          <p className="font-semibold text-foreground">{t.h1}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </Link>
    );
  }
  if (block.kind === "dataset") {
    const d = getDataset(block.slug);
    if (!d) return null;
    return (
      <Link to={`/datasets/${d.slug}`} className="not-prose flex items-center gap-4 bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"><Database className="w-5 h-5 text-primary" /></div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{block.label ?? `${d.category} dataset`}</p>
          <p className="font-semibold text-foreground">{d.title}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </Link>
    );
  }
  if (block.kind === "tool") {
    const t = getTool(block.slug);
    if (!t) return null;
    return (
      <Link to={`/tools/${t.slug}`} className="not-prose flex items-center gap-4 bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"><Wrench className="w-5 h-5 text-primary" /></div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{block.label ?? "Free tool"}</p>
          <p className="font-semibold text-foreground">{t.h1}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </Link>
    );
  }
  if (block.kind === "watch") {
    const w = getWatch(block.slug);
    if (!w) return null;
    return (
      <Link to={`/watch/${w.slug}`} className="not-prose flex items-center gap-4 bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"><FileVideo className="w-5 h-5 text-primary" /></div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{block.label ?? "Example video"}</p>
          <p className="font-semibold text-foreground">{w.title}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </Link>
    );
  }
  return null;
};

const renderBlock = (block: BodyBlock, i: number) => {
  switch (block.type) {
    case "p":
      return <p key={i} className="text-foreground/90 leading-relaxed text-[1.05rem]">{block.text}</p>;
    case "h2":
      return <h2 key={i} id={block.id} className="scroll-mt-24 text-2xl md:text-3xl font-bold text-foreground mt-10">{block.text}</h2>;
    case "h3":
      return <h3 key={i} className="text-xl font-semibold text-foreground mt-6">{block.text}</h3>;
    case "list":
      return block.ordered ? (
        <ol key={i} className="list-decimal pl-6 space-y-2 text-foreground/90">
          {block.items.map((it, j) => <li key={j}>{it}</li>)}
        </ol>
      ) : (
        <ul key={i} className="list-disc pl-6 space-y-2 text-foreground/90">
          {block.items.map((it, j) => <li key={j}>{it}</li>)}
        </ul>
      );
    case "callout":
      return (
        <aside key={i} className="not-prose flex gap-3 bg-primary/10 border border-primary/30 rounded-xl p-4">
          <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-foreground/90 text-sm leading-relaxed">{block.text}</p>
        </aside>
      );
    case "quote":
      return (
        <blockquote key={i} className="not-prose border-l-4 border-primary/60 pl-4 italic text-foreground/90">
          <Quote className="w-4 h-4 text-primary inline mr-2" />
          {block.text}
          {block.cite && <footer className="not-italic text-sm text-muted-foreground mt-1">— {block.cite}</footer>}
        </blockquote>
      );
    case "embed":
      return <EmbedCard key={i} block={block} />;
  }
};

const BlogPost = () => {
  const { slug } = useParams();
  const raw = getPost(slug);
  if (!raw) return <NotFound />;
  const post = withAnchors(raw);
  const author = AUTHORS[post.authorKey];
  const related = post.related.map(getPost).filter(Boolean) as ReturnType<typeof getPost>[];
  const toc = tocItems(post);

  const tplLinks = (post.relatedTemplates ?? []).map(getLanding).filter(Boolean);
  const dsLinks = (post.relatedDatasets ?? []).map(getDataset).filter(Boolean);
  const toolLinks = (post.relatedTools ?? []).map(getTool).filter(Boolean);
  const watchLinks = (post.relatedWatch ?? []).map(getWatch).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={post.seoTitle}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        ogImage={post.ogImage ?? "/og/default.jpg"}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            author: { "@type": "Person", name: author.name, jobTitle: author.role },
            publisher: { "@type": "Organization", name: "Data to Video", logo: { "@type": "ImageObject", url: `${SITE}/og/default.jpg` } },
            mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
            articleSection: post.category,
            keywords: post.tags.join(", "),
            image: `${SITE}${post.ogImage ?? "/og/default.jpg"}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: `${SITE}/blog/${post.slug}` },
            ],
          },
          ...(post.faqs && post.faqs.length > 0 ? [faqJsonLd(post.faqs)] : []),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link> ›{" "}
          <Link to="/blog" className="hover:text-foreground">Blog</Link> ›{" "}
          <span className="text-foreground">{post.category}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_240px] gap-12">
          <article className="min-w-0">
            <header>
              <div className="flex flex-wrap gap-2 mb-4">
                <Link to={`/blog?category=${encodeURIComponent(post.category)}`} className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  {post.category}
                </Link>
                {post.tags.slice(0, 3).map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">#{t}</span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">{post.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
              <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                  {author.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-foreground font-medium">{author.name}</p>
                  <p className="text-xs">
                    <time dateTime={post.date}>{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
                    {" · "}{post.readMinutes} min read
                    {post.updated && post.updated !== post.date && <> · Updated {new Date(post.updated).toLocaleDateString()}</>}
                  </p>
                </div>
              </div>
            </header>

            {toc.length > 1 && (
              <nav aria-label="Table of contents" className="mt-8 lg:hidden bg-card rounded-2xl p-4 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">In this article</p>
                <ol className="space-y-1 text-sm">
                  {toc.map((t) => (
                    <li key={t.id}><a className="text-foreground/80 hover:text-primary" href={`#${t.id}`}>{t.text}</a></li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="mt-8 space-y-6">
              {post.body.map(renderBlock)}
            </div>

            {post.faqs && post.faqs.length > 0 && (
              <div className="mt-12">
                <FaqSection faqs={post.faqs} />
              </div>
            )}

            <section className="mt-12 bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground">Ready to make your first one?</h2>
              <p className="text-muted-foreground mt-2 text-sm">Open the editor and turn this into a vertical MP4 in under five minutes — no signup required.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/create?new=1" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold">Start creating free</Link>
                <Link to="/templates" className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold">Browse templates</Link>
              </div>
            </section>

            <section className="mt-10 flex items-start gap-4 bg-card/60 rounded-2xl p-5 border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
                {author.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-semibold text-foreground">{author.name}</p>
                <p className="text-xs text-muted-foreground">{author.role}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{author.bio}</p>
              </div>
            </section>

            {(tplLinks.length + dsLinks.length + toolLinks.length + watchLinks.length) > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold text-foreground mb-4">Mentioned in this article</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {tplLinks.map((t) => t && (
                    <Link key={`t-${t.slug}`} to={`/templates/${t.slug}`} className="bg-card rounded-xl p-4 hover:bg-card/70">
                      <p className="text-xs text-muted-foreground">Template</p>
                      <p className="font-semibold text-foreground">{t.h1}</p>
                    </Link>
                  ))}
                  {dsLinks.map((d) => d && (
                    <Link key={`d-${d.slug}`} to={`/datasets/${d.slug}`} className="bg-card rounded-xl p-4 hover:bg-card/70">
                      <p className="text-xs text-muted-foreground">Dataset</p>
                      <p className="font-semibold text-foreground">{d.title}</p>
                    </Link>
                  ))}
                  {toolLinks.map((t) => t && (
                    <Link key={`tool-${t.slug}`} to={`/tools/${t.slug}`} className="bg-card rounded-xl p-4 hover:bg-card/70">
                      <p className="text-xs text-muted-foreground">Tool</p>
                      <p className="font-semibold text-foreground">{t.h1}</p>
                    </Link>
                  ))}
                  {watchLinks.map((w) => w && (
                    <Link key={`w-${w.slug}`} to={`/watch/${w.slug}`} className="bg-card rounded-xl p-4 hover:bg-card/70">
                      <p className="text-xs text-muted-foreground">Watch</p>
                      <p className="font-semibold text-foreground">{w.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold text-foreground mb-4">Related reading</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {related.map((r) => r && (
                    <Link key={r.slug} to={`/blog/${r.slug}`} className="bg-card rounded-xl p-5 hover:bg-card/70 transition-colors">
                      <p className="text-xs text-primary font-semibold">{r.category}</p>
                      <p className="font-semibold text-foreground mt-1">{r.title}</p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {toc.length > 1 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">In this article</p>
                <ol className="space-y-2 text-sm border-l border-border pl-4">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a className="text-foreground/70 hover:text-primary block leading-snug" href={`#${t.id}`}>{t.text}</a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;