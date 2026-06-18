import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import {
  DATASET_CATEGORIES, DATASET_CATEGORY_LABEL,
  createDataset, getDatasetById, updateDataset,
  type DatasetCategory,
} from "@/lib/datasets";
import { validateCSV } from "@/lib/validateCSV";
import type { DataRow } from "@/lib/types";

const EMPTY_CSV = `Year,Label A,Label B,Label C
2020,12,8,5
2021,16,11,7
2022,21,15,10
2023,29,20,14
2024,38,28,19`;

export default function DatasetEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DatasetCategory>("economy");
  const [tagsInput, setTagsInput] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [unit, setUnit] = useState("");
  const [csvText, setCsvText] = useState(EMPTY_CSV);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    getDatasetById(id!).then((d) => {
      if (!d) { toast.error("Dataset not found"); navigate("/dashboard/datasets"); return; }
      setTitle(d.title);
      setDescription(d.description ?? "");
      setCategory(d.category);
      setTagsInput(d.tags.join(", "));
      setSourceName(d.sourceName ?? "");
      setSourceUrl(d.sourceUrl ?? "");
      setUnit(d.unit ?? "");
      setIsPublic(d.isPublic);
      // serialize back to CSV
      const rows = d.data ?? [];
      const labels = Array.from(new Set(rows.map((r) => r.label)));
      const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
      const lookup = new Map<string, number>();
      for (const r of rows) lookup.set(`${r.label}|${r.year}`, r.value);
      const header = ["Year", ...labels].join(",");
      const lines = [header];
      for (const y of years) {
        lines.push([y, ...labels.map((l) => lookup.get(`${l}|${y}`) ?? "")].join(","));
      }
      setCsvText(lines.join("\n"));
      setInitialLoading(false);
    });
  }, [editing, id, navigate]);

  const validation = useMemo(() => {
    try { return validateCSV(csvText); }
    catch (e: any) {
      return {
        headers: [], labels: [], rows: [] as DataRow[], preview: [], years: [],
        issues: [{ level: "error" as const, message: e?.message || "Could not parse CSV." }],
        hasErrors: true,
      };
    }
  }, [csvText]);
  const parsedRows = validation.rows;

  const onCsvFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("CSV file is larger than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsvText(text);
      const v = validateCSV(text);
      if (v.hasErrors) toast.error(`CSV uploaded with ${v.issues.filter((i) => i.level === "error").length} error(s).`);
      else toast.success(`CSV parsed: ${v.rows.length} values across ${v.years.length} year(s).`);
    };
    reader.readAsText(file);
  };

  const submit = async () => {
    if (!title.trim()) { toast.error("Please add a title"); return; }
    if (validation.hasErrors) {
      toast.error("Fix the CSV errors before publishing.");
      return;
    }
    if (parsedRows.length < 2) { toast.error("Need at least one row of data"); return; }
    setLoading(true);
    const tags = tagsInput.split(",").map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-")).filter(Boolean).slice(0, 20);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      tags,
      sourceName: sourceName.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      unit: unit.trim() || undefined,
      data: parsedRows,
      isPublic,
    };
    if (editing) {
      const ok = await updateDataset(id!, payload);
      setLoading(false);
      if (!ok) { toast.error("Could not save"); return; }
      toast.success("Dataset updated");
      navigate("/dashboard/datasets");
    } else {
      const created = await createDataset(payload);
      setLoading(false);
      if (!created) { toast.error("Could not create"); return; }
      toast.success("Dataset published");
      navigate(`/datasets/${created.slug}`);
    }
  };

  if (initialLoading) return <div className="min-h-[40vh]" />;

  return (
    <>
      <Seo title={editing ? "Edit dataset — Dashboard" : "Publish dataset — Dashboard"} description="Manage datasets" path="/dashboard/datasets" noindex />
      <Link to="/dashboard/datasets" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to datasets
      </Link>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{editing ? "Edit dataset" : "Publish a dataset"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Datasets are searchable, downloadable as CSV, and one click away from becoming a video.</p>
      </header>

      <div className="space-y-5 max-w-2xl">
        <Field label="Title" required>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="GDP per Capita ASEAN" className={inputCls} />
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What does this dataset show?" className={inputCls} />
        </Field>

        <Field label="Category" required>
          <select value={category} onChange={(e) => setCategory(e.target.value as DatasetCategory)} className={inputCls}>
            {DATASET_CATEGORIES.filter((c) => c !== "other").map((c) => (
              <option key={c} value={c}>{DATASET_CATEGORY_LABEL[c]}</option>
            ))}
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="Tags" hint="Comma-separated. Auto-filled from labels if left empty.">
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="asean, gdp, economy" className={inputCls} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Source name">
            <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="World Bank" className={inputCls} />
          </Field>
          <Field label="Source URL">
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://" className={inputCls} />
          </Field>
        </div>

        <Field label="Unit" hint="e.g. USD (billions), People, Points">
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="USD (billions)" className={inputCls} />
        </Field>

        <Field label="CSV data" required hint="Header row: Year, then one column per label.">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            className={`${inputCls} font-mono text-xs`}
          />
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <label className="cursor-pointer underline">
              Upload CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onCsvFile(f); }}
              />
            </label>
            <span>{parsedRows.length} values · {validation.years.length} year(s) · {validation.labels.length} label(s)</span>
          </div>
          <CsvFeedback validation={validation} />
        </Field>

        <Field label="">
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Public (visible on the dataset network)
          </label>
        </Field>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={submit}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
          >
            {loading ? "Saving…" : editing ? "Save changes" : "Publish dataset"}
          </button>
          <Link to="/dashboard/datasets" className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm">
            Cancel
          </Link>
        </div>
      </div>
    </>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

function Field({ label, children, hint, required }: { label: string; children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <div>
      {label && (
        <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
          {label}{required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}