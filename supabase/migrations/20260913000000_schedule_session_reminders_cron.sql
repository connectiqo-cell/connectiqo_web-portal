-- Wires up notify-session-reminders (deployed as an Edge Function, but never
-- actually triggered by anything — no cron existed, so no reminders were
-- ever being sent). pg_net lets Postgres make outbound HTTP calls; pg_cron
-- fires this once a minute to call the function.
--
-- Cost check: 60 * 24 * 30 = 43,200 invocations/month — well under even the
-- free-tier 500,000/month Edge Function quota, independent of user count.
--
-- The Authorization header uses the public anon key, not the service-role
-- key: the function only needs a valid Supabase-issued JWT to pass the
-- platform's verify_jwt gate here — it authenticates its own DB access
-- separately, internally, via its own SUPABASE_SERVICE_ROLE_KEY function
-- secret. The anon key is safe to embed here; it's the same key already
-- public in the deployed website's client bundle.
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'notify-session-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pkoaxfxejgaawtwnkhvk.supabase.co/functions/v1/notify-session-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb2F4ZnhlamdhYXd0d25raHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDcxMTcsImV4cCI6MjA4OTQyMzExN30.xzMh8CqUzQ9MEcSQbfTfr-VLxJxXdfyMcebrjQ4tWXQ'
    ),
    body := '{}'::jsonb
  );
  $$
);
