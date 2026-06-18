import type { DataRow } from "./types";

export type CsvIssueLevel = "error" | "warning";

export interface CsvIssue {
  level: CsvIssueLevel;
  line?: number;
  message: string;
}

export interface CsvValidationResult {
  headers: string[];
  labels: string[];
  rows: DataRow[];
  /** One object per data line, useful for preview tables. */
  preview: Array<{ line: number; year: number | null; values: Array<number | null>; raw: string[] }>;
  years: number[];
  issues: CsvIssue[];
  hasErrors: boolean;
}

/**
 * Strict CSV validator with row-by-row mapping.
 * - Reports header problems, malformed years, non-numeric values, duplicate (year,label) entries, and column-count mismatches.
 * - Always returns whatever rows could be salvaged so the editor can preview partial uploads.
 */
export function validateCSV(text: string): CsvValidationResult {
  const issues: CsvIssue[] = [];
  const preview: CsvValidationResult["preview"] = [];
  const rows: DataRow[] = [];

  const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
  // Track real line numbers (1-indexed) even after filtering blanks.
  const lines = rawLines
    .map((l, i) => ({ text: l.trim(), line: i + 1 }))
    .filter((l) => l.text.length > 0);

  if (lines.length === 0) {
    issues.push({ level: "error", message: "CSV is empty." });
    return { headers: [], labels: [], rows, preview, years: [], issues, hasErrors: true };
  }
  if (lines.length < 2) {
    issues.push({ level: "error", message: "Need a header row plus at least one data row." });
    return { headers: [], labels: [], rows, preview, years: [], issues, hasErrors: true };
  }

  const headers = lines[0].text.split(",").map((h) => h.trim());
  if (headers.length < 2) {
    issues.push({ level: "error", line: lines[0].line, message: "Header must be: Year,Label A,Label B,…" });
  }
  if (headers[0] && headers[0].toLowerCase() !== "year") {
    issues.push({ level: "warning", line: lines[0].line, message: `First column should be "Year" (got "${headers[0]}").` });
  }
  const labels = headers.slice(1).map((l) => l.trim());
  labels.forEach((l, i) => {
    if (!l) issues.push({ level: "error", line: lines[0].line, message: `Label column ${i + 2} is empty.` });
  });
  const dupLabels = labels.filter((l, i) => l && labels.indexOf(l) !== i);
  if (dupLabels.length) {
    issues.push({ level: "error", line: lines[0].line, message: `Duplicate label columns: ${Array.from(new Set(dupLabels)).join(", ")}.` });
  }

  const seen = new Set<string>();
  const years = new Set<number>();

  for (let i = 1; i < lines.length; i++) {
    const { text: raw, line } = lines[i];
    const cols = raw.split(",").map((c) => c.trim());
    const yearStr = cols[0] ?? "";
    const yearNum = /^-?\d+$/.test(yearStr) ? parseInt(yearStr, 10) : NaN;
    const yearValid = !isNaN(yearNum);
    if (!yearValid) {
      issues.push({ level: "error", line, message: `Year "${yearStr}" is not a whole number.` });
    }
    if (cols.length !== headers.length) {
      issues.push({
        level: "warning",
        line,
        message: `Row has ${cols.length} columns, expected ${headers.length}. Missing cells will be skipped.`,
      });
    }

    const values: Array<number | null> = [];
    labels.forEach((label, idx) => {
      const cell = cols[idx + 1];
      if (cell === undefined || cell === "") {
        values.push(null);
        return;
      }
      const num = Number(cell);
      if (!isFinite(num)) {
        issues.push({ level: "error", line, message: `Column "${label}" value "${cell}" is not a number.` });
        values.push(null);
        return;
      }
      values.push(num);
      if (!yearValid || !label) return;
      const key = `${label}|${yearNum}`;
      if (seen.has(key)) {
        issues.push({ level: "warning", line, message: `Duplicate entry for ${label} in ${yearNum}; later value kept.` });
        // Replace previous occurrence.
        const idxExisting = rows.findIndex((r) => r.label === label && r.year === yearNum);
        if (idxExisting >= 0) rows[idxExisting] = { label, value: num, year: yearNum };
      } else {
        seen.add(key);
        rows.push({ label, value: num, year: yearNum });
      }
    });

    if (yearValid) years.add(yearNum);
    preview.push({ line, year: yearValid ? yearNum : null, values, raw: cols });
  }

  if (rows.length === 0) {
    issues.push({ level: "error", message: "No usable data rows found." });
  }

  const hasErrors = issues.some((i) => i.level === "error");
  return {
    headers,
    labels,
    rows,
    preview,
    years: Array.from(years).sort((a, b) => a - b),
    issues,
    hasErrors,
  };
}