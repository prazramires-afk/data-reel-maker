
CREATE OR REPLACE FUNCTION public.consume_tokens(cost integer)
 RETURNS TABLE(success boolean, tokens_remaining integer, is_premium boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  rec public.user_credits%ROWTYPE;
  today DATE := (now() AT TIME ZONE 'utc')::date;
  daily_cap INTEGER;
  is_unlimited BOOLEAN := false;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, 0, false;
    RETURN;
  END IF;

  is_unlimited := public.has_role(uid, 'admin'::public.app_role);

  SELECT * INTO rec FROM public.user_credits WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, tokens, last_reset)
    VALUES (uid, 10, today)
    RETURNING * INTO rec;
  END IF;

  IF is_unlimited THEN
    UPDATE public.user_credits
      SET tokens = 999999, is_premium = true, last_reset = today, updated_at = now()
      WHERE user_id = uid;
    RETURN QUERY SELECT true, 999999, true;
    RETURN;
  END IF;

  IF rec.is_premium AND rec.premium_until IS NOT NULL AND rec.premium_until < now() THEN
    rec.is_premium := false;
    UPDATE public.user_credits SET is_premium = false WHERE user_id = uid;
  END IF;

  daily_cap := CASE WHEN rec.is_premium THEN 50 ELSE 10 END;

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
$function$;

UPDATE public.user_credits
  SET tokens = 999999, is_premium = true, premium_until = now() + interval '100 years', updated_at = now()
  WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.app_role);
