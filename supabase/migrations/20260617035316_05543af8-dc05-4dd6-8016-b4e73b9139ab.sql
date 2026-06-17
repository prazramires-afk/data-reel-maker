
-- ============================================================
-- Datasets, dataset collections, project linkage
-- ============================================================

CREATE TABLE IF NOT EXISTS public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_name text,
  source_url text,
  unit text,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean NOT NULL DEFAULT true,
  hidden boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  use_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT datasets_category_check CHECK (category IN ('economy','finance','population','sports','technology','history','business','other'))
);

GRANT SELECT ON public.datasets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datasets public read"
  ON public.datasets FOR SELECT
  USING (is_public = true AND hidden = false);

CREATE POLICY "datasets owner read"
  ON public.datasets FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "datasets owner insert"
  ON public.datasets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "datasets owner update"
  ON public.datasets FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "datasets owner delete"
  ON public.datasets FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS datasets_tags_gin ON public.datasets USING GIN (tags);
CREATE INDEX IF NOT EXISTS datasets_category_idx ON public.datasets (category);
CREATE INDEX IF NOT EXISTS datasets_published_at_idx ON public.datasets (published_at DESC);

-- updated_at trigger
CREATE TRIGGER datasets_touch_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-derive tags from title + labels when user leaves tags empty
CREATE OR REPLACE FUNCTION public.derive_dataset_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  raw text[];
  cleaned text[];
  stop text[] := ARRAY['the','and','for','from','with','into','over','this','that','than','then','top','vs','of','in','on','to','a','an','by','is','are','be','it','as','at','or'];
  tok text;
  out_tags text[] := ARRAY[]::text[];
  STOP_LIMIT int := 12;
BEGIN
  IF NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 0 THEN
    RETURN NEW;
  END IF;
  raw := ARRAY(
    SELECT DISTINCT public.slugify_token(elem->>'label')
    FROM jsonb_array_elements(coalesce(NEW.data, '[]'::jsonb)) elem
    WHERE elem ? 'label'
  );
  FOR tok IN SELECT regexp_split_to_table(lower(coalesce(NEW.title, '')), '[^a-z0-9]+') LOOP
    IF length(tok) >= 3 AND NOT (tok = ANY(stop)) THEN
      raw := raw || public.slugify_token(tok);
    END IF;
  END LOOP;
  cleaned := ARRAY(SELECT DISTINCT t FROM unnest(raw) t WHERE t <> '' AND length(t) >= 2);
  IF array_length(cleaned, 1) IS NULL THEN
    out_tags := ARRAY[]::text[];
  ELSIF array_length(cleaned, 1) <= STOP_LIMIT THEN
    out_tags := cleaned;
  ELSE
    out_tags := cleaned[1:STOP_LIMIT];
  END IF;
  NEW.tags := out_tags;
  RETURN NEW;
END;
$$;

CREATE TRIGGER datasets_derive_tags
  BEFORE INSERT OR UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.derive_dataset_tags();

-- Slug generator (reuses pattern from generate_project_slug)
CREATE OR REPLACE FUNCTION public.generate_dataset_slug(_title text, _id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  base := lower(coalesce(_title, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  IF length(base) < 1 THEN base := 'dataset'; END IF;
  IF length(base) > 60 THEN base := substring(base, 1, 60); END IF;
  base := regexp_replace(base, '-+$', '', 'g');
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.datasets WHERE slug = candidate AND id <> _id) LOOP
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

-- ============================================================
-- Dataset collections (global, by slug; not nested under user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dataset_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_dataset_id uuid REFERENCES public.datasets(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.dataset_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dataset_collections TO authenticated;
GRANT ALL ON public.dataset_collections TO service_role;

ALTER TABLE public.dataset_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dscoll public read"
  ON public.dataset_collections FOR SELECT
  USING (is_public = true);

CREATE POLICY "dscoll owner all"
  ON public.dataset_collections FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER dataset_collections_touch_updated_at
  BEFORE UPDATE ON public.dataset_collections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.dataset_collection_items (
  collection_id uuid NOT NULL REFERENCES public.dataset_collections(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, dataset_id)
);

GRANT SELECT ON public.dataset_collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dataset_collection_items TO authenticated;
GRANT ALL ON public.dataset_collection_items TO service_role;

ALTER TABLE public.dataset_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dscoll items public read"
  ON public.dataset_collection_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.dataset_collections c
    WHERE c.id = collection_id AND c.is_public = true
  ));

CREATE POLICY "dscoll items owner all"
  ON public.dataset_collection_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dataset_collections c
    WHERE c.id = collection_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.dataset_collections c
    WHERE c.id = collection_id AND c.user_id = auth.uid()
  ));

