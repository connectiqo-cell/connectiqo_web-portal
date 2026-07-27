import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";
import { VIDEO_UNLOCK_PRICE_TIERS } from "@/lib/constants/videoUnlockTiers";

const BUCKET = "mentor-videos";
const THUMB_BUCKET = "mentor-videos-thumbnail";

export interface MentorVideo {
  id: string;
  mentor_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  is_free: boolean;
  position: number | null;
  created_at: string;
  storage_path?: string;
  profiles?: { id: string; name: string | null; avatar_url: string | null } | null;
}

export type PublicVideo = MentorVideo & {
  profiles: { id: string; name: string | null; avatar_url: string | null } | null;
  mentor_profiles: { specialization: string | null; unlock_price: number | null };
};

export interface CreateVideoOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  routeEnabled: boolean;
  mentorAmount: number;
  convenienceFee: number;
  totalAmount: number;
}

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let detail = error.message;
    try {
      const errBody = await (error as { context?: { json?: () => Promise<{ error?: string }> } })
        .context?.json?.();
      if (errBody?.error) detail = errBody.error;
    } catch {
      // ignore parse failure — fall back to error.message
    }
    throw new Error(detail);
  }
  return data as T;
}

/**
 * Ported (web-relevant subset) from connectfront/src/api/videoApi.js. Upload
 * uses a direct browser File -> Supabase Storage upload instead of mobile's
 * base64+XHR workaround (that workaround existed only because React
 * Native's FormData didn't work with the Supabase JS client).
 */
export const videoLibraryApi = {
  uploadVideo: async ({
    mentorId,
    title,
    description = "",
    file,
    isFree = false,
    thumbnailFile,
  }: {
    mentorId: string;
    title: string;
    description?: string;
    file: File;
    isFree?: boolean;
    thumbnailFile?: File;
  }): Promise<MentorVideo> => {
    const supabase = createClient();
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const storagePath = `${mentorId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, { contentType: file.type || "video/mp4" });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbExt = (thumbnailFile.name.split(".").pop() || "jpg").toLowerCase();
        const thumbPath = `${mentorId}/${Date.now()}_thumb.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from(THUMB_BUCKET)
          .upload(thumbPath, thumbnailFile, { contentType: thumbnailFile.type || "image/jpeg" });
        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage.from(THUMB_BUCKET).getPublicUrl(thumbPath);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      }

      const { data, error } = await supabase
        .from("mentor_videos")
        .insert({
          mentor_id: mentorId,
          title,
          description,
          video_url: publicUrlData.publicUrl,
          storage_path: storagePath,
          is_free: isFree,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MentorVideo;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorVideos: async (mentorId: string): Promise<MentorVideo[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_videos")
        .select("id, mentor_id, title, description, video_url, thumbnail_url, is_free, position, storage_path, created_at")
        .eq("mentor_id", mentorId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as MentorVideo[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateVideo: async ({
    id,
    title,
    description,
    isFree,
  }: {
    id: string;
    title?: string;
    description?: string;
    isFree?: boolean;
  }) => {
    const supabase = createClient();
    try {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (isFree !== undefined) updates.is_free = isFree;

      const { data, error } = await supabase
        .from("mentor_videos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  deleteVideo: async ({ id, storagePath }: { id: string; storagePath?: string }) => {
    const supabase = createClient();
    try {
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
      const { error } = await supabase.from("mentor_videos").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** All mentors' public videos, newest first — powers the cross-mentor /videos browse page. */
  getAllPublicVideos: async ({
    page = 0,
    pageSize = 20,
  }: { page?: number; pageSize?: number } = {}): Promise<PublicVideo[]> => {
    const supabase = createClient();
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: videos, error } = await supabase
        .from("mentor_videos")
        .select(
          "id, mentor_id, title, description, video_url, thumbnail_url, is_free, position, created_at, profiles:mentor_id (id, name, avatar_url)",
        )
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      if (!videos?.length) return [];

      const mentorIds = [...new Set(videos.map((v) => v.mentor_id))];
      const { data: mentorProfiles } = await supabase
        .from("mentor_profiles")
        .select("id, specialization, unlock_price")
        .in("id", mentorIds);

      const profileMap = new Map((mentorProfiles || []).map((mp) => [mp.id, mp]));

      return (videos as unknown as MentorVideo[]).map((v) => ({
        ...v,
        profiles: v.profiles ?? null,
        mentor_profiles: profileMap.get(v.mentor_id) || { specialization: "", unlock_price: null },
      })) as PublicVideo[];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Learner's active (non-expired) unlocks with mentor profile details, for the Settings page. */
  getLearnerActiveSubscriptions: async (
    learnerId: string,
  ): Promise<
    Array<{
      mentor_id: string;
      expires_at: string | null;
      unlocked_at: string;
      profiles: { id: string; name: string | null; avatar_url: string | null } | null;
    }>
  > => {
    const supabase = createClient();
    try {
      const iso = new Date().toISOString();
      const { data, error } = await supabase
        .from("learner_unlocks")
        .select("mentor_id, expires_at, unlocked_at, profiles:mentor_id ( id, name, avatar_url )")
        .eq("learner_id", learnerId)
        .or(`expires_at.is.null,expires_at.gt.${iso}`)
        .order("expires_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data as unknown as Array<{
        mentor_id: string;
        expires_at: string | null;
        unlocked_at: string;
        profiles: { id: string; name: string | null; avatar_url: string | null } | null;
      }>) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Learner's active (non-expired) unlocks, keyed by mentor id. */
  getLearnerUnlocks: async (learnerId: string): Promise<Map<string, { expiresAt: string | null }>> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("learner_unlocks")
        .select("mentor_id, expires_at")
        .eq("learner_id", learnerId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      if (error) throw error;
      const map = new Map<string, { expiresAt: string | null }>();
      (data || []).forEach((u) => map.set(u.mentor_id, { expiresAt: u.expires_at }));
      return map;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  checkUnlocked: async ({ learnerId, mentorId }: { learnerId: string; mentorId: string }): Promise<boolean> => {
    const supabase = createClient();
    try {
      const iso = new Date().toISOString();
      const { data, error } = await supabase
        .from("learner_unlocks")
        .select("id")
        .eq("learner_id", learnerId)
        .eq("mentor_id", mentorId)
        .or(`expires_at.is.null,expires_at.gt.${iso}`)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setUnlockPrice: async ({ mentorId, price }: { mentorId: string; price: number }) => {
    if (!(VIDEO_UNLOCK_PRICE_TIERS as readonly number[]).includes(price)) {
      throw new Error(`Price must be one of: ₹${VIDEO_UNLOCK_PRICE_TIERS.join(", ₹")}`);
    }
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("mentor_profiles")
        .update({ unlock_price: price })
        .eq("id", mentorId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Step 1: create a Razorpay order for a 30-day video library subscription. */
  createVideoOrder: async (params: {
    mentorId: string;
    learnerId: string;
  }): Promise<CreateVideoOrderResponse> => {
    try {
      return await invokeFunction<CreateVideoOrderResponse>("create-video-order", params);
    } catch (error) {
      throw new Error((error as Error)?.message || "Failed to create order");
    }
  },

  /** Step 2: verify payment + record the unlock, after Razorpay checkout succeeds. */
  verifyVideoSubscription: async (params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    mentorId: string;
    learnerId: string;
  }): Promise<{ success: boolean; expiresAt: string }> => {
    try {
      return await invokeFunction("verify-video-subscription", params);
    } catch (error) {
      throw new Error((error as Error)?.message || "Payment verification failed");
    }
  },
};
