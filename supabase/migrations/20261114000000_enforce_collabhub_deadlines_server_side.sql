-- Both CollabHub deadlines (application_deadline, submission_deadline) were
-- only ever enforced in the browser (hiding the Apply button / upload card
-- once passed) — the actual inserts had no server-side check, so a stale
-- tab, direct API call, or any future client could still apply/submit after
-- the deadline. This pins both to the database.
--
-- Cutoff matches the existing client-side logic (campaignDisplay.ts
-- deadlineEndsAt): a deadline stored as a date is end-of-day IST, i.e. the
-- start of the next calendar day minus the 5:30 IST offset.

drop policy campaign_applications_insert_own on public.campaign_applications;

create policy campaign_applications_insert_own
  on public.campaign_applications for insert
  with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and c.status = 'published'
        and (
          c.application_deadline is null
          or now() < ((c.application_deadline::date + interval '1 day') - interval '5 hours 30 minutes')
        )
    )
  );

-- Also widens 'accepted' to include 'shortlisted' — the app now treats
-- shortlist as the stage that unlocks upload (accepted kept only for rows
-- decided before that change, per applications/[applicationId]/page.tsx),
-- but this policy was never updated to match, silently blocking every
-- shortlisted creator's upload at the database level.
drop policy campaign_submissions_insert_own on public.campaign_submissions;

create policy campaign_submissions_insert_own
  on public.campaign_submissions for insert
  with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.campaign_applications a
      join public.campaigns c on c.id = a.campaign_id
      where a.id = application_id
        and a.creator_id = auth.uid()
        and a.status in ('accepted', 'shortlisted')
        and (
          c.submission_deadline is null
          or now() < ((c.submission_deadline::date + interval '1 day') - interval '5 hours 30 minutes')
        )
    )
  );
