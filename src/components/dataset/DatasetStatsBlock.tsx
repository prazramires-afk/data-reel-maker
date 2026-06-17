import { computeDatasetStats, type Dataset } from "@/lib/datasets";

export function DatasetStatsBlock({ dataset }: { dataset: Dataset }) {
  const s = computeDatasetStats(dataset);
  if (!s) return null;
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const items = [
    { label: "Entries", value: s.entries.toLocaleString() },
    { label: "Labels", value: s.labelCount.toLocaleString() },
    { label: "Years", value: s.yearRange },
    { label: "Highest", value: `${fmt(s.max)}`, sub: s.maxLabel },
    { label: "Lowest", value: `${fmt(s.min)}`, sub: s.minLabel },
    { label: "Average", value: fmt(s.avg) },
  ];
  return (
    <section>
      <h2 className="sr-only">Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{it.label}</p>
            <p className="text-lg font-bold text-foreground mt-1 truncate">{it.value}</p>
            {it.sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{it.sub}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}