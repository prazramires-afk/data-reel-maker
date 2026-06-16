## Goal

Turn Data to Video into a community platform: discovery, search, tags, categories, likes, remixes, downloads, collections, trending — all SEO-friendly, zero AI APIs.

## Scope decisions (please confirm or adjust)

1. **URL strategy** — Keep `/community/:slug` for individual videos (already live, already indexed, slug-based). Add new sibling routes:
   - `/community` — discovery hub (rebuild)
   - `/community/category/:slug` — category pages (move off bare `/community/:slug` to avoid collision with video slugs that happen to match a category name)
   - `/tag/:slug` — tag pages
   - `/collections/:slug` — collection pages
   - `/u/:username` — already exists, extend it
2. **Tags source** — Tags are auto-derived from each video's data labels + title keywords (no AI, pure string processing) on publish. Users can edit them later from the dashboard. Alternative: fully manual tag entry only.
3. **Remix** — Clones the project (data, settings, title prefixed "Remix of …") into the current user's account with an `inspired_by` FK back to the original. Requires sign-in.
4. **Trending score** — `views + 3*likes + 5*remixes + 2*downloads`, decayed by `1 / (hours_since_publish + 2)^1.5`. Computed on read (SQL), no cron.
5. **Collections** — User-owned, can be public or private. Many-to-many with projects.
6. **Moderation** — Hide / unpublish / delete / edit metadata all from the existing dashboard. Public profile only lists `is_public AND NOT hidden`.

## Database migration

New columns on `projects`:
- `tags text[]` (gin-indexed)
- `remix_of uuid REFERENCES projects(id)` (nullable, ON DELETE SET NULL)
- `hidden boolean NOT NULL DEFAULT false`
- `remix_count int NOT NULL DEFAULT 0`
- `description text` (user-editable, also used in OG/Helmet)

New tables (all with GRANTs + RLS):
- `project_likes(user_id, project_id, created_at)` — unique pair; increments/decrements `projects.like_count` via trigger.
- `collections(id, user_id, slug, name, description, is_public, cover_project_id, created_at, updated_at)` — unique `(user_id, slug)`.
- `collection_items(collection_id, project_id, position, created_at)` — unique pair.

New RPCs:
- `toggle_project_like(_project_id uuid) returns boolean` — insert/delete + counter update, returns new liked state.
- `remix_project(_source_id uuid) returns uuid` — copies row to current user, sets `remix_of`, increments source `remix_count`, returns new project id.
- `search_community(_q text, _tag text, _category text, _sort text, _window text, _limit int, _offset int) returns setof projects` — single endpoint powering /community filters/search/tag/category.
- `get_trending(_window text, _limit int) returns setof projects` — score formula above, filters by `published_at` window.
- `get_collection_by_slug(_username text, _slug text) returns table(...)` and `list_user_collections(_username text)`.

Tag derivation:
- `derive_project_tags(_id uuid) returns void` — trigger on insert/update: slugify each `data.label` + significant title tokens, store unique array (max 12).

Storage GRANTs follow the standard public-readable-when-published pattern; likes/collections require `auth.uid()`.

## Frontend

New routes (all lazy-loaded in `src/App.tsx`):
- Rebuild `src/pages/Community.tsx` — search input, sort tabs (Trending/Latest/Most Viewed/Most Liked/Most Remixed), time window chips (24h/7d/30d/All), category nav, infinite-scroll grid.
- `src/pages/CommunityCategory.tsx` — already exists, repath to `/community/category/:slug` and update internal links.
- `src/pages/TagPage.tsx` — `/tag/:slug`, indexable, CollectionPage JSON-LD.
- `src/pages/CollectionPage.tsx` — `/collections/:slug` (resolve by current user OR `?u=username`) — actually use `/u/:username/c/:slug` to keep slugs unique per user and avoid global collisions. Indexable when `is_public`.
- Extend `src/pages/UserProfile.tsx` — add tabs (Latest / Most Viewed / Most Liked) + Collections section.
- Extend `src/pages/CommunityProject.tsx` — Like button, Remix button, Download counter wiring, Tags chips linking to `/tag/:slug`, "Inspired by @username" when `remix_of` is set.

New components:
- `CommunityCard` (replaces older card) — thumbnail, title, creator chip, views/likes/downloads, Watch/Remix/Share.
- `LikeButton`, `RemixButton`, `TagChips`, `SortTabs`, `TimeWindowChips`, `SearchBar`, `CollectionGrid`, `AddToCollectionDialog`.

Dashboard additions (`src/pages/DashboardComingSoon.tsx` slot for videos → real page):
- `DashboardVideos.tsx` — list user's projects with hide/unpublish/delete/edit-metadata (title, description, tags) actions.
- `DashboardCollections.tsx` — CRUD collections, add/remove items, toggle public.

SEO:
- Tag + category + collection pages all get `Seo` with `CollectionPage` + `BreadcrumbList` JSON-LD.
- Watch page already ships `VideoObject` + `Dataset` + `FAQPage` + `BreadcrumbList` — add tags into `keywords`.
- `scripts/generate-sitemap.ts` — extend to enumerate public tags, categories, and public collections.
- `public/robots.txt` already allows everything — confirm.

## Out of scope

- Real-time notifications, comments, follows, DMs.
- AI tag suggestion or AI descriptions (explicitly excluded).
- Server-side rendering — staying with Helmet + JSON-LD (Googlebot executes JS; social crawlers see static index.html fallback).
- Paid/featured boosting.

## Rollout

1. Migration (tables, columns, RPCs, triggers) + GRANTs. Backfill tags for existing public projects.
2. Storage layer (`src/lib/storage.ts`) helpers + types. Rewire CommunityProject + UserProfile to new fields.
3. New Community hub + Tag + Collection + Category pages.
4. Dashboard CRUD (videos + collections).
5. Sitemap extension + final SEO pass.

Shall I proceed with all five steps, or trim anything first?
