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
import { BLOG_POSTS, AUTHORS, withAnchors, type BodyBlock } from "../src/lib/seoContent/blogPosts";
import { TEMPLATE_LANDINGS } from "../src/lib/seoContent/templateLandings";
import { HOME_FAQS } from "../src/lib/seoContent/faqs";
import { DATASETS } from "../src/lib/seoContent/datasets";
import { TOOLS } from "../src/lib/seoContent/tools";
import { WATCH_PAGES } from "../src/lib/seoContent/watchPages";
import { ogImageFor } from "../src/lib/ogImage";

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
  ogImage?: string;        // absolute or site-relative path
}

const headerHtml = `
<header class="site-header">
  <a href="/" rel="home"><strong>Data to Video</strong></a>
  <nav aria-label="Primary">
    <a href="/templates">Templates</a>
    <a href="/datasets">Datasets</a>
    <a href="/tools">Tools</a>
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
    <a href="/datasets">Datasets</a>
    <a href="/tools">Tools</a>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
  </nav>
  <p>&copy; ${new Date().getFullYear()} Data to Video. Turn data into viral short-form video.</p>
</footer>`;

const breadcrumbJsonLd = (crumbs: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: `${SITE}${c.path}`,
  })),
});

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
  ogImage: ogImageFor("/"),
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
  ogImage: ogImageFor("/templates"),
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
    ogImage: ogImageFor(`/templates/${t.slug}`),
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
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Templates", path: "/templates" },
        { name: t.h1, path: `/templates/${t.slug}` },
      ]),
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

// ---------- Datasets ----------
routes.push({
  path: "/datasets",
  title: "Free Datasets for Animated Stats Videos — Data to Video",
  description: "Browse free datasets for GDP, sports, demographics, business and crypto. Drop any dataset into the editor and export a viral animated chart video.",
  ogImage: ogImageFor("/datasets"),
  jsonLd: [{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Data to Video — Datasets",
    hasPart: DATASETS.map((d) => ({
      "@type": "Dataset",
      name: d.title,
      description: d.seoDescription,
      url: `${SITE}/datasets/${d.slug}`,
    })),
  }],
  body: `
    ${headerHtml}
    <main>
      <h1>Free datasets for animated stats videos</h1>
      <p>Curated datasets ready to drop into the editor and export as a TikTok or Reels video.</p>
      <ul>
        ${DATASETS.map((d) => `<li><h2><a href="/datasets/${d.slug}">${esc(d.title)}</a></h2><p>${esc(d.intro)}</p></li>`).join("")}
      </ul>
    </main>
    ${footerHtml}
  `,
});

for (const d of DATASETS) {
  routes.push({
    path: `/datasets/${d.slug}`,
    title: d.seoTitle,
    description: d.seoDescription,
    ogImage: ogImageFor(`/datasets/${d.slug}`),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: d.title,
        description: d.seoDescription,
        url: `${SITE}/datasets/${d.slug}`,
        keywords: d.keywords.join(", "),
        creator: { "@type": "Organization", name: "Data to Video" },
        isAccessibleForFree: true,
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Datasets", path: "/datasets" },
        { name: d.title, path: `/datasets/${d.slug}` },
      ]),
      faqJsonLd(d.faqs),
    ],
    body: `
      ${headerHtml}
      <main>
        <article>
          <p><small>${esc(d.category)} dataset · Source: ${esc(d.source)}</small></p>
          <h1>${esc(d.h1)}</h1>
          <p>${esc(d.intro)}</p>
          ${d.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
          <h2>Preview rows</h2>
          <ul>${d.preview.map((r) => `<li><strong>${esc(r.label)}</strong> — ${esc(String(r.value))} ${esc(d.unit)}${r.meta ? ` (${esc(r.meta)})` : ""}</li>`).join("")}</ul>
          <h2>Templates that use this dataset</h2>
          <ul>${d.recommendedTemplates.map((s) => {
            const t = TEMPLATE_LANDINGS.find((x) => x.slug === s);
            return t ? `<li><a href="/templates/${t.slug}">${esc(t.h1)}</a></li>` : "";
          }).join("")}</ul>
          ${faqHtml(d.faqs)}
        </article>
      </main>
      ${footerHtml}
    `,
  });
}

