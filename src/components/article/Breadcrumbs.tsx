import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  name: string;
  path?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {c.path && !isLast ? (
                <Link to={c.path} className="hover:text-foreground">{c.name}</Link>
              ) : (
                <span className={isLast ? "text-foreground" : ""}>{c.name}</span>
              )}
              {!isLast && <ChevronRight className="w-3 h-3 opacity-60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}