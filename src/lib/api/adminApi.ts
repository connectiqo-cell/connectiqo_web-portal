import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";
import { quotePostgrestFilterValue } from "@/lib/utils/mentorCategories";

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AdminProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  role: string | null;
  is_frozen: boolean;
  is_admin: boolean;
}

/** Categories/user-moderation surface for the /admin dashboard. Writes rely on the profiles_admin_update / mentor_categories_admin_mutate RLS policies. */
export const adminApi = {
  listCategories: async (): Promise<AdminCategoryRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_categories")
        .select("id, name, slug, icon, sort_order, is_active")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  createCategory: async ({
    name,
    slug,
    icon,
    sortOrder,
  }: {
    name: string;
    slug: string;
    icon?: string;
    sortOrder?: number;
  }): Promise<AdminCategoryRow> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_categories")
        .insert({ name, slug, icon: icon || null, sort_order: sortOrder ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data as AdminCategoryRow;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateCategory: async (
    id: string,
    patch: Partial<Pick<AdminCategoryRow, "name" | "slug" | "icon" | "sort_order">>,
  ): Promise<AdminCategoryRow> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_categories")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AdminCategoryRow;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setCategoryActive: async (id: string, isActive: boolean): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("mentor_categories")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  deleteCategory: async (id: string): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase.from("mentor_categories").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  searchProfiles: async (query: string): Promise<AdminProfileRow[]> => {
    const supabase = createClient();
    try {
      const term = quotePostgrestFilterValue(`%${query.trim()}%`);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, username, role, is_frozen, is_admin")
        .or(`name.ilike.${term},email.ilike.${term},username.ilike.${term}`)
        .order("name", { ascending: true })
        .limit(25);
      if (error) throw error;
      return (data as AdminProfileRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setUserFrozen: async (userId: string, isFrozen: boolean): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_frozen: isFrozen })
        .eq("id", userId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Timed mentor-side freeze (keeps learner access). Requires admin_freeze_mentor RPC. */
  freezeMentor: async ({
    mentorId,
    until = null,
    reason = null,
  }: {
    mentorId: string;
    until?: string | null;
    reason?: string | null;
  }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("admin_freeze_mentor", {
        p_id: mentorId,
        p_until: until,
        p_reason: reason,
        p_operator: null,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  unfreezeMentor: async (mentorId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("admin_unfreeze_mentor", {
        p_id: mentorId,
        p_operator: null,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  listMentorVideos: async ({
    page = 1,
    pageSize = 25,
    search = "",
  }: {
    page?: number;
    pageSize?: number;
    search?: string;
  } = {}) => {
    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const q = search
      .trim()
      .replace(/[%_,]/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 80);

    try {
      let query = supabase
        .from("mentor_videos")
        .select(
          "id, mentor_id, title, description, thumbnail_url, is_free, is_promoted, promoted_at, created_at, storage_path, video_url",
          { count: "exact" },
        )
        .order("is_promoted", { ascending: false })
        .order("promoted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data || [], total: count ?? 0 };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setMentorVideoPromoted: async (videoId: string, promoted: boolean) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_videos")
        .update({
          is_promoted: promoted,
          promoted_at: promoted ? new Date().toISOString() : null,
        })
        .eq("id", videoId)
        .select("id, is_promoted, promoted_at")
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  deleteMentorVideo: async (video: {
    id: string;
    storage_path?: string | null;
    video_url?: string | null;
  }) => {
    const supabase = createClient();
    try {
      if (video.storage_path) {
        await supabase.storage.from("mentor-videos").remove([video.storage_path]).catch(() => {});
      }
      const { error } = await supabase.from("mentor_videos").delete().eq("id", video.id);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
