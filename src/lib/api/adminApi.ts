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

  /**
   * Renaming a category here only updates the mentor_categories row itself —
   * learner_profiles.interests / mentor_profiles.category are plain strings
   * with no foreign key, so a rename would otherwise silently orphan every
   * existing reference to the old name. When `patch.name` changes, propagate
   * it into already-saved data via admin_propagate_category_rename.
   */
  updateCategory: async (
    id: string,
    patch: Partial<Pick<AdminCategoryRow, "name" | "slug" | "icon" | "sort_order">>,
  ): Promise<AdminCategoryRow> => {
    const supabase = createClient();
    try {
      const { data: before, error: beforeError } = await supabase
        .from("mentor_categories")
        .select("name")
        .eq("id", id)
        .single();
      if (beforeError) throw beforeError;

      const { data, error } = await supabase
        .from("mentor_categories")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (patch.name && patch.name !== before.name) {
        const { error: propagateError } = await supabase.rpc("admin_propagate_category_rename", {
          p_old_name: before.name,
          p_new_name: patch.name,
        });
        if (propagateError) throw propagateError;
      }

      return data as AdminCategoryRow;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Deactivating a category removes it from every picker the same way a
   * delete does, so it's propagated the same way: `isActive: false` strips
   * the name from already-saved interests/category. Reactivating doesn't
   * restore anything that was already stripped.
   */
  setCategoryActive: async (id: string, isActive: boolean): Promise<void> => {
    const supabase = createClient();
    try {
      const { data: category, error: fetchError } = await supabase
        .from("mentor_categories")
        .select("name")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("mentor_categories")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;

      if (!isActive) {
        const { error: propagateError } = await supabase.rpc("admin_propagate_category_removed", {
          p_category_name: category.name,
        });
        if (propagateError) throw propagateError;
      }
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  deleteCategory: async (id: string): Promise<void> => {
    const supabase = createClient();
    try {
      const { data: category, error: fetchError } = await supabase
        .from("mentor_categories")
        .select("name")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { error } = await supabase.from("mentor_categories").delete().eq("id", id);
      if (error) throw error;

      const { error: propagateError } = await supabase.rpc("admin_propagate_category_removed", {
        p_category_name: category.name,
      });
      if (propagateError) throw propagateError;
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
};
