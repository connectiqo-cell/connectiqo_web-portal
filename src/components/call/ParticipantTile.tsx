"use client";

import { useParticipant } from "@videosdk.live/react-sdk";
import { MicOff, User } from "lucide-react";
import { useEffect, useRef } from "react";

export function ParticipantTile({
  participantId,
  label,
}: {
  participantId: string;
  label: string;
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
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-meeting-canvas">
      {webcamOn ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-chip-strong">
          <User size={28} className="text-text-muted" />
        </div>
      )}
      {!isLocal ? <audio ref={audioRef} autoPlay /> : null}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1">
        {!micOn ? <MicOff size={12} className="text-white" /> : null}
        <span className="text-xs font-medium text-white">{label}</span>
      </div>
    </div>
  );
}
