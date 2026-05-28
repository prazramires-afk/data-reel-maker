import { Helmet } from "react-helmet-async";
import { ogImageFor, OG_DEFAULT } from "@/lib/ogImage";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  jsonLd?: object | object[];
  ogImage?: string;
}

const SITE = "https://data-reel-maker.lovable.app";

export const Seo = ({ title, description, path, noindex, jsonLd, ogImage }: SeoProps) => {
  const url = path.startsWith("http") ? path : `${SITE}${path}`;
  // Resolve OG image: explicit prop wins, then a per-route prerendered card,
  // then the global default. This guarantees every page ships a real preview.
  const resolved = ogImage ?? ogImageFor(path) ?? OG_DEFAULT;
  const ogImageUrl = resolved.startsWith("http")
    ? resolved
    : `${SITE}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:image" content={ogImageUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
};