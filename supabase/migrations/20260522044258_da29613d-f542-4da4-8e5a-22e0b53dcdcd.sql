
REVOKE EXECUTE ON FUNCTION public.consume_tokens(INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_tokens(INTEGER) TO authenticated;
