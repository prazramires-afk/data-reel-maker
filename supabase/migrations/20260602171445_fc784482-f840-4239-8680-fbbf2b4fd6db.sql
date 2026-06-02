
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS author_name text;

CREATE INDEX IF NOT EXISTS idx_projects_public_published
  ON public.projects (is_public, published_at DESC);

-- Allow everyone (including anonymous visitors) to view projects that the owner explicitly published.
GRANT SELECT ON public.projects TO anon;

CREATE POLICY "Anyone can view published projects"
ON public.projects
FOR SELECT
USING (is_public = true);
