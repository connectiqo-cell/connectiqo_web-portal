-- Creators were never asked to agree to anything before a brand got full,
-- unrestricted use of their unlocked video — the brand's content_usage_rights
-- text was just displayed, never consented to. Adds a required, timestamped
-- consent on the first submission per application, enforced server-side
-- (not just a UI checkbox) so it can't be skipped by calling the client SDK
-- directly.

alter table public.campaign_submissions
  add column agreement_accepted_at timestamptz;

drop policy campaign_submissions_insert_own on public.campaign_submissions;

create policy campaign_submissions_insert_own
  on public.campaign_submissions for insert
  with check (
    creator_id = auth.uid()
    and agreement_accepted_at is not null
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

-- Re-submission (revision) goes through this same upsert as an UPDATE, not
-- an INSERT. Consent is asked once per application (not re-asked on every
-- revision) — the client leaves agreement_accepted_at out of a resubmit's
-- payload, so it's untouched; this check just guards it can never be
-- cleared back to null once set.
drop policy campaign_submissions_update_by_creator on public.campaign_submissions;

create policy campaign_submissions_update_by_creator
  on public.campaign_submissions for update
  using (creator_id = auth.uid() and status in ('processing', 'submitted', 'revision_requested'))
  with check (creator_id = auth.uid() and status in ('processing', 'submitted') and agreement_accepted_at is not null);
