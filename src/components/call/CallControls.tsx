"use client";

import { useMeeting } from "@videosdk.live/react-sdk";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

export function CallControls({ onLeave }: { onLeave: () => void }) {
  const { toggleMic, toggleWebcam, localMicOn, localWebcamOn } = useMeeting();

  return (
    <div className="flex items-center justify-center gap-4 rounded-full border border-border-light bg-surface-sheet px-6 py-3">
      <button
        type="button"
        onClick={() => toggleMic()}
        aria-label={localMicOn ? "Mute microphone" : "Unmute microphone"}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          localMicOn ? "bg-surface-chip text-text-primary" : "bg-accent-error/20 text-accent-error"
        }`}
      >
        {localMicOn ? <Mic size={18} /> : <MicOff size={18} />}
      </button>

      <button
        type="button"
        onClick={() => toggleWebcam()}
        aria-label={localWebcamOn ? "Turn camera off" : "Turn camera on"}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          localWebcamOn ? "bg-surface-chip text-text-primary" : "bg-accent-error/20 text-accent-error"
        }`}
      >
        {localWebcamOn ? <Video size={18} /> : <VideoOff size={18} />}
      </button>

      <button
        type="button"
        onClick={onLeave}
        aria-label="Leave session"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-error text-white"
      >
        <PhoneOff size={18} />
      </button>
    </div>
  );
}
