import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { name: string | null; avatar_url: string | null } | null;
}

/** Ported (subset) from connectfront/src/api/reviewsApi.js — public read, RLS allows it. */
export const reviewsApi = {
  getReviewsForMentor: async (supabase: SupabaseClient, mentorId: string): Promise<ReviewRow[]> => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`*, profiles!learner_id (name, avatar_url)`)
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as ReviewRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  submitReview: async (params: {
    bookingId: string;
    mentorId: string;
    learnerId: string;
    rating: number;
    comment?: string;
  }) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          booking_id: params.bookingId,
          mentor_id: params.mentorId,
          learner_id: params.learnerId,
          rating: params.rating,
          comment: params.comment || null,
        })
        .select()
        .single();
      if (error) throw error;

      supabase.functions
        .invoke("recalculate-mentor-rating", { body: { mentorId: params.mentorId } })
        .catch((err) => console.warn("recalculate-mentor-rating failed:", err));

      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Single query for which of a set of bookings already have a review. */
  getReviewedBookingIds: async (bookingIds: string[]): Promise<Set<string>> => {
    if (!bookingIds.length) return new Set();
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds);
      if (error) throw error;
      return new Set((data || []).map((r) => r.booking_id as string));
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getReviewForBooking: async (bookingId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
