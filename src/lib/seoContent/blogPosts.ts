export type BlogCategory =
  | "Tutorials"
  | "TikTok Growth"
  | "YouTube Shorts"
  | "Data Visualization"
  | "Football Statistics"
  | "Viral Video Psychology"
  | "Creator Economy"
  | "Case Studies";

export const BLOG_CATEGORIES: BlogCategory[] = [
  "Tutorials",
  "TikTok Growth",
  "YouTube Shorts",
  "Data Visualization",
  "Football Statistics",
  "Viral Video Psychology",
  "Creator Economy",
  "Case Studies",
];

export interface Author {
  name: string;
  role: string;
  bio: string;
}

export const AUTHORS: Record<string, Author> = {
  editorial: {
    name: "Data to Video Editorial",
    role: "Editorial team",
    bio: "We test every format we write about. Our editorial team publishes data videos daily across niche TikTok and YouTube accounts and shares what actually moves the needle for creators.",
  },
  marco: {
    name: "Marco Rivers",
    role: "Football data creator",
    bio: "Marco runs a football-stats account that crossed 600k followers in 14 months posting one animated chart per day. He focuses on the European leagues and Champions League history.",
  },
  ana: {
    name: "Ana Petrova",
    role: "Growth analyst",
    bio: "Ana studies algorithmic distribution on short-form platforms and consults for finance and education channels on TikTok and YouTube Shorts.",
  },
};

export type BodyBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; text: string; tone?: "tip" | "warn" }
  | { type: "quote"; text: string; cite?: string }
  | { type: "embed"; kind: "template" | "dataset" | "tool" | "watch"; slug: string; label?: string };

