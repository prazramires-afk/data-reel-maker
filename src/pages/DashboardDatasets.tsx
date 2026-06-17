import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Database, Eye, EyeOff, Trash2, Pencil, Globe, Lock, Download } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import {
  DATASET_CATEGORY_LABEL,
  deleteDataset, getMyDatasets, updateDataset,
  type Dataset,
} from "@/lib/datasets";

export default function DashboardDatasets() {
  const [datasets, setDatasets] = useState<Dataset[] | null>(null);

  const load = () => getMyDatasets().then(setDatasets);
  useEffect(() => { load(); }, []);

  const togglePublic = async (d: Dataset) => {
    const ok = await updateDataset(d.id, { isPublic: !d.isPublic });
    if (ok) { toast.success(d.isPublic ? "Set to private" : "Published"); load(); }
    else toast.error("Update failed");
  };

  const remove = async (d: Dataset) => {
    if (!confirm(`Delete dataset "${d.title}"? This cannot be undone.`)) return;
    const ok = await deleteDataset(d.id);
    if (ok) { toast.success("Dataset deleted"); load(); }
    else toast.error("Delete failed");
  };

  return (
    <>
      <Seo title="My Datasets — Dashboard" description="Manage and publish datasets" path="/dashboard/datasets" noindex />
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My datasets</h1>
          <p className="text-sm text-muted-foreground mt-1">Publish datasets the community can animate, remix and download.</p>
        </div>
        <Link to="/dashboard/datasets/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          <Plus className="w-4 h-4" /> New dataset
        </Link>
      </header>

      {datasets === null ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : datasets.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Database className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">You haven't published any datasets yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Add one to make it searchable on the dataset network.</p>
          <Link to="/dashboard/datasets/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            <Plus className="w-4 h-4" /> Publish a dataset
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {datasets.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    {DATASET_CATEGORY_LABEL[d.category]}
                  </span>
                  {d.isPublic ? (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500 inline-flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
                  )}
                </div>
                <Link to={`/datasets/${d.slug}`} className="font-semibold text-foreground hover:text-primary line-clamp-1">{d.title}</Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {d.data.length} entries · <Eye className="w-3 h-3 inline" /> {d.viewCount} · <Download className="w-3 h-3 inline" /> {d.downloadCount}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => togglePublic(d)} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90" title={d.isPublic ? "Make private" : "Publish"}>
                  {d.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Link to={`/dashboard/datasets/${d.id}/edit`} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90" title="Edit">
                  <Pencil className="w-4 h-4" />
                </Link>
                <button onClick={() => remove(d)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}