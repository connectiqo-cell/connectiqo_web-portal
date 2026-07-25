const VIDEO_SDK_CDN_BASE = "https://cdn.videosdk.live/";

/** Ported from connectfront/src/api/api.js — VideoSDK sometimes returns a CDN-relative path. */
export function normalizeRecordingUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const relativePath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${VIDEO_SDK_CDN_BASE}${relativePath}`;
}
