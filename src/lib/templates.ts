import { Template } from "./types";
import { GDP_SAMPLE, FOOTBALL_SAMPLE, POPULATION_SAMPLE } from "./sampleData";

export const TEMPLATES: Template[] = [
  {
    id: "viral-bar-race",
    name: "Viral Bar Race",
    description: "GDP race between world economies — perfect for viral content",
    icon: "🏆",
    type: "bar_race",
    data: GDP_SAMPLE,
    settings: {
      title: "Top Economies by GDP",
      theme: "dark",
      speed: "medium",
      showLabels: true,
      showValues: true,
      smoothAnimation: true,
    },
  },
  {
    id: "educational-timeline",
    name: "Educational Timeline",
    description: "Population growth data — great for educational content",
    icon: "📚",
    type: "bar_race",
    data: POPULATION_SAMPLE,
    settings: {
      title: "World Population Growth",
      theme: "light",
      speed: "slow",
      showLabels: true,
      showValues: true,
      smoothAnimation: true,
    },
  },
  {
    id: "sports-battle",
    name: "Sports Battle",
    description: "All-time football goal scorers racing for the top",
    icon: "⚽",
    type: "bar_race",
    data: FOOTBALL_SAMPLE,
    settings: {
      title: "All-Time Goal Scorers",
      theme: "neon",
      speed: "fast",
      showLabels: true,
      showValues: true,
      smoothAnimation: true,
    },
  },
  {
    id: "economic-growth",
    name: "Economic Growth",
    description: "Compare economic powerhouses over the decades",
    icon: "📈",
    type: "bar_race",
    data: GDP_SAMPLE,
    settings: {
      title: "Economic Powerhouses",
      theme: "dark",
      speed: "slow",
      showLabels: true,
      showValues: true,
      smoothAnimation: true,
    },
  },
];
