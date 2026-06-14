ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON public.projects (slug) WHERE slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_project_slug(_title text, _id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  base := lower(coalesce(_title, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  IF length(base) < 1 THEN base := 'video'; END IF;
  IF length(base) > 60 THEN base := substring(base, 1, 60); END IF;
  base := regexp_replace(base, '-+$', '', 'g');
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.projects WHERE slug = candidate AND id <> _id) LOOP
    i := i + 1;
    candidate := base || '-' || lpad(((random()*9999)::int)::text, 4, '0');
    IF i > 20 THEN
      candidate := base || '-' || substring(_id::text, 1, 6);
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill slugs for existing public projects
UPDATE public.projects p
SET slug = public.generate_project_slug(
  coalesce(NULLIF(p.settings->>'title',''), NULLIF(p.name,''), 'video'),
  p.id
)
WHERE p.is_public = true AND (p.slug IS NULL OR p.slug = '');