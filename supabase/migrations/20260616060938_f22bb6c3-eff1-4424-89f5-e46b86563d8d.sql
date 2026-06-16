
-- ============================================================
-- 1. Project columns: tags, remix_of, hidden, remix_count
-- ============================================================
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS remix_of uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS remix_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS projects_tags_gin_idx ON public.projects USING gin (tags);
CREATE INDEX IF NOT EXISTS projects_remix_of_idx ON public.projects (remix_of) WHERE remix_of IS NOT NULL;

-- Replace the public-select policy to also exclude hidden videos.
DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
CREATE POLICY "Anyone can view published projects"
  ON public.projects FOR SELECT
  USING (is_public = true AND hidden = false);

-- ============================================================
-- 2. Tag derivation (no AI; pure slug/keyword extraction)
-- ============================================================
CREATE OR REPLACE FUNCTION public.slugify_token(_s text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_s, '')), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.derive_project_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  title text;
  raw text[];
  cleaned text[];
  stop text[] := ARRAY['the','and','for','from','with','into','over','this','that','than','then','top','vs','of','in','on','to','a','an','by','is','are','be','it','as','at','or'];
  tok text;
  out_tags text[] := ARRAY[]::text[];
  STOP_LIMIT int := 12;
BEGIN
  -- Only auto-derive when user hasn't set tags explicitly.
  IF NEW.tags IS NOT NULL AND array_length(NEW.tags, 1) > 0 THEN
    RETURN NEW;
  END IF;
  title := coalesce(NEW.settings->>'title', NEW.name, '');
  -- collect labels
  raw := ARRAY(
    SELECT DISTINCT public.slugify_token(elem->>'label')
    FROM jsonb_array_elements(coalesce(NEW.data, '[]'::jsonb)) elem
    WHERE elem ? 'label'
  );
  -- collect title tokens
  FOR tok IN SELECT regexp_split_to_table(lower(title), '[^a-z0-9]+') LOOP
    IF length(tok) >= 3 AND NOT (tok = ANY(stop)) THEN
      raw := raw || public.slugify_token(tok);
    END IF;
  END LOOP;
  -- dedupe + filter
  cleaned := ARRAY(
    SELECT DISTINCT t FROM unnest(raw) t WHERE t <> '' AND length(t) >= 2
  );
  -- cap length
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

DROP TRIGGER IF EXISTS projects_derive_tags ON public.projects;
CREATE TRIGGER projects_derive_tags
  BEFORE INSERT OR UPDATE OF settings, data, name ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.derive_project_tags();

-- Backfill tags for existing rows with empty tags
UPDATE public.projects
SET name = name
WHERE coalesce(array_length(tags, 1), 0) = 0;

-- ============================================================
-- 3. project_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_likes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

GRANT SELECT, INSERT, DELETE ON public.project_likes TO authenticated;
GRANT ALL ON public.project_likes TO service_role;

ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own likes"
  ON public.project_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own likes"
  ON public.project_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS project_likes_project_idx ON public.project_likes(project_id);

CREATE OR REPLACE FUNCTION public.toggle_project_like(_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existed boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  DELETE FROM public.project_likes WHERE user_id = uid AND project_id = _project_id;
  GET DIAGNOSTICS existed = ROW_COUNT;
  IF existed THEN
    UPDATE public.projects SET like_count = GREATEST(0, like_count - 1) WHERE id = _project_id;
    RETURN false;
  ELSE
    INSERT INTO public.project_likes (user_id, project_id) VALUES (uid, _project_id);
    UPDATE public.projects SET like_count = like_count + 1 WHERE id = _project_id;
    RETURN true;
  END IF;
END;
$$;

-- ============================================================
-- 4. Remix
-- ============================================================
CREATE OR REPLACE FUNCTION public.remix_project(_source_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  src public.projects%ROWTYPE;
  new_id uuid := gen_random_uuid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO src FROM public.projects WHERE id = _source_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'source not found'; END IF;
  IF NOT src.is_public OR src.hidden THEN RAISE EXCEPTION 'source not available'; END IF;
  IF NOT coalesce(src.allow_remix, true) THEN RAISE EXCEPTION 'remix not allowed'; END IF;

  INSERT INTO public.projects (
    id, user_id, name, type, data, settings, label_images,
    remix_of, is_public, hidden, tags
  ) VALUES (
    new_id, uid,
    'Remix of ' || coalesce(src.settings->>'title', src.name, 'Untitled'),
    src.type, src.data,
    jsonb_set(src.settings, '{title}', to_jsonb('Remix of ' || coalesce(src.settings->>'title', src.name, 'Untitled'))),
    src.label_images,
    src.id, false, false, src.tags
  );
  UPDATE public.projects SET remix_count = remix_count + 1 WHERE id = src.id;
  RETURN new_id;
END;
$$;

-- ============================================================
-- 5. Collections
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  cover_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;
GRANT ALL ON public.collections TO service_role;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public collections"
  ON public.collections FOR SELECT
  USING (is_public = true);
CREATE POLICY "Users view own collections"
  ON public.collections FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, project_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT SELECT ON public.collection_items TO anon;
GRANT ALL ON public.collection_items TO service_role;

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items in public collections"
  ON public.collection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public OR c.user_id = auth.uid())));

