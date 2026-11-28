/** Ported from connectfront/src/lib/supabaseErrorHandler.js — keep messages in sync. */
export function getSupabaseErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred";

  const err = error as { message?: string; code?: string; status?: number };
  const message = err.message || "";
  const code = err.code || "";
  const status = err.status;

  if (
    code === "invalid_credentials" ||
    message.includes("Invalid login credentials") ||
    message.includes("Incorrect email or password")
  ) {
    return "Incorrect email or password. Please try again.";
  }

  if (code === "email_not_confirmed" || message.includes("Email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox.";
  }
  if (message.includes("User already registered")) {
    return "This email is already registered. Try signing in instead.";
  }
  if (code === "user_not_found") {
    return "No account found with this email.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    status === 429 ||
    message.includes("too many requests") ||
    message.includes("rate limit")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (code === "PGRST301" || code === "session_not_found") {
    return "Your session has expired. Please sign in again.";
  }

  if (code === "weak_password") {
    return "Password is too weak. Use at least 8 characters with letters and numbers.";
  }

  if (code === "23505" && message.toLowerCase().includes("username")) {
    return "That username is already taken. Try another one.";
  }
  if (code === "23505" && (message.includes("user_reports") || message.toLowerCase().includes("report"))) {
    return "You already have an open report for this item.";
  }
  if (code === "23505") return "This record already exists.";
  if (code === "23502") return "A required field is missing.";
  if (code === "42P01") return "Database error. Please contact support.";

  // 42501 is Postgres' RLS denial. It reaches users verbatim as "new row
  // violates row-level security policy for table X", which tells them
  // nothing. The common real cause is a session still running an older JS
  // bundle that doesn't send a column a tightened policy now requires
  // (see the usage-agreement migration), and a reload fixes it.
  if (code === "42501" || message.includes("row-level security policy")) {
    return "We couldn't save that. Close and reopen the app to get the latest version, then try again. If it keeps happening, contact support.";
  }

  if (
    message.includes("Network request failed") ||
    message.includes("Failed to fetch") ||
    message.includes("network error")
  ) {
    return "No internet connection. Please check your network and try again.";
  }

  return message || "Something went wrong. Please try again.";
}
