import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_POSTS } from "../src/lib/seoContent/blogPosts";
import { TEMPLATE_LANDINGS } from "../src/lib/seoContent/templateLandings";

const BASE_URL = "https://data-reel-maker.lovable.app";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const today = new Date().toISOString().split("T")[0];

const entries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmod: today },
  { path: "/create", changefreq: "weekly", priority: "0.9" },
  { path: "/templates", changefreq: "weekly", priority: "0.9", lastmod: today },
  ...TEMPLATE_LANDINGS.map((t) => ({
    path: `/templates/${t.slug}`,
    changefreq: "monthly" as const,
    priority: "0.8",
  })),
  { path: "/blog", changefreq: "weekly", priority: "0.8", lastmod: today },
  ...BLOG_POSTS.map((p) => ({
    path: `/blog/${p.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
    lastmod: p.date,
  })),
  { path: "/watch/gdp-race-usa-vs-china", changefreq: "monthly", priority: "0.6" },
  { path: "/watch/ronaldo-vs-messi-goals", changefreq: "monthly", priority: "0.6" },
  { path: "/watch/top-10-economies-2025", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "yearly", priority: "0.4" },
  { path: "/contact", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

function generateSitemap(items: Entry[]) {
  const urls = items.map((e) => {
    const lines = [`  <url>`, `    <loc>${BASE_URL}${e.path}</loc>`];
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
    lines.push(`  </url>`);
    return lines.join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

writeFileSync(OUT, generateSitemap(entries), "utf8");
console.log(`sitemap.xml written with ${entries.length} entries`);
