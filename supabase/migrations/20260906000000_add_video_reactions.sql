-- Thumbs up / thumbs down on mentor_videos (the /videos short-video feed and
-- the profile video library). One reaction per (video, user) — switching
-- from like to dislike (or back) replaces the row rather than adding a
-- second one, so counts stay a true "one vote per person" tally.

CREATE TABLE video_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES mentor_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_id, user_id)
);

CREATE INDEX video_reactions_video_id_idx ON video_reactions(video_id);

ALTER TABLE video_reactions ENABLE ROW LEVEL SECURITY;

-- Counts need to be publicly readable (shown to logged-out feed visitors
-- too), same as videos_select_all on mentor_videos.
CREATE POLICY video_reactions_select_all ON video_reactions
  FOR SELECT USING (true);

CREATE POLICY video_reactions_insert_own ON video_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY video_reactions_update_own ON video_reactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY video_reactions_delete_own ON video_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Aggregated per-video counts, queried by video_id IN (...) for whatever
-- page of the feed is currently loaded — cheap at this table's expected
-- size, revisit with a materialized/cached count if the table gets large.
CREATE VIEW video_reaction_counts AS
  SELECT
    video_id,
    COUNT(*) FILTER (WHERE reaction = 'like') AS like_count,
    COUNT(*) FILTER (WHERE reaction = 'dislike') AS dislike_count
  FROM video_reactions
  GROUP BY video_id;
