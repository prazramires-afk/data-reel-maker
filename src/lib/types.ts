export type VideoType = "bar_race" | "timeline" | "top10" | "comparison";

export type ThemeType = "dark" | "light" | "neon";

export type SpeedType = "slow" | "medium" | "fast";

export interface DataRow {
  label: string;
  value: number;
  year: number;
}

export interface MultiYearData {
  years: number[];
  labels: string[];
  values: Record<string, Record<number, number>>; // label -> year -> value
}

export interface ProjectSettings {
  title: string;
  theme: ThemeType;
  speed: SpeedType;
  showLabels: boolean;
  showValues: boolean;
  smoothAnimation: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: VideoType;
  data: DataRow[];
  settings: ProjectSettings;
  labelImages: Record<string, string>; // label -> base64 data URL
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: VideoType;
  data: DataRow[];
  settings: ProjectSettings;
}

export const DEFAULT_SETTINGS: ProjectSettings = {
  title: "",
  theme: "dark",
  speed: "medium",
  showLabels: true,
  showValues: true,
  smoothAnimation: true,
};

export const VIDEO_TYPES: { type: VideoType; label: string; description: string; available: boolean }[] = [
  { type: "bar_race", label: "Bar Chart Race", description: "Animated bars racing over time", available: true },
  { type: "timeline", label: "Timeline Story", description: "Events unfolding through time", available: false },
  { type: "top10", label: "Top 10 Countdown", description: "Countdown revealing the best", available: false },
  { type: "comparison", label: "Comparison Battle", description: "Head-to-head face-offs", available: false },
];

export const BAR_COLORS = [
  "#7c5cfc", "#3b9dff", "#f97316", "#22c55e", "#ef4444",
  "#eab308", "#ec4899", "#06b6d4", "#8b5cf6", "#14b8a6",
  "#f43f5e", "#a855f7", "#6366f1", "#84cc16", "#f59e0b",
];
