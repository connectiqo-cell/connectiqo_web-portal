function trimEnv(value: string | undefined) {
  if (value == null) return value;
  return value.replace(/\r$/, "").trim();
}

export const SUPABASE_URL = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = trimEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set both in .env.local at the project root (see .env.local.example), then restart the dev server.",
  );
}
