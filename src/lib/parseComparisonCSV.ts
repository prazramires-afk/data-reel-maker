import type { DataRow } from "./types";
import { splitCsvLine, detectSchema, type CsvParseIssue } from "./csvSplit";

export interface ComparisonMatrix {
  entities: string[];
  categories: string[];
  /** categories[i] → entity → numeric value (NaN if the source cell was non-numeric). */
  values: Record<string, Record<string, number>>;
}

export interface ComparisonParseResult extends ComparisonMatrix {
  /** Adapted DataRow[] — each category is used as a "year" (integer id) so the
   *  existing battle animation, which iterates by year, can play through them. */
  data: DataRow[];
  issues: CsvParseIssue[];
  hasErrors: boolean;
}

/**
 * Parses Comparison Battle CSV: `Category,<EntityA>,<EntityB>[,<EntityC>...]`
 * - Each row = one metric being compared.
 * - Cells may be numeric or free-text; non-numeric cells are treated as 0 for the
 *   animated bar length but preserved in the parsed matrix for future display.
 */
export function parseComparisonCSV(text: string): ComparisonParseResult {
  const issues: CsvParseIssue[] = [];
  const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
  const lines = rawLines
    .map((l, i) => ({ text: l.trim(), line: i + 1 }))
    .filter((l) => l.text.length > 0);

  const empty = (): ComparisonParseResult => ({
    entities: [], categories: [], values: {}, data: [], issues, hasErrors: true,
  });

  if (lines.length < 2) {
    issues.push({ level: "error", message: "Comparison Battle needs a header row plus at least one metric." });
    return empty();
  }

  const detected = detectSchema(lines[0].text);
  const headerCols = splitCsvLine(lines[0].text);
  const headerLower = headerCols.map((h) => h.toLowerCase());
  if (headerLower[0] !== "category") {
    if (detected !== "unknown" && detected !== "comparison") {
      issues.push({
        level: "error",
        line: lines[0].line,
        message: `This CSV looks like a ${detected.replace("_", " ")} CSV. Comparison Battle expects: "Category,EntityA,EntityB,...".`,
      });
      return empty();
    }
    issues.push({
      level: "error",
      line: lines[0].line,
      message: `First column must be "Category". Got "${headerCols[0] ?? ""}".`,
    });
    return empty();
  }

  const entities = headerCols.slice(1).map((e) => e.trim()).filter(Boolean);
  if (entities.length < 2) {
    issues.push({ level: "error", line: lines[0].line, message: "Add at least two entity columns after Category." });
    return empty();
  }
  if (entities.length > 4) {
    issues.push({ level: "warning", line: lines[0].line, message: `${entities.length} entities given — the battle view is designed for 2-4. Extra entities will still render.` });
  }

  const categories: string[] = [];
  const values: Record<string, Record<string, number>> = {};

  for (let i = 1; i < lines.length; i++) {
    const { text: raw, line } = lines[i];
    const cols = splitCsvLine(raw);
    const category = (cols[0] ?? "").trim();
    if (!category) {
      issues.push({ level: "error", line, message: "Category name is empty." });
      continue;
    }
    if (categories.includes(category)) {
      issues.push({ level: "warning", line, message: `Duplicate category "${category}" — later row kept.` });
    } else {
      categories.push(category);
    }
    const rowValues: Record<string, number> = {};
    entities.forEach((entity, idx) => {
      const cell = cols[idx + 1];
      if (cell === undefined || cell === "") {
        rowValues[entity] = NaN;
        return;
      }
      // Strip common suffixes like "%", "M", "B" so "$1.2B" or "45%" parse cleanly.
      const cleaned = String(cell).replace(/[,$%\s]/g, "");
      const num = Number(cleaned);
      if (!isFinite(num)) {
        issues.push({ level: "warning", line, message: `${entity} value "${cell}" isn't numeric — rendered as 0 in the battle bars.` });
        rowValues[entity] = NaN;
      } else {
        rowValues[entity] = num;
      }
    });
    values[category] = rowValues;
  }

  if (categories.length === 0) {
    issues.push({ level: "error", message: "No usable metric rows found." });
    return empty();
  }
  if (categories.length < 2) {
    issues.push({ level: "warning", message: "Add at least 2 metrics for a compelling comparison." });
  }

  // Adapt into DataRow[]: each category becomes an integer "year" (1..N).
  const data: DataRow[] = [];
  categories.forEach((category, catIdx) => {
    entities.forEach((entity) => {
      const raw = values[category]?.[entity];
      data.push({ label: entity, value: isFinite(raw) ? raw : 0, year: catIdx + 1 });
    });
  });

  return { entities, categories, values, data, issues, hasErrors: issues.some((i) => i.level === "error") };
}