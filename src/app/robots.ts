import type { MetadataRoute } from "next";

const BASE_URL = "https://app.connectiqo.com";

/**
 * Blocks everything that's either auth-gated (settings, bookings, the call
 * room) or has no standalone content value to a crawler (auth forms, the
 * booking checkout flow, the recorder's headless template page — see
 * RecordingTemplateView.tsx, never opened by a human). Public profile pages
 * (/mentor/:id, /mentor/:id/reviews, /category/:name) stay allowed and are
 * listed in sitemap.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/signup",
        "/forgot-password",
        "/onboarding",
        "/call/",
        "/booking/",
        "/review/",
        "/reschedule/",
        "/settings/",
        "/bookings",
        "/transactions",
        "/notifications",
        "/videos",
        "/admin/",
        "/mentor/profile",
        "/mentor/sessions",
        "/mentor/schedule",
        "/mentor/videos",
        "/mentor/reschedule/",
        "/recording-template",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
