import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BLOG_POSTS } from "../src/lib/seoContent/blogPosts";
import { TEMPLATE_LANDINGS } from "../src/lib/seoContent/templateLandings";
import { TOOLS } from "../src/lib/seoContent/tools";
import { DATASETS as LEGACY_DATASETS } from "../src/lib/seoContent/datasets";
import { WATCH_PAGES } from "../src/lib/seoContent/watchPages";
import { CATEGORIES } from "../src/lib/seo/categories";

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
  { path: "/datasets", changefreq: "weekly", priority: "0.9", lastmod: today },
  // Legacy seeded dataset slugs — resolved via in-app fallback when not in DB.
  ...LEGACY_DATASETS.map((d) => ({
    path: `/datasets/${d.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
  })),
  { path: "/tools", changefreq: "weekly", priority: "0.9", lastmod: today },
  ...TOOLS.map((t) => ({
    path: `/tools/${t.slug}`,
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
  ...WATCH_PAGES.map((w) => ({
    path: `/watch/${w.slug}`,
    changefreq: "monthly" as const,
    priority: "0.6",
    lastmod: w.uploadDate,
  })),
  { path: "/about", changefreq: "yearly", priority: "0.4" },
  { path: "/contact", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

// Community: index, category pages and every public video.
entries.push({ path: "/community", changefreq: "daily", priority: "0.8", lastmod: today });
for (const c of CATEGORIES) {
  if (c.slug === "other") continue;
  entries.push({ path: `/community/${c.slug}`, changefreq: "weekly", priority: "0.7", lastmod: today });
}

async function fetchPublicProjects(): Promise<{ slug: string; published_at: string | null; tags: string[] }[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("sitemap: skipping community videos (missing Supabase env)");
    return [];
  }
  try {
    const r = await fetch(`${url}/rest/v1/projects?is_public=eq.true&hidden=eq.false&select=slug,id,published_at,tags&order=published_at.desc&limit=5000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) {
      console.warn("sitemap: fetch projects failed", r.status);
      return [];
    }
    const rows = (await r.json()) as { slug: string | null; id: string; published_at: string | null; tags: string[] | null }[];
    return rows.map((x) => ({ slug: x.slug || x.id, published_at: x.published_at, tags: x.tags || [] }));
  } catch (e) {
    console.warn("sitemap: error fetching projects", e);
    return [];
  }
}

const publicProjects = await fetchPublicProjects();
const tagSet = new Set<string>();
for (const p of publicProjects) {
  entries.push({
    path: `/community/${p.slug}`,
    changefreq: "weekly",
    priority: "0.6",
    lastmod: p.published_at ? p.published_at.split("T")[0] : today,
  });
  for (const t of p.tags) tagSet.add(t);
}
for (const t of tagSet) {
  entries.push({ path: `/tag/${t}`, changefreq: "weekly", priority: "0.5", lastmod: today });
}

async function fetchPublicCollections(): Promise<{ username: string; slug: string; updated_at: string }[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const r = await fetch(`${url}/rest/v1/collections?is_public=eq.true&select=slug,updated_at,profiles!collections_user_id_fkey(username)&limit=2000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return [];
    const rows = (await r.json()) as { slug: string; updated_at: string; profiles: { username: string } | null }[];
    return rows
      .filter((x) => x.profiles?.username)
      .map((x) => ({ username: x.profiles!.username, slug: x.slug, updated_at: x.updated_at }));
  } catch { return []; }
}

const publicCollections = await fetchPublicCollections();
for (const c of publicCollections) {
  entries.push({
    path: `/u/${c.username}/c/${c.slug}`,
    changefreq: "weekly",
    priority: "0.5",
    lastmod: c.updated_at ? c.updated_at.split("T")[0] : today,
  });
}

// Dataset network: categories, datasets, curated collections.
const DATASET_CATEGORIES = ["economy","finance","population","sports","technology","history","business"];
for (const c of DATASET_CATEGORIES) {
  entries.push({ path: `/datasets/category/${c}`, changefreq: "weekly", priority: "0.7", lastmod: today });
}

async function fetchPublicDatasets(): Promise<{ slug: string; updated_at: string | null; tags: string[] }[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const r = await fetch(`${url}/rest/v1/datasets?is_public=eq.true&hidden=eq.false&select=slug,updated_at,tags&order=updated_at.desc&limit=5000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return [];
    return (await r.json()) as any[];
  } catch { return []; }
}
const publicDatasets = await fetchPublicDatasets();
for (const d of publicDatasets) {
  entries.push({
    path: `/datasets/${d.slug}`,
    changefreq: "weekly",
    priority: "0.7",
    lastmod: d.updated_at ? d.updated_at.split("T")[0] : today,
  });
  for (const t of (d.tags || [])) tagSet.add(t);
}

async function fetchPublicDatasetCollections(): Promise<{ slug: string; updated_at: string }[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const r = await fetch(`${url}/rest/v1/dataset_collections?is_public=eq.true&select=slug,updated_at&limit=2000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return [];
    return (await r.json()) as any[];
  } catch { return []; }
}
const publicDatasetCollections = await fetchPublicDatasetCollections();
for (const c of publicDatasetCollections) {
  entries.push({
    path: `/collections/${c.slug}`,
    changefreq: "weekly",
    priority: "0.6",
    lastmod: c.updated_at ? c.updated_at.split("T")[0] : today,
  });
}

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
