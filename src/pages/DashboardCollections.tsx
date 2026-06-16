import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Globe, Lock, ExternalLink } from "lucide-react";
import { Seo } from "@/components/Seo";
import { getMyProfile, Profile } from "@/lib/profile";
import {
  CollectionSummary,
  createCollection,
  deleteCollection,
  listMyCollections,
  setCollectionVisibility,
} from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

const DashboardCollections = () => {
  const [cols, setCols] = useState<CollectionSummary[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");

  const reload = () => listMyCollections().then(setCols);
  useEffect(() => { reload(); getMyProfile().then(setProfile); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const slug = await createCollection(name.trim());
    if (slug) { setName(""); reload(); toast({ title: "Collection created" }); }
    else toast({ title: "Couldn't create collection", variant: "destructive" });
  };

  return (
    <>
      <Seo title="Collections — Dashboard" description="Curate sets of videos." path="/dashboard/collections" noindex />
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Collections</h1>
      <p className="text-muted-foreground mb-6">Group videos into public collections — ASEAN Economy, Football Stats, etc.</p>

      <div className="bg-card rounded-2xl p-4 border border-border/50 mb-5 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New collection name" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
        <button onClick={create} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm">
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      {cols === null ? (
        <div className="h-40" />
      ) : cols.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center border border-border/50 text-muted-foreground text-sm">No collections yet.</div>
      ) : (
        <div className="space-y-2">
          {cols.map((c) => (
            <div key={c.id} className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.item_count} item{c.item_count === 1 ? "" : "s"} · {c.is_public ? "Public" : "Private"}</div>
              </div>
              {profile && (
                <Link to={`/u/${profile.username}/c/${c.slug}`} className="p-2 rounded-lg hover:bg-secondary" title="View">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
              <button onClick={async () => { await setCollectionVisibility(c.id, !c.is_public); reload(); }} className="p-2 rounded-lg hover:bg-secondary" title={c.is_public ? "Make private" : "Make public"}>
                {c.is_public ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Globe className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button onClick={async () => { if (confirm("Delete collection?")) { await deleteCollection(c.id); reload(); } }} className="p-2 rounded-lg hover:bg-destructive/15 text-destructive" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DashboardCollections;