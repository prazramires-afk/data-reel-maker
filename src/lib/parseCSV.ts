import { DataRow } from "./types";

export function parseCSV(text: string): DataRow[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  // Expect first column to be Year, rest are labels
  const labels = headers.slice(1);
  const rows: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const year = parseInt(cols[0], 10);
    if (isNaN(year)) continue;

    labels.forEach((label, idx) => {
      const val = parseFloat(cols[idx + 1]);
      if (!isNaN(val)) {
        rows.push({ label, value: val, year });
      }
    });
  }

  return rows;
}
