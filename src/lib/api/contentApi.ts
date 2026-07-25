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
