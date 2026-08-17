-- Fixes complete_session_payment() rejecting the wallet credit whenever the
-- learner (not the mentor) is the one who ends the call. updateBookingStatus()
-- in the app runs under whichever participant's browser triggered it, but the
-- RPC previously only allowed auth.uid() = p_mentor_id, so a learner-initiated
-- leave silently failed to credit the mentor's wallet and never fired the
-- payout — with no visible error to either party.
--
-- Scopes the check to "any genuine participant (mentor or learner) on THIS
-- booking" instead of "only the mentor", preserving the original intent of
-- the auth.uid() check added in add_auth_check_to_complete_session_payment
-- (stop an arbitrary authenticated user from crediting someone else's
-- booking) while fixing the false rejection. Also adds a check that the
-- booking is actually 'completed' before crediting — a gap the original
-- check never covered, since it only verified a pending earnings row
-- existed, not that the session had actually happened.

CREATE OR REPLACE FUNCTION public.complete_session_payment(p_booking_id uuid, p_mentor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_amount NUMERIC(12,2);
  v_learner_id uuid;
  v_booking_status text;
BEGIN
  SELECT learner_id, status INTO v_learner_id, v_booking_status
  FROM bookings
  WHERE id = p_booking_id AND mentor_id = p_mentor_id;

  IF v_learner_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found for this mentor';
  END IF;

  IF auth.uid() != p_mentor_id AND auth.uid() != v_learner_id THEN
    RAISE EXCEPTION 'Unauthorized: only a participant on this booking may complete its payment';
  END IF;

  IF v_booking_status != 'completed' THEN
    RAISE EXCEPTION 'Booking is not marked completed';
  END IF;

  SELECT amount INTO v_amount
  FROM earnings
  WHERE booking_id = p_booking_id
    AND mentor_id  = p_mentor_id
    AND status     = 'pending'
  LIMIT 1;

  IF v_amount IS NULL THEN
    RETURN;
  END IF;

  UPDATE earnings
  SET status     = 'completed',
      updated_at = now()
  WHERE booking_id = p_booking_id
    AND mentor_id  = p_mentor_id
    AND status     = 'pending';

  INSERT INTO mentor_wallets (id, balance, total_earned, total_withdrawn)
  VALUES (p_mentor_id, v_amount, v_amount, 0)
  ON CONFLICT (id) DO UPDATE
    SET balance      = mentor_wallets.balance      + v_amount,
        total_earned = mentor_wallets.total_earned + v_amount,
        updated_at   = now();
END;
$function$;
