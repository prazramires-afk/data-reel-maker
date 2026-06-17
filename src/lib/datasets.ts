import { supabase } from "@/integrations/supabase/client";
import type { DataRow } from "./types";

export const DATASET_CATEGORIES = [
  "economy",
  "finance",
  "population",
  "sports",
  "technology",
  "history",
  "business",
  "other",
] as const;
export type DatasetCategory = typeof DATASET_CATEGORIES[number];

export const DATASET_CATEGORY_LABEL: Record<DatasetCategory, string> = {
  economy: "Economy",
  finance: "Finance",
  population: "Population",
  sports: "Sports",
  technology: "Technology",
  history: "History",
  business: "Business",
  other: "Other",
};

export interface Dataset {
  id: string;
  userId: string | null;
  slug: string;
  title: string;
  description: string | null;
  category: DatasetCategory;
  tags: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  unit: string | null;
  data: DataRow[];
  isPublic: boolean;
  hidden: boolean;
  viewCount: number;
  downloadCount: number;
  useCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface DatasetCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverDatasetId: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

function rowToDataset(r: any): Dataset {
  const data = Array.isArray(r.data)
    ? (r.data as any[]).map((x) => ({
        label: String(x.label ?? ""),
        year: Number(x.year ?? 0),
        value: Number(x.value ?? 0),
      }))
    : [];
  return {
    id: r.id,
    userId: r.user_id ?? null,
    slug: r.slug,
    title: r.title,
    description: r.description ?? null,
    category: (r.category ?? "other") as DatasetCategory,
    tags: Array.isArray(r.tags) ? r.tags : [],
    sourceName: r.source_name ?? null,
    sourceUrl: r.source_url ?? null,
    unit: r.unit ?? null,
    data,
    isPublic: !!r.is_public,
    hidden: !!r.hidden,
    viewCount: r.view_count ?? 0,
    downloadCount: r.download_count ?? 0,
    useCount: r.use_count ?? 0,
    likeCount: r.like_count ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
  };
}

export type DatasetSort = "latest" | "trending" | "most_used" | "most_downloaded" | "most_viewed";

export interface DatasetQuery {
  q?: string;
  tag?: string;
  category?: DatasetCategory | string;
  sort?: DatasetSort;
  limit?: number;
  offset?: number;
}

export async function searchDatasets(params: DatasetQuery = {}): Promise<Dataset[]> {
  const { data, error } = await (supabase as any).rpc("search_datasets", {
    _q: params.q ?? null,
    _tag: params.tag ?? null,
    _category: params.category ?? null,
    _sort: params.sort ?? "latest",
    _limit: params.limit ?? 24,
    _offset: params.offset ?? 0,
  });
  if (error) { console.error("searchDatasets", error); return []; }
  return (data ?? []).map(rowToDataset);
}

export async function getTrendingDatasets(limit = 12): Promise<Dataset[]> {
  const { data, error } = await (supabase as any).rpc("get_trending_datasets", { _limit: limit });
  if (error) { console.error("getTrendingDatasets", error); return []; }
  return (data ?? []).map(rowToDataset);
}

export async function getDatasetBySlug(slug: string): Promise<Dataset | null> {
  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("hidden", false)
    .maybeSingle();
  if (error || !data) return null;
  return rowToDataset(data);
}

export async function getDatasetById(id: string): Promise<Dataset | null> {
  const { data, error } = await supabase.from("datasets").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToDataset(data);
}

export async function getMyDatasets(): Promise<Dataset[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(rowToDataset);
}

export interface DatasetInput {
  title: string;
  description?: string;
  category: DatasetCategory;
  tags?: string[];
  sourceName?: string;
  sourceUrl?: string;
  unit?: string;
  data: DataRow[];
  isPublic?: boolean;
}

export async function createDataset(input: DatasetInput): Promise<Dataset | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const id = crypto.randomUUID();
  let slug: string | null = null;
  try {
    const { data: slugData } = await supabase.rpc("generate_dataset_slug", { _title: input.title, _id: id });
    if (typeof slugData === "string") slug = slugData;
  } catch {}
  if (!slug) slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "").slice(0, 60) || `dataset-${id.slice(0, 6)}`;
  const payload: any = {
    id,
    user_id: user.id,
    slug,
    title: input.title.slice(0, 200),
    description: input.description ?? null,
    category: input.category,
    tags: input.tags && input.tags.length ? input.tags.slice(0, 20) : [],
    source_name: input.sourceName ?? null,
    source_url: input.sourceUrl ?? null,
    unit: input.unit ?? null,
    data: input.data as any,
    is_public: input.isPublic ?? true,
  };
  const { data, error } = await supabase.from("datasets").insert(payload).select("*").maybeSingle();
  if (error || !data) { console.error("createDataset", error); return null; }
  return rowToDataset(data);
}

