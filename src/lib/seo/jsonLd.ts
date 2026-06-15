import type { Project } from "@/lib/types";
import type { Faq } from "@/components/FaqSection";

const SITE = "https://data-reel-maker.lovable.app";

export function videoObjectLd(project: Project, url: string, ogImage?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: project.settings?.title || project.name,
    description:
      (project as any).meta_description ||
      (project as any).summary?.slice(0, 200) ||
      `Animated data video by ${project.authorName || "a Data to Video creator"}.`,
    thumbnailUrl: ogImage ? [ogImage] : undefined,
    uploadDate: project.publishedAt || project.createdAt,
    contentUrl: url,
    embedUrl: url,
  };
}

export function datasetLd(project: Project, url: string) {
  const labels = Array.from(new Set((project.data || []).map((r) => r.label)));
  const years = Array.from(new Set((project.data || []).map((r) => r.year))).sort();
  const fmt = project.settings?.valueFormat;
  const unit = fmt?.unit || fmt?.suffix || fmt?.prefix || undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: project.settings?.title || project.name,
    description:
      (project as any).summary ||
      `Dataset of ${labels.length} entries${years.length ? ` from ${years[0]} to ${years[years.length - 1]}` : ""}.`,
    creator: project.authorName ? { "@type": "Person", name: project.authorName } : undefined,
    url,
    variableMeasured: unit ? `${labels[0] || "value"} (${unit})` : labels[0] || "value",
    temporalCoverage:
      years.length > 1 ? `${years[0]}/${years[years.length - 1]}` : years[0] ? String(years[0]) : undefined,
    keywords: labels.slice(0, 20).join(", "),
  };
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.path.startsWith("http") ? it.path : `${SITE}${it.path}`,
    })),
  };
}

export function collectionLd(name: string, description: string, url: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  };
}