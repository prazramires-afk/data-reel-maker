export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  body: { h2?: string; p?: string }[];
  related: string[];
  ogImage?: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-make-viral-bar-chart-race-videos",
    title: "How to Make Viral Bar Chart Race Videos in 2026",
    seoTitle: "How to Make Viral Bar Chart Race Videos — Step-by-Step Guide",
    excerpt: "A practical guide to producing bar chart race videos that consistently break 100k views on TikTok and YouTube Shorts.",
    date: "2026-05-10",
    readMinutes: 6,
    body: [
      { p: "Bar chart races have quietly become one of the most reliable formats in short-form video. The reason is simple: humans can't stop watching a leaderboard shift. If you've ever scrolled past a 'Top countries by GDP from 1960 to 2025' clip and ended up watching the whole 45 seconds, you already understand the magic. This guide walks through exactly how to make those videos — repeatably, and with data you choose." },
      { h2: "Step 1: Pick a topic with built-in tension" },
      { p: "The viral bar chart races all share one thing: an obvious rivalry. China vs the US. Ronaldo vs Messi. Bitcoin vs Ethereum. The reorder animation only works when viewers care which bar is on top. Before you touch any tool, write down the two or three categories your audience already argues about. That's your dataset." },
      { h2: "Step 2: Get clean time-series data" },
      { p: "Bar chart races need values across time. The minimum useful structure is a CSV with one label column (country, player, coin) and one numeric column per time step (year, quarter, season). World Bank, Wikipedia, Statista and FBref all publish data that drops straight into this shape." },
      { h2: "Step 3: Render in Data to Video" },
      { p: "Open the bar chart race template, paste your CSV, pick a dark or neon theme, and add a hook title. A great hook is short and confrontational — 'The country that quietly overtook the US' beats 'GDP growth 1960–2025' every time." },
      { h2: "Step 4: Export vertical" },
      { p: "Export at 1080×1920. Horizontal exports get half the reach on TikTok and Reels. Add captions in your editor of choice, or use the built-in viral hook overlay." },
      { h2: "Step 5: Post a series, not a one-off" },
      { p: "The accounts that grow fastest with bar chart races post daily. Each video uses the same template, same theme, same hook structure — different data. That's how you get the algorithm to learn your channel." },
    ],
    related: ["why-bar-chart-races-go-viral", "best-tiktok-data-visualization-ideas"],
    ogImage: "/og/blog-bar-chart-race.jpg",
  },
  {
    slug: "best-tiktok-data-visualization-ideas",
    title: "20 Best TikTok Data Visualization Ideas for Creators",
    seoTitle: "Best TikTok Data Visualization Ideas — 20 Viral Formats",
    excerpt: "Twenty proven data video concepts that get millions of views on TikTok, with the exact template to use for each.",
    date: "2026-04-22",
    readMinutes: 7,
    body: [
      { p: "If you make data content on TikTok and your views have plateaued, the issue is almost always the format — not the data. Below are twenty concepts that consistently outperform, grouped by the Data to Video template that fits each." },
      { h2: "Bar chart race ideas" },
      { p: "1. Top economies by GDP. 2. All-time goal scorers. 3. Biggest YouTubers by subscriber count. 4. Crypto market caps month by month. 5. Most-downloaded apps. 6. Most-streamed songs of the decade. 7. F1 driver championship points by season. 8. Olympic medal counts by country." },
      { h2: "Top 10 countdown ideas" },
      { p: "9. Richest people in the world. 10. Best-selling video games. 11. Most-followed celebrities. 12. Most expensive football transfers. 13. Largest cities by population." },
      { h2: "Timeline ideas" },
      { p: "14. World population from year 1 to 2025. 15. Major wars by death toll. 16. Tech company founding years. 17. Average global temperature." },
      { h2: "Head-to-head comparison ideas" },
      { p: "18. Ronaldo vs Messi. 19. iPhone vs Android market share. 20. PlayStation vs Xbox sales." },
      { p: "Pick one, open the matching template, and publish today. The accounts that win in this niche publish daily — the data is everywhere." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos", "how-football-channels-use-statistics-videos"],
    ogImage: "/og/blog-tiktok-ideas.jpg",
  },
  {
    slug: "how-football-channels-use-statistics-videos",
    title: "How Football Channels Use Statistics Videos to Hit Millions of Views",
    seoTitle: "How Football Channels Use Stats Videos — Viral Format Breakdown",
    excerpt: "A breakdown of the stats video formats top football creators use — and how to replicate them with free tools.",
    date: "2026-04-01",
    readMinutes: 5,
    body: [
      { p: "Open TikTok and search 'football stats'. The top results aren't from clubs or broadcasters — they're from one-person channels publishing simple animated charts every single day. The format is so reliable that several accounts have crossed a million followers in under a year doing nothing else." },
      { h2: "The three core formats" },
      { p: "Football stats channels rotate between three formats: head-to-head comparisons, all-time leaderboards and season-by-season races. Each takes under five minutes to make once you have a template." },
      { h2: "Where to get the data" },
      { p: "FBref, Transfermarkt and Wikipedia cover almost every stat worth animating. Copy a table, paste into Google Sheets, export as CSV, drop into Data to Video." },
      { h2: "What makes them work" },
      { p: "Three things: a confrontational title, fast pacing (under 25 seconds), and a clear winner reveal. Avoid neutral framing — 'Who has more goals?' beats 'Goals comparison' every time." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos", "best-tiktok-data-visualization-ideas"],
    ogImage: "/og/blog-football-stats.jpg",
  },
  {
    slug: "why-bar-chart-races-go-viral",
    title: "Why Bar Chart Races Go Viral (and How to Engineer the Effect)",
    seoTitle: "Why Bar Chart Races Go Viral — The Psychology Behind the Format",
    excerpt: "The cognitive reasons behind the bar chart race's enduring viral pull — and how to design your videos around them.",
    date: "2026-03-15",
    readMinutes: 5,
    body: [
      { p: "Bar chart races have been viral for almost a decade. That kind of longevity is rare in short-form video, and it's not an accident — the format taps directly into how human attention works." },
      { h2: "Open loops" },
      { p: "Every reorder of the bars creates a tiny open loop in the viewer's mind: who's going to be on top next? The brain refuses to close that loop until the animation ends, which is why people watch all the way through." },
      { h2: "Recognizable categories" },
      { p: "Countries, players and brands are pre-cached in everyone's head. Viewers don't need to read labels — they recognize the bars instantly, which removes friction in the first three seconds." },
      { h2: "Compressed time" },
      { p: "Sixty years of GDP in thirty seconds feels like watching history on fast-forward. That compression is intrinsically pleasurable." },
      { h2: "Designing for the effect" },
      { p: "Keep the bar count between five and ten. Use bold colors that contrast against a dark background. Add a hook title in the first frame. Don't slow the animation down — fast pacing is part of the appeal." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos", "best-data-formats-for-animated-videos"],
    ogImage: "/og/blog-why-viral.jpg",
  },
  {
    slug: "best-data-formats-for-animated-videos",
    title: "Best Data Formats for Animated Videos",
    seoTitle: "Best Data Formats for Animated Videos — CSV, JSON and Beyond",
    excerpt: "Which data structures work best for animated charts, and how to clean your data before importing it.",
    date: "2026-02-28",
    readMinutes: 4,
    body: [
      { p: "The single biggest reason animated chart videos fail is bad data. Not wrong data — badly shaped data. Here's how to prep yours so it drops cleanly into any animated chart tool." },
      { h2: "CSV is king" },
      { p: "Use a flat CSV with one label column and one numeric column per time step. Avoid merged cells, footnotes inside numeric cells, and currency symbols mixed with numbers." },
      { h2: "Time as columns, not rows" },
      { p: "For bar chart races, each time step (year, month, season) should be its own column. Each row is one category. This 'wide' format is what every animation engine expects." },
      { h2: "Five to ten rows" },
      { p: "Bar chart races with more than ten bars are unreadable on a phone. Pre-filter to the top 5–10 entries before importing." },
      { h2: "Clean numbers" },
      { p: "Strip commas, currency symbols and percent signs. Numbers should be raw — 12500000, not '$12.5M'." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos"],
    ogImage: "/og/blog-data-formats.jpg",
  },
];

export const getPost = (slug?: string) => BLOG_POSTS.find((p) => p.slug === slug);