"use client";

import { useParticipant } from "@videosdk.live/react-sdk";
import { MicOff, User } from "lucide-react";
import { useEffect, useRef } from "react";

export function ParticipantTile({
  participantId,
  label,
  fill = false,
}: {
  participantId: string;
  label: string;
  /** Fills its parent's box instead of sizing itself via aspect-video — for large/mini views that control their own container size. */
  fill?: boolean;
}) {
  const { webcamStream, micStream, webcamOn, micOn, isLocal } = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (webcamOn && webcamStream?.track) {
      const mediaStream = new MediaStream([webcamStream.track]);
      el.srcObject = mediaStream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [webcamOn, webcamStream]);

  // Local audio is never played back — avoids hearing yourself.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || isLocal) return;
    if (micOn && micStream?.track) {
      const mediaStream = new MediaStream([micStream.track]);
      el.srcObject = mediaStream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [isLocal, micOn, micStream]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-meeting-canvas ${
        fill ? "h-full w-full" : "aspect-video w-full"
      }`}
    >
      {webcamOn ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-chip-strong">
          <User size={28} className="text-text-muted" />
        </div>
      )}
      {!isLocal ? <audio ref={audioRef} autoPlay /> : null}

      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 right-30 select-none text-xs font-bold tracking-wide text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_2px_6px_rgba(0,0,0,0.7)] sm:text-sm"
      >
        Connectiqo
      </span>

      <div className="absolute bottom-2 left-20 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1">
        {!micOn ? <MicOff size={12} className="text-white" /> : null}
        <span className="text-xs font-medium text-white">{label}</span>
      </div>
    </div>
  );
}
