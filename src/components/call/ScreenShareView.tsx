"use client";

import { useParticipant } from "@videosdk.live/react-sdk";
import { useEffect, useRef } from "react";

export function ScreenShareView({
  participantId,
  label,
}: {
  participantId: string;
  label: string;
}) {
  const { screenShareStream, screenShareOn } = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (screenShareOn && screenShareStream?.track) {
      el.srcObject = new MediaStream([screenShareStream.track]);
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [screenShareOn, screenShareStream]);

  if (!screenShareOn) return null;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-contain" />
      <div className="absolute top-2 left-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
        {label} is sharing their screen
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 right-3 select-none text-xs font-bold tracking-wide text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_2px_6px_rgba(0,0,0,0.7)] sm:text-sm"
      >
        Connectiqo
      </span>
    </div>
  );
}
