import type { Project } from "@/lib/types";
import { formatValue } from "@/lib/valueFormat";

interface Props {
  project: Project;
}

/**
 * Crawlable HTML rendering of the project's dataset. Designed for Google
 * to read every value — never put dataset numbers behind canvas only.
 */
export function DatasetTable({ project }: Props) {
  const rows = project.data ?? [];
  if (!rows.length) return null;
  const labels = Array.from(new Set(rows.map((r) => r.label)));
  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
  const lookup = new Map<string, number>();
  for (const r of rows) lookup.set(`${r.label}|${r.year}`, r.value);
  const fmt = project.settings?.valueFormat;

  return (
    <section className="mt-8 bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Full dataset</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {labels.length} entries · {years.length} {years.length === 1 ? "year" : "years"} ({years[0]}–{years[years.length - 1]})
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{project.settings?.title || project.name} dataset</caption>
          <thead className="bg-secondary/30">
            <tr>
              <th scope="col" className="text-left px-4 py-2 font-semibold text-foreground sticky left-0 bg-secondary/30">Label</th>
              {years.map((y) => (
                <th key={y} scope="col" className="text-right px-4 py-2 font-semibold text-foreground whitespace-nowrap">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
              <tr key={label} className="border-t border-border">
                <th scope="row" className="text-left px-4 py-2 font-medium text-foreground sticky left-0 bg-card">{label}</th>
                {years.map((y) => {
                  const v = lookup.get(`${label}|${y}`);
                  return (
                    <td key={y} className="text-right px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {v === undefined ? "—" : formatValue(v, fmt)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}