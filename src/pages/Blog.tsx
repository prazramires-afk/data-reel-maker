import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { BLOG_POSTS, BLOG_CATEGORIES, AUTHORS } from "@/lib/seoContent/blogPosts";

const SITE = "https://data-reel-maker.lovable.app";

const Blog = () => {
  const [params, setParams] = useSearchParams();
  const selectedCategory = params.get("category");

  const sorted = useMemo(
    () => [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date)),
    []
  );
  const filtered = selectedCategory
    ? sorted.filter((p) => p.category === selectedCategory)
    : sorted;
  const [featured, ...rest] = filtered;

  const setCategory = (cat: string | null) => {
    if (!cat) setParams({});
    else setParams({ category: cat });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Blog — Data Video Tips, Viral Formats & Creator Guides"
        description="Guides, tutorials and case studies for creators making viral data videos for TikTok, Reels and YouTube Shorts."
        path="/blog"
        ogImage="/og/default.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Data to Video Blog",
          url: `${SITE}/blog`,
          blogPost: BLOG_POSTS.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${SITE}/blog/${p.slug}`,
            datePublished: p.date,
            author: { "@type": "Person", name: AUTHORS[p.authorKey].name },
          })),
        }}
      />
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <header className="mb-8 max-w-2xl">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Creator publication</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">The Data to Video Blog</h1>
          <p className="mt-4 text-muted-foreground">
            Tutorials, case studies and creator insights for turning data into viral short-form video.
            Every post is written by creators who actually publish in the niche.
          </p>
        </header>

        <nav aria-label="Categories" className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            }`}
          >
            All
          </button>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {featured && !selectedCategory && (
          <Link
            to={`/blog/${featured.slug}`}
            className="block bg-card rounded-3xl p-8 border border-border hover:border-primary/50 transition-colors mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Featured · {featured.category}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{featured.title}</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">{featured.excerpt}</p>
            <p className="text-xs text-muted-foreground mt-4">
              {AUTHORS[featured.authorKey].name} · <time dateTime={featured.date}>{new Date(featured.date).toLocaleDateString()}</time> · {featured.readMinutes} min read
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold">
              Read article <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(selectedCategory ? filtered : rest).map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{post.category}</p>
              <h2 className="text-lg font-bold text-foreground leading-snug">{post.title}</h2>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">{post.excerpt}</p>
              <p className="text-xs text-muted-foreground mt-4">
                {AUTHORS[post.authorKey].name} · {post.readMinutes} min
              </p>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm">No articles in this category yet.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;