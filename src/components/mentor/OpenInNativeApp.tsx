"use client";

import { useEffect } from "react";

/**
 * On mobile browsers, try once to hand off /mentor/:id to the native app
 * via the custom scheme (works even before App / Universal Links verify).
 * If the app isn't installed the OS ignores it and the web page stays.
 */
export function OpenInNativeApp({ mentorSlug }: { mentorSlug: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    if (!isMobile) return;

    const slug = String(mentorSlug || "").trim();
    if (!slug) return;

    const key = `connectiqo:open-native:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // private mode — still attempt once this mount
    }

    const appUrl = `connectiqo://mentor/${encodeURIComponent(slug)}`;
    const fallback = window.location.href;

    if (/Android/i.test(ua)) {
      window.location.href =
        `intent://mentor/${encodeURIComponent(slug)}` +
        `#Intent;scheme=connectiqo;package=com.connectiqo.app;` +
        `S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
      return;
    }

    window.location.href = appUrl;
  }, [mentorSlug]);

  return null;
}
