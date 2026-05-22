
-- user_credits: one row per user, tracks tokens + premium
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL DEFAULT 10,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_until TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  last_reset DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create credit row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, tokens, last_reset)
  VALUES (NEW.id, 10, (now() AT TIME ZONE 'utc')::date)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Reset + consume function: refills if new UTC day, then deducts cost
CREATE OR REPLACE FUNCTION public.consume_tokens(cost INTEGER)
RETURNS TABLE(success BOOLEAN, tokens_remaining INTEGER, is_premium BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  rec public.user_credits%ROWTYPE;
  today DATE := (now() AT TIME ZONE 'utc')::date;
  daily_cap INTEGER;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, 0, false;
    RETURN;
  END IF;

  SELECT * INTO rec FROM public.user_credits WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, tokens, last_reset)
    VALUES (uid, 10, today)
    RETURNING * INTO rec;
  END IF;

  -- Expire premium if past end date
  IF rec.is_premium AND rec.premium_until IS NOT NULL AND rec.premium_until < now() THEN
    rec.is_premium := false;
    UPDATE public.user_credits SET is_premium = false WHERE user_id = uid;
  END IF;

  daily_cap := CASE WHEN rec.is_premium THEN 50 ELSE 10 END;

  -- Daily reset (no rollover)
  IF rec.last_reset < today THEN
    rec.tokens := daily_cap;
    rec.last_reset := today;
    UPDATE public.user_credits SET tokens = daily_cap, last_reset = today, updated_at = now()
      WHERE user_id = uid;
  END IF;

  IF rec.tokens < cost THEN
    RETURN QUERY SELECT false, rec.tokens, rec.is_premium;
    RETURN;
  END IF;

  UPDATE public.user_credits
    SET tokens = rec.tokens - cost, updated_at = now()
    WHERE user_id = uid
    RETURNING tokens INTO rec.tokens;

  RETURN QUERY SELECT true, rec.tokens, rec.is_premium;
END;
$$;
