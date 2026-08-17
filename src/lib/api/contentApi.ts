import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export type MentorCategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
};

/**
 * Ported from connectfront/src/api/contentApi.js. Accepts an optional client
 * so Server Components can pass a cookie-free public client (keeps ISR pages
 * static) instead of the default browser client.
 */
export async function fetchActiveCategories(
  supabase: SupabaseClient = createClient(),
): Promise<MentorCategoryRow[]> {
  try {
    const { data, error } = await supabase
      .from("mentor_categories")
      .select("id, name, slug, icon, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("mentor_categories:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("mentor_categories fetch failed:", (e as Error)?.message);
    return [];
  }
}

export async function fetchActiveCategoryNames(): Promise<string[]> {
  const rows = await fetchActiveCategories();
  return rows.map((r) => r.name).filter(Boolean);
}

export type HeroSlideRow = {
  id: string;
  image_url: string;
  position: number;
};

export type HomeVideoRow = {
  id: string;
  title: string | null;
  label: string | null;
  video_url: string;
  thumbnail_url: string | null;
};

/** The single admin-managed "how it works" intro clip shown on Home. */
export async function fetchIntroVideo(): Promise<HomeVideoRow | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("home_videos")
      .select("id, title, label, video_url, thumbnail_url")
      .eq("type", "intro")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("home_videos:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.warn("home_videos fetch failed:", (e as Error)?.message);
    return null;
  }
}

/** Home banner carousel — admin-managed promotional slides. */
export async function fetchActiveHeroSlides(): Promise<HeroSlideRow[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("id, image_url, position")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("hero_slides:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("hero_slides fetch failed:", (e as Error)?.message);
    return [];
  }
}
