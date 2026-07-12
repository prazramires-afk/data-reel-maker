/**
 * Shared CSV line splitter that handles double-quoted values so cells may
 * contain commas. Extracted so every video-type parser agrees on quoting rules.
 */
export function splitCsvLine(line: string): string[] {
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

export type CsvIssueLevel = "error" | "warning";
export interface CsvParseIssue {
  level: CsvIssueLevel;
  line?: number;
  message: string;
}

/**
 * Given a header row, guess which video-type schema it belongs to. Used to
 * show a helpful "this looks like a different type" hint when the user pastes
 * the wrong CSV into a specific editor.
 */
export function detectSchema(headerRow: string): "bar_race" | "timeline" | "top10" | "comparison" | "event_timeline" | "unknown" {
  const cols = splitCsvLine(headerRow).map((c) => c.toLowerCase());
  if (cols.length === 0) return "unknown";
  if (cols[0] === "rank") return "top10";
  if (cols[0] === "category") return "comparison";
  if (cols[0] === "year") {
    if (cols[1] === "title" || cols[1] === "event" || cols[1] === "name") {
      // Distinguish Timeline Story (has "description" or "image") from Event Timeline.
      if (cols.includes("image") || cols[1] === "title") return "timeline";
      return "event_timeline";
    }
    // Year + numeric label columns → Bar Chart Race
    return "bar_race";
  }
  return "unknown";
}