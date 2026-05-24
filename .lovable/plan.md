# Plan: SEO-Optimized Creator Platform Transformation

Transform "Data to Video" into a content-rich, SEO-optimized creator platform while preserving the existing app flow (Home buttons, Create, Projects, Templates, Admin, Auth).

## Scope strategy

The request is huge. To ship something coherent in one pass (rather than 30 half-done pages), I'll prioritize **high-SEO-value foundations** and **scaffold** the rest with real but lighter content. Everything will be wired up, indexable, and internally linked.

## 1. Landing page (Home.tsx) — expand, don't replace

Keep the existing hero buttons (Create / Projects / Templates / Admin / Upgrade) intact at the top. Add SEO content sections **below**:

- **Hero polish**: H1 "Create Viral Data Videos Online", subtitle, primary CTA "Start Creating Free" → /create, secondary "Watch Demo" → /templates
- **Features grid** (6 cards): Bar Chart Race, TikTok/Reels Export, Data Storytelling, Sports Stats, Economic Visualization, Educational Timelines
- **Use cases grid** (7 blocks with placeholder thumbnails + CTAs)
- **How it works** (3 steps)
- **Testimonials** (3 placeholder cards, clearly styled as social proof)
- **FAQ accordion** (6 Q&As, with FAQPage JSON-LD)
- **Footer** with internal links to all key pages

Uses semantic `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`.

## 2. Programmatic SEO template pages

New route `/templates/:slug` rendered by a single `TemplateLanding.tsx` page. Content driven by a `templateContent.ts` map keyed by slug:

- bar-chart-race
- gdp-race
- football-stats
- population-growth
- top-10
- economic-growth

Each entry: unique H1, SEO title/description, 2–3 keyword paragraphs, feature list, FAQ (with FAQ JSON-LD), live preview hooked to existing canvas engine via the matching template from `TEMPLATES`, CTA → `/create?template=<id>`.

The existing `/templates` listing page gets updated cards that link to these landing pages (instead of jumping straight to `/create`), with a small "Use template" shortcut preserved.

## 3. Blog / Learn hub

- `/blog` — listing page with 5 article cards
- `/blog/:slug` — article page from a `blogPosts.ts` data file

Articles (semantic, ~600–900 words each — real readable content, not lorem):
- how-to-make-viral-bar-chart-race-videos
- best-tiktok-data-visualization-ideas
- how-football-channels-use-statistics-videos
- why-bar-chart-races-go-viral
- best-data-formats-for-animated-videos

Each has Article JSON-LD, internal links to templates, related posts.

## 4. Trust pages

Lightweight but real:
- `/about`
- `/contact` (mailto + simple form, no backend)
- `/privacy`
- `/terms`

## 5. Public share pages (viral)

- Route `/watch/:slug` — minimal "share" landing showing a project preview placeholder, "Made with Data to Video" branding, social share buttons (Web Share API + copy link), CTA "Create your own". Schema: VideoObject JSON-LD.
- Wired as a route now; full data binding can come later. For seeded demo slugs (`gdp-race-usa-vs-china`, etc.) we'll render hard-coded preview metadata so the page is real and shareable.

## 6. Reusable SEO infrastructure

- `Seo.tsx` already exists — extend to accept optional `jsonLd` and `ogImage` props.
- Add `<Footer />` component used across all public pages.
- Add `<SiteHeader />` lightweight nav for non-Home pages (Home keeps current look).
- All new pages call `<Seo>` with full keyword-rich metadata.

## 7. Sitemap + robots

Update `public/sitemap.xml` to include every new URL: home, create, templates, /templates/{6 slugs}, /blog, /blog/{5 slugs}, /about, /contact, /privacy, /terms, /watch/{demo slugs}. Robots stays as-is (already correct).

## 8. Routing changes (App.tsx)

Add routes:
- `/templates/:slug` → TemplateLanding
- `/blog` → Blog
- `/blog/:slug` → BlogPost
- `/about`, `/contact`, `/privacy`, `/terms`
- `/watch/:slug` → Watch

## Technical notes

- Use existing design tokens (`bg-card`, `text-foreground`, etc.) — no new colors.
- Use existing `accordion` shadcn component for FAQs.
- Lazy-load route components via `React.lazy` to keep initial bundle lean.
- JSON-LD injected via `<Helmet>` with `<script type="application/ld+json">`.
- All images are CSS gradients / icons (no external assets needed) to keep this shippable in one pass.
- Keep `Home.tsx` button section unchanged at top; SEO content appended below in new semantic sections.

## What's intentionally deferred

- Real article content beyond the 5 seeded posts (programmatic blog generation).
- Persisting public share pages from actual user projects (currently demo slugs only).
- Real testimonials (placeholders only, clearly generic).

## Files to create

- `src/components/Footer.tsx`
- `src/components/SiteHeader.tsx`
- `src/components/FaqSection.tsx`
- `src/pages/TemplateLanding.tsx`
- `src/pages/Blog.tsx`
- `src/pages/BlogPost.tsx`
- `src/pages/About.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Watch.tsx`
- `src/lib/seoContent/templateLandings.ts`
- `src/lib/seoContent/blogPosts.ts`
- `src/lib/seoContent/faqs.ts`

## Files to edit

- `src/App.tsx` (add routes)
- `src/pages/Home.tsx` (append SEO sections + footer)
- `src/pages/Templates.tsx` (link to landings)
- `src/components/Seo.tsx` (jsonLd support)
- `public/sitemap.xml` (full URL set)
- `index.html` (improve sitewide JSON-LD)
