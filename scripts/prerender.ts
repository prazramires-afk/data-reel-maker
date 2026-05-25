/**
 * Postbuild prerender: emits crawlable static HTML for every SEO route.
 *
 * Why: the app is a Vite SPA. Without this, crawlers and link-preview bots
 * that don't execute JS only see <div id="root"></div>. This script writes
 * a static HTML file per route into dist/<route>/index.html with the full
 * head (title, meta, canonical, og, JSON-LD) and a server-rendered body
 * containing headings, copy, FAQ text, and footer links. React mounts on
 * the client via createRoot().render() which replaces #root's children, so
 * there is no hydration mismatch.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_POSTS } from "../src/lib/seoContent/blogPosts";
import { TEMPLATE_LANDINGS } from "../src/lib/seoContent/templateLandings";
import { HOME_FAQS } from "../src/lib/seoContent/faqs";

const SITE = "https://data-reel-maker.lovable.app";
const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const TEMPLATE = readFileSync(resolve(DIST, "index.html"), "utf8");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface Route {
  path: string;            // e.g. "/blog/foo"
  title: string;
  description: string;
  noindex?: boolean;
  jsonLd?: object[];
  body: string;            // HTML to inject inside #root
}

const headerHtml = `
<header class="site-header">
  <a href="/" rel="home"><strong>Data to Video</strong></a>
  <nav aria-label="Primary">
    <a href="/templates">Templates</a>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/create">Create</a>
  </nav>
</header>`;

const footerHtml = `
<footer class="site-footer">
  <nav aria-label="Footer">
    <a href="/">Home</a>
    <a href="/templates">Templates</a>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
  </nav>
  <p>&copy; ${new Date().getFullYear()} Data to Video. Turn data into viral short-form video.</p>
</footer>`;

const faqHtml = (faqs: { q: string; a: string }[]) => `
<section aria-labelledby="faq-heading">
  <h2 id="faq-heading">Frequently asked questions</h2>
  <dl>
    ${faqs.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join("")}
  </dl>
</section>`;

const faqJsonLd = (faqs: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

// ---------- Routes ----------
const routes: Route[] = [];

routes.push({
  path: "/",
  title: "Free Bar Chart Race Maker — Turn Data into Viral TikTok Videos",
  description:
    "Create viral data videos online for free. Bar chart races, top 10 countdowns, animated statistics and CSV-to-video — all in your browser, ready for TikTok and Reels.",
  jsonLd: [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Data to Video", url: `${SITE}/` },
    faqJsonLd(HOME_FAQS),
  ],
  body: `
    ${headerHtml}
    <main>
      <section>
        <h1>Create Viral Data Videos Online</h1>
        <p>Turn statistics, rankings, timelines and charts into animated TikTok and Reels videos in seconds — free, in your browser.</p>
        <p><a href="/create">Start creating free</a> &middot; <a href="/templates">Browse templates</a></p>
      </section>
      <section aria-labelledby="templates-heading">
        <h2 id="templates-heading">Popular templates</h2>
        <ul>
          ${TEMPLATE_LANDINGS.map((t) => `<li><a href="/templates/${t.slug}">${esc(t.h1)}</a> — ${esc(t.intro)}</li>`).join("")}
        </ul>
      </section>
      <section aria-labelledby="blog-heading">
        <h2 id="blog-heading">From the blog</h2>
        <ul>
          ${BLOG_POSTS.map((p) => `<li><a href="/blog/${p.slug}">${esc(p.title)}</a> — ${esc(p.excerpt)}</li>`).join("")}
        </ul>
      </section>
      ${faqHtml(HOME_FAQS)}
    </main>
    ${footerHtml}
  `,
});

routes.push({
  path: "/templates",
  title: "Video templates — Data to Video",
  description: "Browse free animated video templates: bar chart race, top 10 countdown, timeline, head-to-head comparison and more.",
  body: `
    ${headerHtml}
    <main>
      <h1>Animated data video templates</h1>
      <p>Pick a template, drop in your data, export a vertical MP4 ready for TikTok, Reels and YouTube Shorts.</p>
      <ul>
        ${TEMPLATE_LANDINGS.map((t) => `<li><h2><a href="/templates/${t.slug}">${esc(t.h1)}</a></h2><p>${esc(t.intro)}</p></li>`).join("")}
      </ul>
    </main>
    ${footerHtml}
  `,
});

for (const t of TEMPLATE_LANDINGS) {
  routes.push({
    path: `/templates/${t.slug}`,
    title: t.seoTitle,
    description: t.seoDescription,
    jsonLd: [
      faqJsonLd(t.faqs),
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: t.h1,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
    body: `
      ${headerHtml}
      <main>
        <article>
          <p><small>${esc(t.keywords[0])}</small></p>
          <h1>${esc(t.h1)}</h1>
          <p>${esc(t.intro)}</p>
          <p><a href="/create?template=${t.templateId}">Start creating free</a> &middot; <a href="/templates">Browse all templates</a></p>
          ${t.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
          <h2>What you get</h2>
          <ul>${t.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          ${faqHtml(t.faqs)}
        </article>
      </main>
      ${footerHtml}
    `,
  });
}

routes.push({
  path: "/blog",
  title: "Blog — Data video tips, viral formats & creator guides",
  description: "Guides on making viral bar chart race videos, TikTok data visualizations, football stats content and animated chart videos.",
  body: `
    ${headerHtml}
    <main>
      <header>
        <h1>The Data to Video Blog</h1>
        <p>Guides, formats and case studies for creators who turn data into viral short-form video.</p>
      </header>
      <ul>
        ${BLOG_POSTS.map((p) => `<li><article>
          <p><small><time datetime="${p.date}">${p.date}</time> · ${p.readMinutes} min read</small></p>
          <h2><a href="/blog/${p.slug}">${esc(p.title)}</a></h2>
          <p>${esc(p.excerpt)}</p>
        </article></li>`).join("")}
      </ul>
    </main>
    ${footerHtml}
  `,
});

for (const p of BLOG_POSTS) {
  routes.push({
    path: `/blog/${p.slug}`,
    title: p.seoTitle,
    description: p.excerpt,
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title,
      datePublished: p.date,
      author: { "@type": "Organization", name: "Data to Video" },
    }],
    body: `
      ${headerHtml}
      <main>
        <article>
          <p><small><time datetime="${p.date}">${p.date}</time> · ${p.readMinutes} min read</small></p>
          <h1>${esc(p.title)}</h1>
          <p>${esc(p.excerpt)}</p>
          ${p.body.map((b) => b.h2 ? `<h2>${esc(b.h2)}</h2>` : `<p>${esc(b.p!)}</p>`).join("")}
        </article>
      </main>
      ${footerHtml}
    `,
  });
}

const trustPages: { path: string; title: string; description: string; h1: string; body: string }[] = [
  {
    path: "/about", title: "About — Data to Video",
    description: "Data to Video is a free browser-based tool to turn data into viral animated short-form videos for TikTok, Reels and YouTube Shorts.",
    h1: "About Data to Video",
    body: "<p>Data to Video is a free, browser-based creator tool that turns spreadsheets and CSVs into animated short-form videos. Built for creators who post data, sports, finance and educational content on TikTok, Reels and YouTube Shorts.</p>",
  },
  {
    path: "/contact", title: "Contact — Data to Video",
    description: "Get in touch with the Data to Video team for support, feedback or partnership questions.",
    h1: "Contact",
    body: "<p>Reach us by email for support, feedback or partnerships.</p>",
  },
  {
    path: "/privacy", title: "Privacy Policy — Data to Video",
    description: "How Data to Video handles your data, projects and account information.",
    h1: "Privacy Policy",
    body: "<p>Data to Video renders videos entirely in your browser. Your uploaded CSVs and images stay on your device unless you explicitly save a project to your account.</p>",
  },
  {
    path: "/terms", title: "Terms of Service — Data to Video",
    description: "Terms of service for using Data to Video.",
    h1: "Terms of Service",
    body: "<p>By using Data to Video you agree to the terms below covering fair use, ownership of exported videos and account responsibilities.</p>",
  },
];
for (const t of trustPages) {
  routes.push({
    path: t.path,
    title: t.title,
    description: t.description,
    body: `${headerHtml}<main><h1>${esc(t.h1)}</h1>${t.body}</main>${footerHtml}`,
  });
}

const shares = [
  { slug: "gdp-race-usa-vs-china", title: "GDP Race: USA vs China (1980–2025)", description: "The animated race between the world's two biggest economies over the last 45 years.", templateId: "viral-bar-race" },
  { slug: "ronaldo-vs-messi-goals", title: "Ronaldo vs Messi — All-Time Goals", description: "Head-to-head animated comparison of every official goal scored by both players.", templateId: "comparison-football" },
  { slug: "top-10-economies-2025", title: "Top 10 Economies in 2025", description: "The world's biggest economies, ranked and revealed one by one.", templateId: "top10-gdp" },
];
for (const s of shares) {
  routes.push({
    path: `/watch/${s.slug}`,
    title: `${s.title} — Data to Video`,
    description: s.description,
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: s.title,
      description: s.description,
      uploadDate: "2026-01-01",
      thumbnailUrl: `${SITE}/placeholder.svg`,
    }],
    body: `${headerHtml}<main><article><h1>${esc(s.title)}</h1><p>${esc(s.description)}</p><p>Made with Data to Video.</p><p><a href="/create?template=${s.templateId}">Create your own</a></p></article></main>${footerHtml}`,
  });
}

// Noindex routes still get a stub so refresh doesn't 404 on hosting that
// doesn't fall back to index.html for unknown paths.
const noindexRoutes: { path: string; title: string }[] = [
  { path: "/create", title: "Create animated data video — Data to Video" },
  { path: "/projects", title: "My projects — Data to Video" },
  { path: "/auth", title: "Sign in — Data to Video" },
  { path: "/admin", title: "Admin — Data to Video" },
];
for (const r of noindexRoutes) {
  routes.push({
    path: r.path,
    title: r.title,
    description: "Data to Video — turn data into animated short-form videos.",
    noindex: true,
    body: `${headerHtml}<main><h1>${esc(r.title)}</h1><p>Loading…</p></main>`,
  });
}

// ---------- Renderer ----------
function buildHead(r: Route): string {
  const url = `${SITE}${r.path === "/" ? "/" : r.path}`;
  const parts: string[] = [];
  parts.push(`<title>${esc(r.title)}</title>`);
  parts.push(`<meta name="description" content="${esc(r.description)}" />`);
  parts.push(`<link rel="canonical" href="${url}" />`);
  parts.push(`<meta property="og:title" content="${esc(r.title)}" />`);
  parts.push(`<meta property="og:description" content="${esc(r.description)}" />`);
  parts.push(`<meta property="og:url" content="${url}" />`);
  parts.push(`<meta property="og:type" content="website" />`);
  parts.push(`<meta name="twitter:card" content="summary_large_image" />`);
  parts.push(`<meta name="twitter:title" content="${esc(r.title)}" />`);
  parts.push(`<meta name="twitter:description" content="${esc(r.description)}" />`);
  if (r.noindex) parts.push(`<meta name="robots" content="noindex, nofollow" />`);
  for (const block of r.jsonLd ?? []) {
    parts.push(`<script type="application/ld+json">${JSON.stringify(block)}</script>`);
  }
  return parts.join("\n    ");
}

function renderRoute(r: Route): string {
  let html = TEMPLATE;
  // Strip the default <title> and any existing description/canonical/og/twitter/robots/ld+json
  html = html.replace(/<title>[\s\S]*?<\/title>/i, "");
  html = html.replace(/<meta\s+name=["'](?:description|keywords|robots|twitter:[^"']+)["'][^>]*>\s*/gi, "");
  html = html.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, "");
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");
  html = html.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi, "");
  // Inject our head block right before </head>
  html = html.replace(/<\/head>/i, `    ${buildHead(r)}\n  </head>`);
  // Inject prerendered body content into #root
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${r.body}</div>`
  );
  return html;
}

let written = 0;
for (const r of routes) {
  const out = r.path === "/"
    ? resolve(DIST, "index.html")
    : resolve(DIST, r.path.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderRoute(r), "utf8");
  written++;
}
console.log(`prerender: wrote ${written} HTML files`);