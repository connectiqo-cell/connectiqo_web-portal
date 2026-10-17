import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "./env";

/** Service-role client for server-only code (API routes) that needs to
 * bypass RLS — e.g. reading/writing the private campaign-submissions
 * bucket, or minting signed URLs. NEVER import this from a "use client"
 * file or a browser-executed path: SUPABASE_SERVICE_ROLE_KEY has no
 * NEXT_PUBLIC_ prefix, so it's only ever defined in a server context, but
 * importing it from client code is still a mistake worth avoiding outright. */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createSupabaseClient(SUPABASE_URL!, serviceRoleKey);
}
