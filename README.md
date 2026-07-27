# Connectiqo — Web

Next.js (App Router) web client for the Connectiqo live 1-on-1 mentorship
marketplace. Shares the same Supabase project/backend as the mobile app
(`connectfront`) — no separate schema or API.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in real values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API (same project as the mobile app) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page — anon/publishable key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Not required client-side today — `create-razorpay-order` returns the key id. Present for future use. |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional. Leave unset to disable error monitoring entirely. |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Optional, only needed for Sentry source map upload on build. |

## Scripts

```bash
npm run dev         # local dev server
npm run build        # production build (also runs the TS type check)
npm run start         # run the production build locally
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit (used by CI, faster than a full build)
npm run test:e2e       # Playwright smoke tests (builds + starts the app first)
```

## Testing

`e2e/smoke.spec.ts` covers page rendering, client-side form validation, and
auth-gating redirects. It deliberately never submits a real signup, booking,
or payment — there is no separate staging Supabase project, only the one
this app and the mobile app both run against in production. Before adding
true end-to-end coverage (real signup → booking → payment → video call),
set up a dedicated Supabase branch/project for tests first.

## Deploying

1. **Push to GitHub.** This repo has no remote configured yet:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin master
   ```
2. **Create a Vercel project** from that repo (vercel.com → New Project →
   import the GitHub repo). Vercel auto-detects Next.js — no build config
   
   needed.
3. **Set environment variables in Vercel** (Project → Settings →
   Environment Variables) — same names as `.env.local.example`, real values.
4. **Add a custom domain** under Project → Settings → Domains once you're
   ready to point `connectiqo.app` (or a subdomain) at it.
5. **GitHub Actions CI** (`.github/workflows/ci.yml`) runs lint, typecheck,
   build, and the Playwright suite on every PR and push to `main`. Add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as repo
   secrets (Settings → Secrets and variables → Actions) or the build step
   will fail.

## Backend

All data lives in the same Supabase project as the mobile app.
`connectfront/supabase/migrations` is the single source of truth for schema
changes — apply migrations there, not per-client. Edge Functions
(`create-razorpay-order`, `verify-razorpay-payment`, `get-videosdk-token`,
`delete-account`, etc.) are likewise shared.
