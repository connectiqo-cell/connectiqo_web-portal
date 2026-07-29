import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

import { MENTOR_SELECT, type MentorProfileRow } from "./mentorApi";

export const bookmarkApi = {
  isSaved: async (learnerId: string, mentorId: string): Promise<boolean> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("saved_mentors")
        .select("id")
        .eq("learner_id", learnerId)
        .eq("mentor_id", mentorId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    } catch {
      return false;
    }
  },

  saveMentor: async (learnerId: string, mentorId: string): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("saved_mentors")
        .insert([{ learner_id: learnerId, mentor_id: mentorId }]);
      if (error && error.code !== "23505") throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  unsaveMentor: async (learnerId: string, mentorId: string): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("saved_mentors")
        .delete()
        .eq("learner_id", learnerId)
        .eq("mentor_id", mentorId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getSavedMentors: async (learnerId: string): Promise<MentorProfileRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("saved_mentors")
        .select("mentor_id, created_at")
        .eq("learner_id", learnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const mentorIds = (data || []).map((row) => row.mentor_id as string);
      if (!mentorIds.length) return [];

      const { data: mentors, error: mentorsError } = await supabase
        .from("mentor_profiles")
        .select(MENTOR_SELECT)
        .in("id", mentorIds);
      if (mentorsError) throw mentorsError;

      const byId = new Map((mentors as unknown as MentorProfileRow[]).map((m) => [m.id, m]));
      return mentorIds.map((id) => byId.get(id)).filter((m): m is MentorProfileRow => !!m);
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
