import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";
import { uploadFileWithProgress } from "@/lib/utils/uploadWithProgress";

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

export interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  objectives: string | null;
  content_type: string | null;
  target_audience: string | null;
  platforms: string[] | null;
  video_duration_seconds: number | null;
  eligibility_criteria: string | null;
  min_followers: number | null;
  budget_per_winner: number;
  winner_count: number;
  content_usage_rights: string | null;
  category: string | null;
  cover_image_url: string | null;
  location: string | null;
  application_deadline: string | null;
  submission_deadline: string | null;
  status: "draft" | "published" | "closed" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  // campaigns.brand_id only FKs to profiles, not brand_profiles directly, so
  // this embeds profiles (name/avatar_url) rather than brand_profiles —
  // profiles.name is already set to the company name at brand signup
  // (see signup/brand/page.tsx), so no second hop/query is needed.
  brand?: { name: string | null; avatar_url: string | null } | null;
  /** Only populated by queries that ask for it (getCampaignsByBrand, getAllCampaignsForAdmin). */
  application_count?: number;
}

export interface CampaignApplication {
  id: string;
  campaign_id: string;
  creator_id: string;
  pitch: string;
  status: "pending" | "shortlisted" | "accepted" | "rejected";
  applied_at: string;
  decided_at: string | null;
  campaign?: Pick<Campaign, "id" | "title" | "status" | "budget_per_winner"> | null;
  creator?: { id: string; name: string | null; avatar_url: string | null } | null;
}

/**
 * What a brand sees about an applicant. Read from the account's own profile
 * (mentor_profiles), not a CollabHub-specific copy: bio, location and links
 * are already filled in there via Edit Profile, and a second copy only drifts
 * from the one the creator actually maintains.
 */
export interface CreatorProfile {
  id: string;
  portfolio_links: string[] | null;
  social_links: Record<string, string> | null;
  location: string | null;
  bio: string | null;
}

export interface CampaignSubmission {
  id: string;
  application_id: string;
  creator_id: string;
  original_storage_path: string | null;
  watermarked_storage_path: string | null;
  watermarked_video_url: string | null;
  thumbnail_url: string | null;
  status: "processing" | "submitted" | "revision_requested" | "approved" | "rejected";
  feedback: string | null;
  /** Set by the transcoder when a watermark pass fails; status stays 'processing'. */
  watermark_error: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  updated_at: string;
}

/** CollabHub Phase 3: a paid unlock of the clean (non-watermarked) video —
 * both the brand (payer) and creator (paid) get access once this exists. */
export interface CampaignUnlock {
  id: string;
  application_id: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string;
  amount_paid: number;
  unlocked_at: string;
}

export interface CreateCampaignOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  creatorAmount: number;
  convenienceFee: number;
  totalAmount: number;
  platformFeePercent: number;
  gstPercent: number;
  campaignTitle: string;
}

export type CampaignInput = Omit<
  Campaign,
  "id" | "brand_id" | "status" | "created_at" | "updated_at" | "brand"
>;

const CAMPAIGN_SELECT = "*, brand:brand_id ( name, avatar_url )";
const CAMPAIGN_SELECT_WITH_COUNT = "*, brand:brand_id ( name, avatar_url ), campaign_applications ( count )";

function withApplicationCount(row: Record<string, unknown>): Campaign {
  const counted = row.campaign_applications as { count: number }[] | undefined;
  return { ...row, application_count: counted?.[0]?.count ?? 0 } as Campaign;
}

