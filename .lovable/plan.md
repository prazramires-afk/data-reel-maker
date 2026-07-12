## Goal

Make Timeline Story, Top 10 Countdown, and Comparison Battle first-class video types with their own CSV schema, parser, validator, sample data, placeholder text, help copy, error messages, and preview table — while leaving Bar Chart Race and Event Timeline untouched.

## New data model (src/lib/types.ts)

Add row types + optional Project fields (kept alongside existing `data: DataRow[]` so nothing breaks for Bar Race):

- `TimelineEventRow { year: number; title: string; description?: string; image?: string }` (image = filename hint or data URL)
- `Top10Row { rank: number; name: string; value: number; image?: string }`
- `ComparisonRow { category: string; values: Record<string, string | number> }` with a sibling `entities: string[]` list (the header columns after `Category`).
- Optional on `Project`: `timelineEvents?`, `top10Rows?`, `comparisonEntities?`, `comparisonRows?`.

Bar Race continues to use `data: DataRow[]` and its existing parser — untouched.

## New parsers (one file each)

- `src/lib/parseTimelineStoryCSV.ts` — header `Year,Title,Description,Image` (last two optional). Reuses BC/AD handling from `parseEventCSV`. Returns `{ rows, issues, hasErrors }`.
- `src/lib/parseTop10CSV.ts` — header `Rank,Name,Value` with optional `Image`. Validates integer rank 1-N, numeric value; auto-sorts descending by value if ranks are missing or inconsistent; caps at 10 rows with a warning.
- `src/lib/parseComparisonCSV.ts` — header `Category,<Entity1>,<Entity2>,...` (2-4 entities). Each row = one metric. Values may be numeric or free-text (kept as string; numeric detected for bar rendering). Warns when fewer than 2 entities or fewer than 2 categories.

Each parser:
- quoted-value CSV splitter (share `splitCsvLine` utility, extracted to `src/lib/csvSplit.ts`)
- structured `issues[]` with line numbers
- schema mismatch detection → issue message that names the correct header (e.g. "This looks like a Bar Chart Race CSV. Timeline Story expects: `Year,Title,Description,Image`.")

## Sample data (src/lib/sampleData.ts)

Add and export:
- `TIMELINE_STORY_SAMPLE_CSV` (Apollo 11 / Berlin Wall / iPhone rows from the request)
- `TOP10_SAMPLE_CSV` (the 10 countries example)
- `COMPARISON_SAMPLE_CSV` (Apple vs Samsung)
Plus tiny helpers to build a parsed `Project`-ready payload from each.

## Create page UX (src/pages/Create.tsx)

For each of the three types, replace the current shared CSV editor with a dedicated editor block (mirroring the pattern already used by `EventTimelineEditor`):

- `TimelineStoryEditor` — row list (Year / Title / Description / Image upload) + CSV paste tab + "Load sample" button + inline validation.
- `Top10Editor` — rank table with drag-to-reorder OR auto-sort toggle, image upload per row, CSV paste tab, sample.
- `ComparisonEditor` — entity headers input (2-4 chips) + category rows grid + optional per-entity image, CSV paste tab, sample.

Each editor:
- Custom placeholder text showing that type's schema
- "Download sample CSV" link (Blob download of the sample constant)
- Preview table that reflects the parsed rows for that type
- Error/warning panel driven by the parser's issues
- Help snippet under the textarea documenting the expected columns

Bar Race path (`videoType === "bar_race"`) keeps the current `validateCSV`-driven editor verbatim. Event Timeline path is unchanged.

Auto-detect: when a user pastes a CSV whose header matches a different video type, show a soft banner "This CSV looks like a Top 10 Countdown — switch video type?" with a one-click switch.

## Preview + Export wiring

- `LivePreview` / export flow already dispatch by `videoType`. Continue passing `data` for Bar Race. For Timeline / Top 10 / Comparison, adapt the existing animation engines to accept the new row shapes:
  - `timelineAnimation.ts`: consume `TimelineEventRow[]` (title + description + optional image). Keeps current one-card-at-a-time animation; per-row image support added via `labelImages` keyed by row index (same trick used by Event Timeline).
  - `top10Animation.ts`: consume `Top10Row[]` with rank/name/value; countdown reveal from #10 → #1 with a winner celebration frame at the end.
  - `comparisonAnimation.ts`: consume entities + `ComparisonRow[]`; render animated bars per category, highlight winner, and show a final aggregated score summary.

Only the input adapter layer changes; visual style stays consistent with today's engines. No new export pipeline.

## Persistence

`saveProject` / `loadProject` gain passthrough for the new optional fields. Legacy projects (with only `data`) keep loading fine because the new fields are optional.

## Technical notes

- Shared CSV utilities extracted to `src/lib/csvSplit.ts` so all four parsers agree on quoting rules.
- No DB migration required — new fields live inside the existing JSON `settings`/`data` payload where projects are stored.
- No changes to Bar Chart Race code paths, `parseCSV.ts`, `validateCSV.ts`, or Event Timeline files.
- Unit-test each new parser with the sample CSVs from the request (happy path + one malformed variant).

## Out of scope

- Bar Chart Race (frozen, as requested).
- Event Timeline (already optimized).
- Redesigning the actual animation visuals beyond the input adapter changes above.
- Any backend/schema migration.

Reply "go" to build, or tell me what to tweak — e.g. max entities for Comparison (currently 4), whether Top 10 should always cap at 10 or allow Top 5 / Top 20, or whether Timeline Story should support BC/AD years like Event Timeline (planned: yes).