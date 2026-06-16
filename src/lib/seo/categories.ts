export type CommunityCategory =
  | "economy"
  | "finance"
  | "population"
  | "sports"
  | "technology"
  | "history"
  | "education"
  | "politics"
  | "business"
  | "entertainment"
  | "other";

export interface CategoryMeta {
  slug: CommunityCategory;
  name: string;
  title: string;
  description: string;
  intro: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "economy",
    name: "Economy",
    title: "Economy Data Videos — GDP, Trade, FDI & Growth",
    description:
      "Animated economy data videos: GDP, FDI inflows, trade, inflation, growth rankings and country comparisons.",
    intro:
      "Animated videos covering GDP rankings, FDI flows, trade balances, inflation, growth and country comparisons — built from public datasets by Data to Video creators.",
  },
  {
    slug: "finance",
    name: "Finance",
    title: "Finance Data Videos — Markets, Revenue & Market Cap",
    description:
      "Finance and markets in motion: company revenue, market capitalization, stock performance and earnings rankings.",
    intro:
      "Charts that move: company revenue races, market-cap rankings, earnings comparisons and stock-market histories.",
  },
  {
    slug: "population",
    name: "Population",
    title: "Population Data Videos — Demographics & Growth",
    description:
      "Population growth, urbanization and demographic shifts visualized as animated rankings.",
    intro:
      "Population growth, urbanization, life expectancy and demographic shifts rendered as bar chart races and timelines.",
  },
  {
    slug: "sports",
    name: "Sports",
    title: "Sports Data Videos — Goals, Trophies & Rankings",
    description:
      "Football goals, championship counts, athlete career stats and historical rankings as animated comparisons.",
    intro:
      "Goal-scorer races, trophy counts, season comparisons and historical sports rankings as animated data videos.",
  },
  {
    slug: "technology",
    name: "Technology",
    title: "Technology Data Videos — Subscribers, Adoption & Growth",
    description:
      "YouTube subscribers, app downloads, technology adoption and platform growth as animated rankings.",
    intro:
      "Subscriber counts, app downloads, platform growth and technology adoption visualized through time.",
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    title: "Entertainment Data Videos — Streaming, Box Office & Charts",
    description:
      "Box office, streaming, music charts and entertainment industry rankings as animated bar chart races.",
    intro:
      "Box office, streaming, music charts and entertainment rankings — animated for short-form video.",
  },
  {
    slug: "history",
    name: "History",
    title: "History Data Videos — Empires, Events & Timelines",
    description:
      "Historical rankings, empire timelines, wars and centuries of data visualized as animated charts.",
    intro: "Empires, wars, eras and centuries of human history — animated as data videos.",
  },
  {
    slug: "education",
    name: "Education",
    title: "Education Data Videos — Schools, Literacy & Rankings",
    description:
      "Education statistics: literacy, schools, university rankings and enrollment animated as data videos.",
    intro: "Education data: literacy, university rankings, school enrollment and learning outcomes.",
  },
  {
    slug: "politics",
    name: "Politics",
    title: "Politics Data Videos — Elections, Polls & Power",
    description:
      "Elections, polls, leadership and political rankings visualized as animated charts.",
    intro: "Elections, polls, leadership tenures and political rankings across time.",
  },
  {
    slug: "business",
    name: "Business",
    title: "Business Data Videos — Companies, Brands & Industry",
    description:
      "Company revenues, brand value, market share and industry rankings as animated comparisons.",
    intro: "Companies, brands, market share and industry rankings rendered as short-form data videos.",
  },
  {
    slug: "other",
    name: "Other",
    title: "Community Data Videos — Other Topics",
    description:
      "Community data videos that don't fit a single category — climate, education, science and more.",
    intro: "Community videos covering everything that doesn't fit the other categories.",
  },
];

const SET = new Set(CATEGORIES.map((c) => c.slug));

export function isCategorySlug(s: string | undefined | null): s is CommunityCategory {
  return !!s && SET.has(s as CommunityCategory);
}

export function getCategory(slug: string | null | undefined): CategoryMeta | undefined {
  if (!isCategorySlug(slug)) return undefined;
  return CATEGORIES.find((c) => c.slug === slug);
}