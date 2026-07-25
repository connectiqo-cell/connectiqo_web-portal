import * as Sentry from "@sentry/nextjs";

// No-ops until NEXT_PUBLIC_SENTRY_DSN is set — safe to ship without one.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // Errors already avoid logging PII (see AuthContext/bookingApi console
  // calls) — keep the same discipline for anything sent to Sentry.
  sendDefaultPii: false,
});
