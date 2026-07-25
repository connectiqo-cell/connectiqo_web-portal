"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { createVideoMeeting, getVideoSdkToken } from "@/lib/api/videoCallApi";
import { createClient } from "@/lib/supabase/client";

/**
 * Resolves everything needed to join a call for a booking: the booking row,
 * whether the current user is the host (mentor), a VideoSDK token, and the
 * room's meetingId. The host creates the room on demand; the learner waits
 * for it to appear on the booking row (Realtime, with a short poll fallback)
 * — mirrors the mentor-creates/learner-waits flow in VideoCallScreen.js.
 */
export function useCallSetup(bookingId: string) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const isHost = Boolean(user?.id && booking?.mentor_id && user.id === booking.mentor_id);
  const isParticipant = Boolean(
    user?.id && booking && (user.id === booking.mentor_id || user.id === booking.learner_id),
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [bookingRow, videoToken] = await Promise.all([
          bookingApi.getBooking(bookingId),
          getVideoSdkToken(),
        ]);
        if (cancelled) return;
        setBooking(bookingRow);
        setToken(videoToken);
        if (bookingRow.meeting_id) setMeetingId(bookingRow.meeting_id);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load this session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, user]);

  useEffect(() => {
    if (!booking || meetingId || isHost) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`booking-${bookingId}-meeting`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${bookingId}` },
        (payload) => {
          const nextMeetingId = (payload.new as { meeting_id?: string | null } | null)
            ?.meeting_id;
          if (nextMeetingId) setMeetingId(nextMeetingId);
        },
      )
      .subscribe();

    // Belt-and-suspenders fallback in case the Realtime event is missed.
    const pollId = setInterval(async () => {
      const fresh = await bookingApi.getBooking(bookingId).catch(() => null);
      if (fresh?.meeting_id) setMeetingId(fresh.meeting_id);
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollId);
    };
  }, [booking, meetingId, isHost, bookingId]);

  const startSession = useCallback(async () => {
    if (!token || !isHost || meetingId) return;
    setStarting(true);
    setError("");
    try {
      const newMeetingId = await createVideoMeeting(token);
      await bookingApi.setMeetingId({ bookingId, meetingId: newMeetingId });
      setMeetingId(newMeetingId);
    } catch (err) {
      setError((err as Error)?.message || "Could not start the session");
    } finally {
      setStarting(false);
    }
  }, [token, isHost, meetingId, bookingId]);

  return { loading, error, booking, isHost, isParticipant, token, meetingId, starting, startSession };
}
