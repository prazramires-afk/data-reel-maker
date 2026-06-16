import { Link } from "react-router-dom";

export function TagChips({ tags, max = 8 }: { tags?: string[] | null; max?: number }) {
  const list = (tags || []).filter(Boolean).slice(0, max);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((t) => (
        <Link
          key={t}
          to={`/tag/${encodeURIComponent(t)}`}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground hover:bg-primary/15 hover:text-primary transition-colors"
        >
          #{t}
        </Link>
      ))}
    </div>
  );
}

export default TagChips;