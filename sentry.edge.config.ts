import * as Sentry from "@sentry/nextjs";

// No-ops until NEXT_PUBLIC_SENTRY_DSN is set — safe to ship without one.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});
