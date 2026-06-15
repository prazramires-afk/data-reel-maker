# Community Videos → SEO Content Pages

Make every public video rank like an article: crawlable HTML, AI-written narrative grounded in the actual dataset, structured data, internal linking, and topic/category pages.

## Scope decisions (please confirm)

A few choices change the size of this work. I'll proceed with the defaults below unless you say otherwise.

1. **URL strategy.** `/watch/:slug` already powers the existing SEO landing pages (`watchPages.ts`). Keeping two `/watch` systems will collide. Default: keep community videos on `/community/:slug` (already slugified last turn) and upgrade that page into the rich article. If you prefer the literal `/watch/:slug` for community, I'll namespace the existing pages to `/explore/:slug`.

2. **AI generation cost model.** Default: generate once on publish and cache in DB (cheap, indexable immediately, no per-view cost). Alternative: generate on first view. Pre-generation is recommended for SEO so Googlebot sees the text on the very first crawl.

3. **Categories.** Default: a fixed taxonomy (`economy`, `finance`, `population`, `sports`, `technology`, `entertainment`, `other`) auto-assigned by AI on publish, with a manual override in the publish dialog. Alternative: free-form tags only.

4. **Pre-rendering.** Default: client-rendered with `react-helmet-async` + JSON-LD (Googlebot executes JS; LinkedIn/Slack/Facebook do not). True per-page social previews need SSR/static prerender, which is a separate, bigger lift. I'll flag this honestly in copy and keep social fallback meta in `index.html`.

## What every community video page will contain

`/community/:slug` becomes a long-form article with this structure, in order:

1. Breadcrumb (Home › Community › Category › Title)
2. H1 = video title
3. Animated canvas player (existing component) + Share controls
4. **Crawlable dataset table** rendered as real `<table>` HTML (not canvas) with caption, units, source
5. AI summary (2–3 paragraphs introducing the topic and the dataset)
6. Key insights (3–6 bullets grounded in real values — top mover, leader, gap, trend)
7. FAQ accordion (5 topic-specific Q&As)
8. Author card linking to `/u/:username`
9. Related videos (same category, by view count)
10. Related datasets (from existing `datasets.ts` matched by keywords)
11. "Create your own" CTA → `/create`

Every section is server-friendly markup — no data hidden inside the canvas.

## AI content generation (Lovable AI Gateway)

A single edge function `generate-video-seo` takes a project id, reads the dataset, and writes back: `seo_title`, `meta_description`, `summary`, `insights[]`, `faqs[{q,a}]`, `category`. Uses `google/gemini-2.5-flash` with strict JSON tool-calling so we get structured output, then validate before saving. Prompt anchors on the actual numbers ("Top 5 by latest year: …") so the model never invents filler.

Triggered:
- Automatically on publish (in `publishProject` after the row is upserted).
- Manually from the dashboard via a "Regenerate SEO content" button.
- Backfill script runs once for the existing public projects.

## Structured data (JSON-LD via react-helmet-async)

On each `/community/:slug`:
- `VideoObject` (name, description, thumbnailUrl, uploadDate, contentUrl, embedUrl)
- `Dataset` (name, description, creator, distribution=CSV download link, variableMeasured)
- `FAQPage` (mainEntity = generated FAQs)
- `BreadcrumbList`

On `/community/:category`: `CollectionPage` + `BreadcrumbList`.
On `/u/:username`: keep existing `ProfilePage` and add `ItemList` of videos.

## Category pages

New route `/community/:category` (matched before `:slug` via an allowlist of known category slugs to avoid conflicts). Lists every public video in that category, paginated 24 per page, with H1 ("Economy Data Videos"), short intro, and JSON-LD `CollectionPage`. Indexable; included in the sitemap.

## Internal linking

- Each video card links to its slugified URL.
- Related videos block on the article page links 6 same-category videos.
- Related datasets block links 3 best-match entries from `datasets.ts`.
- Creator name on every card and article links to `/u/:username`.
- Category chip on each card links to `/community/:category`.

## Sitemap & robots

Extend `scripts/generate-sitemap.ts` to fetch all public projects and category slugs and add them to entries. Keep `robots.txt` as-is.

## Per-page metadata

Switch the project to `react-helmet-async` (sitewide `og:*` stays in `index.html` for non-JS crawlers). Each community article ships its own `<title>`, meta description (from AI summary, ≤160 chars), canonical, `og:url`, `og:title`, `og:description`, and `og:image` (we already generate a thumbnail from the first canvas frame — we'll persist it to the `avatars` bucket sibling `thumbnails` and use it here).

## Technical details

**Database migration**
- `projects`: add `category text`, `seo_title text`, `meta_description text`, `summary text`, `insights jsonb`, `faqs jsonb`, `seo_generated_at timestamptz`.
- Unique partial index on `category` for fast category-page queries.
- RLS unchanged (public read on `is_public = true` already exists).

**Edge function** `supabase/functions/generate-video-seo/index.ts`
- Auth: requires the project owner OR admin (verified via `auth.uid()` + `has_role`).
- Reads project row → builds a compact dataset prompt → calls Lovable AI Gateway with tool schema → updates row.
- Returns the generated fields.

**Frontend**
- New `src/pages/CommunityArticle.tsx` replacing the current `CommunityProject.tsx` body (keeps the same route).
- New `src/pages/CommunityCategory.tsx`.
- New `src/components/DatasetTable.tsx`, `FaqAccordion.tsx`, `RelatedVideos.tsx`, `RelatedDatasets.tsx`, `Breadcrumbs.tsx`.
- New `src/lib/seo/jsonLd.ts` builders for VideoObject / Dataset / FAQPage / BreadcrumbList / CollectionPage.
- Update `src/lib/storage.ts` `publishProject` to trigger SEO generation (fire-and-forget; the publish call returns immediately).
- Add `react-helmet-async` and wire `HelmetProvider` in `src/main.tsx`.
- Backfill script `scripts/backfill-seo.ts` callable once via `bunx tsx`.

**Routing**

```text
/community                       → existing browse
/community/:categoryOrSlug       → category page if matches taxonomy, else article
/u/:username                     → existing, gains ItemList JSON-LD
```

## Out of scope (call out, don't build)

- True SSR / static prerender of community pages (real per-page social previews).
- Comments, likes UI, follow system.
- Video embed iframe for third-party sites.
- Multi-language SEO.

## Suggested rollout

1. Migration + edge function + backfill (no UI change yet).
2. Rebuild `/community/:slug` as the article page with helmet + JSON-LD + dataset table + AI sections.
3. Category pages + sitemap update + internal linking polish.

Reply with answers to the four scope questions (or "go with defaults") and I'll start with step 1.
