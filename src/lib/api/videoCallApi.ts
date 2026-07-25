import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const VIDEOSDK_API_BASE = "https://api.videosdk.live/v2";

/** Ported from connectfront/src/api/api.js — fetches a VideoSDK JWT via the shared Edge Function. */
export async function getVideoSdkToken(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-videosdk-token`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error("No token in response");
  return data.token as string;
}

/** Creates a new VideoSDK room. Only the session host (mentor) calls this. */
export async function createVideoMeeting(token: string): Promise<string> {
  const res = await fetch(`${VIDEOSDK_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`HTTP ${res.status}: ${body?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.roomId as string;
}
