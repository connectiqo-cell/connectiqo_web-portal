-- Brands need to see an applicant's portfolio/social/follower data to
-- actually evaluate them — that's the entire point of creator_profiles
-- existing. It was originally locked to owner-only read (mirroring
-- learner_profiles), but unlike learner_profiles this data is meant to be
-- shown to brands reviewing applications, same as mentor_profiles' public
-- read policy. None of these columns are sensitive (no banking/contact
-- info), so a broad public SELECT is the right scope here.
--
-- The old owner-only policy (creator_profiles_select_own) is left in place
-- rather than dropped — both are permissive SELECT policies, so the old
-- one is just redundant now, not a security gap (unlike a permissive
-- policy that bypasses an intended *restriction*, e.g. the mentor_videos
-- bug found earlier this session). Harmless to leave; safe to clean up
-- later in a DROP-capable context.
create policy creator_profiles_select_public
  on public.creator_profiles for select
  using (true);
