import { Helmet } from "react-helmet-async";

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
  const ogImageUrl = ogImage
    ? ogImage.startsWith("http") ? ogImage : `${SITE}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`
    : undefined;
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
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
};