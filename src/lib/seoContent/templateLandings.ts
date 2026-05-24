import type { Faq } from "@/components/FaqSection";

export interface TemplateLanding {
  slug: string;
  templateId: string; // matches TEMPLATES id
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  paragraphs: string[];
  features: string[];
  keywords: string[];
  faqs: Faq[];
}

export const TEMPLATE_LANDINGS: TemplateLanding[] = [
  {
    slug: "bar-chart-race",
    templateId: "viral-bar-race",
    h1: "Free Bar Chart Race Video Maker Online",
    seoTitle: "Free Bar Chart Race Maker — Animated Charts for TikTok & Reels",
    seoDescription: "Create animated bar chart race videos online for free. Turn rankings, GDP, sports stats and CSV data into viral TikTok and Reels videos in seconds.",
    intro: "Make viral bar chart race videos in your browser — no software, no signup, no watermark on premium.",
    paragraphs: [
      "A bar chart race is the single most shareable data visualization format on short-form video. Watching bars overtake each other taps into the same loop that makes sports highlights and leaderboard reveals so addictive. Data to Video gives you a free bar chart race maker that runs entirely in your browser, exports vertical MP4s sized for TikTok and Reels, and supports CSV upload or manual entry.",
      "Use the bar chart race generator for GDP rankings, population growth, football scorers, YouTube subscriber counts, crypto market caps, app downloads — anything with categories and values across time. Pick a dark, light or neon theme, set the title, choose your speed, and export. The render happens client-side on your device, so your data never leaves your browser.",
      "Creators use Data to Video's animated bar chart maker to publish daily stats content, weekly leaderboard recaps, and viral comparison videos. With a clean vertical layout, bold typography and built-in viral hooks, your charts look like they were produced by a full motion-design team.",
    ],
    features: [
      "Vertical 1080×1920 export for TikTok and Reels",
      "CSV upload or manual data entry",
      "Smooth bar reorder animation",
      "Dark, light and neon themes",
      "Built-in viral hook text overlays",
      "Green Screen mode for chroma keying",
    ],
    keywords: ["bar chart race maker", "animated bar chart", "data video generator"],
    faqs: [
      { q: "Is the bar chart race maker free?", a: "Yes. You can create and export bar chart race videos every day on the free plan." },
      { q: "What data format do I need?", a: "Upload a CSV with a label column and one or more numeric columns, or enter values manually inside the editor." },
      { q: "Can I export for TikTok?", a: "Yes — every export is a vertical 1080×1920 MP4 ready to upload to TikTok, Reels and YouTube Shorts." },
    ],
  },
  {
    slug: "gdp-race",
    templateId: "viral-bar-race",
    h1: "Create GDP Race Videos Instantly",
    seoTitle: "GDP Race Video Generator — Animated Economy Comparison Videos",
    seoDescription: "Generate animated GDP race videos comparing world economies. Free online GDP race maker for TikTok, Reels and YouTube Shorts.",
    intro: "Compare the world's biggest economies in a viral animated race — perfect for finance and educational creators.",
    paragraphs: [
      "GDP race videos consistently rank among the most-viewed data visualizations on TikTok and YouTube Shorts. Data to Video ships with a curated GDP dataset covering the world's largest economies over multiple decades — load it, restyle it and publish in minutes.",
      "Beyond GDP, the same engine handles GDP per capita, debt ratios, currency reserves and any economic indicator you can fit into a CSV. Match your channel's brand with custom theme colors, add a viral hook title, and export a vertical MP4 ready for social.",
    ],
    features: ["Pre-loaded GDP dataset", "Decade-by-decade animation", "Country flag avatars", "Vertical TikTok/Reels export"],
    keywords: ["GDP race generator", "economic comparison video", "country GDP animation"],
    faqs: [
      { q: "Can I use my own GDP data?", a: "Yes — upload a CSV with country names and yearly GDP values." },
      { q: "Does it work for GDP per capita?", a: "Yes. The template works with any economic indicator." },
    ],
  },
  {
    slug: "football-stats",
    templateId: "comparison-football",
    h1: "Football Stats Video Maker for TikTok",
    seoTitle: "Football Stats Video Maker — Goal Scorer & Player Comparison",
    seoDescription: "Make football statistics videos for TikTok and Reels. Compare goal scorers, assists and season stats with animated head-to-head charts.",
    intro: "Build head-to-head player comparisons, all-time scorer rankings and season recaps in the same format used by viral football pages.",
    paragraphs: [
      "Football is the most-watched sport on social — and football stats accounts get millions of views by turning numbers into motion. Data to Video gives you a football stats video maker built for goal scorers, assist leaders, Ballon d'Or races and head-to-head player comparisons.",
      "Use the Comparison template for Ronaldo vs Messi style showdowns, or the Bar Chart Race for all-time scorer leaderboards across seasons. Upload your own player photos as avatars and brand the export with your channel name.",
    ],
    features: ["Player avatar support", "Head-to-head comparison mode", "All-time scorer rankings", "Custom themes per club"],
    keywords: ["football stats video maker", "soccer ranking video", "goal scorer animation"],
    faqs: [
      { q: "Can I add player photos?", a: "Yes, upload PNGs or JPGs as avatars for each player." },
      { q: "Does it work for other sports?", a: "Yes — the same engine handles basketball, F1, esports and any stat-driven sport." },
    ],
  },
  {
    slug: "population-growth",
    templateId: "timeline-population",
    h1: "Population Growth Animation Maker",
    seoTitle: "Population Growth Video Maker — Animated Timeline Generator",
    seoDescription: "Create animated population growth videos for TikTok, Reels and educational content. Free online timeline maker for demographic data.",
    intro: "Visualize population growth across centuries in a clean, animated timeline.",
    paragraphs: [
      "Population growth videos perform exceptionally well on educational TikTok and YouTube Shorts because they compress thousands of years of change into 30 seconds of motion. Data to Video's timeline generator handles country populations, city growth, world milestones and any time-series demographic data.",
      "Pair the timeline with the Bar Chart Race template for a two-shot reveal — first the global trend, then the country-by-country race. Both export as vertical MP4s ready for social.",
    ],
    features: ["Smooth timeline animation", "Decade and century scales", "Educational dark theme", "Vertical export"],
    keywords: ["population growth animation", "demographic video maker", "timeline video generator"],
    faqs: [
      { q: "What time range can I use?", a: "Any range from a single year to several millennia." },
    ],
  },
  {
    slug: "top-10",
    templateId: "top10-gdp",
    h1: "Top 10 Countdown Video Maker",
    seoTitle: "Top 10 Countdown Video Maker — Ranking Animation Generator",
    seoDescription: "Make Top 10 countdown videos online. Animated ranking reveals for TikTok, Reels and YouTube Shorts — free and instant.",
    intro: "Reveal a top 10 ranking with a dramatic countdown — the most clicked-through format on short-form video.",
    paragraphs: [
      "Top 10 countdowns drive higher completion rate than almost any other short-form format because viewers stay until #1 is revealed. Data to Video's top 10 video maker animates the reveal one entry at a time with bold typography, viral hook overlays and your choice of theme.",
      "Use it for top economies, top scorers, top YouTubers, top crypto coins, top cities — any ranking you can fit into a list. Upload an avatar per entry and publish vertically for TikTok and Reels.",
    ],
    features: ["One-by-one reveal animation", "Avatar support", "Three theme styles", "TikTok-ready export"],
    keywords: ["top 10 video maker", "countdown video generator", "ranking animation"],
    faqs: [
      { q: "Can I do top 5 or top 20?", a: "Yes — any list length works." },
    ],
  },
  {
    slug: "economic-growth",
    templateId: "economic-growth",
    h1: "Economic Growth Visualization Generator",
    seoTitle: "Economic Growth Video Generator — Animated Financial Data",
    seoDescription: "Animate economic growth data with a free online video generator. Perfect for finance creators, analysts and educators.",
    intro: "Turn economic indicators, inflation rates and currency moves into clean motion content.",
    paragraphs: [
      "Finance creators on TikTok and YouTube use animated charts to make dense economic data instantly readable. Data to Video lets you visualize GDP growth, inflation, unemployment, central-bank rates and currency movements with smooth bar reorder animation and decade-spanning timelines.",
      "Pair multiple exports back-to-back for a longer YouTube video, or post the standalone vertical MP4 to TikTok and Reels.",
    ],
    features: ["Multi-decade animation", "Financial dark theme", "CSV-driven", "Vertical export"],
    keywords: ["economic growth animation", "finance video maker", "inflation chart video"],
    faqs: [
      { q: "Is my data uploaded anywhere?", a: "No — all rendering happens locally in your browser." },
    ],
  },
];

export const getLanding = (slug?: string) =>
  TEMPLATE_LANDINGS.find((t) => t.slug === slug);