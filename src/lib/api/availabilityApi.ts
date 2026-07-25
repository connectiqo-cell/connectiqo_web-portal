import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

export interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked?: boolean;
}

/**
 * Ported (subset used by booking flow + mentor dashboard) from
 * connectfront/src/api/availabilityApi.js. The mobile app also has a
 * declarative `syncMentorAvailability` bulk-diff function for its calendar
 * grid editor; this web version uses simple add/delete of individual slots
 * instead, which fits a plain list-based editor better.
 */
export const availabilityApi = {
  getAvailabilityForMentor: async (mentorId: string): Promise<AvailabilitySlot[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("id, date, start_time, end_time, is_booked")
        .eq("mentor_id", mentorId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  addAvailabilitySlot: async ({
    mentorId,
    date,
    startTime,
    endTime,
  }: {
    mentorId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<AvailabilitySlot> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("availability_slots")
        .insert([{ mentor_id: mentorId, date, start_time: startTime, end_time: endTime, is_booked: false }])
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AvailabilitySlot;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  deleteAvailabilitySlot: async (slotId: string): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("availability_slots")
        .delete()
        .eq("id", slotId)
        .eq("is_booked", false);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
