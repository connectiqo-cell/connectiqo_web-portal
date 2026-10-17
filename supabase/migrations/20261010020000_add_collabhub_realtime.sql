-- CollabHub UX pass: live updates on the brand's campaign detail page and
-- the creator's application/submission page (no more manual reload to see
-- a new application, a brand's decision, or watermarking finishing).
alter publication supabase_realtime add table public.campaign_applications;
alter publication supabase_realtime add table public.campaign_submissions;
