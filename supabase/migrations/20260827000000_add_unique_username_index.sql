-- profiles.username now doubles as the public mentor profile slug
-- (/mentor/:username), so two accounts sharing one would make that link
-- ambiguous. The edit-profile form and profileApi.isUsernameAvailable()
-- already check for a case-insensitive collision before saving, but that
-- check-then-write is racy without a DB constraint backing it — this index
-- is the source of truth that actually prevents the collision.
--
-- Case-insensitive (lower(username)) so "NishadNikam" and "nishadnikam"
-- can't both be taken. Partial (WHERE username IS NOT NULL AND username <> '')
-- because username is optional and most existing rows are blank — a
-- non-partial unique index would fail to create the moment more than one
-- row has an empty string.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND username <> '';

-- profiles' RLS policy doesn't allow reading another user's row directly
-- (confirmed: a bare `select id from profiles` 403s for the anon key, and
-- there's no evidence the authenticated role is any more permissive) — so
-- the edit-profile form's availability check can't do that read itself.
-- SECURITY DEFINER bypasses RLS *inside* the function only; the function
-- itself is still access-controlled via the GRANT below, and it only ever
-- returns a boolean, never another user's id/other columns.
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE lower(username) = lower(p_username)
      AND id != p_user_id
  );
$function$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text, uuid) TO authenticated;
