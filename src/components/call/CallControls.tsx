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
    <div className="flex items-center justify-center gap-2 rounded-full border border-border-light bg-surface-sheet px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
      <button
        type="button"
        onClick={onToggleChat}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors sm:h-11 sm:w-11 ${
          chatOpen ? "bg-accent-link/20 text-accent-link" : "bg-surface-chip text-text-primary"
        }`}
      >
        <MessageCircle size={16} className="sm:size-[18px]" />
      </button>

      <button
        type="button"
        onClick={() => toggleMic()}
        aria-label={localMicOn ? "Mute microphone" : "Unmute microphone"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors sm:h-11 sm:w-11 ${
          localMicOn ? "bg-surface-chip text-text-primary" : "bg-accent-error/20 text-accent-error"
        }`}
      >
        {localMicOn ? <Mic size={16} className="sm:size-[18px]" /> : <MicOff size={16} className="sm:size-[18px]" />}
      </button>

      <button
        type="button"
        onClick={() => toggleWebcam()}
        aria-label={localWebcamOn ? "Turn camera off" : "Turn camera on"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors sm:h-11 sm:w-11 ${
          localWebcamOn ? "bg-surface-chip text-text-primary" : "bg-accent-error/20 text-accent-error"
        }`}
      >
        {localWebcamOn ? <Video size={16} className="sm:size-[18px]" /> : <VideoOff size={16} className="sm:size-[18px]" />}
      </button>

      <button
        type="button"
        onClick={() => toggleScreenShare().catch(() => {})}
        disabled={someoneElseSharing}
        aria-label={isSharingScreen ? "Stop screen share" : "Share screen"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 sm:h-11 sm:w-11 ${
          isSharingScreen ? "bg-accent-link/20 text-accent-link" : "bg-surface-chip text-text-primary"
        }`}
      >
        {isSharingScreen ? <MonitorX size={16} className="sm:size-[18px]" /> : <MonitorUp size={16} className="sm:size-[18px]" />}
      </button>

      {canRecord ? (
        <button
          type="button"
          onClick={onToggleRecording}
          disabled={!isRecording && recordingDisabled}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 sm:h-11 sm:w-11 ${
            isRecording ? "bg-accent-error/20 text-accent-error" : "bg-surface-chip text-text-primary"
          }`}
        >
          <Circle size={16} className="sm:size-[18px]" fill={isRecording ? "currentColor" : "none"} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onLeave}
        aria-label="Leave session"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-error text-white sm:h-11 sm:w-11"
      >
        <PhoneOff size={16} className="sm:size-[18px]" />
      </button>
    </div>
  );
}
