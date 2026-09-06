-- Admin category changes (rename, delete, deactivate) previously only
-- affected the live category pool shown in pickers — a learner's/mentor's
-- already-saved selection (learner_profiles.interests, mentor_profiles.category)
-- is just a plain string/array with no foreign key, so it silently went stale
-- and was never updated. These two RPCs propagate admin category changes into
-- already-saved data. Called from adminApi.ts right after the corresponding
-- mentor_categories mutation succeeds. SECURITY DEFINER + is_admin() check
-- since they touch every learner's/mentor's row, not just the caller's own.

CREATE OR REPLACE FUNCTION public.admin_propagate_category_rename(p_old_name text, p_new_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE learner_profiles
  SET interests = (
    SELECT array_agg(CASE WHEN lower(elem) = lower(p_old_name) THEN p_new_name ELSE elem END)
    FROM unnest(interests) AS elem
  )
  WHERE EXISTS (SELECT 1 FROM unnest(interests) AS elem WHERE lower(elem) = lower(p_old_name));

  UPDATE mentor_profiles
  SET category = p_new_name
  WHERE lower(category) = lower(p_old_name);

  RETURN json_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_propagate_category_removed(p_category_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE learner_profiles
  SET interests = COALESCE((
    SELECT array_agg(elem) FROM unnest(interests) AS elem
    WHERE lower(elem) <> lower(p_category_name)
  ), '{}'::text[])
  WHERE EXISTS (SELECT 1 FROM unnest(interests) AS elem WHERE lower(elem) = lower(p_category_name));

  UPDATE mentor_profiles
  SET category = 'Other'
  WHERE lower(category) = lower(p_category_name);

  RETURN json_build_object('success', true);
END;
$function$;
