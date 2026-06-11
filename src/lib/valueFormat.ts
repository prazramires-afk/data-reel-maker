export type UnitType =
  | "none"
  | "currency"
  | "percentage"
  | "population"
  | "distance"
  | "weight"
  | "energy"
  | "time"
  | "custom";

export type CurrencyPosition = "before" | "after";
export type PopulationScale = "people" | "million" | "billion";

export interface ValueFormat {
  unitType: UnitType;
  /** Currency symbol or code, e.g. "$", "€", "USD". */
  currencySymbol?: string;
  currencyPosition?: CurrencyPosition;
  populationScale?: PopulationScale;
  /** Auto-abbreviate large numbers (1.2K, 3.4M, 1.1B, 2T). */
  abbreviate?: boolean;
  /** Decimal places (0-3). */
  decimals?: number;
  /** Custom prefix (when unitType = custom). */
  prefix?: string;
  /** Custom suffix (when unitType = custom). */
  suffix?: string;
}

export const DEFAULT_VALUE_FORMAT: ValueFormat = {
  unitType: "none",
  currencySymbol: "$",
  currencyPosition: "before",
  populationScale: "people",
  abbreviate: false,
  decimals: 0,
  prefix: "",
  suffix: "",
};

const ABBREV_UNITS = [
  { v: 1e12, s: "T" },
  { v: 1e9, s: "B" },
  { v: 1e6, s: "M" },
  { v: 1e3, s: "K" },
];

function trimZeros(n: string): string {
  return n.includes(".") ? n.replace(/\.?0+$/, "") : n;
}

function formatNumberCore(value: number, abbreviate: boolean, decimals: number): string {
  const safeDecimals = Math.max(0, Math.min(3, Math.floor(decimals)));
  if (abbreviate) {
    const abs = Math.abs(value);
    for (const u of ABBREV_UNITS) {
      if (abs >= u.v) {
        return trimZeros((value / u.v).toFixed(Math.max(safeDecimals, 1))) + u.s;
      }
    }
    return trimZeros(value.toFixed(safeDecimals));
  }
  const fixed = value.toFixed(safeDecimals);
  const [intPart, decPart] = fixed.split(".");
  const withSep = Number(intPart).toLocaleString("en-US");
  return decPart ? `${withSep}.${decPart}` : withSep;
}

/**
 * Formats a raw numeric value for display. Never mutates the underlying
 * value — sorting and animation should always use the raw number.
 */
export function formatValue(rawValue: number, fmt?: ValueFormat): string {
  const value = Number.isFinite(rawValue) ? rawValue : 0;
  if (!fmt || fmt.unitType === "none") {
    return formatNumberCore(value, !!fmt?.abbreviate, fmt?.decimals ?? 0);
  }
  const decimals = fmt.decimals ?? 0;
  const abbreviate = !!fmt.abbreviate;

  switch (fmt.unitType) {
    case "currency": {
      const sym = (fmt.currencySymbol ?? "$").trim() || "$";
      const core = formatNumberCore(value, abbreviate, decimals);
      if (fmt.currencyPosition === "after") return `${core} ${sym}`;
      const sep = sym.length > 1 ? " " : "";
      return `${sym}${sep}${core}`;
    }
    case "percentage":
      return `${formatNumberCore(value, false, decimals)}%`;
    case "population": {
      const scale = fmt.populationScale ?? "people";
      if (scale === "million") return `${formatNumberCore(value / 1e6, false, decimals || 1)}M People`;
      if (scale === "billion") return `${formatNumberCore(value / 1e9, false, decimals || 2)}B People`;
      return `${formatNumberCore(value, abbreviate, decimals)} People`;
    }
    case "distance":
      return `${formatNumberCore(value, abbreviate, decimals)} km`;
    case "weight":
      return `${formatNumberCore(value, abbreviate, decimals)} kg`;
    case "energy":
      return `${formatNumberCore(value, abbreviate, decimals)} kWh`;
    case "time":
      return `${formatNumberCore(value, abbreviate, decimals)} h`;
    case "custom": {
      const core = formatNumberCore(value, abbreviate, decimals);
      const prefix = fmt.prefix ?? "";
      const suffix = fmt.suffix ?? "";
      const prefixPart = prefix ? (prefix.endsWith(" ") ? prefix : `${prefix}${prefix.length > 1 ? " " : ""}`) : "";
      const suffixPart = suffix ? (suffix.startsWith(" ") ? suffix : ` ${suffix}`) : "";
      return `${prefixPart}${core}${suffixPart}`;
    }
    default:
      return formatNumberCore(value, abbreviate, decimals);
  }
}

export const UNIT_TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "currency", label: "Currency" },
  { value: "percentage", label: "Percentage" },
  { value: "population", label: "Population" },
  { value: "distance", label: "Distance (km)" },
  { value: "weight", label: "Weight (kg)" },
  { value: "energy", label: "Energy (kWh)" },
  { value: "time", label: "Time (h)" },
  { value: "custom", label: "Custom" },
];

export const CURRENCY_PRESETS = ["$", "€", "£", "¥", "Rp", "₹", "₩"];
