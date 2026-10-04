-- Self-service account deletion: soft delete / anonymize rather than a hard
-- delete. transactions, earnings, bookings, and reviews stay intact (they're
-- financial/compliance records tied to real Razorpay payments), but the
-- profile's PII is scrubbed and the account is locked out immediately via
-- the existing is_frozen flag (same mechanism AuthContext already enforces
-- for admin-banned accounts — instant sign-out + frozen notice on next
-- session check, see AuthContext.tsx).
--
-- auth.users itself is intentionally left untouched here: deleting it would
-- cascade/conflict with the profiles FK we're relying on to keep the
-- anonymized row, and requires the admin API anyway (unavailable to a plain
-- SECURITY DEFINER SQL function). Login is blocked purely via is_frozen,
-- identical to how admin-initiated bans already work in this app.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet_balance numeric;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Guard: a mentor must withdraw their balance, with no payout in flight,
  -- before they can delete — otherwise their earned money has nowhere to go.
  select balance into v_wallet_balance from public.mentor_wallets where id = v_uid;
  if v_wallet_balance is not null and v_wallet_balance <> 0 then
    raise exception 'Please withdraw your wallet balance before deleting your account.';
  end if;
  if exists (
    select 1 from public.withdrawal_requests
    where mentor_id = v_uid and status in ('pending', 'processing')
  ) then
    raise exception 'You have a withdrawal in progress. Please wait for it to complete before deleting your account.';
  end if;

  -- Guard: no booking left unresolved on either side of the account.
  if exists (
    select 1 from public.bookings
    where (mentor_id = v_uid or learner_id = v_uid)
      and status not in ('completed', 'cancelled', 'rejected')
  ) then
    raise exception 'You have an active or unresolved booking. Please complete, cancel, or resolve it before deleting your account.';
  end if;

  update public.profiles
  set name = 'Deleted user',
      email = 'deleted-' || v_uid || '@connectiqo.invalid',
      username = null,
      avatar_url = null,
      fcm_token = null,
      is_frozen = true,
      deleted_at = now()
  where id = v_uid;

  update public.mentor_profiles
  set bio = null,
      specialization = '',
      website = null,
      linkedin_url = null,
      x_url = null,
      twitter_url = null,
      instagram_url = null,
      youtube_url = null,
      skills = null,
      location = null,
      cover_image_url = null,
      bank_account = null,
      ifsc = null,
      account_holder_name = null,
      upi_id = null,
      mentor_frozen = true,
      mentor_freeze_reason = 'Account deleted by user'
  where id = v_uid;

  update public.learner_profiles
  set bio = null,
      interests = null
  where id = v_uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