export async function updateDataset(id: string, patch: Partial<DatasetInput>): Promise<boolean> {
  const row: any = {};
  if (patch.title !== undefined) row.title = patch.title.slice(0, 200);
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.tags !== undefined) row.tags = patch.tags;
  if (patch.sourceName !== undefined) row.source_name = patch.sourceName;
  if (patch.sourceUrl !== undefined) row.source_url = patch.sourceUrl;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.data !== undefined) row.data = patch.data;
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;
  const { error } = await supabase.from("datasets").update(row).eq("id", id);
  if (error) { console.error("updateDataset", error); return false; }
  return true;
}

export async function deleteDataset(id: string): Promise<boolean> {
  const { error } = await supabase.from("datasets").delete().eq("id", id);
  return !error;
}

export async function recordDatasetEvent(id: string, type: "view" | "download"): Promise<void> {
  try {
    await (supabase as any).rpc("record_dataset_event", { _dataset_id: id, _event_type: type });
  } catch (e) {
    console.warn("recordDatasetEvent", e);
  }
}

/** Videos that were built from this dataset. */
export async function getVideosForDataset(datasetId: string, limit = 12): Promise<any[]> {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("dataset_id", datasetId)
    .eq("is_public", true)
    .eq("hidden", false)
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Datasets similar by category/tags, excluding current id. */
export async function getRelatedDatasets(current: Dataset, limit = 6): Promise<Dataset[]> {
  // Try same category first.
  const { data } = await supabase
    .from("datasets")
    .select("*")
    .eq("is_public", true)
    .eq("hidden", false)
    .eq("category", current.category)
    .neq("id", current.id)
    .order("use_count", { ascending: false })
    .limit(limit);
  let rows = (data ?? []).map(rowToDataset);
  if (rows.length >= limit) return rows;
  // Pad with tag matches.
  if (current.tags?.length) {
    const { data: tagData } = await supabase
      .from("datasets")
      .select("*")
      .eq("is_public", true)
      .eq("hidden", false)
      .neq("id", current.id)
      .overlaps("tags", current.tags)
      .limit(limit);
    const seen = new Set(rows.map((r) => r.id));
    for (const r of (tagData ?? []).map(rowToDataset)) {
      if (!seen.has(r.id)) { rows.push(r); seen.add(r.id); }
      if (rows.length >= limit) break;
    }
  }
  return rows;
}

// ============================================================
// Dataset collections
// ============================================================

function rowToCollection(r: any): DatasetCollection {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? null,
    coverDatasetId: r.cover_dataset_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    itemCount: r.item_count !== undefined ? Number(r.item_count) : undefined,
  };
}

export async function listDatasetCollections(limit = 24): Promise<DatasetCollection[]> {
  const { data, error } = await supabase
    .from("dataset_collections")
    .select("*")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map(rowToCollection);
}

export async function getDatasetCollectionBySlug(slug: string): Promise<{ collection: DatasetCollection; items: Dataset[] } | null> {
  const { data, error } = await (supabase as any).rpc("get_dataset_collection_by_slug", { _slug: slug });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const collection = rowToCollection(row);
  const { data: items } = await supabase
    .from("dataset_collection_items")
    .select("position,datasets(*)")
    .eq("collection_id", collection.id)
    .order("position", { ascending: true });
  const datasets = (items ?? [])
    .map((r: any) => r.datasets)
    .filter((d: any) => d && d.is_public && !d.hidden)
    .map(rowToDataset);
  collection.itemCount = datasets.length;
  return { collection, items: datasets };
}

// ============================================================
// CSV helpers
// ============================================================

/** Render dataset data rows as a downloadable CSV string (year + label columns). */
export function datasetToCsv(d: Dataset): string {
  const rows = d.data ?? [];
  const labels = Array.from(new Set(rows.map((r) => r.label)));
  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
  const lookup = new Map<string, number>();
  for (const r of rows) lookup.set(`${r.label}|${r.year}`, r.value);
  const header = ["Year", ...labels];
  const lines = [header.map(csvField).join(",")];
  for (const y of years) {
    const line = [String(y), ...labels.map((l) => {
      const v = lookup.get(`${l}|${y}`);
      return v === undefined ? "" : String(v);
    })];
    lines.push(line.map(csvField).join(","));
  }
  return lines.join("\n");
}

function csvField(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(dataset: Dataset): void {
  const csv = datasetToCsv(dataset);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dataset.slug}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Compute basic stats across the dataset. */
export function computeDatasetStats(d: Dataset) {
  const rows = d.data ?? [];
  if (!rows.length) return null;
  const values = rows.map((r) => r.value);
  const labels = Array.from(new Set(rows.map((r) => r.label)));
  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const minRow = rows.find((r) => r.value === min)!;
  const maxRow = rows.find((r) => r.value === max)!;
  return {
    entries: rows.length,
    labelCount: labels.length,
    yearRange: years.length ? `${years[0]}–${years[years.length - 1]}` : "—",
    yearCount: years.length,
    min, max, avg,
    minLabel: minRow?.label,
    maxLabel: maxRow?.label,
  };
}

/** Convert a generated DataRow[] (from current editor) into a draft dataset payload. */
export function dataRowsToDatasetDraft(rows: DataRow[], title: string, category: DatasetCategory = "other"): DatasetInput {
  return { title, category, data: rows };
}