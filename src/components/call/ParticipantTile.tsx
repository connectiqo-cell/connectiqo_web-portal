"use client";

import { useParticipant } from "@videosdk.live/react-sdk";
import { MicOff, User } from "lucide-react";
import { useEffect, useRef } from "react";

export function ParticipantTile({
  participantId,
  label,
  fill = false,
  showWatermark = true,
  overlayClassName = "inset-x-2 bottom-2",
  watermarkClassName = "bottom-2 right-2 sm:text-sm",
}: {
  participantId: string;
  label: string;
  /** Fills its parent's box instead of sizing itself via aspect-video — for large/mini views that control their own container size. */
  fill?: boolean;
  /** Off for small tiles (e.g. the screen-share corner thumbnails) where the watermark already lives on the shared screen and there isn't room for both. */
  showWatermark?: boolean;
  /** Position of the name pill — each usage (side-by-side, min/max, screen-share) can tune this independently instead of sharing one fixed value. */
  overlayClassName?: string;
  /** Position of the "Connectiqo" mark — positioned independently of the name pill so small tiles can put it in a corner that isn't already occupied. */
  watermarkClassName?: string;
}) {
  const { webcamStream, micStream, webcamOn, micOn, isLocal, setQuality } = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Without this, VideoSDK's simulcast auto-selection decides which
  // resolution layer to send us for a remote participant — it can settle on
  // a lower layer than the sender is actually capable of. Explicitly asking
  // for "high" is the receive-side half of the video-quality fix; the other
  // half (capture settings) lives in CallControls.tsx. No-op for the local
  // tile, which isn't receiving anything.
  useEffect(() => {
    if (isLocal || !webcamOn) return;
    setQuality("high").catch(() => {});
  }, [isLocal, webcamOn, setQuality]);

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

      <div className={`absolute flex items-center ${overlayClassName}`}>
        <div className="flex min-w-0 items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1">
          {!micOn ? <MicOff size={12} className="shrink-0 text-white" /> : null}
          <span className="truncate text-xs font-medium text-white">{label}</span>
        </div>
      </div>

      {showWatermark ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute select-none text-xs font-bold tracking-wide text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_2px_6px_rgba(0,0,0,0.7)] ${watermarkClassName}`}
        >
          Connectiqo
        </span>
      ) : null}
    </div>
  );
}
