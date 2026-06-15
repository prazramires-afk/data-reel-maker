import { Link } from "react-router-dom";
import { DATASETS } from "@/lib/seoContent/datasets";

export function RelatedDatasets({ keywords }: { keywords: string[] }) {
  const tokens = keywords
    .flatMap((k) => k.toLowerCase().split(/[^a-z0-9]+/))
    .filter((t) => t.length >= 3);
  if (!tokens.length) return null;
  const scored = DATASETS.map((d) => {
    const hay = [d.title, d.intro, ...d.keywords].join(" ").toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    return { d, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!scored.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-3">Related datasets</h2>
      <ul className="grid sm:grid-cols-3 gap-3">
        {scored.map(({ d }) => (
          <li key={d.slug} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors">
            <Link to={`/datasets/${d.slug}`} className="block">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{d.category}</p>
              <p className="font-semibold text-foreground mt-1 line-clamp-2">{d.title}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{d.intro}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}