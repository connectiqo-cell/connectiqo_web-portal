"use client";

import { useEffect } from "react";

/**
 * Point a <video> at an HLS ladder, falling back to a progressive MP4.
 *
 * Safari plays .m3u8 natively; Chrome and Firefox need hls.js, which is loaded
 * lazily so the ~400KB library never lands in the initial bundle for the many
 * pages that show no video at all.
 *
 * Pass `hlsUrl` as null until the transcoder has produced one — the hook then
 * just sets `src` to the MP4, so videos stay watchable while transcoding is
 * pending, failed, or was never run (every video uploaded before the worker).
 */
export function useHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  hlsUrl: string | null | undefined,
  fallbackUrl: string | null | undefined,
) {
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const src = hlsUrl || fallbackUrl;
    if (!src) return;

    const isHls = src.includes(".m3u8");

    // Progressive MP4, or Safari which handles HLS itself.
    if (!isHls || el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
      return;
    }

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;

    void (async () => {
      const Hls = (await import("hls.js")).default;
      if (destroyed) return;

      if (!Hls.isSupported()) {
        // No MSE (very old browser): the MP4 still plays.
        if (fallbackUrl) el.src = fallbackUrl;
        return;
      }

      hls = new Hls({ enableWorker: true });
      hls.on(Hls.Events.ERROR, (_e: unknown, data: { fatal?: boolean }) => {
        // A broken ladder must never mean a blank player.
        if (data?.fatal && fallbackUrl) {
          hls?.destroy();
          hls = null;
          el.src = fallbackUrl;
        }
      });
      hls.loadSource(src);
      hls.attachMedia(el);
    })();

    return () => {
      destroyed = true;
      hls?.destroy();
    };
  }, [videoRef, hlsUrl, fallbackUrl]);
}
