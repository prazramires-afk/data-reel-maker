
-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  website_url text,
  twitter_url text,
  youtube_url text,
  tiktok_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,24}$')
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Username generator: short id from email prefix + random suffix, lowercased.
CREATE OR REPLACE FUNCTION public.generate_username(_email text)
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
  base := regexp_replace(lower(split_part(coalesce(_email, ''), '@', 1)), '[^a-z0-9_]', '', 'g');
  IF length(base) < 3 THEN base := 'user'; END IF;
  IF length(base) > 18 THEN base := substring(base, 1, 18); END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    i := i + 1;
    candidate := substring(base, 1, 18) || '_' || lpad(((random()*9999)::int)::text, 4, '0');
    IF i > 20 THEN
      candidate := 'user_' || substring(gen_random_uuid()::text, 1, 8);
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    public.generate_username(NEW.email),
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, username, display_name)
SELECT u.id,
       public.generate_username(u.email),
       coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ============= PROJECTS extensions =============
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_remix boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_download boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_embed boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS projects_user_updated_idx ON public.projects (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS projects_public_published_idx ON public.projects (is_public, published_at DESC) WHERE is_public = true;

-- ============= PROJECT EVENTS =============
CREATE TABLE public.project_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('view','like','share','download')),
  referrer text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_events_project_idx ON public.project_events (project_id, created_at DESC);
CREATE INDEX project_events_owner_idx ON public.project_events (owner_id, created_at DESC);

GRANT INSERT ON public.project_events TO anon, authenticated;
GRANT SELECT ON public.project_events TO authenticated;
GRANT ALL ON public.project_events TO service_role;

ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can record an event for a public project, or owner for own project
CREATE POLICY "Insert events for public or own projects"
  ON public.project_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (p.is_public = true OR p.user_id = auth.uid())
        AND p.user_id = owner_id
    )
  );

CREATE POLICY "Owners can read own events"
  ON public.project_events FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin());

-- Atomic counter bump callable from client
CREATE OR REPLACE FUNCTION public.record_project_event(
  _project_id uuid,
  _event_type text,
  _referrer text DEFAULT NULL,
  _visitor_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj record;
BEGIN
  IF _event_type NOT IN ('view','like','share','download') THEN
    RAISE EXCEPTION 'invalid event type';
  END IF;
  SELECT id, user_id, is_public INTO proj FROM public.projects WHERE id = _project_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF NOT proj.is_public AND proj.user_id IS DISTINCT FROM auth.uid() THEN RETURN; END IF;

  INSERT INTO public.project_events (project_id, owner_id, event_type, referrer, visitor_id)
  VALUES (_project_id, proj.user_id, _event_type, _referrer, _visitor_id);

  IF _event_type = 'view' THEN
    UPDATE public.projects SET view_count = view_count + 1 WHERE id = _project_id;
  ELSIF _event_type = 'like' THEN
    UPDATE public.projects SET like_count = like_count + 1 WHERE id = _project_id;
  ELSIF _event_type = 'share' THEN
    UPDATE public.projects SET share_count = share_count + 1 WHERE id = _project_id;
  ELSIF _event_type = 'download' THEN
    UPDATE public.projects SET download_count = download_count + 1 WHERE id = _project_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_project_event(uuid, text, text, text) TO anon, authenticated;

-- Profile-by-username helper (public) — returns profile + aggregated stats
CREATE OR REPLACE FUNCTION public.get_profile_by_username(_username text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  website_url text,
  twitter_url text,
  youtube_url text,
  tiktok_url text,
  created_at timestamptz,
  total_videos bigint,
  total_views bigint,
  total_likes bigint,
  total_shares bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url,
         p.website_url, p.twitter_url, p.youtube_url, p.tiktok_url,
         p.created_at,
         COALESCE((SELECT count(*) FROM public.projects pr WHERE pr.user_id = p.id AND pr.is_public = true), 0) AS total_videos,
         COALESCE((SELECT sum(view_count) FROM public.projects pr WHERE pr.user_id = p.id AND pr.is_public = true), 0) AS total_views,
         COALESCE((SELECT sum(like_count) FROM public.projects pr WHERE pr.user_id = p.id AND pr.is_public = true), 0) AS total_likes,
         COALESCE((SELECT sum(share_count) FROM public.projects pr WHERE pr.user_id = p.id AND pr.is_public = true), 0) AS total_shares
  FROM public.profiles p
  WHERE p.username = lower(_username)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_by_username(text) TO anon, authenticated;
