"use client";

import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { messagesApi } from "@/lib/api/messagesApi";
import { ROUTES } from "@/lib/routes";

/** Starts (or resumes) the conversation with this mentor and opens the thread. */
export function MessageMentorButton({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (user?.id === mentorId) return null;

  const handleClick = async () => {
    if (!user) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.mentorProfile(mentorId))}`);
      return;
    }
    setLoading(true);
    try {
      const conversationId = await messagesApi.getOrCreateConversation({ mentorId, learnerId: user.id });
      router.push(ROUTES.messageThread(conversationId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border-light text-sm font-semibold text-text-primary transition-colors hover:bg-surface-chip disabled:opacity-60 sm:w-auto sm:px-6"
    >
      <MessageSquare size={16} />
      {loading ? "Opening…" : "Message"}
    </button>
  );
}
