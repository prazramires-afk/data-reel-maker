export type VideoType = "bar_race" | "timeline" | "top10" | "comparison";

export type ThemeType = "dark" | "light" | "neon" | "greenscreen";

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
  showIntro: boolean;
  smoothAnimation: boolean;
  /** Normalized 0-1 anchor for the big year display (centered). */
  yearPos?: { x: number; y: number };
  /** Normalized 0-1 anchor for the watermark (centered). */
  watermarkPos?: { x: number; y: number };
  /** Custom export width in pixels (overrides preset). */
  exportWidth?: number;
  /** Custom export height in pixels (overrides preset). */
  exportHeight?: number;
  /** Premium-only: when true, watermark is not drawn on the canvas. */
  hideWatermark?: boolean;
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
  showIntro: true,
  smoothAnimation: true,
  yearPos: { x: 0.85, y: 0.92 },
  watermarkPos: { x: 0.5, y: 0.97 },
  hideWatermark: false,
};

export const VIDEO_TYPES: { type: VideoType; label: string; description: string; available: boolean }[] = [
  { type: "bar_race", label: "Bar Chart Race", description: "Animated bars racing over time", available: true },
  { type: "timeline", label: "Timeline Story", description: "Events unfolding through time", available: true },
  { type: "top10", label: "Top 10 Countdown", description: "Countdown revealing the best", available: true },
  { type: "comparison", label: "Comparison Battle", description: "Head-to-head face-offs", available: true },
];

export const BAR_COLORS = [
  "#7c5cfc", "#3b9dff", "#f97316", "#22c55e", "#ef4444",
  "#eab308", "#ec4899", "#06b6d4", "#8b5cf6", "#14b8a6",
  "#f43f5e", "#a855f7", "#6366f1", "#84cc16", "#f59e0b",
];
