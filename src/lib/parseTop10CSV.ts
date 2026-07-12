import type { DataRow } from "./types";
import { splitCsvLine, detectSchema, type CsvParseIssue } from "./csvSplit";

export interface Top10ParsedRow {
  rank: number;
  name: string;
  value: number;
  image: string;
}

export interface Top10ParseResult {
  rows: Top10ParsedRow[];
  /** Adapted DataRow[] — single-year snapshot the countdown engine expects. */
  data: DataRow[];
  issues: CsvParseIssue[];
  hasErrors: boolean;
}

const SNAPSHOT_YEAR = new Date().getFullYear();

/**
 * Parses Top 10 Countdown CSV: `Rank,Name,Value` (+ optional Image column).
 * - Auto-sorts descending by value when ranks are missing or inconsistent.
 * - Caps to the top 10 (warning if trimmed).
 */
export function parseTop10CSV(text: string): Top10ParseResult {
  const issues: CsvParseIssue[] = [];
  const parsed: Top10ParsedRow[] = [];
  const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
  const lines = rawLines
    .map((l, i) => ({ text: l.trim(), line: i + 1 }))
    .filter((l) => l.text.length > 0);

  if (lines.length < 2) {
    issues.push({ level: "error", message: "Top 10 needs a header row plus at least 2 entries." });
    return { rows: [], data: [], issues, hasErrors: true };
  }

  const detected = detectSchema(lines[0].text);
  const header = splitCsvLine(lines[0].text).map((h) => h.toLowerCase());
  const hasHeader = header[0] === "rank" && (header[1] === "name" || header[1] === "label" || header[1] === "entity");
  if (!hasHeader) {
    if (detected !== "unknown" && detected !== "top10") {
      issues.push({
        level: "error",
        line: lines[0].line,
        message: `This CSV looks like a ${detected.replace("_", " ")} CSV. Top 10 Countdown expects: "Rank,Name,Value".`,
      });
      return { rows: [], data: [], issues, hasErrors: true };
    }
    issues.push({
      level: "warning",
      line: lines[0].line,
      message: `Expected header "Rank,Name,Value" (got "${lines[0].text}"). Treating first row as data.`,
    });
  }

  const startIdx = hasHeader ? 1 : 0;
  let ranksConsistent = true;
  for (let i = startIdx; i < lines.length; i++) {
    const { text: raw, line } = lines[i];
    const cols = splitCsvLine(raw);
    if (cols.length < 3) {
      issues.push({ level: "error", line, message: "Row needs Rank, Name, and Value." });
      continue;
    }
    const rank = parseInt(cols[0], 10);
    const name = (cols[1] ?? "").trim();
    const valNum = Number(cols[2]);
    const image = (cols[3] ?? "").trim();
    if (!name) {
      issues.push({ level: "error", line, message: "Name is empty." });
      continue;
    }
    if (!isFinite(valNum)) {
      issues.push({ level: "error", line, message: `Value "${cols[2]}" is not a number.` });
      continue;
    }
    if (isNaN(rank)) {
      ranksConsistent = false;
    }
    parsed.push({ rank: isNaN(rank) ? 0 : rank, name, value: valNum, image });
  }

  // Auto-sort by value desc when ranks are missing/inconsistent, else honor the given rank.
  if (!ranksConsistent) {
    issues.push({ level: "warning", message: "Some ranks were missing — auto-sorted by Value (highest first)." });
    parsed.sort((a, b) => b.value - a.value);
    parsed.forEach((r, i) => (r.rank = i + 1));
  } else {
    parsed.sort((a, b) => a.rank - b.rank);
  }

  let rows = parsed;
  if (rows.length > 10) {
    issues.push({ level: "warning", message: `${rows.length} rows given — trimmed to the top 10.` });
    rows = rows.slice(0, 10);
  }

  if (rows.length === 0) {
    issues.push({ level: "error", message: "No usable rows found." });
  }

  const data: DataRow[] = rows.map((r) => ({ label: r.name, value: r.value, year: SNAPSHOT_YEAR }));

  return { rows, data, issues, hasErrors: issues.some((i) => i.level === "error") };
}