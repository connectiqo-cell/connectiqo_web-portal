import { createClient } from "@/lib/supabase/client";

export type MentorCategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
};

/** Ported from connectfront/src/api/contentApi.js. */
export async function fetchActiveCategories(): Promise<MentorCategoryRow[]> {
  const supabase = createClient();
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
