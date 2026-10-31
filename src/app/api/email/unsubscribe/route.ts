import type { NextRequest } from "next/server";

import { isUnsubscribeToken, unsubscribeByToken } from "@/lib/emailUnsubscribe";

/**
 * POST /api/email/unsubscribe?t=<token>
 *  - One-click unsubscribe from mail apps (RFC 8058: body "List-Unsubscribe=One-Click",
 *    sent because our emails carry List-Unsubscribe-Post) → plain 200/400 response.
 *  - The confirm button on /unsubscribe → 303 back to the page with the result.
 *
 * GET never unsubscribes: email security scanners open links automatically, so a
 * GET with side effects would unsubscribe people who never clicked.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";

  let oneClick = false;
  try {
    const form = await request.formData();
    oneClick = form.get("List-Unsubscribe") === "One-Click";
  } catch {
    // No/unsupported body — treat as the page's form.
  }

  const result = await unsubscribeByToken(token);

  if (oneClick) {
    const status = result === "done" ? 200 : result === "invalid" ? 400 : 500;
    return new Response(result === "done" ? "Unsubscribed" : "Could not unsubscribe", {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // Relative Location: correct behind the reverse proxy regardless of internal host.
  const back = `/unsubscribe?t=${encodeURIComponent(token)}&status=${result}`;
  return new Response(null, { status: 303, headers: { Location: back, "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const target = isUnsubscribeToken(token) ? `/unsubscribe?t=${encodeURIComponent(token)}` : "/unsubscribe";
  return new Response(null, { status: 303, headers: { Location: target, "Cache-Control": "no-store" } });
}
