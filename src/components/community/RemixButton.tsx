import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { remixProject } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

export function RemixButton({ projectId, disabled = false, variant = "primary" }: { projectId: string; disabled?: boolean; variant?: "primary" | "ghost" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const cls =
    variant === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground";

  return (
    <button
      disabled={disabled || busy}
      onClick={async () => {
        if (!user) {
          navigate("/auth?next=" + encodeURIComponent(location.pathname));
          return;
        }
        setBusy(true);
        const id = await remixProject(projectId);
        setBusy(false);
        if (!id) {
          toast({ title: "Couldn't remix this video", variant: "destructive" });
          return;
        }
        toast({ title: "Remix created" });
        navigate(`/create?id=${id}`);
      }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 ${cls}`}
    >
      <Wand2 className="w-4 h-4" /> {busy ? "Remixing…" : "Remix"}
    </button>
  );
}

export default RemixButton;