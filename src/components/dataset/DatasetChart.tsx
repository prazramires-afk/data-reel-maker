import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import type { Dataset } from "@/lib/datasets";
import { BAR_COLORS } from "@/lib/types";

export function DatasetChart({ dataset }: { dataset: Dataset }) {
  const { rows, labels, multiYear } = useMemo(() => {
    const data = dataset.data ?? [];
    const labels = Array.from(new Set(data.map((r) => r.label)));
    const years = Array.from(new Set(data.map((r) => r.year))).sort((a, b) => a - b);
    if (!data.length) return { rows: [], labels: [], multiYear: false };
    const multiYear = years.length > 1;
    if (multiYear) {
      const lookup = new Map<string, number>();
      for (const r of data) lookup.set(`${r.label}|${r.year}`, r.value);
      const rows = years.map((y) => {
        const row: any = { year: y };
        for (const l of labels) row[l] = lookup.get(`${l}|${y}`) ?? null;
        return row;
      });
      return { rows, labels, multiYear };
    }
    // single year — bar chart by label
    const rows = labels.map((l) => {
      const v = data.find((d) => d.label === l)?.value ?? 0;
      return { label: l, value: v };
    });
    return { rows, labels, multiYear };
  }, [dataset]);

  if (!rows.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
        No data points to chart.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {multiYear ? (
            <LineChart data={rows} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {labels.slice(0, 10).map((l, i) => (
                <Line key={l} type="monotone" dataKey={l} stroke={BAR_COLORS[i % BAR_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={rows} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}