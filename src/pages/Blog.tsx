import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { BLOG_POSTS } from "@/lib/seoContent/blogPosts";

const Blog = () => (
  <div className="min-h-screen flex flex-col">
    <Seo
      title="Blog — Data video tips, viral formats & creator guides"
      description="Guides on making viral bar chart race videos, TikTok data visualizations, football stats content and animated chart videos."
      path="/blog"
    />
    <SiteHeader />
    <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-foreground">The Data to Video Blog</h1>
        <p className="mt-3 text-muted-foreground">Guides, formats and case studies for creators who turn data into viral short-form video.</p>
      </header>
      <div className="grid gap-4">
        {BLOG_POSTS.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="bg-card rounded-xl p-6 hover:bg-card/70 transition-colors">
            <article>
              <p className="text-xs text-muted-foreground">{new Date(post.date).toLocaleDateString()} · {post.readMinutes} min read</p>
              <h2 className="text-xl font-bold text-foreground mt-2">{post.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{post.excerpt}</p>
            </article>
          </Link>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default Blog;