import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

/** Satisfies NOT NULL on recordings.recording_url until VideoSDK returns a real URL. */
export const RECORDING_URL_PLACEHOLDER = "pending";

/** Ported from connectfront/src/api/recordingsApi.js. */
export const recordingsApi = {
  /** Create or replace the session row for a booking (host stores the VideoSDK room id here). */
  upsertSessionForBooking: async ({
    bookingId,
    mentorId,
    learnerId,
    meetingId,
  }: {
    bookingId: string;
    mentorId: string;
    learnerId: string;
    meetingId: string | null;
  }) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.from("recordings").upsert(
        {
          booking_id: bookingId,
          mentor_id: mentorId,
          learner_id: learnerId,
          meeting_id: meetingId ?? null,
          recording_url: RECORDING_URL_PLACEHOLDER,
          recording_playback_url: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "booking_id" },
      );
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateRecordingUrls: async ({
    bookingId,
    recordingUrl,
    recordingPlaybackUrl,
    mentorId,
    learnerId,
    meetingId,
  }: {
    bookingId: string;
    recordingUrl: string | null;
    recordingPlaybackUrl?: string | null;
    mentorId?: string;
    learnerId?: string;
    meetingId?: string | null;
  }) => {
    const supabase = createClient();
    try {
      const url = recordingUrl || RECORDING_URL_PLACEHOLDER;
      const patch: Record<string, unknown> = {
        recording_url: url,
        recording_playback_url: recordingPlaybackUrl ?? recordingUrl ?? null,
        updated_at: new Date().toISOString(),
      };
      if (meetingId != null) patch.meeting_id = meetingId;

      if (mentorId && learnerId) {
        const { error } = await supabase.from("recordings").upsert(
          { booking_id: bookingId, mentor_id: mentorId, learner_id: learnerId, ...patch },
          { onConflict: "booking_id" },
        );
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("recordings").update(patch).eq("booking_id", bookingId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
