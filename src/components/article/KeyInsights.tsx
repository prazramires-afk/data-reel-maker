export function KeyInsights({ insights }: { insights: string[] }) {
  if (!insights?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-3">Key insights</h2>
      <ul className="bg-card border border-border rounded-2xl p-5 space-y-2 list-disc pl-8 text-foreground">
        {insights.map((s, i) => (
          <li key={i} className="text-sm leading-relaxed">{s}</li>
        ))}
      </ul>
    </section>
  );
}