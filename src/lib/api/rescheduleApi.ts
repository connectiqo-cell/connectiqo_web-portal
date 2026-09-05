import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

export interface RescheduleRequest {
  id: string;
  booking_id: string;
  mentor_id: string;
  learner_id: string;
  reason: string | null;
  status: string;
  proposed_date: string | null;
  proposed_start_time: string | null;
  proposed_end_time: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ProposalWithBooking extends RescheduleRequest {
  bookings: {
    id: string;
    mentor_id: string;
    learner_id: string;
    reschedule_reason: string | null;
    profiles: { id: string; name: string | null; avatar_url: string | null } | null;
    availability_slots: { date: string; start_time: string; end_time: string } | null;
  } | null;
}

const PROPOSAL_SELECT = `
  *,
  bookings (
    id, mentor_id, learner_id, reschedule_reason,
    profiles:mentor_id ( id, name, avatar_url ),
    availability_slots ( date, start_time, end_time )
  )
`;

function notifyReschedule(payload: { type: string; bookingId: string; requestId?: string }) {
  const supabase = createClient();
  supabase.functions
    .invoke("notify-reschedule", { body: payload })
    .catch((err) => console.warn("notify-reschedule failed:", err));
}

/** Ported from connectfront/src/api/rescheduleApi.js — proposal-review subset used on web. */
export const rescheduleApi = {
  /**
   * Learner: mark a booking as needing reschedule after the mentor didn't join
   * within the session window. Gives the mentor a 7-day window to propose a new
   * time. Enforced server-side by request_reschedule (rejects if the session
   * hasn't actually ended yet — a check that can't live in the client alone).
   */
  markForReschedule: async (bookingId: string, reason: "mentor_noshow" | "technical") => {
    const supabase = createClient();
    try {
      const { error } = await supabase.rpc("request_reschedule", {
        p_booking_id: bookingId,
        p_reason: reason,
      });
      if (error) throw error;

      notifyReschedule({ type: "reschedule_requested", bookingId });
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Mentor: propose a new time for a booking awaiting reschedule. Duration
   * match, conflict, and attempt-cap checks all happen server-side in
   * propose_reschedule_slot — mentorId/learnerId/reason are derived from the
   * booking row there rather than trusted from the client.
   */
  proposeSlot: async ({
    bookingId,
    date,
    startTime,
    endTime,
  }: {
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<{ requestId: string; expiresAt: string }> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("propose_reschedule_slot", {
        p_booking_id: bookingId,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
      });
      if (error) throw error;

      notifyReschedule({ type: "reschedule_proposed", bookingId, requestId: data.request_id });
      return { requestId: data.request_id, expiresAt: data.expires_at };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Non-sensitive read powering "Attempt X of 3" UI — no RPC needed. */
  getDeclinedCount: async (bookingId: string): Promise<number> => {
    const supabase = createClient();
    try {
      const { count, error } = await supabase
        .from("reschedule_requests")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", bookingId)
        .eq("status", "declined");
      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Learner: all proposals currently awaiting their response, across all bookings. */
  getProposalsForLearner: async (learnerId: string): Promise<ProposalWithBooking[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("reschedule_requests")
        .select(PROPOSAL_SELECT)
        .eq("learner_id", learnerId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as ProposalWithBooking[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getProposalById: async (requestId: string): Promise<ProposalWithBooking> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("reschedule_requests")
        .select(PROPOSAL_SELECT)
        .eq("id", requestId)
        .single();
      if (error) throw error;
      return data as unknown as ProposalWithBooking;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Learner: accept a proposal. Atomically creates the new booking via DB RPC. */
  acceptProposal: async (requestId: string, bookingId: string) => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("accept_reschedule_proposal", {
        p_request_id: requestId,
      });
      if (error) throw error;
      notifyReschedule({ type: "reschedule_accepted", bookingId, requestId });
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Learner: decline a proposal. Mentor can then submit another one, unless
   * this was the 3rd decline — decline_reschedule_proposal flips the booking
   * to reschedule_unresolved instead, and that's reflected in the return value.
   */
  declineProposal: async (requestId: string, bookingId: string): Promise<{ unresolved: boolean }> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("decline_reschedule_proposal", {
        p_request_id: requestId,
      });
      if (error) throw error;
      notifyReschedule({
        type: data.unresolved ? "reschedule_unresolved" : "reschedule_declined",
        bookingId,
        requestId,
      });
      return { unresolved: data.unresolved };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};

export function rescheduleReasonLabel(
  reason: string | null | undefined,
  viewer: "mentor" | "learner",
): string {
  if (reason === "mentor_noshow") {
    return viewer === "mentor" ? "You didn't join the session" : "Mentor didn't join the session";
  }
  if (reason === "technical") {
    return "Session ended too early (technical issue)";
  }
  return "Session could not be completed";
}
