-- CollabHub Phase 3: live updates when a brand's payment unlocks a video —
-- the creator's application page listens for this so "Paid!" shows up
-- without a manual reload, same reasoning as campaign_applications/
-- campaign_submissions in 20261010020000_add_collabhub_realtime.sql.
alter publication supabase_realtime add table public.campaign_unlocks;