CREATE POLICY "Owners manage collection items"
  ON public.collection_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

-- ============================================================
-- 6. Search + Trending
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_community(
  _q text DEFAULT NULL,
  _tag text DEFAULT NULL,
  _category text DEFAULT NULL,
  _sort text DEFAULT 'latest',
  _window text DEFAULT 'all',
  _limit int DEFAULT 24,
  _offset int DEFAULT 0
)
RETURNS SETOF public.projects
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since timestamptz;
BEGIN
  since := CASE _window
    WHEN '24h' THEN now() - interval '24 hours'
    WHEN '7d'  THEN now() - interval '7 days'
    WHEN '30d' THEN now() - interval '30 days'
    ELSE NULL
  END;
  RETURN QUERY
  SELECT p.*
  FROM public.projects p
  WHERE p.is_public = true AND p.hidden = false
    AND (since IS NULL OR p.published_at >= since)
    AND (_category IS NULL OR _category = '' OR p.category = _category)
    AND (_tag IS NULL OR _tag = '' OR _tag = ANY(p.tags))
    AND (
      _q IS NULL OR _q = '' OR
      p.name ILIKE '%'||_q||'%' OR
      coalesce(p.settings->>'title','') ILIKE '%'||_q||'%' OR
      coalesce(p.author_name,'') ILIKE '%'||_q||'%' OR
      EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE '%'||_q||'%')
    )
  ORDER BY
    CASE WHEN _sort = 'latest'   THEN extract(epoch from p.published_at) END DESC NULLS LAST,
    CASE WHEN _sort = 'views'    THEN p.view_count    END DESC NULLS LAST,
    CASE WHEN _sort = 'likes'    THEN p.like_count    END DESC NULLS LAST,
    CASE WHEN _sort = 'remixed'  THEN p.remix_count   END DESC NULLS LAST,
    CASE WHEN _sort = 'downloads' THEN p.download_count END DESC NULLS LAST,
    CASE WHEN _sort = 'trending' THEN
      (p.view_count + 3*p.like_count + 5*p.remix_count + 2*p.download_count)::float
      / power(GREATEST(EXTRACT(EPOCH FROM (now() - p.published_at))/3600, 1) + 2, 1.5)
    END DESC NULLS LAST,
    p.published_at DESC
  LIMIT _limit OFFSET _offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_trending(_window text DEFAULT '7d', _limit int DEFAULT 12)
RETURNS SETOF public.projects
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.search_community(NULL, NULL, NULL, 'trending', _window, _limit, 0);
$$;

-- ============================================================
-- 7. Collections helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_user_collections(_username text)
RETURNS TABLE (
  id uuid, slug text, name text, description text, is_public boolean,
  cover_project_id uuid, item_count bigint, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.slug, c.name, c.description, c.is_public, c.cover_project_id,
         (SELECT count(*) FROM public.collection_items ci WHERE ci.collection_id = c.id) AS item_count,
         c.updated_at
  FROM public.collections c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE p.username = lower(_username) AND c.is_public = true
  ORDER BY c.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_collection_by_slug(_username text, _slug text)
RETURNS TABLE (
  id uuid, user_id uuid, slug text, name text, description text,
  is_public boolean, cover_project_id uuid, created_at timestamptz, updated_at timestamptz,
  owner_username text, owner_display_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.user_id, c.slug, c.name, c.description, c.is_public,
         c.cover_project_id, c.created_at, c.updated_at,
         p.username, p.display_name
  FROM public.collections c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE p.username = lower(_username) AND c.slug = _slug AND c.is_public = true
  LIMIT 1;
$$;
