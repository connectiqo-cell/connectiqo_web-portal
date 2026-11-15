-- The client never inserts into withdrawal_requests directly — it always
-- calls the process-withdrawal edge function, which uses the service-role
-- key (bypasses RLS) after verifying the payout method and atomically
-- deducting the wallet balance via deduct_wallet_for_withdrawal().
--
-- The withdrawal_insert policy (with check: mentor_id = auth.uid()) served
-- no legitimate purpose but let any logged-in creator insert a
-- withdrawal_requests row directly via the REST API/client SDK for any
-- amount and any status (including 'completed'), completely bypassing the
-- balance/minimum checks that only exist inside the edge function + RPC.

drop policy withdrawal_insert on public.withdrawal_requests;
