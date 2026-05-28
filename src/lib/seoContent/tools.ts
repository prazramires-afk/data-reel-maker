import type { Faq } from "@/components/FaqSection";

export interface Tool {
  slug: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  paragraphs: string[];
  steps: string[];
  templateId: string;
  templateSlug: string;
  keywords: string[];
  faqs: Faq[];
}

export const TOOLS: Tool[] = [
  {
    slug: "csv-to-video",
    h1: "CSV to Video Converter",
    seoTitle: "CSV to Video — Free Online Converter for TikTok & Reels",
    seoDescription:
      "Convert any CSV into an animated video for TikTok, Reels and YouTube Shorts. Free, in your browser, no upload required.",
    intro: "Drop a CSV in and walk out with a vertical animated MP4 — bar chart race, timeline or Top 10.",
    paragraphs: [
      "Our CSV to video converter parses your spreadsheet locally, maps columns to chart values and animates the result in a vertical 1080×1920 frame ready for TikTok and Reels.",
      "Supports label + value columns, multi-year wide-format data, and avatar URLs per row.",
    ],
    steps: [
      "Click Upload CSV and pick your file",
      "Map the label and value columns",
      "Choose a template and theme",
      "Hit Export and download your MP4",
    ],
    templateId: "viral-bar-race",
    templateSlug: "bar-chart-race",
    keywords: ["csv to video", "spreadsheet to video", "data to mp4"],
    faqs: [
      { q: "Does my CSV leave my device?", a: "No. Parsing and rendering happen entirely in your browser." },
      { q: "What CSV format works?", a: "Standard comma-separated with a header row. Both long and wide formats are supported." },
    ],
  },
  {
    slug: "chart-race-generator",
    h1: "Chart Race Generator",
    seoTitle: "Chart Race Generator — Free Animated Race Maker Online",
    seoDescription:
      "Generate animated chart race videos online. Free bar chart race maker for rankings, GDP, sports and stats videos.",
    intro: "The fastest way to turn rankings over time into a viral animated race.",
    paragraphs: [
      "The chart race generator animates bars overtaking each other based on your data. Pick a theme, set the duration and export a vertical MP4.",
    ],
    steps: [
      "Pick the Bar Chart Race template",
      "Upload your data or load a sample",
      "Style with theme, speed and labels",
      "Export vertical 1080×1920",
    ],
    templateId: "viral-bar-race",
    templateSlug: "bar-chart-race",
    keywords: ["chart race generator", "animated chart maker", "bar race maker"],
    faqs: [{ q: "Is there a watermark?", a: "No watermark on premium exports; free exports include a small Data to Video tag." }],
  },
  {
    slug: "ranking-video-maker",
    h1: "Ranking Video Maker",
    seoTitle: "Ranking Video Maker — Top 10 Countdown Generator",
    seoDescription:
      "Make Top 10 ranking videos online for free. Animated countdown reveals built for TikTok, Reels and YouTube Shorts.",
    intro: "Reveal a ranking one entry at a time — the highest completion-rate format on short-form video.",
    paragraphs: [
      "Use the ranking video maker for top economies, top scorers, top YouTubers, top cities — anything you can list. Each entry gets its own dramatic reveal.",
    ],
    steps: [
      "Enter your ranked list",
      "Add avatars per entry",
      "Pick a theme",
      "Export and post",
    ],
    templateId: "top10-gdp",
    templateSlug: "top-10",
    keywords: ["ranking video maker", "top 10 generator", "countdown video"],
    faqs: [{ q: "Can I do Top 5 or Top 20?", a: "Yes — any list length works." }],
  },
  {
    slug: "statistics-video-generator",
    h1: "Statistics Video Generator",
    seoTitle: "Statistics Video Generator — Animated Stats for TikTok & Reels",
    seoDescription:
      "Turn statistics and numbers into animated videos. Free statistics video generator built for short-form creators.",
    intro: "Animate any statistic — sports, finance, demographics — into a clean vertical short.",
    paragraphs: [
      "Pair the statistics video generator with our datasets library for evergreen content ideas. Every export is sized for TikTok, Reels and Shorts.",
    ],
    steps: [
      "Pick a stat-friendly template",
      "Load a dataset or paste your numbers",
      "Add a viral hook overlay",
      "Export vertical MP4",
    ],
    templateId: "comparison-football",
    templateSlug: "football-stats",
    keywords: ["statistics video", "stats video maker", "numbers to video"],
    faqs: [{ q: "Best dataset to start with?", a: "GDP by Country and All-Time Football Goals consistently perform best." }],
  },
  {
    slug: "tiktok-data-video-maker",
    h1: "TikTok Data Video Maker",
    seoTitle: "TikTok Data Video Maker — Vertical Animated Charts in Seconds",
    seoDescription:
      "The TikTok data video maker creators use to publish daily stats content. Free vertical exports, no watermark on premium.",
    intro: "Built from the ground up for vertical 9:16 video, viral hook overlays and one-tap publishing.",
    paragraphs: [
      "Data to Video's TikTok-first design means every export is pre-sized for the platform, with safe areas for captions, hooks and your channel handle.",
    ],
    steps: [
      "Pick a viral template",
      "Drop in your data",
      "Add a hook ('Watch till the end…')",
      "Export 1080×1920 MP4",
    ],
    templateId: "viral-bar-race",
    templateSlug: "bar-chart-race",
    keywords: ["tiktok data video", "tiktok stats maker", "vertical chart video"],
    faqs: [{ q: "Does it post directly to TikTok?", a: "No — export the MP4 and upload from the TikTok app or web." }],
  },
];

export const getTool = (slug?: string) => TOOLS.find((t) => t.slug === slug);