-- In-app messaging between a learner and mentor. Deliberately asymmetric:
-- a learner can only send from a fixed set of pre-written labels UNTIL
-- there's an active booking between them and that mentor (status not in
-- completed/cancelled/rescheduled) — then they unlock free text too, same
-- as the mentor always has. This stops learners cold-messaging mentors
-- with arbitrary text before any real engagement exists, while still
-- letting them nudge a mentor (e.g. "Make Your Slots Available") or ask a
-- real question once a session is actually on the books.
--
-- One conversation per (mentor, learner) pair — not per booking — so a
-- repeat booking continues the same thread rather than starting a new one.
-- Enforcement lives in a SECURITY DEFINER RPC (send_message), mirroring the
-- reschedule flow's RPC pattern: no direct client INSERT policy on
-- messages, so the label rule can't be bypassed by calling the table API
-- directly.

CREATE TABLE conversation_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('learner', 'mentor')),
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO conversation_labels (role, label, sort_order) VALUES
  ('learner', 'Make Your Slots Available', 1),
  ('learner', 'When Will Your Slots Be Available?', 2);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  mentor_last_read_at timestamptz,
  learner_last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, learner_id)
);

CREATE INDEX conversations_mentor_idx ON conversations(mentor_id, last_message_at DESC);
CREATE INDEX conversations_learner_idx ON conversations(learner_id, last_message_at DESC);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_label boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON messages(conversation_id, created_at);

ALTER TABLE conversation_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversation_labels_select_all ON conversation_labels
  FOR SELECT USING (true);

CREATE POLICY conversations_select_own ON conversations
  FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

-- Read-state updates (marking your own side's last-read timestamp) are the
-- only direct write learners/mentors make to conversations; everything else
-- (creating one, bumping last_message_at) happens inside the RPCs below.
CREATE POLICY conversations_update_own_read_state ON conversations
  FOR UPDATE USING (auth.uid() = mentor_id OR auth.uid() = learner_id)
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = learner_id);

CREATE POLICY messages_select_own_conversation ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.mentor_id = auth.uid() OR c.learner_id = auth.uid())
    )
  );

-- No INSERT policy on messages at all — every send goes through
-- send_message() below, which is where the label-only rule is enforced.

CREATE OR REPLACE FUNCTION public.has_active_booking(p_mentor_id uuid, p_learner_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE mentor_id = p_mentor_id
      AND learner_id = p_learner_id
      AND status NOT IN ('completed', 'cancelled', 'rescheduled')
  );
$function$;

-- Finds or creates the (mentor, learner) conversation and returns its id —
-- called when a learner taps "Message" on a mentor's profile, or a mentor
-- opens their inbox for a learner they don't have a thread with yet.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_mentor_id uuid, p_learner_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_caller NOT IN (p_mentor_id, p_learner_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO v_id FROM conversations WHERE mentor_id = p_mentor_id AND learner_id = p_learner_id;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO conversations (mentor_id, learner_id)
  VALUES (p_mentor_id, p_learner_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id uuid, p_body text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_conv conversations%ROWTYPE;
  v_is_learner boolean;
  v_is_label boolean := false;
  v_body text := trim(p_body);
BEGIN
  IF v_body = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  SELECT * INTO v_conv FROM conversations WHERE id = p_conversation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;
  IF v_caller NOT IN (v_conv.mentor_id, v_conv.learner_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_is_learner := (v_caller = v_conv.learner_id);

  IF v_is_learner AND NOT has_active_booking(v_conv.mentor_id, v_conv.learner_id) THEN
    -- No active booking yet: the message must be exactly one of the
    -- learner's active labels — free text is rejected here, not just
    -- hidden in the UI, so this can't be bypassed by calling the RPC
    -- directly with arbitrary text.
    IF NOT EXISTS (
      SELECT 1 FROM conversation_labels
      WHERE role = 'learner' AND is_active AND label = v_body
    ) THEN
      RAISE EXCEPTION 'Book a session with this mentor to send a custom message — for now, choose one of the suggested messages.';
    END IF;
    v_is_label := true;
  END IF;

  INSERT INTO messages (conversation_id, sender_id, body, is_label)
  VALUES (p_conversation_id, v_caller, v_body, v_is_label);

  UPDATE conversations
  SET last_message_at = now(), last_message_preview = left(v_body, 140)
  WHERE id = p_conversation_id;

  RETURN json_build_object('success', true);
END;
$function$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
