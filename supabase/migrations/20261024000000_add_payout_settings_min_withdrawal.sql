-- Minimum withdrawal amount, editable by admins instead of hardcoded.
--
-- Before this, the web portal's wallet page hardcoded MIN_WITHDRAWAL = 5000
-- and nothing on the server enforced any minimum (process-withdrawal and
-- deduct_wallet_for_withdrawal only checked amount > 0 and balance).
--
-- 1. payout_settings: a single-row settings table (id is always `true`).
--    Seeded with 5000 so behaviour is unchanged until an admin edits it.
--    Signed-in users can read it (the wallet page shows the minimum);
--    only admins (is_admin()) can update it. No insert/delete policies —
--    the one row is created here and only ever updated.
-- 2. deduct_wallet_for_withdrawal now rejects amounts below the minimum.
--    The check lives here (not in a trigger on withdrawal_requests) because
--    process-withdrawal deducts the wallet *before* inserting the request;
--    rejecting at insert time would leave the wallet already debited.
--    Signature, SECURITY DEFINER and grants are unchanged; search_path is
--    now pinned, as recommended for SECURITY DEFINER functions.

create table if not exists public.payout_settings (
  id boolean primary key default true check (id),
  min_withdrawal_amount numeric(12, 2) not null default 5000
    check (min_withdrawal_amount >= 1),
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.payout_settings (id, min_withdrawal_amount)
values (true, 5000)
on conflict (id) do nothing;

alter table public.payout_settings enable row level security;

create policy payout_settings_select_authenticated
  on public.payout_settings for select
  to authenticated
  using (true);

create policy payout_settings_admin_update
  on public.payout_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on public.payout_settings to authenticated;

create or replace function public.deduct_wallet_for_withdrawal(p_mentor_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_balance numeric;
  v_min numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select min_withdrawal_amount into v_min
  from payout_settings
  where id;

  if v_min is not null and p_amount < v_min then
    raise exception 'Minimum withdrawal is ₹%',
      case when v_min = trunc(v_min) then to_char(v_min, 'FM99,99,99,990')
           else to_char(v_min, 'FM99,99,99,990.00') end;
  end if;

  select balance into v_balance
  from mentor_wallets
  where id = p_mentor_id
  for update;

  if v_balance is null then
    raise exception 'Wallet not found for mentor';
  end if;

  if v_balance < p_amount then
    raise exception 'Insufficient wallet balance';
  end if;

  update mentor_wallets
  set balance = balance - p_amount,
      updated_at = now()
  where id = p_mentor_id
  returning balance into v_balance;

  return v_balance;
end;
$function$;
