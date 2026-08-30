import type { MetadataRoute } from "next";

import { createPublicClient } from "@/lib/supabase/publicClient";
import { normalizeCategoryBucket, parseMentorCategories } from "@/lib/utils/mentorCategories";

const BASE_URL = "https://app.connectiqo.com";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  // "/" itself is no longer listed — it now just redirects logged-out
  // visitors out to the marketing site (connectiqo.com), so it has no
  // content of its own worth indexing here.
  // Privacy/Terms also live on the marketing site now (connectiqo.com/privacy,
  // /terms) — nothing in-app links to the local copies anymore, so they're
  // dropped here too rather than indexing an orphaned duplicate.
  { url: `${BASE_URL}/discover`, changeFrequency: "daily", priority: 0.9 },
];

/**
 * Public, crawlable content only — mentor profiles, their reviews, and
 * category browse pages. Everything behind auth (bookings, settings, the
 * call room, the mentor's own dashboard) is deliberately left out here and
 * blocked in robots.ts instead.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("mentor_profiles").select("id, category");
  const mentors = data ?? [];

  const mentorEntries: MetadataRoute.Sitemap = mentors.flatMap((m) => [
    { url: `${BASE_URL}/mentor/${m.id}`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/mentor/${m.id}/reviews`, changeFrequency: "weekly", priority: 0.5 },
  ]);

  const categories = new Set<string>();
  mentors.forEach((m) => {
    const parsed = parseMentorCategories(m.category);
    (parsed.length ? parsed : [""]).forEach((c) => categories.add(normalizeCategoryBucket(c)));
  });
  const categoryEntries: MetadataRoute.Sitemap = [...categories].map((category) => ({
    url: `${BASE_URL}/category/${encodeURIComponent(category)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...STATIC_ROUTES, ...mentorEntries, ...categoryEntries];
}
