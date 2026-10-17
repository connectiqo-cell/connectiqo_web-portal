-- CollabHub Phase 3: pay-to-unlock the clean (non-watermarked) video.
-- Modeled directly on learner_unlocks/video_order_intents — same shape,
-- same split between a client-invisible intent row (webhook reconciliation
-- safety net) and the actual unlock record.

create table public.campaign_unlocks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.campaign_applications(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  brand_id uuid not null references public.profiles(id),
  creator_id uuid not null references public.profiles(id),
  amount_paid integer not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  unlocked_at timestamptz not null default now()
);

create index campaign_unlocks_creator_id_idx on public.campaign_unlocks(creator_id);
create index campaign_unlocks_brand_id_idx on public.campaign_unlocks(brand_id);

alter table public.campaign_unlocks enable row level security;

-- Both sides of the deal get to see it's unlocked (unlike learner_unlocks,
-- where only the paying learner can read their own row) — the workflow doc
-- is explicit that both brand and creator get access to the clean video.
create policy campaign_unlocks_select_involved
  on public.campaign_unlocks for select
  using (brand_id = auth.uid() or creator_id = auth.uid() or is_admin());

create policy admin_all_campaign_unlocks
  on public.campaign_unlocks for all
  using (is_admin())
  with check (is_admin());

-- No client insert/update policy anywhere on this table — written only by
-- the verify-campaign-payment edge function (service role), same reasoning
-- as learner_unlocks: the correct path is deliberately the only path.

create table public.campaign_order_intents (
  razorpay_order_id text primary key,
  application_id uuid not null references public.campaign_applications(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  brand_id uuid not null references public.profiles(id),
  creator_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.campaign_order_intents enable row level security;

create policy admin_all_campaign_order_intents
  on public.campaign_order_intents for all
  using (is_admin())
  with check (is_admin());

-- Intentionally no non-admin policies at all (same as video_order_intents) —
-- this table only exists for the razorpay-webhook function's reconciliation
-- read, which uses the service-role client and bypasses RLS entirely.
