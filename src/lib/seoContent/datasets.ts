import type { Faq } from "@/components/FaqSection";

export interface DatasetRow {
  label: string;
  value: number | string;
  meta?: string;
}

export interface Dataset {
  slug: string;
  title: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  category: "Economy" | "Sports" | "Demographics" | "Business" | "Tech" | "Culture";
  intro: string;
  paragraphs: string[];
  source: string;
  unit: string;
  preview: DatasetRow[];
  recommendedTemplates: string[]; // template landing slugs
  relatedWatch: string[]; // watch slugs
  keywords: string[];
  faqs: Faq[];
}

export const DATASETS: Dataset[] = [
  {
    slug: "gdp-countries",
    title: "GDP by Country",
    h1: "GDP by Country Dataset (1980 – 2025)",
    seoTitle: "GDP by Country Dataset — Free CSV for Bar Chart Race Videos",
    seoDescription:
      "Free GDP by country dataset spanning 1980–2025. Use it to create animated GDP race videos for TikTok, Reels and YouTube Shorts.",
    category: "Economy",
    intro:
      "Annual nominal GDP for every major economy from 1980 to 2025 — ready to drop into a bar chart race or Top 10 countdown.",
    paragraphs: [
      "This dataset covers nominal gross domestic product in current US dollars for 45+ years across the world's largest economies. It is the most-used dataset on Data to Video and powers the majority of viral GDP race videos shared on TikTok and YouTube Shorts.",
      "Load it directly into the Bar Chart Race or Top 10 template, restyle to match your channel and export a vertical MP4 in seconds.",
    ],
    source: "World Bank, IMF World Economic Outlook",
    unit: "USD (billions)",
    preview: [
      { label: "United States", value: 27_360, meta: "2024" },
      { label: "China", value: 17_700, meta: "2024" },
      { label: "Germany", value: 4_456, meta: "2024" },
      { label: "Japan", value: 4_213, meta: "2024" },
      { label: "India", value: 3_730, meta: "2024" },
      { label: "United Kingdom", value: 3_340, meta: "2024" },
      { label: "France", value: 3_030, meta: "2024" },
      { label: "Italy", value: 2_255, meta: "2024" },
    ],
    recommendedTemplates: ["gdp-race", "bar-chart-race", "top-10", "economic-growth"],
    relatedWatch: ["gdp-race-usa-vs-china", "top-10-economies-2025"],
    keywords: ["GDP dataset", "country GDP CSV", "world economy data"],
    faqs: [
      { q: "Is the GDP dataset free to use?", a: "Yes — load it in the editor and export commercially with no attribution required." },
      { q: "Can I download the CSV?", a: "The dataset is bundled inside the editor. Open any GDP template and the data loads instantly." },
    ],
  },
  {
    slug: "fifa-goals",
    title: "All-Time Football Goals",
    h1: "FIFA / Football Goals Dataset",
    seoTitle: "Football Goals Dataset — Top Scorers Data for Stats Videos",
    seoDescription:
      "All-time football goal scorer dataset including Messi, Ronaldo, Pelé and more. Perfect for TikTok football stats videos and head-to-head comparisons.",
    category: "Sports",
    intro:
      "Career goal tallies for the all-time top scorers in men's football, with year-by-year breakdowns for the modern era.",
    paragraphs: [
      "Football stats accounts on TikTok routinely cross 10M views by animating goal-scorer rankings. This dataset includes club and international goals for legendary strikers and is built to drop directly into the Comparison and Bar Chart Race templates.",
      "Use the Comparison template for Messi vs Ronaldo style head-to-heads, or the Bar Chart Race for an all-time leaderboard.",
    ],
    source: "FIFA, RSSSF, club archives",
    unit: "Goals",
    preview: [
      { label: "Cristiano Ronaldo", value: 935 },
      { label: "Lionel Messi", value: 870 },
      { label: "Pelé", value: 762 },
      { label: "Romário", value: 772 },
      { label: "Josef Bican", value: 805 },
      { label: "Ferenc Puskás", value: 729 },
    ],
    recommendedTemplates: ["football-stats", "bar-chart-race", "top-10"],
    relatedWatch: ["ronaldo-vs-messi-goals"],
    keywords: ["football goals dataset", "Messi Ronaldo data", "top scorers CSV"],
    faqs: [
      { q: "Does it include international goals?", a: "Yes — both club and international goals are aggregated." },
      { q: "Can I add a player?", a: "Absolutely. Use the editor to append rows or upload your own CSV." },
    ],
  },
  {
    slug: "nba-points",
    title: "NBA All-Time Points",
    h1: "NBA All-Time Scoring Leaders Dataset",
    seoTitle: "NBA Points Dataset — All-Time Scoring Leaders for Stats Videos",
    seoDescription:
      "Free NBA all-time scoring leaders dataset. Make TikTok and Reels videos comparing LeBron, Kareem, Jordan, Kobe and more.",
    category: "Sports",
    intro: "Career points scored by the all-time leaders in NBA history, ready for ranking and head-to-head videos.",
    paragraphs: [
      "Basketball ranking content is one of the highest-engagement niches on short-form video. This dataset includes career totals and per-season totals for the all-time NBA scoring leaders.",
    ],
    source: "NBA.com, Basketball-Reference",
    unit: "Points",
    preview: [
      { label: "LeBron James", value: 41_500 },
      { label: "Kareem Abdul-Jabbar", value: 38_387 },
      { label: "Karl Malone", value: 36_928 },
      { label: "Kobe Bryant", value: 33_643 },
      { label: "Michael Jordan", value: 32_292 },
    ],
    recommendedTemplates: ["nba-ranking-animation", "bar-chart-race", "top-10"],
    relatedWatch: [],
    keywords: ["NBA points dataset", "basketball scoring CSV", "LeBron Jordan data"],
    faqs: [
      { q: "Is per-season data included?", a: "Yes — yearly point totals are available for the top 20 scorers." },
    ],
  },
  {
    slug: "population-growth",
    title: "World Population Growth",
    h1: "World Population Growth Dataset",
    seoTitle: "Population Growth Dataset — World & Country Data for Videos",
    seoDescription:
      "Free world population dataset by country, 1950–2025. Use for animated demographic videos on TikTok, Reels and YouTube Shorts.",
    category: "Demographics",
    intro: "Population by country and global totals across 75 years of demographic change.",
    paragraphs: [
      "Educational TikTok pages use population growth animations as evergreen content because the numbers compress centuries of change into a single 30-second video. This dataset feeds the Timeline and Bar Chart Race templates.",
    ],
    source: "UN World Population Prospects",
    unit: "People",
    preview: [
      { label: "India", value: "1.45B" },
      { label: "China", value: "1.41B" },
      { label: "United States", value: "341M" },
      { label: "Indonesia", value: "281M" },
      { label: "Pakistan", value: "245M" },
    ],
    recommendedTemplates: ["population-growth", "bar-chart-race", "top-10"],
    relatedWatch: [],
    keywords: ["population dataset", "demographic CSV", "country population data"],
    faqs: [
      { q: "What years are covered?", a: "1950 through 2025 with annual granularity." },
    ],
  },
  {
    slug: "richest-companies",
    title: "Richest Companies by Market Cap",
    h1: "Richest Companies by Market Cap Dataset",
    seoTitle: "Market Cap Dataset — Richest Companies for TikTok Stats Videos",
    seoDescription:
      "Free dataset of the world's most valuable companies by market capitalization. Use it for animated business and tech rankings.",
    category: "Business",
    intro: "Daily-updated market capitalization snapshots for the world's most valuable public companies.",
    paragraphs: [
      "Tech finance creators routinely post Top 10 most valuable companies videos. This dataset captures Apple, Microsoft, Nvidia, Saudi Aramco and the rest of the trillion-dollar club.",
    ],
    source: "Public exchanges, companiesmarketcap.com",
    unit: "USD (billions)",
    preview: [
      { label: "Nvidia", value: 3_350 },
      { label: "Apple", value: 3_300 },
      { label: "Microsoft", value: 3_080 },
      { label: "Alphabet", value: 2_220 },
      { label: "Amazon", value: 1_980 },
      { label: "Saudi Aramco", value: 1_780 },
    ],
    recommendedTemplates: ["bar-chart-race", "top-10", "economic-growth"],
    relatedWatch: [],
    keywords: ["market cap dataset", "richest companies CSV", "trillion dollar companies"],
    faqs: [
      { q: "How fresh is the data?", a: "We update the bundled snapshot monthly. Upload your own CSV for live values." },
    ],
  },
  {
    slug: "crypto-marketcap",
    title: "Crypto Market Cap",
    h1: "Cryptocurrency Market Cap Dataset",
    seoTitle: "Crypto Market Cap Dataset — Top Coins Data for Stats Videos",
    seoDescription:
      "Free dataset of the top cryptocurrencies by market cap. Animate Bitcoin, Ethereum, Solana rankings for TikTok and Reels.",
    category: "Tech",
    intro: "Market cap and price data for the top 50 cryptocurrencies.",
    paragraphs: [
      "Crypto rankings drive massive engagement on finance TikTok. Drop this dataset into a Top 10 countdown or Bar Chart Race for an instant viral format.",
    ],
    source: "CoinGecko, CoinMarketCap",
    unit: "USD (billions)",
    preview: [
      { label: "Bitcoin", value: 1_780 },
      { label: "Ethereum", value: 410 },
      { label: "Tether", value: 130 },
      { label: "BNB", value: 95 },
      { label: "Solana", value: 88 },
    ],
    recommendedTemplates: ["bar-chart-race", "top-10", "economic-growth"],
    relatedWatch: [],
    keywords: ["crypto dataset", "Bitcoin Ethereum data", "market cap CSV"],
    faqs: [
      { q: "Is live price data included?", a: "We ship a snapshot. Plug a live CSV via the editor for fresh numbers." },
    ],
  },
];

export const getDataset = (slug?: string) => DATASETS.find((d) => d.slug === slug);