// ---------- Tools ----------
routes.push({
  path: "/tools",
  title: "Free Data Video Tools — CSV to Video, Chart Race & More",
  description: "Free online tools to turn data into video: CSV to video, chart race generator, ranking video maker, statistics video generator.",
  ogImage: ogImageFor("/tools"),
  body: `
    ${headerHtml}
    <main>
      <h1>Free data video tools</h1>
      <p>Pick a tool, drop in your data, export a vertical MP4 — all in your browser.</p>
      <ul>
        ${TOOLS.map((t) => `<li><h2><a href="/tools/${t.slug}">${esc(t.h1)}</a></h2><p>${esc(t.intro)}</p></li>`).join("")}
      </ul>
    </main>
    ${footerHtml}
  `,
});

for (const t of TOOLS) {
  routes.push({
    path: `/tools/${t.slug}`,
    title: t.seoTitle,
    description: t.seoDescription,
    ogImage: ogImageFor(`/tools/${t.slug}`),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: t.h1,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: t.h1,
        step: t.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s })),
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Tools", path: "/tools" },
        { name: t.h1, path: `/tools/${t.slug}` },
      ]),
      faqJsonLd(t.faqs),
    ],
    body: `
      ${headerHtml}
      <main>
        <article>
          <h1>${esc(t.h1)}</h1>
          <p>${esc(t.intro)}</p>
          ${t.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
          <h2>How it works</h2>
          <ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
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
  ogImage: ogImageFor("/blog"),
  jsonLd: [{
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
  }],
  body: `
    ${headerHtml}
    <main>
      <header>
        <h1>The Data to Video Blog</h1>
        <p>Guides, formats and case studies for creators who turn data into viral short-form video.</p>
      </header>
      <ul>
        ${BLOG_POSTS.map((p) => `<li><article>
          <p><small>${esc(p.category)} · <time datetime="${p.date}">${p.date}</time> · ${p.readMinutes} min read · ${esc(AUTHORS[p.authorKey].name)}</small></p>
          <h2><a href="/blog/${p.slug}">${esc(p.title)}</a></h2>
          <p>${esc(p.excerpt)}</p>
        </article></li>`).join("")}
      </ul>
    </main>
    ${footerHtml}
  `,
});

const renderBlockHtml = (b: BodyBlock): string => {
  switch (b.type) {
    case "p": return `<p>${esc(b.text)}</p>`;
    case "h2": return `<h2 id="${esc(b.id ?? "")}">${esc(b.text)}</h2>`;
    case "h3": return `<h3>${esc(b.text)}</h3>`;
    case "list":
      return `<${b.ordered ? "ol" : "ul"}>${b.items.map((it) => `<li>${esc(it)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
    case "callout": return `<aside><strong>Tip:</strong> ${esc(b.text)}</aside>`;
    case "quote": return `<blockquote>${esc(b.text)}${b.cite ? `<footer>— ${esc(b.cite)}</footer>` : ""}</blockquote>`;
    case "embed": {
      const href =
        b.kind === "template" ? `/templates/${b.slug}` :
        b.kind === "dataset" ? `/datasets/${b.slug}` :
        b.kind === "tool" ? `/tools/${b.slug}` :
        `/watch/${b.slug}`;
      const label = b.label ?? `${b.kind}: ${b.slug}`;
      return `<p><a href="${href}">${esc(label)}</a></p>`;
    }
  }
};

for (const raw of BLOG_POSTS) {
  const p = withAnchors(raw);
  const author = AUTHORS[p.authorKey];
  const toc = p.body.filter((b): b is Extract<BodyBlock, { type: "h2" }> => b.type === "h2");
  const tocHtml = toc.length > 1
    ? `<nav aria-label="Table of contents"><strong>In this article</strong><ol>${toc.map((t) => `<li><a href="#${esc(t.id ?? "")}">${esc(t.text)}</a></li>`).join("")}</ol></nav>`
    : "";
  const faqsHtml = p.faqs && p.faqs.length > 0 ? faqHtml(p.faqs) : "";
  const relatedHtml = p.related.length > 0
    ? `<section><h2>Related reading</h2><ul>${p.related.map((s) => {
        const r = BLOG_POSTS.find((x) => x.slug === s);
        return r ? `<li><a href="/blog/${r.slug}">${esc(r.title)}</a></li>` : "";
      }).join("")}</ul></section>`
    : "";

  const mentionedHtml = `
    ${(p.relatedTemplates ?? []).map((s) => {
      const t = TEMPLATE_LANDINGS.find((x) => x.slug === s);
      return t ? `<li><a href="/templates/${t.slug}">Template: ${esc(t.h1)}</a></li>` : "";
    }).join("")}
    ${(p.relatedDatasets ?? []).map((s) => {
      const d = DATASETS.find((x) => x.slug === s);
      return d ? `<li><a href="/datasets/${d.slug}">Dataset: ${esc(d.title)}</a></li>` : "";
    }).join("")}
    ${(p.relatedTools ?? []).map((s) => {
      const t = TOOLS.find((x) => x.slug === s);
      return t ? `<li><a href="/tools/${t.slug}">Tool: ${esc(t.h1)}</a></li>` : "";
    }).join("")}
    ${(p.relatedWatch ?? []).map((s) => {
      const w = WATCH_PAGES.find((x) => x.slug === s);
      return w ? `<li><a href="/watch/${w.slug}">Watch: ${esc(w.title)}</a></li>` : "";
    }).join("")}
  `;
  const mentionedSection = mentionedHtml.trim()
    ? `<section><h2>Mentioned in this article</h2><ul>${mentionedHtml}</ul></section>`
    : "";

  routes.push({
    path: `/blog/${p.slug}`,
    title: p.seoTitle,
    description: p.excerpt,
    ogImage: p.ogImage ?? ogImageFor(`/blog/${p.slug}`),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title,
        description: p.excerpt,
        datePublished: p.date,
        dateModified: p.updated ?? p.date,
        author: { "@type": "Person", name: author.name, jobTitle: author.role },
        publisher: { "@type": "Organization", name: "Data to Video", logo: { "@type": "ImageObject", url: `${SITE}/og/default.jpg` } },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${p.slug}` },
        articleSection: p.category,
        keywords: p.tags.join(", "),
        image: `${SITE}${p.ogImage ?? ogImageFor(`/blog/${p.slug}`)}`,
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: p.title, path: `/blog/${p.slug}` },
      ]),
      ...(p.faqs && p.faqs.length > 0 ? [faqJsonLd(p.faqs)] : []),
    ],
    body: `
      ${headerHtml}
      <main>
        <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog">Blog</a> › ${esc(p.category)}</nav>
        <article>
          <p><small>${esc(p.category)} · <time datetime="${p.date}">${p.date}</time> · ${p.readMinutes} min read · By ${esc(author.name)}</small></p>
          <h1>${esc(p.title)}</h1>
          <p>${esc(p.excerpt)}</p>
          ${tocHtml}
          ${p.body.map(renderBlockHtml).join("")}
          ${faqsHtml}
          <section><h2>About the author</h2><p><strong>${esc(author.name)}</strong> — ${esc(author.role)}. ${esc(author.bio)}</p></section>
          ${mentionedSection}
          ${relatedHtml}
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

for (const s of WATCH_PAGES) {
  routes.push({
    path: `/watch/${s.slug}`,
    title: `${s.title} — Data to Video`,
    description: s.description,
    ogImage: s.ogImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: s.title,
        description: s.description,
        uploadDate: s.uploadDate,
        thumbnailUrl: `${SITE}${s.ogImage}`,
        contentUrl: `${SITE}/watch/${s.slug}`,
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Watch", path: `/watch/${s.slug}` },
      ]),
    ],
    body: `${headerHtml}<main><article><h1>${esc(s.title)}</h1><p>${esc(s.description)}</p><p>${esc(s.summary)}</p><p>Made with the <a href="/templates/${s.templateSlug}">${esc(s.templateSlug)}</a> template.</p><p><a href="/create?template=${s.templateId}">Create your own</a></p></article></main>${footerHtml}`,
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
  const ogImg = r.ogImage ? `${SITE}${r.ogImage}` : undefined;
  const parts: string[] = [];
  parts.push(`<title>${esc(r.title)}</title>`);
  parts.push(`<meta name="description" content="${esc(r.description)}" />`);
  parts.push(`<link rel="canonical" href="${url}" />`);
  parts.push(`<meta property="og:title" content="${esc(r.title)}" />`);
  parts.push(`<meta property="og:description" content="${esc(r.description)}" />`);
  parts.push(`<meta property="og:url" content="${url}" />`);
  parts.push(`<meta property="og:type" content="website" />`);
  if (ogImg) {
    parts.push(`<meta property="og:image" content="${ogImg}" />`);
    parts.push(`<meta property="og:image:width" content="1216" />`);
    parts.push(`<meta property="og:image:height" content="640" />`);
  }
  parts.push(`<meta name="twitter:card" content="summary_large_image" />`);
  parts.push(`<meta name="twitter:title" content="${esc(r.title)}" />`);
  parts.push(`<meta name="twitter:description" content="${esc(r.description)}" />`);
  if (ogImg) parts.push(`<meta name="twitter:image" content="${ogImg}" />`);
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