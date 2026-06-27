/**
 * Generate static Open Graph preview cards (1200x630 PNG) for every
 * SEO route in the site: home, section indexes, templates, datasets,
 * tools, blog posts, watch pages. Output is written to public/og/ so
 * the existing <Seo> + prerender pipeline can ship them as
 * <meta property="og:image">.
 *
 * Rendering pipeline: build an SVG card per route -> rasterize with
 * @resvg/resvg-js. No headless browser required.
 *
 * Run: bun scripts/generate-og-images.ts
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { TEMPLATE_LANDINGS } from "../src/lib/seoContent/templateLandings";
import { DATASETS } from "../src/lib/seoContent/datasets";
import { TOOLS } from "../src/lib/seoContent/tools";
import { WATCH_PAGES } from "../src/lib/seoContent/watchPages";
import { BLOG_POSTS } from "../src/lib/seoContent/blogPosts";
import { ogImageFor } from "../src/lib/ogImage";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "og");
mkdirSync(OUT, { recursive: true });

type Section = "Home" | "Templates" | "Datasets" | "Tools" | "Blog" | "Watch";

interface Card {
  path: string;          // route path, used to derive filename
  badge: Section;
  title: string;
  subtitle?: string;
}

// Section accents tuned to match the dark app theme.
const ACCENTS: Record<Section, [string, string]> = {
  Home:      ["#a78bfa", "#22d3ee"],
  Templates: ["#22d3ee", "#34d399"],
  Datasets:  ["#f59e0b", "#ef4444"],
  Tools:     ["#34d399", "#22d3ee"],
  Blog:      ["#a78bfa", "#f472b6"],
  Watch:     ["#ef4444", "#f59e0b"],
};

const escXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Greedy word wrap targeting a char budget per line. Good enough for
// proportional fonts at this size; the SVG uses textLength only on
// truncated last line via ellipsis to keep things simple.
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (!current) { current = w; continue; }
    if ((current + " " + w).length <= maxChars) current += " " + w;
    else { lines.push(current); current = w; if (lines.length === maxLines) break; }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > maxChars - 1 ? last.slice(0, maxChars - 1) + "…" : last + "…";
  }
  return lines;
}

function svg(card: Card): string {
  const [c1, c2] = ACCENTS[card.badge];
  const titleLines = wrap(card.title, 28, 3);
  const subtitleLines = card.subtitle ? wrap(card.subtitle, 56, 2) : [];
  const titleSize = titleLines.length >= 3 ? 76 : titleLines.length === 2 ? 88 : 100;
  const titleStartY = 260 - (titleLines.length - 1) * (titleSize * 0.55);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0f1a"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.8">
      <stop offset="0" stop-color="${c1}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <!-- subtle grid -->
  <g stroke="#ffffff" stroke-opacity="0.04" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="630"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 90}" x2="1200" y2="${i * 90}"/>`).join("")}
  </g>
  <!-- accent bar -->
  <rect x="80" y="80" width="80" height="6" rx="3" fill="url(#accent)"/>
  <!-- badge -->
  <text x="80" y="130" font-family="Inter, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="${c1}" letter-spacing="4">
    ${escXml(card.badge.toUpperCase())}
  </text>
  <!-- title -->
  <g font-family="Inter, Helvetica, Arial, sans-serif" font-weight="800" fill="#ffffff">
    ${titleLines.map((l, i) => `<text x="80" y="${titleStartY + i * titleSize * 1.05}" font-size="${titleSize}">${escXml(l)}</text>`).join("")}
  </g>
  <!-- subtitle -->
  <g font-family="Inter, Helvetica, Arial, sans-serif" font-size="28" font-weight="400" fill="#cbd5e1">
    ${subtitleLines.map((l, i) => `<text x="80" y="${480 + i * 36}">${escXml(l)}</text>`).join("")}
  </g>
  <!-- brand footer -->
  <g>
    <circle cx="100" cy="568" r="18" fill="url(#accent)"/>
    <text x="132" y="576" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">Data to Video</text>
    <text x="1120" y="576" text-anchor="end" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">data-reel-maker.lovable.app</text>
  </g>
</svg>`;
}

function render(card: Card) {
  const file = ogImageFor(card.path).replace(/^\/og\//, "");
  const out = resolve(OUT, file);
  const png = new Resvg(svg(card), {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" },
    background: "#0b0f1a",
  }).render().asPng();
  writeFileSync(out, png);
  return out;
}

const cards: Card[] = [
  { path: "/", badge: "Home", title: "Turn Data into Viral TikTok & Reels Videos", subtitle: "Bar chart races, top 10 countdowns and animated stats — free, in your browser." },
  { path: "/templates", badge: "Templates", title: "Animated Data Video Templates", subtitle: "Bar chart race, top 10, timeline, head-to-head — vertical MP4s ready for TikTok." },
  { path: "/datasets", badge: "Datasets", title: "Free Datasets for Animated Stats Videos", subtitle: "GDP, sports, demographics, business and crypto — drop in and export." },
  { path: "/tools", badge: "Tools", title: "Free Data Video Tools", subtitle: "CSV to video, chart race generator, ranking maker — all client-side." },
  { path: "/blog", badge: "Blog", title: "Creator Guides for Viral Data to Video", subtitle: "Tutorials, case studies and playbooks for TikTok, Reels and Shorts." },
];

for (const t of TEMPLATE_LANDINGS) {
  cards.push({ path: `/templates/${t.slug}`, badge: "Templates", title: t.h1, subtitle: t.intro });
}
for (const d of DATASETS) {
  cards.push({ path: `/datasets/${d.slug}`, badge: "Datasets", title: d.h1, subtitle: `${d.category} dataset · Source: ${d.source}` });
}
for (const t of TOOLS) {
  cards.push({ path: `/tools/${t.slug}`, badge: "Tools", title: t.h1, subtitle: t.intro });
}
for (const p of BLOG_POSTS) {
  cards.push({ path: `/blog/${p.slug}`, badge: "Blog", title: p.title, subtitle: p.excerpt });
}
for (const w of WATCH_PAGES) {
  cards.push({ path: `/watch/${w.slug}`, badge: "Watch", title: w.title, subtitle: w.description });
}

let count = 0;
for (const card of cards) {
  render(card);
  count++;
}

// Default fallback: rasterize a generic card and also expose as default.jpg
// for any legacy references that still hardcode the .jpg extension.
const defaultPath = resolve(OUT, "default.png");
const defaultPng = new Resvg(svg({
  path: "/default",
  badge: "Home",
  title: "Data to Video",
  subtitle: "Turn any dataset into a vertical animated MP4 for TikTok and Reels.",
}), {
  fitTo: { mode: "width", value: 1200 },
  font: { loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" },
  background: "#0b0f1a",
}).render().asPng();
writeFileSync(defaultPath, defaultPng);
// Mirror to default.jpg if a binary jpg fallback is referenced elsewhere.
const defaultJpg = resolve(OUT, "default.jpg");
if (!existsSync(defaultJpg)) copyFileSync(defaultPath, defaultJpg);

console.log(`og: rendered ${count + 1} cards into public/og/`);