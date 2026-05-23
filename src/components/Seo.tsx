import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

export const Seo = ({ title, description, path, noindex }: SeoProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={path} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={path} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
  </Helmet>
);