export interface FaqItem { q: string; a: string }

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string;
  excerpt: string;
  date: string;
  updated?: string;
  readMinutes: number;
  category: BlogCategory;
  tags: string[];
  authorKey: keyof typeof AUTHORS;
  body: BodyBlock[];
  faqs?: FaqItem[];
  related: string[];
  relatedTemplates?: string[];
  relatedDatasets?: string[];
  relatedTools?: string[];
  relatedWatch?: string[];
  ogImage?: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-make-viral-bar-chart-race-videos",
    title: "How to Make Viral Bar Chart Race Videos in 2026",
    seoTitle: "How to Make Viral Bar Chart Race Videos — Step-by-Step Guide",
    excerpt: "A practical guide to producing bar chart race videos that consistently break 100k views on TikTok and YouTube Shorts.",
    date: "2026-05-10",
    updated: "2026-05-18",
    readMinutes: 6,
    category: "Tutorials",
    tags: ["bar chart race", "tiktok", "tutorial", "viral"],
    authorKey: "editorial",
    body: [
      { type: "p", text: "Bar chart races have quietly become one of the most reliable formats in short-form video. The reason is simple: humans can't stop watching a leaderboard shift. If you've ever scrolled past a 'Top countries by GDP from 1960 to 2025' clip and ended up watching the whole 45 seconds, you already understand the magic. This guide walks through exactly how to make those videos — repeatably, and with data you choose." },
      { type: "h2", text: "Step 1: Pick a topic with built-in tension" },
      { type: "p", text: "The viral bar chart races all share one thing: an obvious rivalry. China vs the US. Ronaldo vs Messi. Bitcoin vs Ethereum. The reorder animation only works when viewers care which bar is on top. Before you touch any tool, write down the two or three categories your audience already argues about. That's your dataset." },
      { type: "callout", tone: "tip", text: "If you can't name the rivalry in five words, the video won't hook. Test the title out loud before you build." },
      { type: "h2", text: "Step 2: Get clean time-series data" },
      { type: "p", text: "Bar chart races need values across time. The minimum useful structure is a CSV with one label column (country, player, coin) and one numeric column per time step (year, quarter, season). World Bank, Wikipedia, Statista and FBref all publish data that drops straight into this shape." },
      { type: "embed", kind: "dataset", slug: "gdp-countries", label: "Use our pre-cleaned GDP by Country dataset" },
      { type: "h2", text: "Step 3: Render in Data to Video" },
      { type: "p", text: "Open the bar chart race template, paste your CSV, pick a dark or neon theme, and add a hook title. A great hook is short and confrontational — 'The country that quietly overtook the US' beats 'GDP growth 1960–2025' every time." },
      { type: "embed", kind: "template", slug: "bar-chart-race" },
      { type: "h2", text: "Step 4: Export vertical" },
      { type: "p", text: "Export at 1080×1920. Horizontal exports get half the reach on TikTok and Reels. Add captions in your editor of choice, or use the built-in viral hook overlay." },
      { type: "h2", text: "Step 5: Post a series, not a one-off" },
      { type: "p", text: "The accounts that grow fastest with bar chart races post daily. Each video uses the same template, same theme, same hook structure — different data. That's how you get the algorithm to learn your channel." },
      { type: "h3", text: "A weekly publishing cadence that works" },
      { type: "list", ordered: true, items: [
        "Monday: Top 10 countdown (richest, biggest, fastest)",
        "Wednesday: Bar chart race over time (decades, seasons)",
        "Friday: Head-to-head comparison (rivalry of the week)",
        "Sunday: Recap reel collaging the week's best stat",
      ] },
    ],
    faqs: [
      { q: "How long should a bar chart race be?", a: "Between 20 and 45 seconds for TikTok and Reels. Anything longer loses retention; anything shorter doesn't give the reorder time to register." },
      { q: "Do I need a paid subscription to remove the watermark?", a: "Free exports include a small Data to Video tag. Premium exports are watermark-free." },
      { q: "What CSV format works?", a: "Wide format: one label column, then one numeric column per time step. Strip currency symbols and commas first." },
    ],
    related: ["why-bar-chart-races-go-viral", "best-tiktok-data-visualization-ideas"],
    relatedTemplates: ["bar-chart-race", "gdp-race", "top-10"],
    relatedDatasets: ["gdp-countries", "fifa-goals"],
    relatedTools: ["chart-race-generator", "csv-to-video"],
    relatedWatch: ["gdp-race-usa-vs-china"],
    ogImage: "/og/blog-bar-chart-race.jpg",
  },
  {
    slug: "best-tiktok-data-visualization-ideas",
    title: "20 Best TikTok Data Visualization Ideas for Creators",
    seoTitle: "Best TikTok Data Visualization Ideas — 20 Viral Formats",
    excerpt: "Twenty proven data video concepts that get millions of views on TikTok, with the exact template to use for each.",
    date: "2026-04-22",
    readMinutes: 7,
    category: "TikTok Growth",
    tags: ["tiktok", "ideas", "data visualization"],
    authorKey: "ana",
    body: [
      { type: "p", text: "If you make data content on TikTok and your views have plateaued, the issue is almost always the format — not the data. Below are twenty concepts that consistently outperform, grouped by the Data to Video template that fits each." },
      { type: "h2", text: "Bar chart race ideas" },
      { type: "list", ordered: true, items: [
        "Top economies by GDP from 1980",
        "All-time men's football goal scorers",
        "Biggest YouTubers by subscriber count",
        "Crypto market caps month by month",
        "Most-downloaded apps of the decade",
        "Most-streamed songs since Spotify launched",
        "F1 driver championship points by season",
        "Summer Olympic medal counts by country",
      ] },
      { type: "embed", kind: "template", slug: "bar-chart-race" },
      { type: "h2", text: "Top 10 countdown ideas" },
      { type: "list", ordered: true, items: [
        "Richest people in the world right now",
        "Best-selling video games of all time",
        "Most-followed celebrities on Instagram",
        "Most expensive football transfers ever",
        "Largest cities by population in 2025",
      ] },
      { type: "embed", kind: "template", slug: "top-10" },
      { type: "h2", text: "Timeline ideas" },
      { type: "list", ordered: true, items: [
        "World population from year 1 to 2025",
        "Major wars by death toll over centuries",
        "Big-tech company founding years",
        "Average global temperature 1880 → today",
      ] },
      { type: "embed", kind: "template", slug: "population-growth" },
      { type: "h2", text: "Head-to-head comparison ideas" },
      { type: "list", ordered: true, items: [
        "Ronaldo vs Messi — career goals",
        "iPhone vs Android market share over time",
        "PlayStation vs Xbox lifetime sales",
      ] },
      { type: "embed", kind: "template", slug: "football-stats" },
      { type: "p", text: "Pick one, open the matching template, and publish today. The accounts that win in this niche publish daily — the data is everywhere." },
    ],
    faqs: [
      { q: "Which idea should I start with?", a: "Pick the one closest to your existing audience. Football accounts should start with scorer leaderboards; finance accounts with GDP or market cap races." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos", "how-football-channels-use-statistics-videos"],
    relatedTemplates: ["bar-chart-race", "top-10", "population-growth", "football-stats"],
    relatedDatasets: ["gdp-countries", "fifa-goals", "nba-points"],
    ogImage: "/og/blog-tiktok-ideas.jpg",
  },
  {
    slug: "how-football-channels-use-statistics-videos",
    title: "How Football Channels Use Statistics Videos to Hit Millions of Views",
    seoTitle: "How Football Channels Use Stats Videos — Viral Format Breakdown",
    excerpt: "A breakdown of the stats video formats top football creators use — and how to replicate them with free tools.",
    date: "2026-04-01",
    readMinutes: 5,
    category: "Football Statistics",
    tags: ["football", "case study", "stats"],
    authorKey: "marco",
    body: [
      { type: "p", text: "Open TikTok and search 'football stats'. The top results aren't from clubs or broadcasters — they're from one-person channels publishing simple animated charts every single day. The format is so reliable that several accounts have crossed a million followers in under a year doing nothing else." },
      { type: "h2", text: "The three core formats" },
      { type: "p", text: "Football stats channels rotate between three formats: head-to-head comparisons, all-time leaderboards and season-by-season races. Each takes under five minutes to make once you have a template." },
      { type: "embed", kind: "watch", slug: "ronaldo-vs-messi-goals" },
      { type: "h2", text: "Where to get the data" },
      { type: "p", text: "FBref, Transfermarkt and Wikipedia cover almost every stat worth animating. Copy a table, paste into Google Sheets, export as CSV, drop into Data to Video." },
      { type: "embed", kind: "dataset", slug: "fifa-goals" },
      { type: "h2", text: "What makes them work" },
      { type: "list", items: [
        "Confrontational title — 'Who's actually the GOAT?' beats 'Comparison'",
        "Fast pacing — under 25 seconds end-to-end",
        "Clear winner reveal in the final 3 seconds",
        "Familiar player faces as avatars",
      ] },
      { type: "quote", text: "Posting daily is the cheat code. The algorithm rewards consistency in this niche more than any other I've worked in.", cite: "Marco" },
    ],
    faqs: [
      { q: "How often should I post?", a: "Daily. The football stats niche moves fast and rewards consistency more than production value." },
      { q: "Do I need official data?", a: "No — FBref, Transfermarkt and Wikipedia are accurate enough for short-form content as long as you credit them." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos", "best-tiktok-data-visualization-ideas"],
    relatedTemplates: ["football-stats", "bar-chart-race", "nba-ranking-animation"],
    relatedDatasets: ["fifa-goals", "nba-points"],
    relatedWatch: ["ronaldo-vs-messi-goals"],
    ogImage: "/og/blog-football-stats.jpg",
  },
  {
    slug: "why-bar-chart-races-go-viral",
    title: "Why Bar Chart Races Go Viral (and How to Engineer the Effect)",
    seoTitle: "Why Bar Chart Races Go Viral — The Psychology Behind the Format",
    excerpt: "The cognitive reasons behind the bar chart race's enduring viral pull — and how to design your videos around them.",
    date: "2026-03-15",
    readMinutes: 5,
    category: "Viral Video Psychology",
    tags: ["psychology", "viral", "bar chart race"],
    authorKey: "ana",
    body: [
      { type: "p", text: "Bar chart races have been viral for almost a decade. That kind of longevity is rare in short-form video, and it's not an accident — the format taps directly into how human attention works." },
      { type: "h2", text: "Open loops" },
      { type: "p", text: "Every reorder of the bars creates a tiny open loop in the viewer's mind: who's going to be on top next? The brain refuses to close that loop until the animation ends, which is why people watch all the way through." },
      { type: "h2", text: "Recognizable categories" },
      { type: "p", text: "Countries, players and brands are pre-cached in everyone's head. Viewers don't need to read labels — they recognize the bars instantly, which removes friction in the first three seconds." },
      { type: "h2", text: "Compressed time" },
      { type: "p", text: "Sixty years of GDP in thirty seconds feels like watching history on fast-forward. That compression is intrinsically pleasurable." },
      { type: "h2", text: "Designing for the effect" },
      { type: "list", items: [
        "Keep the bar count between 5 and 10",
        "Use bold colors that contrast against a dark background",
        "Add a hook title in the first frame",
        "Don't slow the animation down — fast pacing is part of the appeal",
      ] },
      { type: "embed", kind: "tool", slug: "chart-race-generator" },
    ],
    faqs: [
      { q: "Does the same psychology apply to Top 10 countdowns?", a: "Yes — the open-loop effect is even stronger because the brain explicitly waits for #1." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos", "best-data-formats-for-animated-videos"],
    relatedTemplates: ["bar-chart-race", "top-10"],
    relatedTools: ["chart-race-generator"],
    ogImage: "/og/blog-why-viral.jpg",
  },
  {
    slug: "best-data-formats-for-animated-videos",
    title: "Best Data Formats for Animated Videos",
    seoTitle: "Best Data Formats for Animated Videos — CSV, JSON and Beyond",
    excerpt: "Which data structures work best for animated charts, and how to clean your data before importing it.",
    date: "2026-02-28",
    readMinutes: 4,
    category: "Data Visualization",
    tags: ["csv", "data", "tutorial"],
    authorKey: "editorial",
    body: [
      { type: "p", text: "The single biggest reason animated chart videos fail is bad data. Not wrong data — badly shaped data. Here's how to prep yours so it drops cleanly into any animated chart tool." },
      { type: "h2", text: "CSV is king" },
      { type: "p", text: "Use a flat CSV with one label column and one numeric column per time step. Avoid merged cells, footnotes inside numeric cells, and currency symbols mixed with numbers." },
      { type: "h2", text: "Time as columns, not rows" },
      { type: "p", text: "For bar chart races, each time step (year, month, season) should be its own column. Each row is one category. This 'wide' format is what every animation engine expects." },
      { type: "h2", text: "Five to ten rows" },
      { type: "p", text: "Bar chart races with more than ten bars are unreadable on a phone. Pre-filter to the top 5–10 entries before importing." },
      { type: "h2", text: "Clean numbers" },
      { type: "p", text: "Strip commas, currency symbols and percent signs. Numbers should be raw — 12500000, not '$12.5M'." },
      { type: "embed", kind: "tool", slug: "csv-to-video" },
    ],
    faqs: [
      { q: "Does the tool accept Excel files?", a: "Save as CSV first — UTF-8 with comma separators. The parser handles quoted strings and escaped commas." },
    ],
    related: ["how-to-make-viral-bar-chart-race-videos"],
    relatedTools: ["csv-to-video", "chart-race-generator"],
    ogImage: "/og/blog-data-formats.jpg",
  },
  {
    slug: "youtube-shorts-vs-tiktok-for-data-creators",
    title: "YouTube Shorts vs TikTok for Data Creators in 2026",
    seoTitle: "YouTube Shorts vs TikTok for Data Creators — Which Wins in 2026",
    excerpt: "Where data and stats videos actually grow faster in 2026, broken down by retention, monetization and audience intent.",
    date: "2026-05-22",
    readMinutes: 6,
    category: "YouTube Shorts",
    tags: ["youtube shorts", "tiktok", "platform comparison"],
    authorKey: "ana",
    body: [
      { type: "p", text: "We tracked 40 data-video accounts that publish identical content to both TikTok and YouTube Shorts for six months. The results pushed back on a lot of the conventional wisdom in the creator economy." },
      { type: "h2", text: "Where reach is bigger" },
      { type: "p", text: "TikTok still delivers a higher ceiling per video. The top 10% of bar chart race uploads averaged 1.8x more views on TikTok than on Shorts. But the gap closes fast for accounts under 50k followers — Shorts pushes new channels harder than TikTok does in 2026." },
      { type: "h2", text: "Where retention is higher" },
      { type: "p", text: "Shorts wins on average view duration for data content by roughly 15%. Viewers arrive from longer-form YouTube and bring more patience for a 30-second chart reveal. TikTok rewards faster pacing — your first three seconds need to do more work." },
      { type: "h2", text: "Where money is made" },
      { type: "p", text: "Shorts revenue per 1,000 views consistently outpaces the TikTok Creator Rewards Program for data and finance content in the US, UK and Germany. If your goal is sustainable income from the format itself, Shorts is the better long-term bet." },
      { type: "callout", tone: "tip", text: "Post the same MP4 to both. The 9:16 export is identical; you only need to rewrite the caption and the first-frame hook." },
      { type: "h2", text: "What this means for your workflow" },
      { type: "list", ordered: true, items: [
        "Build once in Data to Video, export a single vertical MP4",
        "Post TikTok-first with a confrontational hook",
        "Re-upload to Shorts with a longer descriptive title and richer description",
        "Track retention separately — the platforms reward different things",
      ] },
      { type: "embed", kind: "tool", slug: "tiktok-data-video-maker" },
    ],
    faqs: [
      { q: "Can I use the same hook on both platforms?", a: "You can, but rewriting the title for Shorts to be more descriptive (and keyword-rich) materially improves search reach." },
      { q: "Does cross-posting hurt either platform?", a: "Not in our data. Both algorithms care about retention and completion, not exclusivity." },
    ],
    related: ["best-tiktok-data-visualization-ideas", "how-to-make-viral-bar-chart-race-videos"],
    relatedTools: ["tiktok-data-video-maker"],
    relatedTemplates: ["bar-chart-race", "top-10"],
  },
  {
    slug: "case-study-100k-followers-football-stats",
    title: "Case Study: 0 → 100k Followers in 90 Days with Football Stats",
    seoTitle: "Case Study — 0 to 100k TikTok Followers with Football Stats Videos",
    excerpt: "Exact posting cadence, formats and data sources used to grow a football stats TikTok from zero to 100k in three months.",
    date: "2026-05-05",
    readMinutes: 8,
    category: "Case Studies",
    tags: ["case study", "football", "tiktok", "growth"],
    authorKey: "marco",
    body: [
      { type: "p", text: "Last summer I launched a football stats TikTok with no audience, no existing brand and no paid promotion. Ninety days later it crossed 100,000 followers. Here is exactly what I did — and what I'd change if I started over." },
      { type: "h2", text: "The setup" },
      { type: "p", text: "One person, one phone, Data to Video for animation, a Notion board for ideas. No editor. No designer. No motion graphics work outside the template." },
      { type: "h2", text: "Posting cadence" },
      { type: "list", ordered: true, items: [
        "Days 1–14: one video per day, all head-to-head comparisons",
        "Days 15–30: two per day — added all-time leaderboards",
        "Days 31–60: two per day — introduced season-by-season races",
        "Days 61–90: three per day across the three formats",
      ] },
      { type: "embed", kind: "watch", slug: "ronaldo-vs-messi-goals" },
      { type: "h2", text: "What broke through" },
      { type: "p", text: "The first video to cross 1M views was Ronaldo vs Messi by club. The second was Champions League top scorers since 2000. Both used the Comparison and Bar Chart Race templates respectively with player photos as avatars." },
      { type: "h2", text: "What flopped" },
      { type: "p", text: "Anything without recognizable names. A bar chart race of obscure Serie A defenders' tackles per match got 1,200 views after a string of 200k+ uploads. Lesson: viewers need to know the bars without reading labels." },
      { type: "h2", text: "What I'd do differently" },
      { type: "list", items: [
        "Pick narrower hooks earlier — 'Goals after 30' beats 'Most goals ever'",
        "Pin a follow-up question in comments to push completion → comment ratio",
        "Cross-post to Shorts from day one, not day forty",
      ] },
      { type: "embed", kind: "template", slug: "football-stats" },
    ],
    faqs: [
      { q: "Did you run ads?", a: "Zero. All organic. Total spend over 90 days was the cost of the Data to Video premium subscription." },
      { q: "How long did each video take?", a: "Six to eight minutes once the template was set up — the data fetch was usually slower than the render." },
    ],
    related: ["how-football-channels-use-statistics-videos", "how-to-make-viral-bar-chart-race-videos"],
    relatedTemplates: ["football-stats", "bar-chart-race"],
    relatedDatasets: ["fifa-goals"],
    relatedWatch: ["ronaldo-vs-messi-goals"],
  },
  {
    slug: "creator-economy-data-niche",
    title: "The Data Video Niche Is the Best Bet in the 2026 Creator Economy",
    seoTitle: "Data Videos & The Creator Economy — Why The Niche Wins in 2026",
    excerpt: "Why animated stats videos are the highest-leverage niche to start a channel in this year — and how to position yours.",
    date: "2026-04-12",
    readMinutes: 6,
    category: "Creator Economy",
    tags: ["creator economy", "strategy", "niche"],
    authorKey: "ana",
    body: [
      { type: "p", text: "The creator economy in 2026 looks crowded from the outside. Inside the data video niche it's not. Production costs are near zero, formats are reproducible, and the demand for digestible statistics keeps growing across finance, sports, geopolitics and pop culture." },
      { type: "h2", text: "Low production cost, high perceived production value" },
      { type: "p", text: "A vertical bar chart race looks like motion-graphics work. It isn't — it's a template plus a CSV. That gap between perceived and actual effort is where outsized growth lives." },
      { type: "h2", text: "Evergreen + topical" },
      { type: "p", text: "Stats videos work both ways: 'Top 10 economies in 2025' is evergreen-ish; 'GDP impact of the latest tariff' is topical. Successful channels rotate between the two." },
      { type: "h2", text: "Monetization paths" },
      { type: "list", items: [
        "TikTok Creator Rewards and YouTube Shorts Fund",
        "Brand deals with finance, betting and education sponsors",
        "Newsletter or paid Substack covering the same niche",
        "Selling the underlying datasets or chart templates",
      ] },
      { type: "embed", kind: "template", slug: "gdp-race" },
      { type: "h2", text: "Where to position your channel" },
      { type: "p", text: "Pick a vertical and own it. 'Football stats', 'crypto market cap weekly', 'NBA all-time scoring' — narrow enough that viewers know exactly what they'll get from each post." },
    ],
    faqs: [
      { q: "Is the niche saturated?", a: "Specific verticals like Premier League stats are competitive. New angles — niche sports, regional finance, emerging tech — are wide open." },
    ],
    related: ["best-tiktok-data-visualization-ideas", "case-study-100k-followers-football-stats"],
    relatedTemplates: ["gdp-race", "top-10", "football-stats"],
    relatedDatasets: ["gdp-countries", "crypto-marketcap"],
  },
];

export const getPost = (slug?: string) => BLOG_POSTS.find((p) => p.slug === slug);

/** Extract H2 anchors for table of contents. */
export const tocItems = (post: BlogPost) =>
  post.body
    .filter((b): b is Extract<BodyBlock, { type: "h2" }> => b.type === "h2")
    .map((b) => ({ id: b.id ?? slugify(b.text), text: b.text }));

/** Inject stable anchor ids onto each h2 so prerender and React render the same. */
export const withAnchors = (post: BlogPost): BlogPost => ({
  ...post,
  body: post.body.map((b) =>
    b.type === "h2" ? { ...b, id: b.id ?? slugify(b.text) } : b
  ),
});