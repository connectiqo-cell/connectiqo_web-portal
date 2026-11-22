-- A professional ownership-transfer receipt needs a stable, unique reference
-- number — one assigned once at the moment of transfer, not regenerated on
-- every download (which would give the same transaction a different "unique"
-- ID each time, useless for verification/disputes).
--
-- generated always as identity assigns sequential values automatically,
-- including backfilling every existing campaign_unlocks row.

alter table public.campaign_unlocks
  add column receipt_number bigint generated always as identity;
