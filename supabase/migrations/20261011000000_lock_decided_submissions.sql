-- A creator's UPDATE policy on campaign_submissions only ever restricted
-- what NEW status they could set (processing/submitted, via WITH CHECK) —
-- it never restricted which ROWS they could target in the first place.
-- That meant a direct API call (bypassing the UI, which only hides the
-- resubmit button) could silently replace the video on an already
-- approved/rejected submission after the brand's decision. Once Phase 3
-- ties payment to the approved submission, that's a real integrity hole,
-- not just a theoretical one — closing it now while it's still cheap to do.
alter policy campaign_submissions_update_by_creator
  on public.campaign_submissions
  using (creator_id = auth.uid() and status in ('processing', 'submitted', 'revision_requested'))
  with check (creator_id = auth.uid() and status in ('processing', 'submitted'));
