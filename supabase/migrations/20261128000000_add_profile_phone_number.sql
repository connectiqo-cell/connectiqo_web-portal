-- Adds a shared phone_number field for every account type (learner, creator,
-- brand), and folds it into creator_profile_completeness() as an 11th
-- factor. Rescaled to percentage-of-factor-count (100 * matched / total)
-- instead of the old "10 points each" so it still maxes out at 100 with one
-- more factor added.

alter table public.profiles
  add column phone text;

create or replace function public.creator_profile_completeness(m mentor_profiles)
 returns smallint
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select round(100.0 * (
      coalesce((select nullif(btrim(p.avatar_url), '') is not null from public.profiles p where p.id = m.id), false)::int
    + coalesce((select nullif(btrim(p.phone), '') is not null from public.profiles p where p.id = m.id), false)::int
    + (nullif(btrim(m.specialization), '') is not null)::int
    + (nullif(btrim(m.bio), '') is not null)::int
    + (nullif(btrim(m.category), '') is not null)::int
    + (coalesce(m.experience_years, 0) > 0)::int
    + (coalesce(m.price_per_hour, 0) > 0)::int
    + (coalesce(cardinality(m.skills), 0) > 0)::int
    + (nullif(btrim(m.location), '') is not null)::int
    + (nullif(btrim(m.cover_image_url), '') is not null)::int
    + (coalesce(
        nullif(btrim(m.linkedin_url), ''),
        nullif(btrim(m.instagram_url), ''),
        nullif(btrim(m.youtube_url), ''),
        nullif(btrim(m.x_url), ''),
        nullif(btrim(m.twitter_url), ''),
        nullif(btrim(m.website), '')
      ) is not null)::int
  ) / 11.0)::smallint;
$function$;

-- Was only watching avatar_url; now also needs to react to phone changes,
-- since phone now counts toward the mentor's completeness score too.
drop trigger profiles_refresh_creator_completeness on public.profiles;

create trigger profiles_refresh_creator_completeness
  after update of avatar_url, phone on public.profiles
  for each row
  when (old.avatar_url is distinct from new.avatar_url or old.phone is distinct from new.phone)
  execute function public.refresh_creator_completeness_from_profile();

-- One-off: recompute every existing mentor's score now that phone is a
-- factor — otherwise scores stay stale until each mentor's next unrelated edit.
update public.mentor_profiles m
set profile_completeness = public.creator_profile_completeness(m);

-- profiles has two blanket "using (true)" SELECT policies
-- (authenticated_read_all_profiles, profiles_select_public) that let any
-- user read every column of every other user's row — fine for name/avatar,
-- but phone is real PII and would otherwise leak through those same
-- policies the moment this column exists. RLS can't restrict a subset of
-- columns on its own, so this revokes column-level SELECT on phone itself
-- (same pattern already used for mentor_videos.video_url) and exposes it
-- only through a function that checks the caller owns the row.
revoke select (phone) on public.profiles from anon, authenticated;

create or replace function public.get_my_phone()
returns text
language sql
stable security definer
set search_path to 'public'
as $function$
  select phone from public.profiles where id = auth.uid();
$function$;

grant execute on function public.get_my_phone() to authenticated;
