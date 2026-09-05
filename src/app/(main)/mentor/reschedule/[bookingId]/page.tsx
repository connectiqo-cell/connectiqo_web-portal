"use client";

import { ArrowLeft, CalendarClock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { rescheduleApi, rescheduleReasonLabel } from "@/lib/api/rescheduleApi";
import { ROUTES } from "@/lib/routes";
import { slotDurationMinutes } from "@/lib/utils/contiguousSlots";

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  params: Promise<{ bookingId: string }>;
}

export default function RescheduleRequestPage({ params }: PageProps) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.rescheduleRequest(bookingId))}`);
    }
  }, [authLoading, user, router, bookingId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await bookingApi.getBooking(bookingId);
        if (!cancelled) setBooking(row);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load booking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (authLoading || loading || !user) {
    return <main className="flex flex-1 items-center justify-center py-20 text-sm text-text-muted">Loading…</main>;
  }

  if (error && !booking) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center text-sm text-accent-error">
        {error}
      </main>
    );
  }

  if (!booking || booking.mentor_id !== user.id || booking.status !== "reschedule_pending") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center text-sm text-text-secondary">
        This booking isn&apos;t awaiting a reschedule proposal.
      </main>
    );
  }

  const learnerName = booking.learner_profile?.name || "the learner";
  const slot = booking.availability_slots;
  // The proposed slot must run as long as the one the learner originally paid
  // for (getBooking() already expands this to the full span for continuous
  // multi-slot bookings) — not a fixed length.
  const requiredDurationMinutes = slot ? slotDurationMinutes(slot.start_time, slot.end_time) : null;
  const endTime = startTime && requiredDurationMinutes ? addMinutes(startTime, requiredDurationMinutes) : "";
  const minDate = toDateStr(new Date());

  const handleSubmit = async () => {
    if (!date || !startTime) {
      setError("Pick a date and start time");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await rescheduleApi.proposeSlot({
        bookingId: booking.id,
        mentorId: user.id,
        learnerId: booking.learner_id,
        date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        reason: booking.reschedule_reason ?? null,
      });
      setSent(true);
    } catch (err) {
      setError((err as Error)?.message || "Failed to send proposal");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <CalendarClock size={40} className="text-accent-success" />
        <h1 className="text-xl font-bold text-text-primary">Proposal sent</h1>
        <p className="text-sm text-text-secondary">
          {learnerName} will be notified and has 48 hours to accept or decline.
        </p>
        <Link
          href={ROUTES.mentorSessions}
          className="mt-2 rounded-full px-6 py-2.5 text-sm font-semibold text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Back to sessions
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.mentorSessions}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-light text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Propose new time</h1>
          <p className="text-xs text-text-muted">For {learnerName}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border-light bg-surface-panel p-4">
        <p className="text-sm font-semibold text-text-primary">
          {rescheduleReasonLabel(booking.reschedule_reason, "mentor")}
        </p>
        {slot ? (
          <p className="text-xs text-text-muted">
            Original session: {formatDate(slot.date)} · {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
            {requiredDurationMinutes ? ` (${requiredDurationMinutes} min)` : ""}
          </p>
        ) : null}
        {booking.reschedule_deadline ? (
          <p className="text-xs text-text-muted">
            Propose by {formatDate(booking.reschedule_deadline.split("T")[0])}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
        <p className="text-sm text-text-secondary">
          This slot will be reserved exclusively for {learnerName}.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Date</span>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Start time</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded-xl border border-border-light bg-surface-sheet px-3 py-2.5 text-sm text-text-primary focus:outline-none"
          />
        </label>

        {startTime && requiredDurationMinutes ? (
          <p className="text-xs text-text-muted">
            Session runs {formatTime(startTime)} – {formatTime(endTime)} ({requiredDurationMinutes} min)
          </p>
        ) : null}

        {error ? <p className="text-sm text-accent-error">{error}</p> : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !date || !startTime || !requiredDurationMinutes}
          className="mt-1 flex h-11 items-center justify-center rounded-full text-sm font-semibold text-text-on-accent disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          {submitting ? "Sending…" : "Send proposal"}
        </button>
      </div>
    </main>
  );
}
