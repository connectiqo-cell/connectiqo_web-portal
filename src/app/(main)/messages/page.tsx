"use client";

import { MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import { messagesApi, type ConversationRow } from "@/lib/api/messagesApi";
import { ROUTES } from "@/lib/routes";

function otherParty(conversation: ConversationRow, userId: string) {
  return conversation.mentor_id === userId ? conversation.learner : conversation.mentor;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await messagesApi.getConversations(user.id);
        if (!cancelled) setConversations(rows);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Messages</h1>
        <p className="mt-1 text-sm text-text-secondary">Conversations with mentors and learners</p>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <MessageSquare size={28} className="text-text-muted" />
          <p className="text-sm text-text-muted">
            No conversations yet. Message a mentor from their profile to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => {
            const party = otherParty(conversation, user.id);
            const isMentor = conversation.mentor_id === user.id;
            const lastReadAt = isMentor ? conversation.mentor_last_read_at : conversation.learner_last_read_at;
            const unread = !lastReadAt || new Date(lastReadAt) < new Date(conversation.last_message_at);

            return (
              <Link
                key={conversation.id}
                href={ROUTES.messageThread(conversation.id)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors hover:bg-surface-chip ${
                  unread ? "border-accent-link/40 bg-accent-link/5" : "border-border-light bg-surface-panel"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                  {party?.avatar_url ? (
                    <OptimizedImage
                      src={party.avatar_url}
                      alt={party.name || "User"}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-text-muted" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${unread ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}>
                      {party?.name || "User"}
                    </p>
                    <span className="shrink-0 text-xs text-text-muted">{formatWhen(conversation.last_message_at)}</span>
                  </div>
                  <p className="truncate text-xs text-text-muted">
                    {conversation.last_message_preview || "No messages yet"}
                  </p>
                </div>
                {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent-link" /> : null}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