-- ============================================================
-- Link projects to source datasets
-- ============================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS dataset_id uuid REFERENCES public.datasets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_dataset_id_idx ON public.projects (dataset_id);

-- Bump dataset use_count when a project is linked
CREATE OR REPLACE FUNCTION public.bump_dataset_use_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.dataset_id IS NOT NULL THEN
      UPDATE public.datasets SET use_count = use_count + 1 WHERE id = NEW.dataset_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.dataset_id IS DISTINCT FROM OLD.dataset_id THEN
      IF OLD.dataset_id IS NOT NULL THEN
        UPDATE public.datasets SET use_count = GREATEST(0, use_count - 1) WHERE id = OLD.dataset_id;
      END IF;
      IF NEW.dataset_id IS NOT NULL THEN
        UPDATE public.datasets SET use_count = use_count + 1 WHERE id = NEW.dataset_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.dataset_id IS NOT NULL THEN
      UPDATE public.datasets SET use_count = GREATEST(0, use_count - 1) WHERE id = OLD.dataset_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER projects_bump_dataset_use_count
  AFTER INSERT OR UPDATE OF dataset_id OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.bump_dataset_use_count();

-- ============================================================
-- Search and analytics RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_datasets(
  _q text DEFAULT NULL,
  _tag text DEFAULT NULL,
  _category text DEFAULT NULL,
  _sort text DEFAULT 'latest',
  _limit integer DEFAULT 24,
  _offset integer DEFAULT 0
)
RETURNS SETOF public.datasets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.*
  FROM public.datasets d
  WHERE d.is_public = true AND d.hidden = false
    AND (_category IS NULL OR _category = '' OR d.category = _category)
    AND (_tag IS NULL OR _tag = '' OR _tag = ANY(d.tags))
    AND (
      _q IS NULL OR _q = '' OR
      d.title ILIKE '%'||_q||'%' OR
      coalesce(d.description,'') ILIKE '%'||_q||'%' OR
      coalesce(d.source_name,'') ILIKE '%'||_q||'%' OR
      EXISTS (SELECT 1 FROM unnest(d.tags) t WHERE t ILIKE '%'||_q||'%')
    )
  ORDER BY
    CASE WHEN _sort = 'latest'      THEN extract(epoch from d.published_at) END DESC NULLS LAST,
    CASE WHEN _sort = 'most_used'   THEN d.use_count       END DESC NULLS LAST,
    CASE WHEN _sort = 'most_downloaded' THEN d.download_count END DESC NULLS LAST,
    CASE WHEN _sort = 'most_viewed' THEN d.view_count      END DESC NULLS LAST,
    CASE WHEN _sort = 'trending'    THEN
      (d.view_count + 3*d.use_count + 2*d.download_count)::float
      / power(GREATEST(EXTRACT(EPOCH FROM (now() - d.published_at))/3600, 1) + 2, 1.2)
    END DESC NULLS LAST,
    d.published_at DESC
  LIMIT _limit OFFSET _offset;
$$;

CREATE OR REPLACE FUNCTION public.get_trending_datasets(_limit integer DEFAULT 12)
RETURNS SETOF public.datasets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.search_datasets(NULL, NULL, NULL, 'trending', _limit, 0);
$$;

CREATE OR REPLACE FUNCTION public.record_dataset_event(_dataset_id uuid, _event_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event_type = 'view' THEN
    UPDATE public.datasets SET view_count = view_count + 1 WHERE id = _dataset_id;
  ELSIF _event_type = 'download' THEN
    UPDATE public.datasets SET download_count = download_count + 1 WHERE id = _dataset_id;
  END IF;
END;
$$;

-- Lookup helpers
CREATE OR REPLACE FUNCTION public.get_dataset_by_slug(_slug text)
RETURNS SETOF public.datasets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.datasets WHERE slug = _slug AND is_public = true AND hidden = false LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_dataset_collection_by_slug(_slug text)
RETURNS TABLE(
  id uuid, slug text, name text, description text, cover_dataset_id uuid,
  created_at timestamptz, updated_at timestamptz, item_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.slug, c.name, c.description, c.cover_dataset_id,
         c.created_at, c.updated_at,
         (SELECT count(*) FROM public.dataset_collection_items i WHERE i.collection_id = c.id) AS item_count
  FROM public.dataset_collections c
  WHERE c.slug = _slug AND c.is_public = true
  LIMIT 1;
$$;
