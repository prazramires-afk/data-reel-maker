import type { Faq } from "@/components/FaqSection";

export const HOME_FAQS: Faq[] = [
  {
    q: "What is a bar chart race?",
    a: "A bar chart race is an animated bar chart where the bars reorder over time as values change. It's one of the most viral data visualization formats on TikTok, Reels and YouTube Shorts because viewers can't look away from the constantly shifting ranking.",
  },
  {
    q: "How do I create TikTok statistics videos?",
    a: "Open Data to Video, paste your numbers (or upload a CSV), pick a template like Bar Chart Race or Top 10, customize the title and theme, then export an MP4 sized for TikTok (1080×1920). The whole flow takes under two minutes.",
  },
  {
    q: "Is Data to Video free?",
    a: "Yes. The free plan lets you create and export videos every day. Premium unlocks longer exports, more daily tokens and priority rendering.",
  },
  {
    q: "Can I export MP4 videos?",
    a: "Yes. Every video is exported as an MP4 directly from your browser using the MediaRecorder API — no server upload, no watermark on premium.",
  },
  {
    q: "How do I make football stats animations?",
    a: "Use the Football Stats template, replace the sample players with your own scorers or teams, choose a theme, and export. Perfect for goal-scorer rankings, assist leaders or season comparisons.",
  },
  {
    q: "Can I use CSV data?",
    a: "Yes — upload any CSV with a label column and one or more numeric columns. Data to Video parses it automatically and turns it into a bar chart race, timeline or top 10 countdown.",
  },
];