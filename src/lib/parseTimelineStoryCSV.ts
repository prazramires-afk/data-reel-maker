import type { DataRow } from "./types";
import { splitCsvLine, detectSchema, type CsvParseIssue } from "./csvSplit";
import { parseYearCell } from "./parseEventCSV";

export interface TimelineStoryRow {
  year: number;
  title: string;
  description: string;
  image: string;
}

export interface TimelineStoryParseResult {
  rows: TimelineStoryRow[];
  /** Adapted DataRow[] for the current timelineAnimation engine. */
  data: DataRow[];
  /** Optional descriptions keyed by title (for future card rendering). */
  descriptions: Record<string, string>;
  issues: CsvParseIssue[];
  hasErrors: boolean;
}

/**
 * Parses Timeline Story CSV: `Year,Title,Description,Image`
 * - Year supports 4-digit years or "753 BC" style (via parseYearCell).
 * - Description & Image are optional.
 * - Adapts each row into a DataRow so the existing timeline renderer can
 *   display it without a new pipeline: value = event index + 1.
 */
export function parseTimelineStoryCSV(text: string): TimelineStoryParseResult {
  const issues: CsvParseIssue[] = [];
  const rows: TimelineStoryRow[] = [];
  const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
  const lines = rawLines
    .map((l, i) => ({ text: l.trim(), line: i + 1 }))
    .filter((l) => l.text.length > 0);

  if (lines.length === 0) {
    issues.push({ level: "error", message: "CSV is empty." });
    return { rows, data: [], descriptions: {}, issues, hasErrors: true };
  }
  if (lines.length < 2) {
    issues.push({ level: "error", message: "Timeline Story needs a header row plus at least one event." });
    return { rows, data: [], descriptions: {}, issues, hasErrors: true };
  }

  const detected = detectSchema(lines[0].text);
  const header = splitCsvLine(lines[0].text).map((h) => h.toLowerCase());
  const hasHeader = header[0] === "year" && (header[1] === "title" || header[1] === "event" || header[1] === "name");
  if (!hasHeader) {
    if (detected === "top10" || detected === "comparison" || detected === "bar_race") {
      issues.push({
        level: "error",
        line: lines[0].line,
        message: `This CSV looks like a ${detected.replace("_", " ")} CSV. Timeline Story expects: "Year,Title,Description,Image".`,
      });
      return { rows, data: [], descriptions: {}, issues, hasErrors: true };
    }
    issues.push({
      level: "warning",
      line: lines[0].line,
      message: `Expected header "Year,Title,Description,Image" (got "${lines[0].text}"). Treating first row as data.`,
    });
  }

  const startIdx = hasHeader ? 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const { text: raw, line } = lines[i];
    const cols = splitCsvLine(raw);
    if (cols.length < 2) {
      issues.push({ level: "error", line, message: "Row needs at least Year and Title." });
      continue;
    }
    const yearNum = parseYearCell(cols[0]);
    if (yearNum === null) {
      issues.push({ level: "error", line, message: `Year "${cols[0]}" is not valid (try 1969 or "753 BC").` });
      continue;
    }
    const title = (cols[1] ?? "").trim();
    if (!title) {
      issues.push({ level: "error", line, message: "Title is empty." });
      continue;
    }
    const description = (cols[2] ?? "").trim();
    const image = (cols[3] ?? "").trim();
    rows.push({ year: yearNum, title, description, image });
  }

  rows.sort((a, b) => a.year - b.year);

  if (rows.length === 0) {
    issues.push({ level: "error", message: "No usable event rows found." });
  } else if (rows.length < 2) {
    issues.push({ level: "warning", message: "Add at least 2 events for a meaningful timeline." });
  }

  const descriptions: Record<string, string> = {};
  const data: DataRow[] = rows.map((r, idx) => {
    if (r.description) descriptions[r.title] = r.description;
    return { label: r.title, value: idx + 1, year: r.year };
  });

  return { rows, data, descriptions, issues, hasErrors: issues.some((i) => i.level === "error") };
}