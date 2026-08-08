"use client";

import { CalendarClock, Loader2, TimerOff, Video } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { rescheduleApi } from "@/lib/api/rescheduleApi";
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
  const {
    loading,
    error,
    booking,
    isHost,
    isParticipant,
    token,
    meetingId,
    starting,
    startSession,
    sessionExpired,
  } = useCallSetup(bookingId);

  const [requestingReschedule, setRequestingReschedule] = useState(false);
  const [rescheduleRequested, setRescheduleRequested] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  const handleRequestReschedule = async () => {
    setRequestingReschedule(true);
    setRescheduleError("");
    try {
      await rescheduleApi.markForReschedule(bookingId, "mentor_noshow");
      setRescheduleRequested(true);
    } catch (err) {
      setRescheduleError((err as Error)?.message || "Failed to request reschedule");
    } finally {
      setRequestingReschedule(false);
    }
  };

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

  if (!meetingId || !token) {
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
        )
         : sessionExpired ? (
          rescheduleRequested ? (
            <div className="flex flex-col items-center gap-3">
              <CalendarClock size={32} className="text-accent-success" />
              <p className="text-sm font-semibold text-text-primary">Reschedule requested</p>
              <p className="text-sm text-text-secondary">
                {otherUserName} has been notified and will propose a new time within 7 days.
              </p>

              <Link
                href={ROUTES.bookings}
                className="mt-1 rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                Back to bookings
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <TimerOff size={32} className="text-accent-error" />
              <p className="text-sm font-semibold text-text-primary">Session window closed</p>
              <p className="text-sm text-text-secondary">
                {otherUserName} didn&apos;t join within the session window. You can request a free
                reschedule.
              </p>
              {rescheduleError ? <p className="text-sm text-accent-error">{rescheduleError}</p> : null}
              <button
                type="button"
                onClick={handleRequestReschedule}
                disabled={requestingReschedule}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-text-on-accent disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                {requestingReschedule ? <Loader2 size={16} className="animate-spin" /> : null}
                {requestingReschedule ? "Sending request…" : "Request reschedule"}
              </button>
              <Link
                href={ROUTES.bookings}
                className="text-sm font-semibold text-text-secondary hover:text-text-primary"
              >
                Back to bookings
              </Link>
            </div>
          )
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
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 bg-[#131314] px-4 py-6">
      <CallShell
        meetingId={meetingId}
        token={token}

        name={profile?.name || "Guest"}
        bookingId={bookingId}
        mentorId={booking!.mentor_id}
        learnerId={booking!.learner_id}
        isHost={isHost}
        otherUserName={otherUserName}
        slot={booking?.availability_slots}

      />
    </main>
  );
}
