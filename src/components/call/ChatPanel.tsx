"use client";

import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { localParticipant } = useMeeting();
  const { publish, messages } = usePubSub("CHAT");
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    publish(text.trim(), { persist: true });
    setText("");

  };

  return (
    // max-h-[75vh] mirrors the same cap CallRoom's video-tile grid uses — the
    // row (video + chat, side by side) stretches to fill whatever space is
    // left in the call layout, but the tiles never grow past 75vh. Without
    // the same ceiling here, this panel had nothing capping it and kept
    // stretching to the row's full (taller) height even once the tiles had
    // already stopped growing, so the two visibly stopped lining up.
    <div className="flex w-full min-h-0 max-h-[75vh] flex-col rounded-2xl border border-border-light bg-surface-panel sm:w-80">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Chat</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="text-text-muted hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/*
        flex-1 (not a fixed max-h) so this list grows to fill whatever height
        the panel is stretched to by CallRoom's flex-row layout, matching the
        video tiles' bottom edge — a fixed cap here is what left dead space
        below the input any time the panel was taller than the message list.
        min-h-0 is load-bearing, not decorative: a flex item's default
        min-height is "at least as tall as its content," which silently wins
        over flex-1/max-h and made this grow to fit every message instead of
        scrolling — min-h-0 lets it actually shrink to the space available so
        overflow-y-auto can do its job.
      */}
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isLocal = m.senderId === localParticipant?.id;
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  isLocal
                    ? "self-end bg-accent-link/15 text-text-primary"
                    : "self-start bg-surface-chip text-text-primary"
                }`}
              >
                <p className="text-[11px] font-semibold text-text-muted">
                  {isLocal ? "You" : m.senderName}
                </p>
                <p className="break-words">{m.message}</p>
                <p className="mt-1 text-right text-[10px] text-text-muted">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border-light p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message"
          className="flex-1 rounded-full border border-border-light bg-surface-sheet px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <button

          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 items-center justify-center
           rounded-full bg-accent-link/15 text-accent-link disabled:opacity-50"
        >
          <Send size={15} />
        </button>
        
      </div>
    </div>
  );
}
