-- One-time cleanup for data that went stale BEFORE the propagation RPCs
-- (admin_propagate_category_rename/_removed) existed — mentor.category values
-- and learner interests left over from a since-renamed/deleted/deactivated
-- category, confirmed live via a direct query showing values like
-- "Technology", "Software Development", "Finance & Investing" (pre-taxonomy-
-- consolidation names) and even comma-joined multi-value garbage like
-- "Technology, Software Development, AI & Machine Learning" sitting in
-- mentor_profiles.category. Matches the exact same case-insensitive rule
-- already used everywhere else (settings/profile/edit page, the interests
-- popup bar): valid only if it matches a currently ACTIVE mentor_categories
-- row; anything else is stale.

UPDATE mentor_profiles
SET category = 'Other'
WHERE category IS NOT NULL
  AND category <> ''
  AND NOT EXISTS (
    SELECT 1 FROM mentor_categories mc
    WHERE mc.is_active = true AND lower(mc.name) = lower(mentor_profiles.category)
  );

UPDATE learner_profiles
SET interests = COALESCE((
  SELECT array_agg(elem) FROM unnest(interests) AS elem
  WHERE EXISTS (
    SELECT 1 FROM mentor_categories mc
    WHERE mc.is_active = true AND lower(mc.name) = lower(elem)
  )
), '{}'::text[])
WHERE interests IS NOT NULL AND array_length(interests, 1) > 0;
