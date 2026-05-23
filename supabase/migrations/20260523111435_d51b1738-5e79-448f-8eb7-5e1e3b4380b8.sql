
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled',
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  label_images JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

CREATE INDEX projects_user_id_idx ON public.projects(user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Admin policies on user_credits
CREATE POLICY "Admins view all credits" ON public.user_credits FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update all credits" ON public.user_credits FOR UPDATE USING (public.is_admin());

-- Admin listing view for users (email + created_at from auth.users, restricted)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  tokens INTEGER,
  is_premium BOOLEAN,
  premium_until TIMESTAMPTZ,
  project_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email::text, u.created_at,
         COALESCE(c.tokens, 0), COALESCE(c.is_premium, false), c.premium_until,
         COALESCE((SELECT count(*) FROM public.projects p WHERE p.user_id = u.id), 0)
  FROM auth.users u
  LEFT JOIN public.user_credits c ON c.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_premium(target_user UUID, premium BOOLEAN, months INTEGER DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.user_credits (user_id, tokens, is_premium, premium_until, last_reset)
  VALUES (target_user, CASE WHEN premium THEN 50 ELSE 10 END, premium,
          CASE WHEN premium THEN now() + (months || ' months')::interval ELSE NULL END,
          (now() AT TIME ZONE 'utc')::date)
  ON CONFLICT (user_id) DO UPDATE
    SET is_premium = premium,
        premium_until = CASE WHEN premium THEN now() + (months || ' months')::interval ELSE NULL END,
        tokens = GREATEST(public.user_credits.tokens, CASE WHEN premium THEN 50 ELSE 10 END),
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_tokens(target_user UUID, new_tokens INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.user_credits SET tokens = new_tokens, updated_at = now() WHERE user_id = target_user;
END;
$$;

-- Grant admin role to prazramires@gmail.com if present
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'prazramires@gmail.com'
ON CONFLICT DO NOTHING;

-- Auto-grant admin role on signup for this email
CREATE OR REPLACE FUNCTION public.handle_admin_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'prazramires@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_admin ON auth.users;
CREATE TRIGGER on_auth_user_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_email();
