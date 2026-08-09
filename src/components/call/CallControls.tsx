"use client";

import { useMeeting } from "@videosdk.live/react-sdk";
import {
  Circle,
  LayoutGrid,
  Maximize,
  MessageCircle,
  Mic,
  MicOff,
  Minimize,
  MonitorUp,
  MonitorX,
  MoreVertical,
  Phone,
  PictureInPicture2,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CallControls({
  onLeave,
  chatOpen,
  onToggleChat,
  canRecord,
  recordingDisabled,
  isRecording,
  onToggleRecording,
  layoutMode,
  onToggleLayout,
  isFullscreen,
  onToggleFullscreen,
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
  layoutMode: "split" | "minmax";
  onToggleLayout: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const { toggleMic, toggleWebcam, localMicOn, localWebcamOn, toggleScreenShare, presenterId, localParticipant } =
    useMeeting();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isSharingScreen = presenterId === localParticipant?.id;
  // Only one screen share at a time — disable the button for the other
  // participant while someone else is already presenting.
  const someoneElseSharing = Boolean(presenterId) && !isSharingScreen;

  useEffect(() => {
    if (!moreOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [moreOpen]);

  const iconButtonClass = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9";
  const menuItemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors";

  return (
    <div className="flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border border-border-light bg-surface-sheet px-2.5 py-1.5 sm:gap-2.5 sm:px-4 sm:py-2">
      <button
        type="button"
        onClick={() => toggleMic()}
        aria-label={localMicOn ? "Mute microphone" : "Unmute microphone"}
        className={`${iconButtonClass} ${
          localMicOn ? "bg-surface-chip text-text-primary" : "bg-accent-error/20 text-accent-error"
        }`}
      >
        {localMicOn ? <Mic size={14} className="sm:size-4" /> : <MicOff size={14} className="sm:size-4" />}
      </button>

      <button
        type="button"
        onClick={() => toggleWebcam()}
        aria-label={localWebcamOn ? "Turn camera off" : "Turn camera on"}
        className={`${iconButtonClass} ${
          localWebcamOn ? "bg-surface-chip text-text-primary" : "bg-accent-error/20 text-accent-error"
        }`}
      >
        {localWebcamOn ? <Video size={14} className="sm:size-4" /> : <VideoOff size={14} className="sm:size-4" />}
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
        title={isFullscreen ? "Exit full screen" : "Enter full screen"}
        className={`${iconButtonClass} bg-surface-chip text-text-primary`}
      >
        {isFullscreen ? <Minimize size={14} className="sm:size-4" /> : <Maximize size={14} className="sm:size-4" />}
      </button>

      <div ref={moreRef} className="relative">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="More options"
          aria-expanded={moreOpen}
          className={`${iconButtonClass} ${
            moreOpen ? "bg-accent-link/20 text-accent-link" : "bg-surface-chip text-text-primary"
          }`}
        >
          <MoreVertical size={14} className="sm:size-4" />
        </button>

        {moreOpen ? (
          <div className="absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 rounded-xl border border-border-light bg-surface-panel p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onToggleChat();
                setMoreOpen(false);
              }}
              className={`${menuItemClass} ${
                chatOpen ? "text-accent-link" : "text-text-primary hover:bg-surface-chip"
              }`}
            >
              <MessageCircle size={16} />
              {chatOpen ? "Close chat" : "Open chat"}
            </button>

            <button
              type="button"
              onClick={() => {
                toggleScreenShare().catch(() => {});
                setMoreOpen(false);
              }}
              disabled={someoneElseSharing}
              className={`${menuItemClass} disabled:cursor-not-allowed disabled:opacity-40 ${
                isSharingScreen ? "text-accent-link" : "text-text-primary hover:bg-surface-chip"
              }`}
            >
              {isSharingScreen ? <MonitorX size={16} /> : <MonitorUp size={16} />}
              {isSharingScreen ? "Stop screen share" : "Share screen"}
            </button>

            {canRecord ? (
              <button
                type="button"
                onClick={() => {
                  onToggleRecording();
                  setMoreOpen(false);
                }}
                disabled={!isRecording && recordingDisabled}
                className={`${menuItemClass} disabled:cursor-not-allowed disabled:opacity-40 ${
                  isRecording ? "text-accent-error" : "text-text-primary hover:bg-surface-chip"
                }`}
              >
                {isRecording ? (
                  <Square size={14} fill="currentColor" />
                ) : (
                  <Circle size={16} fill="currentColor" />
                )}
                {isRecording ? "Stop recording" : "Start recording"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                onToggleLayout();
                setMoreOpen(false);
              }}
              className={`${menuItemClass} text-text-primary hover:bg-surface-chip`}
            >
              {layoutMode === "split" ? <PictureInPicture2 size={16} /> : <LayoutGrid size={16} />}
              {layoutMode === "split" ? "Switch to min/max view" : "Switch to side-by-side view"}
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onLeave}
        aria-label="Leave session"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-error text-white sm:h-9 sm:w-9"
      >
        <Phone size={13} className="rotate-[135deg] sm:size-[15px]" />
      </button>
    </div>
  );
}
