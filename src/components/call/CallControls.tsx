"use client";

import { useMeeting } from "@videosdk.live/react-sdk";
import {
  Circle,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";

export function CallControls({
  onLeave,
  chatOpen,
  onToggleChat,
  canRecord,
  recordingDisabled,
  isRecording,
  onToggleRecording,
}: {
  onLeave: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
  /** Whether the record control is shown at all. */
  canRecord: boolean;
  /** Greys the button out (e.g. no one else has joined yet, or a request is already pending). */
  recordingDisabled: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
}) {
  const { toggleMic, toggleWebcam, localMicOn, localWebcamOn, toggleScreenShare, presenterId, localParticipant } =
    useMeeting();

  const isSharingScreen = presenterId === localParticipant?.id;
  // Only one screen share at a time — disable the button for the other
  // participant while someone else is already presenting.
  const someoneElseSharing = Boolean(presenterId) && !isSharingScreen;

  return (
    <div className="flex items-center justify-center gap-4 rounded-full border border-border-light bg-surface-sheet px-6 py-3">
      <button
        type="button"
        onClick={onToggleChat}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          chatOpen ? "bg-accent-link/20 text-accent-link" : "bg-surface-chip text-text-primary"
        }`}
      >

        <MessageCircle size={18} />
      </button>


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
        onClick={() => toggleScreenShare().catch(() => {})}
        disabled={someoneElseSharing}
        aria-label={isSharingScreen ? "Stop screen share" : "Share screen"}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
          isSharingScreen ? "bg-accent-link/20 text-accent-link" : "bg-surface-chip text-text-primary"
        }`}
      >
        {isSharingScreen ? <MonitorX size={18} /> : <MonitorUp size={18} />}
      </button>

      {canRecord ? (
        <button
          type="button"
          onClick={onToggleRecording}
          disabled={!isRecording && recordingDisabled}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
            isRecording ? "bg-accent-error/20 text-accent-error" : "bg-surface-chip text-text-primary"
          }`}
        >
          <Circle size={18} fill={isRecording ? "currentColor" : "none"} />
        </button>
      ) : null}

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
