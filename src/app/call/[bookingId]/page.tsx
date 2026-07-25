"use client";

import { Loader2, Video } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCallSetup } from "@/lib/hooks/useCallSetup";
import { ROUTES } from "@/lib/routes";

// @videosdk.live/react-sdk touches browser-only globals at import time, so
// it must never be evaluated during SSR.
const CallShell = dynamic(() => import("@/components/call/CallShell").then((m) => m.CallShell), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 size={28} className="animate-spin text-text-muted" />
    </div>
  ),
});

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function CallPage({ params }: PageProps) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { loading, error, booking, isHost, isParticipant, token, meetingId, starting, startSession } =
    useCallSetup(bookingId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.call(bookingId))}`);
    }
  }, [authLoading, user, router, bookingId]);

  if (authLoading || loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-text-muted" />
      </main>
    );
  }

  if (error && !booking) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 text-center text-sm text-accent-error">
        {error}
      </main>
    );
  }

  if (booking && !isParticipant) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 text-center text-sm text-text-secondary">
        You&apos;re not a participant on this booking.
      </main>
    );
  }

  const otherUserName = isHost
    ? booking?.learner_profile?.name || "Learner"
    : booking?.profiles?.name || "Mentor";

  if (!meetingId) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Video size={40} className="text-accent-primary" />
        <h1 className="text-xl font-bold text-text-primary">
          Session with {otherUserName}
        </h1>
        {isHost ? (
          <>
            <p className="text-sm text-text-secondary">
              Start the session when you&apos;re ready — {otherUserName} will join automatically.
            </p>
            {error ? <p className="text-sm text-accent-error">{error}</p> : null}
            <button
              type="button"
              onClick={startSession}
              disabled={starting || !token}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-text-on-accent disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : null}
              {starting ? "Starting…" : "Start session"}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={20} className="animate-spin text-text-muted" />
            <p className="text-sm text-text-secondary">
              Waiting for {otherUserName} to start the session…
            </p>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6">
      <CallShell
        meetingId={meetingId}
        token={token!}
        name={profile?.name || "Guest"}
        bookingId={bookingId}
        isHost={isHost}
        recordingRequested={Boolean(booking?.recording_requested)}
        otherUserName={otherUserName}
      />
    </main>
  );
}
