import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

export interface BookingRow {
  id: string;
  status: string;
  message: string | null;
  recording_requested: boolean | null;
  meeting_id: string | null;
  created_at: string;
  mentor_id: string;
  learner_id: string;
  slot_id: string;
  profiles: { id: string; name: string | null; avatar_url: string | null } | null;
  learner_profile?: { id: string; name: string | null; avatar_url: string | null } | null;
  availability_slots: { date: string; start_time: string; end_time: string } | null;
}

export type RecordedSession = BookingRow & { recording_playback_url: string };

const RECORDING_URL_PLACEHOLDER = "pending";

/**
 * Ported (learner-facing subset) from connectfront/src/api/bookingApi.js.
 * Mentor-side queries (getBookingsByMentor, etc.) land with the mentor dashboard phase.
 */
export const bookingApi = {
  getBooking: async (bookingId: string): Promise<BookingRow> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*,
           profiles:mentor_id ( id, name, avatar_url ),
           learner_profile:profiles!learner_id ( id, name, avatar_url ),
           availability_slots ( date, start_time, end_time )`,
        )
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      return data as unknown as BookingRow;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  setMeetingId: async ({ bookingId, meetingId }: { bookingId: string; meetingId: string }) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ meeting_id: meetingId })
        .eq("id", bookingId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  clearMeetingId: async (bookingId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ meeting_id: null })
        .eq("id", bookingId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Marks a session completed, credits the mentor's wallet, and triggers the
   * Route payout transfer (fire-and-forget) — same RPCs/Edge Function the
   * mobile app relies on for earnings to move from pending to available.
   */
  updateBookingStatus: async ({
    bookingId,
    status,
  }: {
    bookingId: string;
    status: string;
  }): Promise<BookingRow | null> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .neq("status", status)
        .select()
        .single();
      if (error) throw error;
      if (!data) return null;

      const booking = data as unknown as BookingRow;

      if (status === "completed" && booking.mentor_id) {
        await supabase.rpc("increment_mentor_sessions", { p_mentor_id: booking.mentor_id });

        const { error: walletError } = await supabase.rpc("complete_session_payment", {
          p_booking_id: bookingId,
          p_mentor_id: booking.mentor_id,
        });
        if (walletError) console.error("Failed to credit wallet:", walletError);

        supabase.functions
          .invoke("transfer-session-payout", { body: { bookingId, mentorId: booking.mentor_id } })
          .then(({ error: transferError }) => {
            if (transferError) console.warn("transfer-session-payout failed:", transferError.message);
          })
          .catch((err) => console.warn("transfer-session-payout fetch error:", err));
      }

      supabase.functions
        .invoke("notify-booking-status", { body: { bookingId, status } })
        .catch((err) => console.warn("notify-booking-status failed:", err));

      return booking;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** All bookings for a learner, any status — powers the derived notification feed. */
  getBookingsByLearner: async (learnerId: string): Promise<BookingRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*, profiles:mentor_id (id, name, avatar_url), availability_slots (date, start_time, end_time)`,
        )
        .eq("learner_id", learnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as BookingRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** All bookings for a mentor, any status — powers the derived notification feed. */
  getBookingsByMentor: async (mentorId: string): Promise<BookingRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*, learner_profile:profiles!learner_id (id, name, avatar_url), availability_slots (date, start_time, end_time)`,
        )
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as BookingRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getUpcomingBookingsByLearner: async (learnerId: string): Promise<BookingRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*, profiles:mentor_id (id, name, avatar_url), availability_slots (date, start_time, end_time)`,
        )
        .eq("learner_id", learnerId)
        .in("status", ["pending", "confirmed", "reschedule_pending"]);
      if (error) throw error;
      const rows = (data as unknown as BookingRow[]) || [];
      return rows.sort((a, b) => {
        const da = `${a.availability_slots?.date ?? ""} ${a.availability_slots?.start_time ?? ""}`;
        const db = `${b.availability_slots?.date ?? ""} ${b.availability_slots?.start_time ?? ""}`;
        return da.localeCompare(db);
      });
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getBookingHistoryByLearner: async (
    learnerId: string,
    page = 0,
    pageSize = 10,
  ): Promise<BookingRow[]> => {
    const supabase = createClient();
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*, profiles:mentor_id (id, name, avatar_url), availability_slots (date, start_time, end_time)`,
        )
        .eq("learner_id", learnerId)
        .in("status", ["completed", "cancelled", "rejected", "rescheduled"])
        .order("date", { referencedTable: "availability_slots", ascending: false })
        .order("start_time", { referencedTable: "availability_slots", ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data as unknown as BookingRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getUpcomingBookingsByMentor: async (mentorId: string): Promise<BookingRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*, learner_profile:profiles!learner_id (id, name, avatar_url), availability_slots (date, start_time, end_time)`,
        )
        .eq("mentor_id", mentorId)
        .in("status", ["pending", "confirmed", "reschedule_pending"]);
      if (error) throw error;
      const rows = (data as unknown as BookingRow[]) || [];
      return rows.sort((a, b) => {
        const da = `${a.availability_slots?.date ?? ""} ${a.availability_slots?.start_time ?? ""}`;
        const db = `${b.availability_slots?.date ?? ""} ${b.availability_slots?.start_time ?? ""}`;
        return da.localeCompare(db);
      });
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getBookingHistoryByMentor: async (
    mentorId: string,
    page = 0,
    pageSize = 10,
  ): Promise<BookingRow[]> => {
    const supabase = createClient();
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*, learner_profile:profiles!learner_id (id, name, avatar_url), availability_slots (date, start_time, end_time)`,
        )
        .eq("mentor_id", mentorId)
        .in("status", ["completed", "cancelled", "rejected", "rescheduled"])
        .order("date", { referencedTable: "availability_slots", ascending: false })
        .order("start_time", { referencedTable: "availability_slots", ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data as unknown as BookingRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Completed sessions (as either learner or mentor) that have a usable
   * recording. `recordings` has no FK to `bookings` (mobile's bookingApi.js
   * notes this explicitly), so bookings and recordings are fetched
   * separately and merged client-side, same as attachRecordings() on mobile.
   */
  getRecordedSessions: async (userId: string): Promise<RecordedSession[]> => {
    const supabase = createClient();
    try {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(
          `*,
           profiles:mentor_id ( id, name, avatar_url ),
           learner_profile:profiles!learner_id ( id, name, avatar_url ),
           availability_slots ( date, start_time, end_time )`,
        )
        .or(`learner_id.eq.${userId},mentor_id.eq.${userId}`)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (bookings as unknown as BookingRow[]) || [];
      if (!rows.length) return [];

      const { data: recordings } = await supabase
        .from("recordings")
        .select("booking_id, recording_url, recording_playback_url")
        .in(
          "booking_id",
          rows.map((b) => b.id),
        );

      const recMap = new Map(
        (recordings || []).map((r) => [
          r.booking_id as string,
          (r.recording_playback_url || r.recording_url) as string | null,
        ]),
      );

      return rows
        .map((booking) => ({
          ...booking,
          recording_playback_url: recMap.get(booking.id) || null,
        }))
        .filter(
          (b): b is RecordedSession =>
            !!b.recording_playback_url && b.recording_playback_url !== RECORDING_URL_PLACEHOLDER,
        );
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  cancelBooking: async (bookingId: string): Promise<BookingRow> => {
    const supabase = createClient();
    try {
      const booking = await bookingApi.getBooking(bookingId);

      await supabase
        .from("availability_slots")
        .update({ is_booked: false })
        .eq("id", booking.slot_id);

      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BookingRow;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
