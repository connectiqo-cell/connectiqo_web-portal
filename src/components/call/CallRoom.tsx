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
import { fetchRecordingUrl, startTemplateRecording, stopTemplateRecording } from "@/lib/api/videoCallApi";
import { ROUTES } from "@/lib/routes";
import { buildOneToOneRecordingConfig } from "@/lib/utils/recordingConfig";


const MAX_PARTICIPANTS = 2;
// Must match RECORDER_NAME in RecordingTemplateView.tsx.
const RECORDER_DISPLAY_NAME = "Recorder";



const RECORDING_POLL_ATTEMPTS = 6;


const RECORDING_POLL_DELAY_MS = 5000;

// How long a non-host web client waits, after recording is mutually agreed,
// before assuming the host's own side never started it and trying itself.
const RECORDING_FALLBACK_DELAY_MS = 6000;

// How long an incoming-chat-message toast stays on screen before auto-dismissing.
const CHAT_TOAST_DURATION_MS = 4000;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatToast, setChatToast] = useState<{ sender: string; text: string } | null>(null);
  const [layoutMode, setLayoutMode] = useState<"split" | "minmax">("split");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [primaryParticipantId, setPrimaryParticipantId] = useState<string | null>(null);
  const [incomingRecordingRequestId, setIncomingRecordingRequestId] = useState<string | null>(null);
  const [awaitingConsent, setAwaitingConsent] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);
  const bothJoinedRef = useRef(false);
  const recordingStartedRef = useRef(false);
  const leavingRef = useRef(false);
  const pendingOutgoingRequestIdRef = useRef<string | null>(null);
  const isHostRef = useRef(isHost);
  const localParticipantIdRef = useRef<string | undefined>(undefined);
  const chatOpenRef = useRef(false);
  const chatToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStateRef = useRef<string>("RECORDING_STOPPED");
  // Tracks "did a recording happen at any point in this call", from the
  // SDK's shared recordingState — unlike recordingStartedRef (only ever true
  // on whichever single client actually called beginRecording), this is
  // correct on EVERY client, host or not, since recordingState is synced to
  // all participants automatically.
  const recordingEverActiveRef = useRef(false);

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
    recordingStateRef.current = recordingState;
    if (recordingState === "RECORDING_STARTED") recordingEverActiveRef.current = true;
  }, [recordingState]);

  useEffect(() => {
    localParticipantIdRef.current = localParticipant?.id;
  }, [localParticipant?.id]);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  // Clear any pending toast-dismiss timer on unmount so it never fires a
  // setState after the call page has navigated away.
  useEffect(() => {
    return () => {
      if (chatToastTimerRef.current) clearTimeout(chatToastTimerRef.current);
    };
  }, []);

  // `participants` from useMeeting() already includes the local participant
  // (VideoSDK sets it in the map on join) — filter it out here, otherwise
  // every count below is inflated by one and double-counts yourself. The
  // headless "Recorder" bot (RecordingTemplateView) also joins this same
  // room while a template recording is active — without excluding it here
  // too, it would count toward MAX_PARTICIPANTS and trigger the "session
  // full" kick, and show up as a visible third tile.
  const remoteIds = Array.from(participants.entries())
    .filter(([id, p]) => id !== localParticipant?.id && p.displayName !== RECORDER_DISPLAY_NAME)
    .map(([id]) => id);
  const participantCount = remoteIds.length + (localParticipant ? 1 : 0);
  const limitExceeded = participantCount > MAX_PARTICIPANTS;

  // Min/max view: whichever participant is "primary" fills the screen, the
  // other floats as a small tappable PiP card that swaps places when clicked.
  // Defaults to the remote participant as primary, same as mobile.
  const mainId = primaryParticipantId || remoteIds[0] || localParticipant?.id || null;
  const pipId = mainId === localParticipant?.id ? remoteIds[0] : localParticipant?.id;
  const handleSwapPrimary = () => {
    if (pipId) setPrimaryParticipantId(pipId);
  };

  // The fullscreen state can also change via the browser's own UI (Esc key,
  // F11, a native "exit fullscreen" bar) — listen instead of only toggling
  // from our own button so the icon never gets out of sync.
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

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
    // The REST API is the only path that can load a custom templateUrl — the
    // SDK's native startRecording() has no such param, and would otherwise
    // silently fall back to whatever recording composition is configured as
    // default for this VideoSDK account (which may not even be ours). Only
    // fall back to the native call if the REST request itself fails.
    startTemplateRecording({ token, meetingId }).catch((err) => {
      console.warn("startTemplateRecording failed, falling back to native SDK recording:", err);
      // Surfaced in the UI (not just the console) — the fallback below can
      // fail too, and its generic SDK error would otherwise be the only
      // thing shown, hiding the real reason the REST template call failed.
      setError((err as Error)?.message || "Recording (template) request failed");
      startRecording(undefined, undefined, buildOneToOneRecordingConfig(2)).catch((fallbackErr) =>
        console.warn("startRecording failed:", fallbackErr),
      );
    });
    recordingsApi
      .upsertSessionForBooking({ bookingId, mentorId, learnerId, meetingId })
      .catch((err) => console.warn("Recording session row not created:", err));
  }, [startRecording, token, bookingId, mentorId, learnerId, meetingId]);

  // Only the host's client used to be trusted to start the (web-branded)
  // template recording — but the host is often on the mobile app, which has
  // its own separate recording pipeline our web code never touches. When
  // that happens, a web participant's "record" request would get mutually
  // agreed on but never actually start a web-template recording. This gives
  // any non-host web client a delayed second chance: if `recordingState`
  // (synced by the SDK to every participant, mobile included) hasn't moved
  // off "RECORDING_STOPPED" shortly after consent was reached, assume the
  // host's own side didn't pick it up and start it from here instead.
  const scheduleRecordingFallback = useCallback(() => {
    if (isHostRef.current) return;
    setTimeout(() => {
      if (recordingStateRef.current !== "RECORDING_STOPPED") return;
      beginRecording();
    }, RECORDING_FALLBACK_DELAY_MS);
  }, [beginRecording]);

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
          // Tells a host-mobile client to kick off its own native recording
          // (existing protocol, unchanged) — but if the host doesn't pick
          // this up on its own side, scheduleRecordingFallback() below still
          // gets a web-template recording started from here.
          publishConsent({ type: "RECORDING_START_APPROVED", requestId, ts: Date.now() });
          scheduleRecordingFallback();
        }
        return;
      }

      if (payload.type === "RECORDING_START_APPROVED" && isHostRef.current) {
        beginRecording();
      }
    },
    [beginRecording, scheduleRecordingFallback],
  );

  const { publish } = usePubSub("RECORDING_CONSENT", { onMessageReceived: handleConsentMessage });

  useEffect(() => {
    publishRef.current = publish;
  }, [publish]);

  // Subscribed here (CallRoom), not inside ChatPanel, so a listener exists
  // for the whole call — otherwise unmounting ChatPanel on close tears down
  // its usePubSub("CHAT") along with it, and nothing is left listening to
  // notice a message arrived while the panel is closed. ChatPanel's own
  // usePubSub("CHAT") call (for rendering `messages`) keeps working exactly
  // as before — VideoSDK shares message history across every subscriber on
  // the same topic, so this second subscription doesn't change what
  // ChatPanel sees once opened.
  const handleChatMessage = useCallback(
    (msg: { message: string; senderId: string; senderName: string }) => {
      if (msg.senderId === localParticipantIdRef.current) return;
      if (chatOpenRef.current) return;

      setUnreadChatCount((count) => count + 1);
      setChatToast({ sender: msg.senderName || otherUserName, text: msg.message });
      if (chatToastTimerRef.current) clearTimeout(chatToastTimerRef.current);
      chatToastTimerRef.current = setTimeout(() => setChatToast(null), CHAT_TOAST_DURATION_MS);
    },
    [otherUserName],
  );

  usePubSub("CHAT", { onMessageReceived: handleChatMessage });

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
      // Belt-and-braces: end whichever path actually started it (REST
      // template or native SDK) — an end call for a recording that was
      // never started that way is just a harmless no-op/404.
      stopTemplateRecording({ token, meetingId }).catch((err) =>
        console.warn("stopTemplateRecording failed:", err),
      );
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
    // Mirrors the fallback on the requester side: if I approved a
    // host-requested recording but the host (e.g. on mobile) never actually
    // starts one, get a web-template recording going from here instead.
    if (agreed) scheduleRecordingFallback();
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

    // Not gated on isHost — whoever actually clicked Leave should try to
    // save the recording, since recordingStartedRef only ever reflects the
    // truth on the single client that called beginRecording(). Any client,
    // if it ever saw the shared recordingState go live, should try.
    if (bothJoinedRef.current && (recordingStartedRef.current || recordingEverActiveRef.current)) {
      pollAndSaveRecording({ bookingId, mentorId, learnerId, meetingId, token }).catch((err) =>
        console.warn("Recording poll failed:", err),
      );
    }

    router.push(ROUTES.bookings);
  };

  if (!joined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/70">
        <Loader2 size={28} className="animate-spin" />
        <p>Joining session…</p>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    );

  }

  if (limitExceeded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle size={32} className="text-red-400" />
        <h1 className="text-lg font-bold text-white">Session is full</h1>
        <p className="text-sm text-white/70">
          Only {MAX_PARTICIPANTS} participants can join this session at a time.
        </p>

      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col gap-4 bg-[#131314] data-[fullscreen]:justify-center data-[fullscreen]:p-4"
      data-fullscreen={isFullscreen ? "" : undefined}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row">
        {presenterId ? (
          <div className="relative min-h-[50vh] flex-1">
            <ScreenShareView
              participantId={presenterId}
              label={presenterId === localParticipant?.id ? "You" : otherUserName}
            />
            {localParticipant ? (
              <div className="absolute bottom-4 left-12 h-28 w-28 overflow-hidden rounded-lg shadow-lg ring-2 ring-white/20 sm:h-36 sm:w-36">
                <ParticipantTile participantId={localParticipant.id} label="You" fill showWatermark={false} />
              </div>
            ) : null}
            {remoteIds[0] ? (
              <div className="absolute bottom-4 right-12 h-28 w-28 overflow-hidden rounded-lg shadow-lg ring-2 ring-white/20 sm:h-36 sm:w-36">
                <ParticipantTile participantId={remoteIds[0]} label={otherUserName} fill showWatermark={false} />
              </div>
            ) : null}
          </div>
        ) : layoutMode === "minmax" && mainId ? (
          <div className="relative min-h-[320px] max-h-[80vh] flex-1">
            <ParticipantTile
              participantId={mainId}
              label={mainId === localParticipant?.id ? "You" : otherUserName}
              fill
              overlayClassName="inset-x-10 bottom-4 sm:inset-x-14"
              watermarkClassName="bottom-4 right-10 sm:right-14 sm:text-sm"
            />
            {pipId ? (
              <button
                type="button"
                onClick={handleSwapPrimary}
                aria-label="Swap to main view"
                className="absolute top-4 right-4 h-32 w-24 overflow-hidden rounded-xl shadow-lg ring-2 ring-white/20 transition-transform hover:scale-[1.03] sm:h-40 sm:w-28"
              >
                <ParticipantTile
                  participantId={pipId}
                  label={pipId === localParticipant?.id ? "You" : otherUserName}
                  fill
                  showWatermark={false}
                  overlayClassName="inset-x-3 bottom-2"
                />
              </button>
            ) : null}
          </div>
        ) : (
          <div
            className={`grid flex-1 gap-3 overflow-hidden ${
              participantCount > 1
                ? "min-h-[240px] max-h-[75vh] auto-rows-fr grid-cols-1 sm:grid-cols-2"
                : "min-h-[240px] max-h-[75vh] grid-cols-1 place-items-center"
            }`}
          >
            {localParticipant ? (
              <div className={participantCount > 1 ? "h-full w-full" : "w-full max-w-xl"}>
                <ParticipantTile
                  participantId={localParticipant.id}
                  label="You"
                  fill={participantCount > 1}
                  overlayClassName="inset-x-10 bottom-4 sm:inset-x-14"
                  watermarkClassName="bottom-4 right-10 sm:right-14 sm:text-sm"
                />
              </div>
            ) : null}
            {remoteIds.map((id) => (
              <div key={id} className={participantCount > 1 ? "h-full w-full" : "w-full max-w-xl"}>
                <ParticipantTile
                  participantId={id}
                  label={otherUserName}
                  fill={participantCount > 1}
                  overlayClassName="inset-x-10 bottom-4 sm:inset-x-14"
                  watermarkClassName="bottom-4 right-10 sm:right-14 sm:text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {chatOpen ? <ChatPanel onClose={() => setChatOpen(false)} /> : null}
      </div>

      {remoteIds.length === 0 ? (
        <p className="text-center text-sm text-white/50">
          Waiting for {otherUserName} to join…
        </p>
      ) : null}

      {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}

      {awaitingConsent ? (
        <p className="text-center text-sm text-white/50">
          Waiting for {otherUserName} to approve recording…
        </p>
      ) : null}

      {consentDeclined ? (
        <p className="text-center text-sm text-red-400">
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

      <div className="flex items-center justify-center gap-3">
        <CallControls
          onLeave={handleLeave}
          chatOpen={chatOpen}
          onToggleChat={() => {
            setChatOpen((v) => !v);
            setUnreadChatCount(0);
            setChatToast(null);
            if (chatToastTimerRef.current) clearTimeout(chatToastTimerRef.current);
          }}
          unreadChatCount={unreadChatCount}
          chatToast={chatOpen ? null : chatToast}
          canRecord
          recordingDisabled={remoteIds.length === 0 || awaitingConsent}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          layoutMode={layoutMode}
          onToggleLayout={() => setLayoutMode((m) => (m === "split" ? "minmax" : "split"))}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
        <CallSessionTimer slot={slot} />
      </div>
    </div>
  );
}
