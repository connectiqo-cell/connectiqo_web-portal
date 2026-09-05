"use client";

import { ArrowLeft, CalendarClock, CalendarX2, HourglassIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { rescheduleApi, rescheduleReasonLabel } from "@/lib/api/rescheduleApi";
import { ROUTES } from "@/lib/routes";
import { slotDurationMinutes } from "@/lib/utils/contiguousSlots";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { TimeSlotPicker, type BusyInterval } from "@/components/booking/TimeSlotPicker";

const MAX_ATTEMPTS = 3;

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
  const [otherBookings, setOtherBookings] = useState<BookingRow[]>([]);
  const [declinedCount, setDeclinedCount] = useState(0);
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
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [row, mentorBookings, count] = await Promise.all([
          bookingApi.getBooking(bookingId),
          bookingApi.getUpcomingBookingsByMentor(user.id).catch(() => []),
          rescheduleApi.getDeclinedCount(bookingId).catch(() => 0),
        ]);
        if (!cancelled) {
          setBooking(row);
          setOtherBookings(mentorBookings.filter((b) => b.id !== bookingId));
          setDeclinedCount(count);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load booking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, user]);

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

  if (!booking || booking.mentor_id !== user.id) {
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

  const busyIntervals: BusyInterval[] = otherBookings
    .filter((b) => b.availability_slots?.date === date)
    .map((b) => ({ start: b.availability_slots!.start_time, end: b.availability_slots!.end_time }));

  if (booking.status === "reschedule_unresolved") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <CalendarX2 size={40} className="text-text-muted" />
        <h1 className="text-xl font-bold text-text-primary">Reschedule unresolved</h1>
        <p className="text-sm text-text-secondary">
          You and {learnerName} were unable to reach an agreement on a new time after {MAX_ATTEMPTS} proposals.
          This booking is now closed.
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

  if (booking.status === "reschedule_proposed") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <HourglassIcon size={40} className="text-accent-warning" />
        <h1 className="text-xl font-bold text-text-primary">Waiting for {learnerName}&apos;s response</h1>
        <p className="text-sm text-text-secondary">
          You&apos;ve already proposed a new time. {learnerName} has 48 hours to accept or decline it.
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

  if (booking.status !== "reschedule_needed") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center text-sm text-text-secondary">
        This booking isn&apos;t awaiting a reschedule proposal.
      </main>
    );
  }

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
        date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 sm:px-6 py-8 sm:py-12">
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-6 rounded-2xl border border-border-light bg-surface-panel p-5 sm:p-6">
          <p className="text-sm text-text-secondary">
            This slot will be reserved exclusively for {learnerName}.
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Date</span>
            <BookingCalendar
              minDate={minDate}
              selectedDate={date || null}
              onSelectDate={(d) => {
                setDate(d);
                setStartTime("");
              }}
            />
          </div>

          {date && requiredDurationMinutes ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Start time</span>
              <TimeSlotPicker
                date={date}
                durationMinutes={requiredDurationMinutes}
                busyIntervals={busyIntervals}
                selectedStartTime={startTime || null}
                onSelect={setStartTime}
              />
            </div>
          ) : null}

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

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-border-light bg-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Original session</p>
            <p className="text-sm font-semibold text-text-primary">
              {rescheduleReasonLabel(booking.reschedule_reason, "mentor")}
            </p>
            {slot ? (
              <p className="text-xs text-text-muted">
                {formatDate(slot.date)} · {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                {requiredDurationMinutes ? ` (${requiredDurationMinutes} min)` : ""}
              </p>
            ) : null}
            {booking.reschedule_deadline ? (
              <p className="text-xs text-text-muted">
                Propose by {formatDate(booking.reschedule_deadline.split("T")[0])}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 rounded-2xl border border-border-light bg-surface-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Reschedule attempts</p>
            <p className="text-sm font-semibold text-text-primary">
              Attempt {declinedCount + 1} of {MAX_ATTEMPTS}
            </p>
            <p className="text-xs text-text-muted">
              If {learnerName} declines {MAX_ATTEMPTS - declinedCount} more time
              {MAX_ATTEMPTS - declinedCount === 1 ? "" : "s"}, this booking will be marked unresolved.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
