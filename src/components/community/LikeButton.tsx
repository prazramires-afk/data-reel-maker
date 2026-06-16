import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasLikedProject, toggleProjectLike } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

export function LikeButton({ projectId, initialCount = 0 }: { projectId: string; initialCount?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!user) {
      setLiked(false);
      return;
    }
    hasLikedProject(projectId).then(setLiked);
  }, [user, projectId]);

  const onClick = async () => {
    if (!user) {
      navigate("/auth?next=" + encodeURIComponent(location.pathname));
      return;
    }
    if (busy) return;
    setBusy(true);
    const optimistic = !liked;
    setLiked(optimistic);
    setCount((c) => Math.max(0, c + (optimistic ? 1 : -1)));
    const res = await toggleProjectLike(projectId);
    if (res === null) {
      setLiked(!optimistic);
      setCount((c) => Math.max(0, c + (optimistic ? -1 : 1)));
      toast({ title: "Couldn't update like", variant: "destructive" });
    }
    setBusy(false);
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={liked}
      className={
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all " +
        (liked ? "bg-primary/15 text-primary border border-primary/40" : "bg-secondary text-secondary-foreground border border-transparent")
      }
    >
      <Heart className={"w-4 h-4 " + (liked ? "fill-current" : "")} />
      {count.toLocaleString()}
    </button>
  );
}

export default LikeButton;