export const collabHubApi = {
  /** Brand: all of their own campaigns, any status. */
  getCampaignsByBrand: async (brandId: string): Promise<Campaign[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select(CAMPAIGN_SELECT_WITH_COUNT)
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as unknown as Record<string, unknown>[]) || []).map(withApplicationCount);
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Creator-facing discovery — published campaigns only, newest first. */
  getPublishedCampaigns: async ({
    category,
    platform,
  }: { category?: string; platform?: string } = {}): Promise<Campaign[]> => {
    const supabase = createClient();
    try {
      let query = supabase.from("campaigns").select(CAMPAIGN_SELECT).eq("status", "published");
      if (category) query = query.eq("category", category);
      if (platform) query = query.contains("platforms", [platform]);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Campaign[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Admin moderation view — every campaign regardless of status (RLS admin_all_campaigns policy). */
  getAllCampaignsForAdmin: async (): Promise<Campaign[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select(CAMPAIGN_SELECT_WITH_COUNT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as unknown as Record<string, unknown>[]) || []).map(withApplicationCount);
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getCampaign: async (campaignId: string): Promise<Campaign | null> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select(CAMPAIGN_SELECT)
        .eq("id", campaignId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Campaign | null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Keyed by the uploading brand's own id, not the campaign's — lets the
   * "new campaign" form upload an image before the campaign row exists yet,
   * same pattern as profileApi.uploadAvatar. Returns the public URL only;
   * the caller includes it in the create/update fields itself. */
  uploadCampaignCoverImage: async ({ brandId, file }: { brandId: string; file: File }): Promise<string> => {
    const supabase = createClient();
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${brandId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("campaign-covers")
        .upload(filePath, file, { contentType: file.type || "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("campaign-covers").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  createCampaign: async ({
    brandId,
    fields,
    publish,
  }: {
    brandId: string;
    fields: CampaignInput;
    publish: boolean;
  }): Promise<Campaign> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({ ...fields, brand_id: brandId, status: publish ? "published" : "draft" })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Campaign;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateCampaign: async ({
    campaignId,
    fields,
  }: {
    campaignId: string;
    fields: Partial<CampaignInput>;
  }): Promise<Campaign> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", campaignId)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Campaign;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setCampaignStatus: async ({
    campaignId,
    status,
  }: {
    campaignId: string;
    status: Campaign["status"];
  }): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", campaignId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Creator applying to a campaign. UNIQUE(campaign_id, creator_id) blocks duplicate applications. */
  applyToCampaign: async ({
    campaignId,
    creatorId,
    pitch,
  }: {
    campaignId: string;
    creatorId: string;
    pitch: string;
  }): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("campaign_applications")
        .insert({ campaign_id: campaignId, creator_id: creatorId, pitch });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMyApplication: async ({
    campaignId,
    creatorId,
  }: {
    campaignId: string;
    creatorId: string;
  }): Promise<CampaignApplication | null> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_applications")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("creator_id", creatorId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CampaignApplication | null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getApplicationById: async (applicationId: string): Promise<CampaignApplication | null> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_applications")
        .select("*, campaign:campaign_id ( id, title, status, budget_per_winner )")
        .eq("id", applicationId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CampaignApplication | null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Creator's "My Applications" tracker. */
  getMyApplications: async (creatorId: string): Promise<CampaignApplication[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_applications")
        .select("*, campaign:campaign_id ( id, title, status, budget_per_winner )")
        .eq("creator_id", creatorId)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as CampaignApplication[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Brand's view of applicants to one of their campaigns. */
  getApplicationsForCampaign: async (campaignId: string): Promise<CampaignApplication[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_applications")
        .select("*, creator:creator_id ( id, name, avatar_url )")
        .eq("campaign_id", campaignId)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as CampaignApplication[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** New (pending) applicants across every campaign owned by this brand —
   * powers the brand-side notifications feed, same derived-not-stored
   * pattern as collabHubNotifications in notificationApi.ts. Includes
   * "shortlisted" too — those still need a final accept/reject, so they're
   * as much "needs your attention" as a brand-new applicant. */
  getPendingApplicationsForBrand: async (brandId: string): Promise<CampaignApplication[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_applications")
        .select("*, campaign:campaigns!inner ( id, title, brand_id ), creator:creator_id ( id, name, avatar_url )")
        .eq("campaign.brand_id", brandId)
        .in("status", ["pending", "shortlisted"])
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as CampaignApplication[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Submitted videos awaiting this brand's review, across every campaign. */
  getSubmissionsAwaitingReviewForBrand: async (
    brandId: string,
  ): Promise<(CampaignSubmission & { campaign_title?: string | null; campaign_id?: string | null })[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_submissions")
        .select(
          "*, campaign_applications!inner ( campaign_id, campaigns!inner ( id, title, brand_id ) )",
        )
        .eq("campaign_applications.campaigns.brand_id", brandId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      type Row = CampaignSubmission & {
        campaign_applications?: { campaign_id: string; campaigns?: { id: string; title: string } | null } | null;
      };
      return ((data as unknown as Row[]) || []).map((row) => ({
        ...row,
        campaign_title: row.campaign_applications?.campaigns?.title ?? null,
        campaign_id: row.campaign_applications?.campaigns?.id ?? null,
      }));
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Batch-fetch for the brand's applicant review screen — creator_id has
   * no direct FK to mentor_profiles (only to profiles), so this is a separate
   * query rather than a nested embed, same reasoning as the brand/profiles
   * join above. Keyed by creator id for easy lookup. */
  getCreatorProfiles: async (creatorIds: string[]): Promise<Record<string, CreatorProfile>> => {
    if (creatorIds.length === 0) return {};
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select("id, bio, location, website, instagram_url, youtube_url, linkedin_url, x_url, twitter_url")
        .in("id", creatorIds);
      if (error) throw error;

      const byId: Record<string, CreatorProfile> = {};
      for (const row of (data as unknown as Record<string, string | null>[]) || []) {
        // The profile stores one column per network; the card wants a map of
        // whichever ones are set.
        const social: Record<string, string> = {};
        for (const [key, column] of [
          ["instagram", "instagram_url"],
          ["youtube", "youtube_url"],
          ["linkedin", "linkedin_url"],
          ["x", "x_url"],
          ["twitter", "twitter_url"],
        ] as const) {
          const url = row[column];
          if (url) social[key] = url;
        }
        byId[row.id as string] = {
          id: row.id as string,
          bio: row.bio ?? null,
          location: row.location ?? null,
          portfolio_links: row.website ? [row.website] : [],
          social_links: social,
        };
      }
      return byId;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Brand: shortlist/accept/reject — a plain RLS-scoped update, not money-moving, so no RPC needed. */
  setApplicationStatus: async ({
    applicationId,
    status,
  }: {
    applicationId: string;
    status: CampaignApplication["status"];
  }): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("campaign_applications")
        .update({ status, decided_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Brand's view of submissions across all applicants to one campaign, keyed by application_id. */
  getSubmissionsForCampaign: async (campaignId: string): Promise<Record<string, CampaignSubmission>> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_submissions")
        .select("*, campaign_applications!inner ( campaign_id )")
        .eq("campaign_applications.campaign_id", campaignId);
      if (error) throw error;
      const byApplication: Record<string, CampaignSubmission> = {};
      for (const row of (data as unknown as CampaignSubmission[]) || []) {
        byApplication[row.application_id] = row;
      }
      return byApplication;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Brand's view of unlocks across all applicants to one campaign, keyed by application_id. */
  getUnlocksForCampaign: async (campaignId: string): Promise<Record<string, CampaignUnlock>> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from("campaign_unlocks").select("*").eq("campaign_id", campaignId);
      if (error) throw error;
      const byApplication: Record<string, CampaignUnlock> = {};
      for (const row of (data as unknown as CampaignUnlock[]) || []) {
        byApplication[row.application_id] = row;
      }
      return byApplication;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getSubmissionForApplication: async (applicationId: string): Promise<CampaignSubmission | null> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_submissions")
        .select("*")
        .eq("application_id", applicationId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CampaignSubmission | null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Creator uploads/resubmits their video for an accepted application.
   * Stores the clean original in the private campaign-submissions bucket and
   * writes the row — that insert/update is what fires the database webhook to
   * the transcoder, which watermarks it and flips the row to 'submitted'.
   * Nothing is awaited here: the realtime subscription on the application page
   * shows the flip, so a closed tab can no longer lose the job. */
  submitVideo: async ({
    applicationId,
    creatorId,
    file,
    onProgress,
  }: {
    applicationId: string;
    creatorId: string;
    file: File;
    onProgress?: (pct: number) => void;
  }): Promise<CampaignSubmission> => {
    const supabase = createClient();
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const storagePath = `${creatorId}/${Date.now()}.${ext}`;
      await uploadFileWithProgress({ bucket: "campaign-submissions", path: storagePath, file, onProgress });

      const { data, error } = await supabase
        .from("campaign_submissions")
        .upsert(
          {
            application_id: applicationId,
            creator_id: creatorId,
            original_storage_path: storagePath,
            status: "processing",
            // Clears a previous failure so the worker treats this as fresh work.
            watermark_error: null,
          },
          { onConflict: "application_id" },
        )
        .select()
        .single();
      if (error) throw error;

      return data as unknown as CampaignSubmission;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Brand: approve / reject / request a revision on a watermarked submission. */
  setSubmissionStatus: async ({
    submissionId,
    status,
    feedback,
  }: {
    submissionId: string;
    status: "revision_requested" | "approved" | "rejected";
    feedback?: string;
  }): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("campaign_submissions")
        .update({ status, feedback: feedback ?? null, reviewed_at: new Date().toISOString() })
        .eq("id", submissionId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Whether an application's video has already been unlocked — both the
   * brand and creator can read this row (see migration RLS). */
  getCampaignUnlock: async (applicationId: string): Promise<CampaignUnlock | null> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("campaign_unlocks")
        .select("*")
        .eq("application_id", applicationId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as CampaignUnlock) || null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Phase 3 step 1: brand pays to unlock the clean video — only possible
   * once the submission is 'approved' (enforced server-side). */
  createCampaignOrder: async ({
    applicationId,
    brandId,
  }: {
    applicationId: string;
    brandId: string;
  }): Promise<CreateCampaignOrderResponse> => {
    try {
      return await invokeFunction<CreateCampaignOrderResponse>("create-campaign-order", { applicationId, brandId });
    } catch (error) {
      throw new Error((error as Error)?.message || "Failed to create order");
    }
  },

  /** Phase 3 step 2: verify payment + record the unlock, after Razorpay checkout succeeds. */
  verifyCampaignPayment: async (params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    applicationId: string;
    brandId: string;
  }): Promise<{ success: boolean; unlockedAt: string }> => {
    try {
      return await invokeFunction("verify-campaign-payment", params);
    } catch (error) {
      throw new Error((error as Error)?.message || "Payment verification failed");
    }
  },

  /** Signed URL for the clean (unwatermarked) original — server-side route
   * confirms a campaign_unlocks row exists and the caller is either side of
   * the deal before issuing it (storage.objects has no client read policy
   * on the private bucket at all, same reasoning as process-submission). */
  getCleanVideoUrl: async (applicationId: string): Promise<string> => {
    const supabase = createClient();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(`/api/campaigns/${applicationId}/clean-video-url`, {
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}) as { error?: string });
        throw new Error(body?.error || "Could not get the video download link");
      }
      const { url } = (await response.json()) as { url: string };
      return url;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
