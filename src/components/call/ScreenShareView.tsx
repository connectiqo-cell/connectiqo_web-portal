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
    <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} autoPlay playsInline className="max-h-[60vh] w-full object-contain" />
      <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
        {label} is sharing their screen
      </div>
    </div>
  );
}
