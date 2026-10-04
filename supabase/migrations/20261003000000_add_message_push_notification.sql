-- Push-notify the other party on every new message. Fires for web and app
-- sends alike (both go through send_message()). pg_net is async, and the
-- EXCEPTION block means a notify failure can never block a message insert.
-- The notify-message edge function does the FCM send (already applied to
-- the live project on 2026-10-03; this file is the record).
CREATE OR REPLACE FUNCTION public.notify_message_recipient()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://pkoaxfxejgaawtwnkhvk.supabase.co/functions/v1/notify-message',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('messageId', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify-message enqueue failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_message_recipient() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER messages_notify_recipient
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message_recipient();
