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
    <div className="flex w-full flex-col rounded-2xl border border-border-light bg-surface-panel sm:w-80">
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

      <div ref={listRef} className="flex max-h-72 min-h-40 flex-col gap-2 overflow-y-auto p-3">
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
