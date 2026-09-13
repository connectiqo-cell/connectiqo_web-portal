-- Tracks failed password sign-in attempts per email so the login-with-lockout
-- edge function can lock an account out for a cooldown window after too many
-- consecutive failures. Only ever read/written via the service role (edge
-- function), so RLS is enabled with no policies -- anon/authenticated clients
-- get no direct access.
create table public.login_attempts (
  email text primary key,
  failed_count integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.login_attempts is
  'Per-email failed login counters used by the login-with-lockout edge function to lock accounts out after repeated failures.';

alter table public.login_attempts enable row level security;
