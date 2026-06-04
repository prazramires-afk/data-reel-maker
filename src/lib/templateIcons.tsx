import {
  Trophy,
  BookOpen,
  CircleDot,
  TrendingUp,
  Clock,
  Medal,
  Swords,
  Activity,
  Bitcoin,
  Briefcase,
  Coins,
  Youtube,
  Flag,
  Film,
  Shield,
  Building2,
  LineChart,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "viral-bar-race": Trophy,
  "educational-timeline": BookOpen,
  "sports-battle": CircleDot,
  "economic-growth": TrendingUp,
  "timeline-population": Clock,
  "top10-gdp": Medal,
  "comparison-football": Swords,
  "nba-ranking": Activity,
  "crypto-race": Bitcoin,
  "companies-marketcap": Briefcase,
  "top10-crypto": Coins,
  "youtube-subscribers": Youtube,
  "olympics-medals": Medal,
  "f1-champions": Flag,
  "streaming-subs": Film,
  "military-spending": Shield,
  "top10-companies": Building2,
  "comparison-f1": Swords,
  "timeline-youtube": LineChart,
};

export function getTemplateIcon(id: string): LucideIcon {
  return TEMPLATE_ICONS[id] ?? LayoutTemplate;
}