-- mentor_videos accumulated two generations of RLS policies: the original
-- "videos_*" set, and a later, more complete "mentor_videos_*" set (adds
-- admin overrides + mentor-freeze awareness) that was meant to replace it
-- but never had the old policies dropped. Since permissive policies for the
-- same command are OR'd together, videos_select_all (qual: true) silently
-- made mentor_videos_select_visible's freeze check a no-op — a frozen
-- mentor's videos were fully visible to everyone regardless. Also meant
-- every query against this table evaluated up to 11 policies instead of 7.

DROP POLICY IF EXISTS videos_select_all ON mentor_videos;
DROP POLICY IF EXISTS videos_insert_own ON mentor_videos;
DROP POLICY IF EXISTS videos_update_own ON mentor_videos;
DROP POLICY IF EXISTS videos_delete_own ON mentor_videos;
