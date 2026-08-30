"use client";

import { MeetingProvider, useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

/**
 * Web's answer to mobile's custom recording template (D:\connect\recording-template) —
 * a headless page VideoSDK's recording bot loads instead of compositing raw
 * tracks itself, so the saved file can carry Connectiqo branding. Where
 * mobile's is a stacked-portrait layout in a separate deployed app, this is a
 * landscape side-by-side layout living as a route in this same Next.js app —
 * VideoSDK just navigates to a URL, so a second deployment buys nothing here.
 *
 * Invoked as `${origin}/recording-template?meetingId=...&token=...` via the
 * REST `POST /v2/recordings/start` templateUrl param (see videoCallApi.ts) —
 * never opened by a real user.
 */
const RECORDER_NAME = "Recorder";

function TemplateTile({ participantId, side }: { participantId: string; side: "left" | "right" }) {
  const { webcamStream, micStream, webcamOn, micOn, displayName, isLocal, setQuality } =
    useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Same fix as ParticipantTile.tsx: without this, the recorder bot receives
  // whatever simulcast layer VideoSDK auto-selects for it, which can be a
  // lower one — and that's what gets permanently baked into the saved
  // recording, regardless of the REST recording config's own "high" setting
  // (that controls the recorder's own output encode, not what it consumes
  // from each participant).
  useEffect(() => {
    if (isLocal || !webcamOn) return;
    setQuality("high").catch(() => {});
  }, [isLocal, webcamOn, setQuality]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (webcamOn && webcamStream?.track) {
      el.srcObject = new MediaStream([webcamStream.track]);
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [webcamOn, webcamStream]);

  // The recorder never plays audio back locally — it's a passive observer,
  // not a real listener — but every OTHER real participant's audio still
  // needs to be attached so it's captured in the recorded file.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || isLocal) return;
    if (micOn && micStream?.track) {
      el.srcObject = new MediaStream([micStream.track]);
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [isLocal, micOn, micStream]);

  return (
    <div className="relative h-full w-1/2 overflow-hidden bg-[#0a0a0a]">
      {webcamOn ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <User size={36} className="text-white/50" />
          </div>
        </div>
      )}
      {!isLocal ? <audio ref={audioRef} autoPlay /> : null}
      <div
        className={`absolute bottom-5 rounded-md bg-black/45 px-3.5 py-1.5 text-lg font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)] ${
          side === "left" ? "left-5" : "right-5"
        }`}
      >
        {displayName || "Guest"}
      </div>
    </div>
  );
}

function ConnectiqoDivider() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7c3aed] to-transparent" />
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-5 py-2 text-lg font-bold uppercase tracking-[0.25em] text-white"
        style={{
          background: "linear-gradient(135deg, rgba(109,40,217,0.85), rgba(139,92,246,0.65))",
          borderColor: "rgba(167,139,250,0.7)",
          textShadow: "0 0 14px rgba(167,139,250,0.95)",
        }}
      >
        Connectiqo
      </div>
    </div>
  );
}

function TemplateMeetingView() {
  const { participants, localParticipant } = useMeeting();
  // Everyone except the recorder itself (the local participant here) —
  // capped at 2 since this template is built for 1:1 mentor sessions.
  const remoteIds = Array.from(participants.keys())
    .filter((id) => id !== localParticipant?.id)
    .slice(0, 2);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black">
      {remoteIds[0] ? (
        <TemplateTile participantId={remoteIds[0]} side="left" />
      ) : (
        <div className="h-full w-1/2 bg-[#0a0a0a]" />
      )}
      {remoteIds[1] ? (
        <TemplateTile participantId={remoteIds[1]} side="right" />
      ) : (
        <div className="h-full w-1/2 bg-[#0a0a0a]" />
      )}
      {remoteIds.length === 2 ? <ConnectiqoDivider /> : null}
    </div>
  );
}

function RecordingTemplateInner() {
  const params = useSearchParams();
  const meetingId = params.get("meetingId");
  const token = params.get("token");
  // VideoSDK appends this itself when it navigates its recorder bot to the
  // templateUrl — per their custom-template docs, the bot expects the page
  // to join AS this specific pre-registered participant, not a fresh
  // SDK-generated one. Omitting it (as this page previously did) means the
  // bot's own tracking never sees "its" participant join, which is the
  // likely cause of the ~5s recording-failed disconnects in web-to-web
  // calls. Mirrors mobile's reference recording-template app, which reads
  // and passes this same param.
  const participantId = params.get("participantId") || undefined;

  if (!meetingId || !token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white/70">
        Missing meetingId or token.
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId,
        name: RECORDER_NAME,
        micEnabled: false,
        webcamEnabled: false,
        debugMode: false,
        participantId,
      }}
      token={token}
      joinWithoutUserInteraction
    >
      <TemplateMeetingView />
    </MeetingProvider>
  );
}

export function RecordingTemplateView() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      <RecordingTemplateInner />
    </Suspense>
  );
}
