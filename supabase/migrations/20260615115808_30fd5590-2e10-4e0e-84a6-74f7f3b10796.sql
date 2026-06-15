ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS insights jsonb,
  ADD COLUMN IF NOT EXISTS faqs jsonb,
  ADD COLUMN IF NOT EXISTS seo_generated_at timestamptz;

CREATE INDEX IF NOT EXISTS projects_category_public_idx
  ON public.projects (category, published_at DESC)
  WHERE is_public = true;