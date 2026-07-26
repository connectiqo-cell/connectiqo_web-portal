import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";
import {
  buildCategoryMatchOrFilter,
  isOtherCategoryLabel,
  mentorHasCategory,
  normalizeCategoryBucket,
  OTHER_CATEGORY_LABEL,
  parseMentorCategories,
  quotePostgrestFilterValue,
} from "@/lib/utils/mentorCategories";

export interface MentorProfileRow {
  id: string;
  category?: string | null;
  specialization: string | null;
  bio: string | null;
  experience_years: number | null;
  price_per_hour: number | null;
  rating: number | null;
  total_sessions: number | null;
  unlock_price?: number | null;
  cover_image_url?: string | null;
  profiles: {
    id: string;
    name: string | null;
    email?: string | null;
    avatar_url: string | null;
    username?: string | null;
  } | null;
}

const MENTOR_SELECT = `
  id,
  category,
  specialization,
  bio,
  experience_years,
  price_per_hour,
  rating,
  total_sessions,
  profiles:id (
    id,
    name,
    email,
    avatar_url,
    username
  )
`;

/**
 * Ported (subset used by discovery pages) from connectfront/src/api/mentorApi.js.
 * Every function takes the Supabase client as its first argument so it works
 * from both Server Components (server client) and client components (browser client).
 */
export const mentorApi = {
  getMentorWithProfile: async (
    supabase: SupabaseClient,
    mentorId: string,
  ): Promise<MentorProfileRow | null> => {
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select(
          `id, specialization, bio, experience_years, price_per_hour, rating, total_sessions,
           unlock_price, cover_image_url,
           profiles:id ( id, name, email, avatar_url, username )`,
        )
        .eq("id", mentorId)
        .single();
      if (error) throw error;
      return data as unknown as MentorProfileRow;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorsByCategory: async (
    supabase: SupabaseClient,
    limitPerCategory = 6,
  ): Promise<Record<string, MentorProfileRow[]>> => {
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select(MENTOR_SELECT)
        .order("category", { ascending: true })
        .order("rating", { ascending: false })
        .limit(300);
      if (error) throw error;

      const grouped: Record<string, MentorProfileRow[]> = {};
      const keyByLower: Record<string, string> = {};

      ((data as unknown as MentorProfileRow[]) || []).forEach((mentor) => {
        const categories = parseMentorCategories(mentor.category);
        const bucketNames = categories.length ? categories : [normalizeCategoryBucket("")];

        bucketNames.forEach((rawCategory) => {
          const canonical = normalizeCategoryBucket(rawCategory);
          const lower = canonical.toLowerCase();
          const key = keyByLower[lower] || canonical;
          keyByLower[lower] = key;

          if (!grouped[key]) grouped[key] = [];
          if (grouped[key].some((m) => m.id === mentor.id)) return;
          if (grouped[key].length < limitPerCategory) grouped[key].push(mentor);
        });
      });

      return grouped;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Learner: mentors matching any of their onboarding interests, ranked by rating. */
  getRecommendedMentors: async (
    supabase: SupabaseClient,
    interests: string[],
    page = 0,
    pageSize = 12,
  ): Promise<MentorProfileRow[]> => {
    try {
      const list = (interests || []).map((c) => String(c).trim()).filter(Boolean);
      if (!list.length) return [];

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const orFilter = list.map((interest) => buildCategoryMatchOrFilter(interest)).join(",");

      const { data, error } = await supabase
        .from("mentor_profiles")
        .select(MENTOR_SELECT)
        .or(orFilter)
        .order("rating", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return ((data as unknown as MentorProfileRow[]) || []).filter((mentor) =>
        list.some((interest) => mentorHasCategory(mentor.category, interest)),
      );
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorsByCategoryName: async (
    supabase: SupabaseClient,
    category: string,
    page = 0,
    pageSize = 12,
  ): Promise<MentorProfileRow[]> => {
    try {
      if (isOtherCategoryLabel(category)) {
        const fetchSize = Math.min(400, Math.max(80, (page + 2) * pageSize * 5));
        const { data, error } = await supabase
          .from("mentor_profiles")
          .select(MENTOR_SELECT)
          .order("rating", { ascending: false })
          .range(0, fetchSize - 1);
        if (error) throw error;

        const matched = ((data as unknown as MentorProfileRow[]) || []).filter((mentor) =>
          mentorHasCategory(mentor.category, OTHER_CATEGORY_LABEL),
        );
        const from = page * pageSize;
        return matched.slice(from, from + pageSize);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select(MENTOR_SELECT)
        .or(buildCategoryMatchOrFilter(category))
        .order("rating", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return ((data as unknown as MentorProfileRow[]) || []).filter((mentor) =>
        mentorHasCategory(mentor.category, category),
      );
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  searchMentors: async (
    supabase: SupabaseClient,
    query: string,
    page = 0,
    pageSize = 20,
  ): Promise<MentorProfileRow[]> => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const term = query.trim().toLowerCase();
      // Quoted so commas/parentheses in the search term don't get parsed as
      // PostgREST `.or()` condition separators (was a raw 400: PGRST100).
      const likeTerm = quotePostgrestFilterValue(`%${term}%`);

      const [fieldRes, nameRes] = await Promise.all([
        supabase
          .from("mentor_profiles")
          .select(MENTOR_SELECT)
          .or(`specialization.ilike.${likeTerm},category.ilike.${likeTerm},bio.ilike.${likeTerm}`)
          .order("rating", { ascending: false })
          .range(from, to),
        supabase.from("profiles").select("id").or(`name.ilike.${likeTerm},username.ilike.${likeTerm}`),
      ]);

      if (fieldRes.error) throw fieldRes.error;

      let results = (fieldRes.data as unknown as MentorProfileRow[]) || [];

      if (nameRes.data?.length) {
        const existingIds = new Set(results.map((m) => m.id));
        const newIds = nameRes.data.map((p) => p.id).filter((id) => !existingIds.has(id));

        if (newIds.length) {
          const { data: byName } = await supabase
            .from("mentor_profiles")
            .select(MENTOR_SELECT)
            .in("id", newIds)
            .order("rating", { ascending: false });
          if (byName?.length) results = [...results, ...(byName as unknown as MentorProfileRow[])];
        }
      }

      return results;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
