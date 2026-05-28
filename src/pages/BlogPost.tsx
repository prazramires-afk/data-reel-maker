import { useParams, Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { getPost, BLOG_POSTS } from "@/lib/seoContent/blogPosts";
import NotFound from "./NotFound";

const BlogPost = () => {
  const { slug } = useParams();
  const post = getPost(slug);
  if (!post) return <NotFound />;
  const related = post.related.map(getPost).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={post.seoTitle}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        ogImage={post.ogImage ?? "/og/default.jpg"}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          datePublished: post.date,
          author: { "@type": "Organization", name: "Data to Video" },
        }}
      />
      <SiteHeader back />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <article>
          <p className="text-xs text-muted-foreground">{new Date(post.date).toLocaleDateString()} · {post.readMinutes} min read</p>
          <h1 className="mt-3 text-4xl font-extrabold text-foreground tracking-tight">{post.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-8 space-y-6">
            {post.body.map((block, i) =>
              block.h2 ? (
                <h2 key={i} className="text-2xl font-bold text-foreground mt-8">{block.h2}</h2>
              ) : (
                <p key={i} className="text-foreground/90 leading-relaxed">{block.p}</p>
              )
            )}
          </div>
        </article>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-foreground mb-4">Related reading</h2>
            <div className="grid gap-3">
              {related.map((r) => r && (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="bg-card rounded-xl p-4 hover:bg-card/70 transition-colors">
                  <p className="font-semibold text-foreground">{r.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;