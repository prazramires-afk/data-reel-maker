import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Sparkles, Coins, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/lib/types";
import { getProjectsByUser, deleteProject } from "@/lib/storage";

interface AdminUserRow {
  user_id: string;
  email: string;
  created_at: string;
  tokens: number;
  is_premium: boolean;
  premium_until: string | null;
  project_count: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [projectsByUser, setProjectsByUser] = useState<Record<string, Project[]>>({});
  const [tokenEdits, setTokenEdits] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    else setUsers((data ?? []) as AdminUserRow[]);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
    else if (isAdmin) loadUsers();
  }, [user, isAdmin, loading, navigate, loadUsers]);

  const togglePremium = async (u: AdminUserRow) => {
    const { error } = await supabase.rpc("admin_set_premium", {
      target_user: u.user_id,
      premium: !u.is_premium,
      months: 1,
    });
    if (error) return toast.error(error.message);
    toast.success(!u.is_premium ? "Premium activated (1 month)" : "Premium removed");
    loadUsers();
  };

  const setTokens = async (u: AdminUserRow) => {
    const raw = tokenEdits[u.user_id];
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return toast.error("Enter a non-negative number");
    const { error } = await supabase.rpc("admin_set_tokens", { target_user: u.user_id, new_tokens: n });
    if (error) return toast.error(error.message);
    toast.success("Tokens updated");
    setTokenEdits((s) => ({ ...s, [u.user_id]: "" }));
    loadUsers();
  };

  const toggleExpand = async (uid: string) => {
    if (expanded === uid) {
      setExpanded(null);
      return;
    }
    setExpanded(uid);
    if (!projectsByUser[uid]) {
      const list = await getProjectsByUser(uid);
      setProjectsByUser((s) => ({ ...s, [uid]: list }));
    }
  };

  const handleEditProject = (id: string) => navigate(`/create?edit=${id}`);

  const handleDeleteProject = async (uid: string, id: string) => {
    if (!confirm("Delete this project?")) return;
    await deleteProject(id);
    const list = await getProjectsByUser(uid);
    setProjectsByUser((s) => ({ ...s, [uid]: list }));
    loadUsers();
  };

  if (loading || !isAdmin) return null;

  return (
    <div className="min-h-screen px-5 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={loadUsers} disabled={busy} className="flex items-center gap-2 text-sm text-muted-foreground active:scale-95 transition-transform">
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">Admin Panel</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage user subscriptions, tokens, and projects.</p>

      <div className="flex flex-col gap-3">
        {users.map((u) => {
          const open = expanded === u.user_id;
          const list = projectsByUser[u.user_id] ?? [];
          return (
            <div key={u.user_id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => toggleExpand(u.user_id)} className="flex items-start gap-2 min-w-0 text-left">
                    {open ? <ChevronDown className="w-4 h-4 mt-1 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{u.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Joined {new Date(u.created_at).toLocaleDateString()} · {u.project_count} project{u.project_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => togglePremium(u)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform ${
                      u.is_premium ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {u.is_premium ? "Premium ON" : "Premium OFF"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Coins className="w-3.5 h-3.5" /> {u.tokens} tokens
                  </span>
                  {u.premium_until && (
                    <span className="text-muted-foreground">until {new Date(u.premium_until).toLocaleDateString()}</span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min={0}
                      placeholder="Set tokens"
                      value={tokenEdits[u.user_id] ?? ""}
                      onChange={(e) => setTokenEdits((s) => ({ ...s, [u.user_id]: e.target.value }))}
                      className="w-24 h-8 px-2 rounded-md bg-background border border-input text-foreground text-xs"
                    />
                    <button
                      onClick={() => setTokens(u)}
                      className="h-8 px-3 rounded-md bg-secondary text-foreground text-xs font-semibold active:scale-95"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>

              {open && (
                <div className="border-t border-border bg-background/40 p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Projects</p>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {list.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.name || "Untitled"}</p>
                            <p className="text-xs text-muted-foreground">{p.type} · {new Date(p.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-3">
                            <button onClick={() => handleEditProject(p.id)} className="p-2 rounded-md bg-secondary active:scale-90">
                              <Pencil className="w-4 h-4 text-foreground" />
                            </button>
                            <button onClick={() => handleDeleteProject(u.user_id, p.id)} className="p-2 rounded-md bg-destructive/15 active:scale-90">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {users.length === 0 && !busy && (
          <p className="text-center text-muted-foreground py-12">No users yet.</p>
        )}
      </div>
    </div>
  );
};

export default Admin;