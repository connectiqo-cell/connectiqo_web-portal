"use client";

import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CallControls } from "@/components/call/CallControls";
import { CallSessionTimer } from "@/components/call/CallSessionTimer";
import { ChatPanel } from "@/components/call/ChatPanel";
import { ParticipantTile } from "@/components/call/ParticipantTile";
import { RecordingConsentModal } from "@/components/call/RecordingConsentModal";
import { ScreenShareView } from "@/components/call/ScreenShareView";
import { bookingApi } from "@/lib/api/bookingApi";
import { recordingsApi } from "@/lib/api/recordingsApi";
import { fetchRecordingUrl } from "@/lib/api/videoCallApi";
import { ROUTES } from "@/lib/routes";


const MAX_PARTICIPANTS = 2;



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
  otherUserName,
  slot,
}: {
  bookingId: string;
  mentorId: string;
  learnerId: string;
  meetingId: string;
  token: string;
  isHost: boolean;
  otherUserName: string;
  slot?: { date?: string | null; start_time?: string | null; end_time?: string | null } | null;
}) {
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [incomingRecordingRequestId, setIncomingRecordingRequestId] = useState<string | null>(null);
  const [awaitingConsent, setAwaitingConsent] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);
  const bothJoinedRef = useRef(false);
  const recordingStartedRef = useRef(false);
  const leavingRef = useRef(false);
  const pendingOutgoingRequestIdRef = useRef<string | null>(null);
  const isHostRef = useRef(isHost);
  const localParticipantIdRef = useRef<string | undefined>(undefined);

  const { leave, participants, localParticipant, startRecording, stopRecording, recordingState, presenterId } =
    useMeeting({
      onMeetingJoined: () => setJoined(true),
      onError: ({ message, code }) => setError(message || code || "Something went wrong"),
    });
  const isRecording = recordingState === "RECORDING_STARTED";

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    localParticipantIdRef.current = localParticipant?.id;
  }, [localParticipant?.id]);

  // `participants` from useMeeting() already includes the local participant
  // (VideoSDK sets it in the map on join) — filter it out here, otherwise
  // every count below is inflated by one and double-counts yourself.
  const remoteIds = Array.from(participants.keys()).filter(
    (id) => id !== localParticipant?.id,
  );
  const participantCount = remoteIds.length + (localParticipant ? 1 : 0);
  const limitExceeded = participantCount > MAX_PARTICIPANTS;

  useEffect(() => {
    if (!limitExceeded || leavingRef.current) return;
    leavingRef.current = true;
    try {
      leave();
    } catch {
      // leave() can throw if the socket already dropped.
    }
  }, [limitExceeded, leave]);

  const beginRecording = useCallback(() => {
    if (recordingStartedRef.current) return;
    recordingStartedRef.current = true;
    startRecording().catch((err) => console.warn("startRecording failed:", err));
    recordingsApi
      .upsertSessionForBooking({ bookingId, mentorId, learnerId, meetingId })
      .catch((err) => console.warn("Recording session row not created:", err));
  }, [startRecording, bookingId, mentorId, learnerId, meetingId]);

  useEffect(() => {
    if (participantCount >= 2) bothJoinedRef.current = true;
    // recordingRequested only marks that recording was paid for at booking
    // time — it no longer auto-starts recording. Every session, paid or not,
    // now requires the other participant's live in-call consent (below)
    // before recording actually begins.
  }, [participantCount]);

  // Screen recording can be requested by either participant at any time (not
  // just paid recordingRequested bookings) but needs the other party's live
  // agreement first — mirrors the mobile app's mutual-consent flow, using a
  // pub/sub data channel to exchange request/response messages in-call.
  //
  // Wire format must match the mobile app exactly (mobile is often the other
  // participant): mobile JSON.stringifies the whole payload object into the
  // `message` string itself (see connectfront's OneToOne/index.js
  // publishConsentMessage), not the SDK's separate `payload` argument. Using
  // a different convention here means mobile's `JSON.parse(entry.message)`
  // throws on our messages and silently drops them — the request never
  // reaches a mobile participant.
  const publishRef = useRef<
    ((message: string, options: { persist?: boolean; sendOnly?: string[] }) => Promise<void>) | null
  >(null);

  const publishConsent = (data: Record<string, unknown>) => {
    // TEMP DIAGNOSTIC — remove once the recording-consent handoff is confirmed working.
    console.log("[RecordingConsent] publishing", data);
    publishRef.current?.(JSON.stringify(data), { persist: true });
  };

  const handleConsentMessage = useCallback(
    (msg: { message: string; senderId: string }) => {
      // TEMP DIAGNOSTIC — remove once the recording-consent handoff is confirmed working.
      console.log("[RecordingConsent] received raw message", msg);
      if (msg.senderId === localParticipantIdRef.current) {
        console.log("[RecordingConsent] ignoring — it's our own echoed message");
        return;
      }

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(msg.message);
      } catch (e) {
        console.log("[RecordingConsent] failed to JSON.parse message.message:", e);
        return;
      }
      console.log("[RecordingConsent] parsed payload", payload);
      if (!payload || typeof payload !== "object" || typeof payload.type !== "string") return;

      if (payload.type === "RECORDING_CONSENT_REQUEST") {
        setIncomingRecordingRequestId((payload.requestId as string) ?? null);
        return;
      }

      if (payload.type === "RECORDING_CONSENT_RESPONSE") {
        const requestId = payload.requestId as string | undefined;
        const agreed = Boolean(payload.agreed);
        if (!requestId || requestId !== pendingOutgoingRequestIdRef.current) return;
        pendingOutgoingRequestIdRef.current = null;
        setAwaitingConsent(false);
        if (!agreed) {
          setConsentDeclined(true);
          return;
        }
        if (isHostRef.current) {
          beginRecording();
        } else {
          publishConsent({ type: "RECORDING_START_APPROVED", requestId, ts: Date.now() });
        }
        return;
      }

      if (payload.type === "RECORDING_START_APPROVED" && isHostRef.current) {
        beginRecording();
      }
    },
    [beginRecording],
  );

  const { publish } = usePubSub("RECORDING_CONSENT", { onMessageReceived: handleConsentMessage });

  useEffect(() => {
    publishRef.current = publish;
  }, [publish]);

  const requestRecording = () => {
    if (remoteIds.length === 0 || awaitingConsent) return;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pendingOutgoingRequestIdRef.current = requestId;
    setAwaitingConsent(true);
    setConsentDeclined(false);
    publishConsent({
      type: "RECORDING_CONSENT_REQUEST",
      requestId,
      requesterId: localParticipantIdRef.current,
      requesterRole: isHost ? "Mentor" : "Learner",
      ts: Date.now(),
    });
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording().catch((err) => console.warn("stopRecording failed:", err));
    } else {
      requestRecording();
    }
  };

  const respondToRecordingRequest = (agreed: boolean) => {
    if (!incomingRecordingRequestId) return;
    publishConsent({
      type: "RECORDING_CONSENT_RESPONSE",
      requestId: incomingRecordingRequestId,
      agreed,
      responderId: localParticipantIdRef.current,
      ts: Date.now(),
    });
    setIncomingRecordingRequestId(null);
  };

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

    if (isHost && bothJoinedRef.current && recordingStartedRef.current) {
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

  if (limitExceeded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle size={32} className="text-accent-error" />
        <h1 className="text-lg font-bold text-text-primary">Session is full</h1>
        <p className="text-sm text-text-secondary">
          Only {MAX_PARTICIPANTS} participants can join this session at a time.
        </p>

      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex justify-end">
        <CallSessionTimer slot={slot} />
      </div>

      {presenterId ? (
        <ScreenShareView
          participantId={presenterId}
          label={presenterId === localParticipant?.id ? "You" : otherUserName}
        />
      ) : null}

      <div className="flex flex-1 flex-col gap-4 sm:flex-row">
        <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">
          {localParticipant ? (
            <ParticipantTile participantId={localParticipant.id} label="You" />
          ) : null}
          {remoteIds.map((id) => (

            <ParticipantTile key={id} participantId={id} label={otherUserName} />
          ))}
        </div>

        {chatOpen ? <ChatPanel onClose={() => setChatOpen(false)} /> : null}
      </div>

      {remoteIds.length === 0 ? (
        <p className="text-center text-sm text-text-muted">
          Waiting for {otherUserName} to join…
        </p>
      ) : null}

      {error ? <p className="text-center text-sm text-accent-error">{error}</p> : null}

      {awaitingConsent ? (
        <p className="text-center text-sm text-text-muted">
          Waiting for {otherUserName} to approve recording…
        </p>
      ) : null}

      {consentDeclined ? (
        <p className="text-center text-sm text-accent-error">
          {otherUserName} declined the recording request.
        </p>
      ) : null}

      {incomingRecordingRequestId ? (
        <RecordingConsentModal
          requesterName={otherUserName}
          onAgree={() => respondToRecordingRequest(true)}
          onDecline={() => respondToRecordingRequest(false)}
        />
      ) : null}

      <CallControls
        onLeave={handleLeave}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
        canRecord
        recordingDisabled={remoteIds.length === 0 || awaitingConsent}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
      />
    </div>
  );
}
