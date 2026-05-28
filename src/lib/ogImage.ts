/**
 * Deterministic mapping from a route path to its prerendered Open Graph
 * image (1200x630 PNG). Files are produced by scripts/generate-og-images.ts
 * and committed under public/og/. If no card exists for a path the caller
 * should fall back to /og/default.jpg (which the generator also writes).
 */
export const OG_DEFAULT = "/og/default.jpg";

const cleanSlug = (s: string) =>
  s.replace(/^\/+|\/+$/g, "").replace(/\//g, "-").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

export function ogImageFor(path: string): string {
  if (!path || path === "/") return "/og/home.png";
  const trimmed = path.split("?")[0].split("#")[0].replace(/\/+$/, "");
  const parts = trimmed.replace(/^\/+/, "").split("/");
  const [section, slug] = parts;
  if (!section) return OG_DEFAULT;
  if (!slug) return `/og/${cleanSlug(section)}.png`;
  return `/og/${cleanSlug(section)}-${cleanSlug(slug)}.png`;
}