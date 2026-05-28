export interface WatchPage {
  slug: string;
  title: string;
  description: string;
  templateId: string;
  templateSlug: string;
  datasetSlug?: string;
  ogImage: string;
  uploadDate: string;
  summary: string;
  keywords: string[];
}

export const WATCH_PAGES: WatchPage[] = [
  {
    slug: "gdp-race-usa-vs-china",
    title: "GDP Race: USA vs China (1980–2025)",
    description: "The animated race between the world's two biggest economies over the last 45 years.",
    templateId: "viral-bar-race",
    templateSlug: "gdp-race",
    datasetSlug: "gdp-countries",
    ogImage: "/og/watch-gdp-usa-china.jpg",
    uploadDate: "2026-01-15",
    summary: "USA leads from 1980 onwards but China closes the gap dramatically after 2001. Watch the animated bar race recreate 45 years of GDP history in 30 seconds.",
    keywords: ["USA vs China GDP", "GDP race video", "economy comparison"],
  },
  {
    slug: "ronaldo-vs-messi-goals",
    title: "Ronaldo vs Messi — All-Time Goals",
    description: "Head-to-head animated comparison of every official goal scored by both players.",
    templateId: "comparison-football",
    templateSlug: "football-stats",
    datasetSlug: "fifa-goals",
    ogImage: "/og/watch-ronaldo-messi.jpg",
    uploadDate: "2026-02-01",
    summary: "From the early 2000s to today, this head-to-head animation tallies every club and international goal scored by the two greatest of their generation.",
    keywords: ["Ronaldo vs Messi", "all time goals", "football stats video"],
  },
  {
    slug: "top-10-economies-2025",
    title: "Top 10 Economies in 2025",
    description: "The world's biggest economies, ranked and revealed one by one.",
    templateId: "top10-gdp",
    templateSlug: "top-10",
    datasetSlug: "gdp-countries",
    ogImage: "/og/watch-top10-economies.jpg",
    uploadDate: "2026-01-20",
    summary: "A dramatic countdown of the 10 largest economies in the world right now, revealed one entry at a time with country flags and 2025 GDP figures.",
    keywords: ["top 10 economies", "biggest economies 2025", "GDP ranking"],
  },
  {
    slug: "richest-companies-2025",
    title: "Top 10 Most Valuable Companies (2025)",
    description: "Nvidia, Apple, Microsoft and the rest of the trillion-dollar club ranked by market cap.",
    templateId: "top10-gdp",
    templateSlug: "top-10",
    datasetSlug: "richest-companies",
    ogImage: "/og/default.jpg",
    uploadDate: "2026-02-10",
    summary: "The most valuable public companies in the world right now, with current market caps and ticker symbols.",
    keywords: ["most valuable companies", "market cap ranking", "trillion dollar club"],
  },
  {
    slug: "world-population-1950-2025",
    title: "World Population 1950 → 2025",
    description: "75 years of demographic change animated as a timeline.",
    templateId: "timeline-population",
    templateSlug: "population-growth",
    datasetSlug: "population-growth",
    ogImage: "/og/default.jpg",
    uploadDate: "2026-02-15",
    summary: "From 2.5 billion in 1950 to over 8 billion today — watch the entire arc of modern world population growth in 30 seconds.",
    keywords: ["world population growth", "demographic video", "population timeline"],
  },
  {
    slug: "top-crypto-marketcap",
    title: "Top 10 Cryptocurrencies by Market Cap",
    description: "Bitcoin, Ethereum and the rest of the top 10 coins, ranked.",
    templateId: "top10-gdp",
    templateSlug: "top-10",
    datasetSlug: "crypto-marketcap",
    ogImage: "/og/default.jpg",
    uploadDate: "2026-02-20",
    summary: "A snapshot countdown of the biggest crypto assets by market cap, perfect for finance and crypto TikTok pages.",
    keywords: ["crypto market cap", "top crypto", "Bitcoin Ethereum ranking"],
  },
];

export const getWatch = (slug?: string) => WATCH_PAGES.find((w) => w.slug === slug);