-- CollabHub Phase 2: video submission + server-side watermarking.
--
-- Two buckets: campaign-submissions holds the original, clean video —
-- PRIVATE, no public/client SELECT policy at all. Every read of it
-- (watermark pipeline, post-payment download) goes through a server-side
-- API route using the service-role client, which bypasses RLS entirely —
-- same reasoning messaging's send_message() used to omit a direct write
-- policy: the correct path is deliberately the only path.
-- campaign-submissions-watermarked is PUBLIC (brands/creators preview it
-- freely pre-payment) and is only ever written to by that same server-side
-- pipeline, so it gets no client INSERT policy either.

insert into storage.buckets (id, name, public)
values
  ('campaign-submissions', 'campaign-submissions', false),
  ('campaign-submissions-watermarked', 'campaign-submissions-watermarked', true);

-- Only the creator can upload their own original, into their own folder —
-- mirrors "Users can upload their own avatar" on storage.objects.
create policy campaign_submissions_bucket_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'campaign-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy campaign_submissions_watermarked_bucket_select
  on storage.objects for select
  using (bucket_id = 'campaign-submissions-watermarked');

create table public.campaign_submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.campaign_applications(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  original_storage_path text,
  watermarked_storage_path text,
  watermarked_video_url text,
  thumbnail_url text,
  status text not null default 'processing'
    check (status in ('processing', 'submitted', 'revision_requested', 'approved', 'rejected')),
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index campaign_submissions_creator_id_idx on public.campaign_submissions(creator_id);

alter table public.campaign_submissions enable row level security;

create policy campaign_submissions_select
  on public.campaign_submissions for select
  using (
    creator_id = auth.uid()
    or is_admin()
    or exists (
      select 1
      from public.campaign_applications a
      join public.campaigns c on c.id = a.campaign_id
      where a.id = application_id and c.brand_id = auth.uid()
    )
  );

-- Only the creator of an ALREADY-ACCEPTED application can submit — prevents
-- a creator from uploading for a campaign that never selected them.
create policy campaign_submissions_insert_own
  on public.campaign_submissions for insert
  with check (
    creator_id = auth.uid()
    and exists (
      select 1 from public.campaign_applications a
      where a.id = application_id and a.creator_id = auth.uid() and a.status = 'accepted'
    )
  );

-- Creator can resubmit after a revision request, but cannot self-approve —
-- WITH CHECK pins the status values a creator-authored update may set to
-- the two "still in progress" states; only the brand policy below can set
-- revision_requested/approved/rejected.
create policy campaign_submissions_update_by_creator
  on public.campaign_submissions for update
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid() and status in ('processing', 'submitted'));

create policy campaign_submissions_update_by_brand
  on public.campaign_submissions for update
  using (
    exists (
      select 1
      from public.campaign_applications a
      join public.campaigns c on c.id = a.campaign_id
      where a.id = application_id and c.brand_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.campaign_applications a
      join public.campaigns c on c.id = a.campaign_id
      where a.id = application_id and c.brand_id = auth.uid()
    )
  );

create policy admin_all_campaign_submissions
  on public.campaign_submissions for all
  using (is_admin())
  with check (is_admin());
