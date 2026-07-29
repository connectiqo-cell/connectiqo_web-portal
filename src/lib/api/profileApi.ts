import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

export interface MentorProfileFields {
  id: string;
  specialization: string | null;
  bio: string | null;
  experience_years: number | null;
  price_per_hour: number | null;
  rating: number | null;
  total_sessions: number | null;
  unlock_price: number | null;
  category: string | null;
  cover_image_url: string | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  skills: string[] | null;
}

/**
 * Ported (subset used by auth/onboarding/dashboard) from connectfront/src/api/profileApi.js.
 * Avatar/cover upload lands with the Settings phase.
 */
export const profileApi = {
  getProfile: async (userId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, email, role, username")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getLearnerProfile: async (learnerId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("learner_profiles")
        .select("id, bio, interests")
        .eq("id", learnerId)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateLearnerProfile: async ({
    userId,
    bio,
    interests,
  }: {
    userId: string;
    bio?: string;
    interests?: string[];
  }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("learner_profiles")
        .upsert(
          { id: userId, bio: bio || "", interests: interests ?? [] },
          { onConflict: "id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  createMentorProfile: async (userId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .upsert(
          {
            id: userId,
            specialization: "",
            bio: "",
            experience_years: 0,
            price_per_hour: 0,
            rating: 0,
            total_sessions: 0,
            category: "",
          },
          { onConflict: "id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  createLearnerProfile: async (userId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("learner_profiles")
        .upsert({ id: userId, bio: "", interests: [] }, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorProfile: async (mentorId: string): Promise<MentorProfileFields> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select(
          "id, specialization, bio, experience_years, price_per_hour, rating, total_sessions, unlock_price, category, cover_image_url, location, website, linkedin_url, twitter_url, instagram_url, youtube_url, skills",
        )
        .eq("id", mentorId)
        .single();
      if (error) throw error;
      return data as unknown as MentorProfileFields;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateProfile: async ({
    userId,
    name,
    avatarUrl,
    username,
  }: {
    userId: string;
    name?: string;
    avatarUrl?: string;
    username?: string;
  }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...(name && { name }),
          ...(avatarUrl && { avatar_url: avatarUrl }),
          ...(username && { username }),
        })
        .eq("id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Web equivalent of profileApi.uploadAvatar (mobile used base64+XHR; the browser can upload a File directly). */
  uploadAvatar: async ({ userId, file }: { userId: string; file: File }): Promise<string> => {
    const supabase = createClient();
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("connectiqo_avatar")
        .upload(filePath, file, { contentType: file.type || "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("connectiqo_avatar").getPublicUrl(filePath);
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);
      if (profileError) throw profileError;

      return avatarUrl;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Clears the profile photo — best-effort storage cleanup, DB pointer is the source of truth. */
  removeAvatar: async ({ userId }: { userId: string }): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
      if (error) throw error;

      // Best-effort: the extension isn't known here, so try the common ones.
      // A failed/missing removal is harmless — avatar_url is already cleared.
      await supabase.storage
        .from("connectiqo_avatar")
        .remove(["jpg", "jpeg", "png", "webp"].map((ext) => `${userId}/avatar.${ext}`))
        .catch(() => undefined);
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateMentorProfile: async ({
    userId,
    specialization,
    bio,
    experienceYears,
    pricePerHour,
    category,
    location,
    website,
    linkedinUrl,
    twitterUrl,
    instagramUrl,
    youtubeUrl,
    skills,
  }: {
    userId: string;
    specialization?: string;
    bio?: string;
    experienceYears?: number;
    pricePerHour?: number;
    category?: string;
    location?: string;
    website?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    skills?: string[];
  }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .upsert(
          {
            id: userId,
            specialization: specialization || "",
            bio: bio || "",
            experience_years: experienceYears ?? 0,
            price_per_hour: pricePerHour ?? 0,
            ...(category !== undefined ? { category: category || "" } : {}),
            ...(location !== undefined ? { location: location || null } : {}),
            ...(website !== undefined ? { website: website || null } : {}),
            ...(linkedinUrl !== undefined ? { linkedin_url: linkedinUrl || null } : {}),
            ...(twitterUrl !== undefined ? { twitter_url: twitterUrl || null } : {}),
            ...(instagramUrl !== undefined ? { instagram_url: instagramUrl || null } : {}),
            ...(youtubeUrl !== undefined ? { youtube_url: youtubeUrl || null } : {}),
            ...(skills !== undefined ? { skills } : {}),
          },
          { onConflict: "id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
