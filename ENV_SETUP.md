# Environment Setup Guide

## Overview

Connectiqo uses environment variables to configure:
- Supabase (database & auth)
- Razorpay (payments)
- Sentry (error tracking - optional)

## Quick Start

### 1. Copy the Example File

```bash
cp .env.example .env.local
```

### 2. Fill in Your Credentials

Edit `.env.local` and add your actual values.

---

## Environment Variables Explained

### ✅ REQUIRED (for development)

#### `NEXT_PUBLIC_SUPABASE_URL`
- **What it is**: Your Supabase project URL
- **Where to get it**: Supabase Dashboard > Project Settings > API
- **Safe to expose**: Yes (public URL)
- **Example**: `https://pkoaxfxejgaawtwnkhvk.supabase.co`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **What it is**: Supabase anonymous API key (limited permissions)
- **Where to get it**: Supabase Dashboard > Project Settings > API > Anon Key
- **Safe to expose**: Yes (limited to RLS policies)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### `SUPABASE_SERVICE_KEY`
- **What it is**: Supabase service role key (full admin access)
- **Where to get it**: Supabase Dashboard > Project Settings > API > Service Role
- **Safe to expose**: ❌ NO - Server-side only
- **Used for**: Server-side operations, migrations
- **Store safely**: Use `.env.local` (never in git)

---

### 🛒 PAYMENT (for production)

#### `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **What it is**: Razorpay public API key
- **Where to get it**: Razorpay Dashboard > Settings > API Keys
- **Safe to expose**: Yes (public key)
- **Required for**: Payment processing
- **Leave empty**: For development testing

---

### 📊 ERROR TRACKING (optional)

#### `NEXT_PUBLIC_SENTRY_DSN`
#### `SENTRY_ORG`
#### `SENTRY_PROJECT`
#### `SENTRY_AUTH_TOKEN`

- **What it is**: Sentry error monitoring configuration
- **Where to get it**: Sentry.io dashboard
- **Required**: No (optional for production)
- **Leave empty**: To disable error tracking

---

## How to Get Each Credential

### Supabase Credentials

1. Go to: https://app.supabase.com
2. Select your project
3. Go to **Settings > API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_KEY`

### Razorpay Credentials

1. Go to: https://dashboard.razorpay.com
2. Go to **Settings > API Keys**
3. Copy:
   - **Key ID** → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Keep Key Secret in your payment processor only

---

## File Structure

```
project/
├── .env.local              ← Your actual credentials (git ignored)
├── .env.local.example      ← Backup of current config
├── .env.example            ← Template with all variables
├── .env.docker.example     ← Docker/production config
└── .gitignore              ← Includes .env.local
```

---

## Development Workflow

### Local Development

```bash
# Create your .env.local
cp .env.example .env.local

# Add your Supabase credentials
# (no Razorpay needed for testing)

# Run dev server
npm run dev
```

### With Payments Testing

```bash
# In .env.local:
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx  # Use test key
```

---

## Deployment Setup

### Vercel

1. Go to **Project Settings > Environment Variables**
2. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Optional: Sentry variables

### Docker

Use `.env.docker.example` as template:

```bash
cp .env.docker.example .env.docker
docker run --env-file .env.docker connectiqo:latest
```

---

## Security Best Practices

✅ **DO**
- Store secrets in `.env.local` (never commit)
- Use Service Key only on server-side
- Rotate keys regularly
- Use different keys for dev/staging/prod

❌ **DON'T**
- Commit `.env.local` to git
- Expose Service Key in client code
- Share credentials in chat/email
- Use production keys in development

---

## Environment Variables in Code

### Browser (Client-Side)

```tsx
// ✅ OK - Exposed variables with NEXT_PUBLIC_ prefix
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
```

### Server-Side Only

```tsx
// ✅ OK - Private variables (server components, API routes, edge functions)
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const sentryToken = process.env.SENTRY_AUTH_TOKEN;
```

### Next.js API Routes

```tsx
// pages/api/example.ts
export default function handler(req, res) {
  // ✅ Can access private env vars
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  res.status(200).json({ ok: true });
}
```

---

## Troubleshooting

### "Supabase connection failed"
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is complete
- Verify RLS policies in Supabase

### "Razorpay is not defined"
- Make sure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Use test key (`rzp_test_`) for development

### "Environment variables not loading"
```bash
# Restart dev server after changing .env.local
npm run dev
```

### "Database operation failed"
- Check `SUPABASE_SERVICE_KEY` is set (for server-side)
- Verify database permissions/RLS policies

---

## Next Steps

1. ✅ Copy `.env.example` to `.env.local`
2. ✅ Add your Supabase credentials
3. ✅ Add Razorpay key (if testing payments)
4. ✅ Run: `npm run dev`
5. ✅ Verify app loads without errors

**All set!** 🚀
