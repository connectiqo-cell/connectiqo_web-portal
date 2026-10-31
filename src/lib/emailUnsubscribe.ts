import { createPublicClient } from "@/lib/supabase/publicClient";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UnsubscribeResult = "done" | "invalid" | "error";

export function isUnsubscribeToken(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Marks the owner of `token` as unsubscribed from non-essential emails
 * (email_unsubscribe RPC — callable without login; the token is the proof).
 * Booking emails keep going out. Repeating it is harmless.
 */
export async function unsubscribeByToken(token: string): Promise<UnsubscribeResult> {
  if (!isUnsubscribeToken(token)) return "invalid";
  try {
    const { data, error } = await createPublicClient().rpc("email_unsubscribe", { p_token: token });
    if (error) {
      console.error("email_unsubscribe failed:", error.message);
      return "error";
    }
    return data === true ? "done" : "invalid";
  } catch (err) {
    console.error("email_unsubscribe failed:", err);
    return "error";
  }
}
