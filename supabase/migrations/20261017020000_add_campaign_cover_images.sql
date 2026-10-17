-- CollabHub: campaign cover images — makes campaigns feel like real brand
-- content instead of plain text cards, for both the brand managing it and
-- creators browsing Collab Hub.
alter table public.campaigns add column cover_image_url text;

insert into storage.buckets (id, name, public)
values ('campaign-covers', 'campaign-covers', true)
on conflict (id) do nothing;

-- Path convention: {brandId}/{timestamp}.{ext} — keyed by the uploading
-- brand's own id, not the campaign's, so an image can be picked before the
-- campaign row even exists yet (the "new campaign" form uploads first,
-- then includes the resulting URL in the insert).
create policy campaign_covers_bucket_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'campaign-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy campaign_covers_bucket_update_own
  on storage.objects for update
  using (
    bucket_id = 'campaign-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy campaign_covers_bucket_select
  on storage.objects for select
  using (bucket_id = 'campaign-covers');
