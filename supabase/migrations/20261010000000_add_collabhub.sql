-- CollabHub: a brand<->creator paid-campaign marketplace layered on top of
-- the existing mentor/learner marketplace. Every Connectiqo account is
-- already both a "mentor" and "learner" (role is hardcoded to 'both' at
-- signup, see authApi.createProfile) — "creator" here is the SAME unified
-- account, not a new role, matching that existing convention. "brand" is
-- genuinely new: a structurally different account type (a company), so it
-- gets its own role value and its own profile table, mirroring
-- mentor_profiles/learner_profiles exactly.

-- 1. Extend the role constraint to allow 'brand'.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role = any (array['mentor'::text, 'learner'::text, 'both'::text, 'brand'::text]));

-- 2. brand_profiles — 1:1 with profiles, mirrors mentor_profiles' shape/RLS.
create table public.brand_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null,
  work_email text,
  logo_url text,
  website text,
  industry text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.brand_profiles enable row level security;

create policy brand_profiles_insert_own
  on public.brand_profiles for insert
  with check (auth.uid() = id);

create policy brand_profiles_update_own
  on public.brand_profiles for update
  using (auth.uid() = id);

create policy brand_profiles_select_public
  on public.brand_profiles for select
  using (true);

create policy admin_all_brand_profiles
  on public.brand_profiles for all
  using (is_admin())
  with check (is_admin());

-- 3. creator_profiles — 1:1 with profiles, mirrors learner_profiles' shape/RLS.
-- Auto-created at signup for every account alongside mentor_profiles/
-- learner_profiles (see authApi.ts), not gated behind any role check.
create table public.creator_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  portfolio_links text[],
  social_links jsonb,
  follower_count int,
  primary_platform text,
  location text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.creator_profiles enable row level security;

create policy creator_profiles_select_own
  on public.creator_profiles for select
  using (auth.uid() = id);

create policy creator_profiles_insert_own
  on public.creator_profiles for insert
  with check (auth.uid() = id);

create policy creator_profiles_update_own
  on public.creator_profiles for update
  using (auth.uid() = id);

create policy admin_all_creator_profiles
  on public.creator_profiles for all
  using (is_admin())
  with check (is_admin());

-- 4. campaigns — posted by a brand, free to create/publish.
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  objectives text,
  content_type text,
  target_audience text,
  platforms text[],
  video_duration_seconds int,
  eligibility_criteria text,
  min_followers int,
  budget_per_winner numeric not null,
  winner_count int not null default 1,
  content_usage_rights text,
  category text,
  location text,
  application_deadline timestamptz,
  submission_deadline timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_brand_id_idx on public.campaigns(brand_id);
create index campaigns_status_idx on public.campaigns(status);

alter table public.campaigns enable row level security;

create policy campaigns_select_published
  on public.campaigns for select
  using (status = 'published' or brand_id = auth.uid() or is_admin());

create policy campaigns_insert_own
  on public.campaigns for insert
  with check (brand_id = auth.uid());

create policy campaigns_update_own
  on public.campaigns for update
  using (brand_id = auth.uid());

create policy campaigns_delete_own
  on public.campaigns for delete
  using (brand_id = auth.uid());

create policy admin_all_campaigns
  on public.campaigns for all
  using (is_admin())
  with check (is_admin());

-- 5. campaign_applications — a creator applying to a campaign.
create table public.campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  pitch text not null,
  status text not null default 'pending'
    check (status in ('pending', 'shortlisted', 'accepted', 'rejected')),
  applied_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (campaign_id, creator_id)
);

create index campaign_applications_campaign_id_idx on public.campaign_applications(campaign_id);
create index campaign_applications_creator_id_idx on public.campaign_applications(creator_id);

alter table public.campaign_applications enable row level security;

create policy campaign_applications_select
  on public.campaign_applications for select
  using (
    creator_id = auth.uid()
    or is_admin()
    or exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid())
  );

create policy campaign_applications_insert_own
  on public.campaign_applications for insert
  with check (creator_id = auth.uid());

-- Status transitions (shortlist/accept/reject) are a plain RLS-scoped update
-- by the owning brand — this isn't money-moving logic like messaging's
-- send_message()/payment verification, so no RPC indirection is needed.
create policy campaign_applications_update_by_brand
  on public.campaign_applications for update
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid()));

create policy admin_all_campaign_applications
  on public.campaign_applications for all
  using (is_admin())
  with check (is_admin());
