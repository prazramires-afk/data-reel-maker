import type { EventRow } from "./types";

export type EventCsvIssueLevel = "error" | "warning";
export interface EventCsvIssue {
  level: EventCsvIssueLevel;
  line?: number;
  message: string;
}

export interface EventCsvValidationResult {
  rows: EventRow[];
  issues: EventCsvIssue[];
  hasErrors: boolean;
}

/**
 * Parse a year cell like "753 BC", "-753", "509 BC", "2024", "2024 AD".
 * BC years are stored as negative integers. Returns null when unparseable.
 */
export function parseYearCell(raw: string): number | null {
  const s = raw.trim().toUpperCase().replace(/\./g, "");
  if (!s) return null;
  // "753 BC" / "753BC" / "BC 753"
  const bcMatch = s.match(/^BC\s*(\d+)$/) || s.match(/^(\d+)\s*BC$/) || s.match(/^(\d+)\s*BCE$/);
  if (bcMatch) {
    const n = parseInt(bcMatch[1], 10);
    return isNaN(n) ? null : -n;
  }
  const adMatch = s.match(/^AD\s*(\d+)$/) || s.match(/^(\d+)\s*AD$/) || s.match(/^(\d+)\s*CE$/);
  if (adMatch) {
    const n = parseInt(adMatch[1], 10);
    return isNaN(n) ? null : n;
  }
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  return null;
}

export function formatYear(y: number): string {
  return y < 0 ? `${Math.abs(y)} BC` : `${y}`;
}

/**
 * Split a CSV line supporting quoted values (so descriptions may contain commas).
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === ',') { out.push(cur); cur = ""; }
      else if (ch === '"' && cur.length === 0) inQuotes = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/**
 * Parse event CSV. Expected header: Year,Event,Description
 * Extra trailing cells are joined back into Description so unquoted commas still work.
 */
export function parseEventCSV(text: string): EventCsvValidationResult {
  const issues: EventCsvIssue[] = [];
  const rows: EventRow[] = [];
  const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
  const lines = rawLines
    .map((l, i) => ({ text: l.trim(), line: i + 1 }))
    .filter((l) => l.text.length > 0);

  if (lines.length === 0) {
    issues.push({ level: "error", message: "CSV is empty." });
    return { rows, issues, hasErrors: true };
  }
  if (lines.length < 2) {
    issues.push({ level: "error", message: "Need a header row plus at least one event." });
    return { rows, issues, hasErrors: true };
  }

  const header = splitCsvLine(lines[0].text).map((h) => h.toLowerCase());
  const hasHeader =
    header[0] === "year" &&
    (header[1] === "event" || header[1] === "title" || header[1] === "name");
  if (!hasHeader) {
    issues.push({
      level: "warning",
      line: lines[0].line,
      message: `Expected header "Year,Event,Description" (got "${lines[0].text}"). Treating first row as data.`,
    });
  }

  const startIdx = hasHeader ? 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const { text: raw, line } = lines[i];
    const cols = splitCsvLine(raw);
    if (cols.length < 2) {
      issues.push({ level: "error", line, message: "Row needs at least Year and Event." });
      continue;
    }
    const yearNum = parseYearCell(cols[0]);
    if (yearNum === null) {
      issues.push({ level: "error", line, message: `Year "${cols[0]}" is not a valid year (try "753 BC" or "2024").` });
      continue;
    }
    const title = (cols[1] ?? "").trim();
    if (!title) {
      issues.push({ level: "error", line, message: "Event title is empty." });
      continue;
    }
    // Join any trailing columns back into description (in case commas were unquoted)
    const description = cols.slice(2).join(", ").trim();
    rows.push({ year: yearNum, title, description });
  }

  rows.sort((a, b) => a.year - b.year);

  if (rows.length === 0) {
    issues.push({ level: "error", message: "No usable event rows found." });
  } else if (rows.length < 2) {
    issues.push({ level: "warning", message: "Add at least 2 events for a meaningful timeline." });
  }

  return { rows, issues, hasErrors: issues.some((i) => i.level === "error") };
}