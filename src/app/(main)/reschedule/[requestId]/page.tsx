"use client";

import { ArrowLeft, CalendarCheck, CalendarX2, HourglassIcon, TimerOff, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OptimizedImage from "@/components/OptimizedImage";
import { use, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { rescheduleApi, rescheduleReasonLabel, type ProposalWithBooking } from "@/lib/api/rescheduleApi";
import { ROUTES } from "@/lib/routes";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default function RescheduleResponsePage({ params }: PageProps) {
  const { requestId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [proposal, setProposal] = useState<ProposalWithBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.rescheduleResponse(requestId))}`);
    }
  }, [authLoading, user, router, requestId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await rescheduleApi.getProposalById(requestId);
        if (!cancelled) setProposal(row);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load proposal");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  if (authLoading || loading || !user) {
    return <main className="flex flex-1 items-center justify-center py-20 text-sm text-text-muted">Loading…</main>;
  }

  if (error && !proposal) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center text-sm text-accent-error">
        {error}
      </main>
    );
  }

  if (!proposal || proposal.learner_id !== user.id) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center text-sm text-text-secondary">
        This proposal isn&apos;t addressed to your account.
      </main>
    );
  }

  const mentor = proposal.bookings?.profiles;
  const mentorName = mentor?.name || "Your mentor";
  const originalSlot = proposal.bookings?.availability_slots;
  const expiresAt = proposal.expires_at ? new Date(proposal.expires_at) : null;
  const isExpired = Boolean(expiresAt && expiresAt < new Date());

  const handleAccept = async () => {
    setActing("accept");
    setError("");
    try {
      await rescheduleApi.acceptProposal(proposal.id);
      setDone("accepted");
    } catch (err) {
      setError((err as Error)?.message || "Failed to accept proposal");
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async () => {
    setActing("decline");
    setError("");
    try {
      await rescheduleApi.declineProposal(proposal.id);
      setDone("declined");
    } catch (err) {
      setError((err as Error)?.message || "Failed to decline proposal");
    } finally {
      setActing(null);
    }
  };

  if (done === "accepted") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <CalendarCheck size={40} className="text-accent-success" />
        <h1 className="text-xl font-bold text-text-primary">Session rescheduled!</h1>
        <p className="text-sm text-text-secondary">
          Your new session with {mentorName} is confirmed
          {proposal.proposed_date ? ` on ${formatDate(proposal.proposed_date)}` : ""}
          {proposal.proposed_start_time ? ` at ${formatTime(proposal.proposed_start_time)}` : ""}.
        </p>
        <Link
          href={ROUTES.bookings}
          className="mt-2 rounded-full px-6 py-2.5 text-sm font-semibold text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Go to bookings
        </Link>
      </main>
    );
  }

  if (done === "declined") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <CalendarX2 size={40} className="text-accent-error" />
        <h1 className="text-xl font-bold text-text-primary">Proposal declined</h1>
        <p className="text-sm text-text-secondary">
          {mentorName} will be notified and can propose another time.
        </p>
        <Link
          href={ROUTES.bookings}
          className="mt-2 rounded-full px-6 py-2.5 text-sm font-semibold text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Go to bookings
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.bookings}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-light text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Reschedule proposal</h1>
          <p className="text-xs text-text-muted">From {mentorName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
          {mentor?.avatar_url ? (
            <OptimizedImage src={mentor.avatar_url} alt={mentorName} width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <User size={18} className="text-text-muted" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{mentorName}</p>
          <p className="text-xs text-text-muted">Your mentor</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border-light bg-surface-panel p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Why was this rescheduled?
        </p>
        <p className="text-sm font-semibold text-text-secondary">
          {rescheduleReasonLabel(proposal.bookings?.reschedule_reason, "learner")}
        </p>
        {originalSlot ? (
          <p className="text-xs text-text-muted">
            Original session: {formatDate(originalSlot.date)} · {formatTime(originalSlot.start_time)}
          </p>
        ) : null}
      </div>

      {isExpired ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-accent-error/40 bg-accent-error/10 p-6 text-center">
          <TimerOff size={26} className="text-accent-error" />
          <p className="text-sm font-semibold text-text-primary">Proposal expired</p>
          <p className="text-xs text-text-muted">
            This proposal expired on {expiresAt?.toLocaleDateString()}. The mentor can submit a new one.
          </p>
        </div>
      ) : proposal.proposed_date ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-accent-link/30 bg-accent-link/10 p-6 text-center">
          <CalendarCheck size={26} className="text-accent-link" />
          <p className="text-sm font-semibold text-text-primary">New time proposed</p>
          <p className="text-sm text-text-secondary">
            {formatDate(proposal.proposed_date)}
            {proposal.proposed_start_time && proposal.proposed_end_time
              ? ` · ${formatTime(proposal.proposed_start_time)} – ${formatTime(proposal.proposed_end_time)}`
              : ""}
          </p>
          {expiresAt ? (
            <p className="text-xs text-text-muted">
              Expires {expiresAt.toLocaleDateString()} — respond before then
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-accent-warning/40 bg-accent-warning/10 p-6 text-center">
          <HourglassIcon size={26} className="text-accent-warning" />
          <p className="text-sm font-semibold text-text-primary">Waiting for mentor&apos;s proposal</p>
          <p className="text-xs text-text-muted">{mentorName} will propose a new time. Check back soon.</p>
        </div>
      )}

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {proposal.proposed_date && !isExpired ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!!acting}
            className="flex h-11 items-center justify-center rounded-full text-sm font-semibold text-text-on-accent disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            {acting === "accept" ? "Confirming…" : "Accept & confirm session"}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={!!acting}
            className="flex h-11 items-center justify-center rounded-full border border-accent-error/40 text-sm font-semibold text-accent-error disabled:opacity-60"
          >
            {acting === "decline" ? "Declining…" : "Decline — propose another time"}
          </button>
        </div>
      ) : (
        <Link
          href={ROUTES.bookings}
          className="flex h-11 items-center justify-center rounded-full border border-border-light text-sm font-semibold text-text-secondary"
        >
          Back to bookings
        </Link>
      )}
    </main>
  );
}
