"use client";

import { createCameraVideoTrack, useMeeting } from "@videosdk.live/react-sdk";
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
  unreadChatCount,
  chatToast,
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
  /** Unread chat messages received while the panel was closed. */
  unreadChatCount: number;
  /** Latest incoming message to surface as a popover above the chat button, or null to show nothing. */
  chatToast: { sender: string; text: string } | null;
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
  const [micPending, setMicPending] = useState(false);
  const [webcamPending, setWebcamPending] = useState(false);
  // Starts every new toast off-state, then flips it on next frame so the
  // opacity/scale/translate classes below actually transition in instead of
  // just appearing — a plain conditional render has nothing to animate from.
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!chatToast) return;
    // Double rAF, not one: setting true on the very next frame can land in
    // the same style/paint pass as the initial (already-true) render, so the
    // transition has nothing to interpolate from and just snaps in. Forcing
    // one extra frame between "reset" and "show" guarantees the browser
    // paints the off-state first.
    let showFrame = 0;
    const resetFrame = requestAnimationFrame(() => {
      setToastVisible(false);
      showFrame = requestAnimationFrame(() => setToastVisible(true));
    });
    return () => {
      cancelAnimationFrame(resetFrame);
      cancelAnimationFrame(showFrame);
    };
  }, [chatToast]);

  // toggleMic/toggleWebcam are async device negotiations — firing a second
  // one before the first resolves (e.g. a fast double-click) races the SDK
  // against itself and throws ERROR_OPERATION_IN_PROGRESS /
  // ERROR_WEBCAM_PRODUCE_FAILED. Disable each button for the duration of its
  // own in-flight toggle.
  const handleToggleMic = () => {
    if (micPending) return;
    setMicPending(true);
    toggleMic().catch(() => {}).finally(() => setMicPending(false));
  };
  const handleToggleWebcam = () => {
    if (webcamPending) return;
    setWebcamPending(true);
    // Turning the camera on: capture with sharper, higher-bitrate settings
    // instead of the SDK's defaults (optimizationMode "motion" + bitrateMode
    // "balanced" + VP8), which visibly soften/blur the picture once WebRTC's
    // congestion control kicks in on a constrained connection — most
    // noticeable on mobile networks. H264 also runs on hardware encoders on
    // most phones, unlike software-only VP8. Falls back to the plain toggle
    // if custom-track capture fails for any reason (e.g. no matching camera).
    const turnOn = localWebcamOn
      ? toggleWebcam()
      : createCameraVideoTrack({
          encoderConfig: "h720p_w1280p",
          optimizationMode: "detail",
          bitrateMode: "high_quality",
          codec: "H264",
          // SDK default is "environment" (rear camera) when this is left
          // unset — irrelevant on desktop (no front/back distinction) but a
          // real regression on mobile web, which is exactly where this
          // quality fix matters most: it would silently flip mobile callers
          // to their back camera instead of the expected selfie camera.
          facingMode: "user",
        })
          .then((track) => toggleWebcam(track))
          .catch(() => toggleWebcam());
    turnOn.catch(() => {}).finally(() => setWebcamPending(false));
  };

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
        onClick={handleToggleMic}
        disabled={micPending}
        aria-label={localMicOn ? "Mute microphone" : "Unmute microphone"}
        className={`${iconButtonClass} disabled:cursor-not-allowed disabled:opacity-60 ${
          localMicOn ? "bg-surface-chip text-text-primary" : "bg-accent-error/20 text-accent-error"
        }`}
      >
        {localMicOn ? <Mic size={14} className="sm:size-4" /> : <MicOff size={14} className="sm:size-4" />}
      </button>

      <button
        type="button"
        onClick={handleToggleWebcam}
        disabled={webcamPending}
        aria-label={localWebcamOn ? "Turn camera off" : "Turn camera on"}
        className={`${iconButtonClass} disabled:cursor-not-allowed disabled:opacity-60 ${
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

      <div className="relative">
        <button
          type="button"
          onClick={onToggleChat}
          aria-label={chatOpen ? "Close chat" : "Open chat"}
          title={chatOpen ? "Close chat" : "Open chat"}
          className={`${iconButtonClass} relative ${
            chatOpen ? "bg-accent-link/20 text-accent-link" : "bg-surface-chip text-text-primary"
          }`}
        >
          <MessageCircle size={14} className="sm:size-4" />
          {unreadChatCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-link px-1 text-[9px] font-bold text-text-on-accent">
              {unreadChatCount > 9 ? "9+" : unreadChatCount}
            </span>
          ) : null}
        </button>

        {chatToast ? (
          // Anchored directly above the chat button (same bottom-full/mb-2
          // popover pattern as the "More options" menu below) so it reads as
          // popping out of the chat icon, not floating over the video. The
          // little rotated square below is the classic speech-bubble "tail"
          // trick — same gradient as the bubble so the two fuse visually.
          <div
            className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-max max-w-64 -translate-x-1/2 rounded-3xl px-4 py-3 text-sm text-text-on-accent shadow-xl ring-1 ring-white/15 transition-all duration-300 ease-out ${
              toastVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-1.5 scale-75 opacity-0"
            }`}
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            <span className="font-bold">{chatToast.sender}:</span>{" "}
            <span className="break-words text-text-on-accent/90">{chatToast.text}</span>
            <span
              aria-hidden
              className="absolute left-1/2 top-full h-3.5 w-3.5 -translate-x-1/2 -translate-y-2 rotate-45 rounded-[3px]"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            />
          </div>
        ) : null}
      </div>

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
