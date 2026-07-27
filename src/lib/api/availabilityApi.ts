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
 * connectfront/src/api/availabilityApi.js. `syncSlotsForDate` mirrors the
 * mobile app's per-date `syncMentorAvailability` bulk-diff used by the
 * Schedule tab's toggle grid; the Availability tab still uses plain
 * add/delete of individual custom-range slots.
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

  /**
   * Bulk-publishes a single date's open slots to match `desired` exactly:
   * inserts missing start/end pairs, deletes existing unbooked slots that
   * are no longer wanted. Booked slots are never touched.
   */
  syncSlotsForDate: async ({
    mentorId,
    date,
    existing,
    desired,
  }: {
    mentorId: string;
    date: string;
    existing: AvailabilitySlot[];
    desired: { startTime: string; endTime: string }[];
  }): Promise<void> => {
    const supabase = createClient();
    try {
      const key = (s: string, e: string) => `${s}-${e}`;
      const desiredKeys = new Set(desired.map((d) => key(d.startTime, d.endTime)));
      const existingUnbooked = existing.filter((s) => !s.is_booked);
      const existingKeys = new Set(
        existingUnbooked.map((s) => key(s.start_time.slice(0, 5), s.end_time.slice(0, 5))),
      );

      const toDelete = existingUnbooked.filter(
        (s) => !desiredKeys.has(key(s.start_time.slice(0, 5), s.end_time.slice(0, 5))),
      );
      const toInsert = desired.filter((d) => !existingKeys.has(key(d.startTime, d.endTime)));

      if (toDelete.length) {
        const { error } = await supabase
          .from("availability_slots")
          .delete()
          .in(
            "id",
            toDelete.map((s) => s.id),
          )
          .eq("is_booked", false);
        if (error) throw error;
      }

      if (toInsert.length) {
        const { error } = await supabase.from("availability_slots").insert(
          toInsert.map((d) => ({
            mentor_id: mentorId,
            date,
            start_time: d.startTime,
            end_time: d.endTime,
            is_booked: false,
          })),
        );
        if (error) throw error;
      }
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
