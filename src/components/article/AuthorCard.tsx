import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  fallbackName?: string | null;
}

export function AuthorCard({ username, displayName, avatarUrl, fallbackName }: Props) {
  const name = displayName || username || fallbackName || "Anonymous creator";
  const initials = (name || "?").slice(0, 2).toUpperCase();
  const inner = (
    <div className="flex items-center gap-3">
      <Avatar className="w-12 h-12">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-foreground font-semibold leading-tight">{name}</p>
        {username ? (
          <p className="text-xs text-muted-foreground mt-0.5">@{username}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">Community creator</p>
        )}
      </div>
    </div>
  );
  return (
    <section className="mt-6 bg-card border border-border rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Created by</p>
      {username ? (
        <Link to={`/u/${username}`} className="block hover:opacity-90">{inner}</Link>
      ) : (
        inner
      )}
    </section>
  );
}