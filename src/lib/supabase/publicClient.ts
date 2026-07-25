import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Anonymous, cookie-free client for public read-only data (mentor discovery,
 * profiles, reviews). Unlike lib/supabase/server.ts, this never calls
 * `cookies()`, so Server Components that only need public data can stay
 * static/ISR-eligible instead of being forced into full dynamic rendering.
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}

