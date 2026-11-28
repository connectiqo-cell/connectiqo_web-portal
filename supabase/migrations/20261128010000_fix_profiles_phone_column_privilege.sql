-- Corrects the previous migration's attempt to protect phone. A column-level
-- REVOKE can't subtract one column from a pre-existing TABLE-WIDE
-- `GRANT SELECT ON profiles TO authenticated/anon` — the table grant still
-- wins, so `phone` was still fully readable afterward (verified: attacl was
-- null, meaning the earlier REVOKE had no effect at all).
--
-- The only way to actually exclude one column is to revoke the table-wide
-- grant entirely and re-grant SELECT on only the safe columns explicitly —
-- same approach already used for mentor_videos.video_url in this project.

revoke select on public.profiles from anon, authenticated;

grant select (id, role, name, email, avatar_url, created_at, is_frozen, fcm_token, username, deleted_at, app_build, app_platform)
  on public.profiles to anon, authenticated;
