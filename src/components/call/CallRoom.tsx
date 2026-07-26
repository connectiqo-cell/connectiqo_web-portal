"use client";

import { useMeeting } from "@videosdk.live/react-sdk";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CallControls } from "@/components/call/CallControls";
import { ParticipantTile } from "@/components/call/ParticipantTile";
import { bookingApi } from "@/lib/api/bookingApi";
import { recordingsApi } from "@/lib/api/recordingsApi";
import { fetchRecordingUrl } from "@/lib/api/videoCallApi";
import { ROUTES } from "@/lib/routes";

const RECORDING_POLL_ATTEMPTS = 6;
const RECORDING_POLL_DELAY_MS = 5000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fire-and-forget: VideoSDK processes recordings asynchronously after the
 * call ends, so the file isn't available immediately. Polls with a fixed
 * delay and saves the playback URL once found — never blocks the host's
 * navigation away from the call.
 */
async function pollAndSaveRecording({
  bookingId,
  mentorId,
  learnerId,
  meetingId,
  token,
}: {
  bookingId: string;
  mentorId: string;
  learnerId: string;
  meetingId: string;
  token: string;
}) {
  for (let attempt = 1; attempt <= RECORDING_POLL_ATTEMPTS; attempt += 1) {
    const recordingUrl = await fetchRecordingUrl({ meetingId, token }).catch(() => null);
    if (recordingUrl) {
      await recordingsApi
        .updateRecordingUrls({
          bookingId,
          recordingUrl,
          recordingPlaybackUrl: recordingUrl,
          mentorId,
          learnerId,
          meetingId,
        })
        .catch((err) => console.warn("Recording URL save failed:", err));
      return;
    }
    await sleep(RECORDING_POLL_DELAY_MS);
  }
}

export function CallRoom({
  bookingId,
  mentorId,
  learnerId,
  meetingId,
  token,
  isHost,
  recordingRequested,
  otherUserName,
}: {
  bookingId: string;
  mentorId: string;
  learnerId: string;
  meetingId: string;
  token: string;
  isHost: boolean;
  recordingRequested: boolean;
  otherUserName: string;
}) {
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const bothJoinedRef = useRef(false);
  const recordingStartedRef = useRef(false);
  const leavingRef = useRef(false);

  const { join, leave, participants, localParticipant, startRecording } = useMeeting({
    onMeetingJoined: () => setJoined(true),
    onError: ({ message, code }) => setError(message || code || "Something went wrong"),
  });

  useEffect(() => {
    join();
    // Join once on mount — `join` identity can change across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remoteIds = Array.from(participants.keys());
  const participantCount = remoteIds.length + (localParticipant ? 1 : 0);

  useEffect(() => {
    if (participantCount >= 2) bothJoinedRef.current = true;

    if (
      isHost &&
      recordingRequested &&
      participantCount >= 2 &&
      !recordingStartedRef.current
    ) {
      recordingStartedRef.current = true;
      startRecording().catch((err) => console.warn("startRecording failed:", err));
      recordingsApi
        .upsertSessionForBooking({ bookingId, mentorId, learnerId, meetingId })
        .catch((err) => console.warn("Recording session row not created:", err));
    }
  }, [participantCount, isHost, recordingRequested, startRecording, bookingId, mentorId, learnerId, meetingId]);

  const handleLeave = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    try {
      leave();
    } catch {
      // leave() can throw if the socket already dropped — cleanup below still runs.
    }

    try {
      if (bothJoinedRef.current) {
        await bookingApi.updateBookingStatus({ bookingId, status: "completed" });
      }
      if (isHost) await bookingApi.clearMeetingId(bookingId);
    } catch (err) {
      console.warn("Post-call cleanup failed:", err);
    }

    if (isHost && recordingRequested && bothJoinedRef.current && recordingStartedRef.current) {
      pollAndSaveRecording({ bookingId, mentorId, learnerId, meetingId, token }).catch((err) =>
        console.warn("Recording poll failed:", err),
      );
    }

    router.push(ROUTES.bookings);
  };

  if (!joined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-text-secondary">
        <Loader2 size={28} className="animate-spin" />
        <p>Joining session…</p>
        {error ? <p className="text-sm text-accent-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {localParticipant ? (
          <ParticipantTile participantId={localParticipant.id} label="You" />
        ) : null}
        {remoteIds.map((id) => (
          <ParticipantTile key={id} participantId={id} label={otherUserName} />
        ))}
      </div>

      {remoteIds.length === 0 ? (
        <p className="text-center text-sm text-text-muted">
          Waiting for {otherUserName} to join…
        </p>
      ) : null}

      {error ? <p className="text-center text-sm text-accent-error">{error}</p> : null}

      <CallControls onLeave={handleLeave} />
    </div>
  );
}
