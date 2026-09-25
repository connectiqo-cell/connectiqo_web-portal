"use client";

import { ArrowLeft, Lock, Send, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import {
  messagesApi,
  type ConversationLabel,
  type ConversationRow,
  type MessageRow,
} from "@/lib/api/messagesApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function formatDateDivider(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
}

/** Groups consecutive messages by calendar day so a date divider can be shown once per day. */
function groupByDay(messages: MessageRow[]): Array<{ dateKey: string; items: MessageRow[] }> {
  const groups: Array<{ dateKey: string; items: MessageRow[] }> = [];
  for (const message of messages) {
    const dateKey = new Date(message.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.dateKey === dateKey) {
      last.items.push(message);
    } else {
      groups.push({ dateKey, items: [message] });
    }
  }
  return groups;
}

export default function MessageThreadPage() {
  const router = useRouter();
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const { user, loading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [labels, setLabels] = useState<ConversationLabel[]>([]);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !conversationId) return;
    let cancelled = false;
    (async () => {
      try {
        const conv = await messagesApi.getConversation(conversationId);
        if (!conv || (conv.mentor_id !== user.id && conv.learner_id !== user.id)) {
          router.replace(ROUTES.messages);
          return;
        }
        if (cancelled) return;
        setConversation(conv);

        const isMentor = conv.mentor_id === user.id;
        const [msgs, active] = await Promise.all([
          messagesApi.getMessages(conversationId),
          isMentor ? Promise.resolve(true) : messagesApi.hasActiveBooking({ mentorId: conv.mentor_id, learnerId: conv.learner_id }),
        ]);
        if (cancelled) return;
        setMessages(msgs);
        setHasActiveBooking(active);

        if (!isMentor && !active) {
          const learnerLabels = await messagesApi.getLabels("learner");
          if (!cancelled) setLabels(learnerLabels);
        }

        void messagesApi.markRead({ conversationId, userId: user.id, isMentor });
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load conversation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, conversationId, router]);

  // Realtime: new messages in this conversation from either side. isMentorRef
  // avoids resubscribing when `conversation` loads (it's set once and never
  // changes identity for a given conversationId) while still reading the
  // current value instead of a stale closure over the initial null.
  const isMentorRef = useRef(false);
  useEffect(() => {
    isMentorRef.current = conversation?.mentor_id === user?.id;
  }, [conversation, user]);

  useEffect(() => {
    if (!conversationId || !user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as MessageRow;
          setMessages((prev) => [...prev, incoming]);
          // The thread is open, so any message that lands here (including
          // the other person's) should immediately count as read.
          void messagesApi.markRead({ conversationId, userId: user.id, isMentor: isMentorRef.current });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (body: string) => {
    if (!body.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await messagesApi.sendMessage({ conversationId, body: body.trim() });
      setDraft("");
    } catch (err) {
      setError((err as Error)?.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  if (!user || loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-muted">Loading…</p>
      </main>
    );
  }
  if (!conversation) return null;

  const isMentor = conversation.mentor_id === user.id;
  const party = isMentor ? conversation.learner : conversation.mentor;
  const canFreeType = isMentor || hasActiveBooking;
  const dayGroups = groupByDay(messages);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-panel">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-sheet/60 px-4 py-3">
          <Link
            href={ROUTES.messages}
            aria-label="Back to messages"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-chip"
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip ring-2 ring-surface-panel">
            {party?.avatar_url ? (
              <OptimizedImage src={party.avatar_url} alt={party.name || "User"} width={40} height={40} className="h-full w-full object-cover" />
            ) : (
              <User size={16} className="text-text-muted" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">{party?.name || "User"}</p>
            <p className="text-xs text-text-muted">{isMentor ? "Learner" : "Mentor"}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
              <Sparkles size={24} className="text-text-muted" />
              <p className="text-sm text-text-muted">Say hello to start the conversation.</p>
            </div>
          ) : (
            dayGroups.map((group) => (
              <div key={group.dateKey} className="flex flex-col gap-2">
                <div className="my-2 flex items-center justify-center">
                  <span className="rounded-full bg-surface-chip px-3 py-1 text-[11px] font-medium text-text-muted">
                    {formatDateDivider(group.items[0].created_at)}
                  </span>
                </div>
                {group.items.map((message) => {
                  const mine = message.sender_id === user.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2.5 ${
                          mine
                            ? "rounded-br-md text-white"
                            : "rounded-bl-md bg-surface-chip text-text-primary"
                        }`}
                        style={mine ? { backgroundImage: "var(--gradient-button-primary)" } : undefined}
                      >
                        {message.is_label ? (
                          <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${mine ? "text-white/70" : "text-text-muted"}`}>
                            <Sparkles size={10} />
                            Quick message
                          </span>
                        ) : null}
                        <p className="text-sm">{message.body}</p>
                        <span className={`text-[10px] ${mine ? "text-white/70" : "text-text-muted"}`}>
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="px-4 pb-2 text-sm text-accent-error">{error}</p> : null}

        {!canFreeType ? (
          <div className="flex flex-col gap-2.5 border-t border-border-light bg-surface-sheet/60 px-4 py-3.5">
            <div className="flex items-center gap-2 rounded-xl border border-accent-link/25 bg-accent-link/5 px-3 py-2">
              <Lock size={14} className="shrink-0 text-accent-link" />
              <p className="text-xs text-text-secondary">
                Book a session with this mentor to send a custom message. For now, choose one:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => handleSend(label.label)}
                  disabled={sending}
                  className="rounded-full border border-accent-link/40 bg-accent-link/10 px-3.5 py-2 text-sm font-semibold text-accent-link transition-colors hover:bg-accent-link/15 disabled:opacity-60"
                >
                  {label.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(draft);
            }}
            className="flex items-center gap-2 border-t border-border-light bg-surface-sheet/60 px-4 py-3"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message…"
              disabled={sending}
              className="flex-1 rounded-full border border-border-light bg-surface-panel px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-on-accent disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
