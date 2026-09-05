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
   * within the session window. Gives the mentor a 7-day window to propose a new time.
   */
  markForReschedule: async (bookingId: string, reason: "mentor_noshow" | "technical") => {
    const supabase = createClient();
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      const { data, error } = await supabase
        .from("bookings")
        
        .update({
          status: "reschedule_pending",
          reschedule_reason: reason,
          reschedule_deadline: deadline.toISOString(),
        })
        .eq("id", bookingId)
        .select()
        .single();
      if (error) throw error;

      notifyReschedule({ type: "reschedule_requested", bookingId });
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  proposeSlot: async ({
    bookingId,
    mentorId,
    learnerId,
    date,
    startTime,
    endTime,
    reason,
  }: {
    bookingId: string;
    mentorId: string;
    learnerId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string | null;
  }): Promise<RescheduleRequest> => {
    const supabase = createClient();
    try {
      await supabase
        .from("reschedule_requests")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("booking_id", bookingId)
        .eq("status", "pending");

      const { data, error } = await supabase
        .from("reschedule_requests")
        .insert({
          booking_id: bookingId,
          mentor_id: mentorId,
          learner_id: learnerId,
          reason,
          proposed_date: date,
          proposed_start_time: startTime,
          proposed_end_time: endTime,
        })
        .select()
        .single();
      if (error) throw error;

      notifyReschedule({ type: "reschedule_proposed", bookingId, requestId: data.id });
      return data as RescheduleRequest;
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

  /** Learner: decline a proposal. Mentor can then submit another one. */
  declineProposal: async (requestId: string, bookingId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("reschedule_requests")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
      notifyReschedule({ type: "reschedule_declined", bookingId, requestId });
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
