import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const VIDEOSDK_API_BASE = "https://api.videosdk.live/v2";
const MEETING_RECORDINGS_V1_URL = "https://api.videosdk.live/v1/meeting-recordings";
const VIDEO_SDK_CDN_BASE = "https://cdn.videosdk.live/";

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

/**
 * Web's landscape side-by-side recording template (RecordingTemplateView),
 * served as a route in this same app rather than mobile's separate deployed
 * template — VideoSDK just navigates to whatever URL it's given.
 */
function buildTemplateUrl({ meetingId, token }: { meetingId: string; token: string }): string {
  const url = new URL("/recording-template", window.location.origin);
  url.searchParams.set("meetingId", meetingId);
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Starts a branded recording via VideoSDK's REST API — the SDK's native
 * startRecording() has no way to load a custom template (only this REST
 * `templateUrl` param does), so this bypasses whatever recording composition
 * is otherwise configured (SDK default, or an account-level default
 * template) and forces web's own landscape layout for this session.
 */
export async function startTemplateRecording({
  token,
  meetingId,
}: {
  token: string;
  meetingId: string;
}): Promise<void> {
  const res = await fetch(`${VIDEOSDK_API_BASE}/recordings/start`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId: meetingId,
      templateUrl: buildTemplateUrl({ meetingId, token }),
      config: {
        layout: { type: "GRID", priority: "PIN", gridSize: 2 },
        theme: "DARK",
        mode: "video-and-audio",
        quality: "high",
        orientation: "landscape",
      },
    }),
  });

  // Always log status + raw body (mirrors mobile's recordingConfig.js) — the
  // json()-then-catch-and-discard approach silently loses the real error
  // whenever VideoSDK's response isn't valid JSON, which is exactly the kind
  // of gap that makes a REST failure look like a mysterious template mismatch.
  const responseText = await res.text().catch(() => "");
  console.warn("[Recording] recordings/start | status:", res.status, "| body:", responseText);

  if (!res.ok) {
    throw new Error(`VideoSDK ${res.status}: ${responseText}`);
  }
}

/** Stops a REST-started recording. Paired with SDK's stopRecording() as belt-and-braces by the caller. */
export async function stopTemplateRecording({
  token,
  meetingId,
}: {
  token: string;
  meetingId: string;
}): Promise<void> {
  const res = await fetch(`${VIDEOSDK_API_BASE}/recordings/end`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomId: meetingId }),
  });

  const responseText = await res.text().catch(() => "");
  console.warn("[Recording] recordings/end | status:", res.status, "| body:", responseText);

  if (!res.ok) {
    throw new Error(`VideoSDK ${res.status}: ${responseText}`);
  }
}

type RecordingLike = Record<string, unknown>;

function pickRecordingUrlFromObject(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as RecordingLike;
  const candidate =
    o.fileUrl ?? o.file_url ?? o.playbackUrl ?? o.playback_url ?? o.downloadUrl ?? o.url ?? o.hlsUrl ?? o.hls_url ?? o.filePath ?? o.file_path;
  return typeof candidate === "string" ? candidate : null;
}

/** VideoSDK recording paths are sometimes relative — resolve them against the CDN. */
function normalizeRecordingUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const relativePath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${VIDEO_SDK_CDN_BASE}${relativePath}`;
}

async function fetchSessionsByRoom({
  meetingId,
  token,
}: {
  meetingId: string;
  token: string;
}): Promise<RecordingLike[]> {
  try {
    const res = await fetch(`${VIDEOSDK_API_BASE}/sessions?roomId=${meetingId}`, {
      headers: { Authorization: token },
    });
    if (!res.ok) return [];
    const result = await res.json();
    return Array.isArray(result?.data) ? result.data : [];
  } catch {
    return [];
  }
}

async function fetchRecordingById({
  recordingId,
  token,
}: {
  recordingId: string;
  token: string;
}): Promise<RecordingLike | null> {
  try {
    const res = await fetch(`${VIDEOSDK_API_BASE}/recordings/${recordingId}`, {
      headers: { Authorization: token },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Cloud composite recordings are sometimes only listed on the v1 meeting-recordings API. */
async function fetchMeetingRecordingsV1({
  meetingId,
  token,
}: {
  meetingId: string;
  token: string;
}): Promise<RecordingLike[]> {
  try {
    const url = `${MEETING_RECORDINGS_V1_URL}?meetingId=${encodeURIComponent(meetingId)}`;
    const res = await fetch(url, { headers: { Authorization: token } });
    if (!res.ok) return [];
    const result = await res.json();
    return Array.isArray(result?.data) ? result.data : [];
  } catch {
    return [];
  }
}

async function collectUrlsFromSessions(sessions: RecordingLike[], token: string, pushUrl: (raw: unknown) => void) {
  const sorted = [...sessions].sort((a, b) => {
    const aTime = new Date((a?.end as string) || (a?.start as string) || 0).getTime();
    const bTime = new Date((b?.end as string) || (b?.start as string) || 0).getTime();
    return bTime - aTime;
  });

  for (const session of sorted) {
    const recordingLog = Array.isArray(session?.recordingLog) ? session.recordingLog : [];

    pushUrl(session.recording);
    pushUrl(session.recordings);

    for (let i = recordingLog.length - 1; i >= 0; i -= 1) {
      const recordingId = (recordingLog[i] as RecordingLike | undefined)?.recordingId;
      if (!recordingId || typeof recordingId !== "string") continue;
      const recording = await fetchRecordingById({ recordingId, token });
      pushUrl(recording?.file);
      pushUrl(recording);
    }

    if (Array.isArray(session.recordings)) {
      session.recordings.forEach((item) => pushUrl(item));
    }
    if (Array.isArray(session.files)) {
      session.files.forEach((item) => pushUrl(item));
    }
  }
}

/**
 * Polls VideoSDK's session/recording APIs for a finished recording's playback
 * URL. Recording is processed asynchronously after the call ends, so this can
 * return an empty list right after `leave()` — callers should retry with backoff.
 * Ported from connectfront/src/api/api.js (fetchRecordingUrls).
 */
export async function fetchRecordingUrls({
  meetingId,
  token,
}: {
  meetingId: string;
  token: string;
}): Promise<string[]> {
  if (!meetingId || !token) return [];
  

  const urls: string[] = [];
  const seen = new Set<string>();
  const pushUrl = (raw: unknown) => {
    const normalized = normalizeRecordingUrl(pickRecordingUrlFromObject(raw));
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    urls.push(normalized);
  };

  const sessions = await fetchSessionsByRoom({ meetingId, token });
  await collectUrlsFromSessions(sessions, token, pushUrl);

  if (!urls.length) {
    const v1Items = await fetchMeetingRecordingsV1({ meetingId, token });
    v1Items.forEach((item) => {
      pushUrl(item.file);
      pushUrl(item);
    });
  }

  return urls;
}

export async function fetchRecordingUrl({
  meetingId,
  token,
}: {
  meetingId: string;
  token: string;
}): Promise<string | null> {
  const urls = await fetchRecordingUrls({ meetingId, token });
  return urls[0] || null;
}
