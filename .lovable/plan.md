## Dataset Network System

Build a user-publishable dataset platform tightly linked to community videos. Zero AI APIs — pure DB + UGC.

### 1. Database (one migration)

**New table `public.datasets`:**
- `id uuid pk`, `user_id uuid` (nullable for seeded), `slug text unique`, `title text`, `description text`
- `category text` (enum-checked: economy, finance, population, sports, technology, history, business, other)
- `tags text[]` (gin index)
- `source_name text`, `source_url text`
- `unit text` (e.g. "USD billions")
- `data jsonb` — `[{label, year, value}]` (same shape as projects.data)
- `is_public boolean default true`, `hidden boolean default false`
- `view_count`, `download_count`, `use_count` (videos created from it), `like_count` int defaults 0
- `created_at`, `updated_at`, `published_at`

**New table `public.dataset_collections`:** `id, user_id, slug unique, name, description, cover_dataset_id, is_public, created_at, updated_at`
**New table `public.dataset_collection_items`:** `collection_id, dataset_id, position`

**Extend `public.projects`:** add `dataset_id uuid references datasets(id) on delete set null` so watch pages can link "Dataset Used".

**Triggers:**
- `derive_dataset_tags()` — same logic as projects, auto-tag from labels+title if user left tags empty
- Bump `datasets.use_count` when a project with `dataset_id` is inserted/published
- `updated_at` touch

**RPCs:**
- `search_datasets(_q, _tag, _category, _sort, _limit, _offset)` — sort: latest/most_used/most_downloaded/most_viewed
- `get_trending_datasets(_window, _limit)` — score: `views + 3*uses + 2*downloads` decayed by age
- `record_dataset_event(_id, 'view'|'download')` — increments counter
- `create_dataset_from_project(_project_id)` — convenience: copies project.data into a new dataset row owned by caller

**Grants + RLS:** public read for `is_public AND NOT hidden`; owner full control; service_role all.

### 2. Storage layer (`src/lib/storage.ts`)

Add helpers: `listDatasets`, `getDatasetBySlug`, `getDatasetsByCategory`, `getDatasetsByTag`, `getTrendingDatasets`, `createDataset`, `updateDataset`, `deleteDataset`, `recordDatasetEvent`, `attachDatasetToProject`, `listDatasetCollections`, `getDatasetCollectionBySlug`.

Add `Dataset` type to `src/lib/types.ts`.

### 3. Routes & pages

| Route | Page | Purpose |
|---|---|---|
| `/datasets` | `Datasets.tsx` (replace existing static page) | Search + sort tabs (Trending / Most Used / Most Downloaded / Most Viewed / Latest) + category nav + grid |
| `/datasets/:slug` | `DatasetDetail.tsx` (new) | H1, description, interactive chart (Recharts), full HTML table, stats card, tags, source, CSV download, share, **Create Video** (→ `/create?dataset=:slug`), Related videos (projects with this `dataset_id`), Related datasets (same category/tags) |
| `/datasets/category/:category` | `DatasetCategory.tsx` | Filtered grid + category JSON-LD |
| `/tag/:slug` | already exists — extend to also show datasets with that tag below videos |
| `/collections/:slug` | `DatasetCollection.tsx` | Curated dataset list |
| `/dashboard/datasets` | `DashboardDatasets.tsx` | User CRUD: create/edit/delete, upload CSV via existing `parseCSV.ts`, set public/private |
| `/dashboard/datasets/new` and `/edit/:id` | `DatasetEditor.tsx` | Form: title, description, category select, tags input, source name/url, unit, CSV paste/upload, public toggle |

### 4. Components

- `components/dataset/DatasetCard.tsx` — card with category, use_count, download_count, view_count
- `components/dataset/DatasetChart.tsx` — Recharts line/bar (auto-pick based on years)
- `components/dataset/DatasetTable.tsx` — promote/reuse `article/DatasetTable.tsx` shape, indexable
- `components/dataset/DatasetStats.tsx` — min/max/avg/range/entries
- `components/dataset/DatasetActions.tsx` — Download CSV, Share, Create Video
- `components/dataset/RelatedDatasets.tsx` and `RelatedDatasetVideos.tsx`

### 5. Watch page link-back

`CommunityProject.tsx`: if `project.dataset_id`, show "Dataset used: <Link to /datasets/:slug>".

`Create.tsx`: read `?dataset=slug` param → preload dataset rows into the editor, store `dataset_id` on save.

### 6. SEO

- JSON-LD `Dataset` (schema.org) on `/datasets/:slug` with `name`, `description`, `keywords`, `creator`, `distribution` (CSV), `temporalCoverage`, `variableMeasured`
- `BreadcrumbList` on every dataset/category/collection page
- `CollectionPage` on `/datasets`, `/datasets/category/*`, `/collections/*`
- Canonical + OG per page via `Seo` component
- Extend `scripts/generate-sitemap.ts` to enumerate public datasets, dataset categories, and dataset collections

### 7. Out of scope

- AI dataset descriptions / auto categorization
- Live data feeds (API integrations)
- Dataset versioning / diffs
- Paid / gated datasets
- Comments and reviews

### Rollout

1. Migration (datasets + collections + projects.dataset_id + RPCs + triggers + grants/RLS)
2. Types + storage helpers
3. Public read pages (`/datasets`, `/datasets/:slug`, category, collection)
4. Dashboard CRUD + editor
5. Watch + Create integration (dataset link-back, ?dataset= preload)
6. Sitemap + JSON-LD pass
