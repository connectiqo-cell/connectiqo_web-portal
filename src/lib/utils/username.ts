export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// Route segments that already mean something under /mentor or at the app
// root — reserving these keeps a chosen username from ever colliding with
// a real page.
const RESERVED_USERNAMES = new Set([
  "admin",
  "settings",
  "login",
  "signup",
  "discover",
  "booking",
  "bookings",
  "call",
  "review",
  "reviews",
  "reschedule",
  "profile",
  "sessions",
  "schedule",
  "videos",
  "notifications",
  "recommended",
  "category",
  "transactions",
  "wallet",
  "onboarding",
]);

/**
 * `_` is a valid username character but is also ILIKE's single-character
 * wildcard, so a raw username passed to `.ilike()` can match the wrong row
 * (or several). Escapes it (and `%`, the multi-character wildcard) so an
 * ILIKE lookup treats the username as a literal string.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Normalizes free-typed input into the character set a username is allowed to use. */
export function sanitizeUsernameInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, USERNAME_MAX_LENGTH);
}

/** Returns a user-facing error, or null if the username is empty (allowed — it's optional) or valid. */
export function usernameFormatError(username: string): string | null {
  if (!username) return null;
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Must be at least ${USERNAME_MIN_LENGTH} characters.`;
  }
  if (!USERNAME_RE.test(username)) {
    return "Lowercase letters, numbers, and underscores only.";
  }
  if (RESERVED_USERNAMES.has(username)) {
    return "That username is reserved.";
  }
  return null;
}
