/**
 * Only allow same-site relative paths as a post-login redirect target —
 * blocks open-redirect payloads like `?next=https://evil.com` or `?next=//evil.com`.
 */
export function toSafeRelativePath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
