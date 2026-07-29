"use client";

import {
  Calendar as CalendarIcon,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HeadphonesIcon,
  History,
  ListChecks,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BookingListItem } from "@/components/booking/BookingListItem";
import { RescheduleBanner } from "@/components/booking/RescheduleBanner";
import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { paymentApi } from "@/lib/api/paymentApi";
import { rescheduleApi, type ProposalWithBooking } from "@/lib/api/rescheduleApi";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { ROUTES } from "@/lib/routes";
import { isBookingSessionPast, isExpiredBooking } from "@/lib/utils/bookingSession";
import { useBookingsRealtime } from "@/lib/hooks/useBookingsRealtime";

const SUPPORT_EMAIL = "contact@connectiqo.com";
const PREVIEW_COUNT = 4;

function toDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [history, setHistory] = useState<BookingRow[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [proposals, setProposals] = useState<ProposalWithBooking[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recordingByBooking, setRecordingByBooking] = useState<Map<string, string>>(new Map());
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [up, hist, pendingProposals, transactions, recordings] = await Promise.all([
        bookingApi.getUpcomingBookingsByLearner(user.id),
        bookingApi.getBookingHistoryByLearner(user.id),
        rescheduleApi.getProposalsForLearner(user.id),
        paymentApi.getTransactions(user.id).catch(() => []),
        bookingApi.getRecordedSessions(user.id).catch(() => []),
      ]);
      setUpcoming(up);
      setHistory(hist);
      setProposals(pendingProposals);
      setTotalSpent(
        transactions
          .filter((t) => t.learner_id === user.id)
          .reduce((sum, t) => sum + t.amount_total_paise, 0) / 100,
      );
      setRecordingByBooking(new Map(recordings.map((r) => [r.id, r.recording_playback_url])));

      const completedIds = hist.filter((b) => b.status === "completed").map((b) => b.id);
      setReviewedIds(await reviewsApi.getReviewedBookingIds(completedIds));
    } catch (err) {
      setError((err as Error)?.message || "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Deferred to a microtask so the fetch (and its setState calls) run as a
    // reaction to the effect rather than synchronously inside its body.
    void Promise.resolve().then(() => loadBookings());
  }, [user, loadBookings]);

  useBookingsRealtime(user?.id, loadBookings);

  const handleCancel = async (bookingId: string) => {
    try {
      await bookingApi.cancelBooking(bookingId);
      await loadBookings();
    } catch (err) {
      setError((err as Error)?.message || "Could not cancel booking");
    }
  };

  const reschedulePending = upcoming.filter((b) => b.status === "reschedule_pending");
  const regularUpcoming = upcoming.filter((b) => b.status !== "reschedule_pending");
  const activeUpcoming = regularUpcoming.filter((b) => !isBookingSessionPast(b));
  const expired = regularUpcoming.filter((b) => isBookingSessionPast(b));
  const proposalByBookingId = new Map(proposals.map((p) => [p.booking_id, p]));
  const upcomingCount = reschedulePending.length + activeUpcoming.length + expired.length;
  const visibleActiveUpcoming = showAllUpcoming ? activeUpcoming : activeUpcoming.slice(0, PREVIEW_COUNT);
  const visibleExpired = showAllUpcoming
    ? expired
    : expired.slice(0, Math.max(0, PREVIEW_COUNT - visibleActiveUpcoming.length));
  const visibleHistory = showAllHistory ? history : history.slice(0, PREVIEW_COUNT);

  const allBookings = useMemo(() => [...upcoming, ...history], [upcoming, history]);
  const bookingDatesSet = useMemo(
    () => new Set(allBookings.map((b) => b.availability_slots?.date).filter((d): d is string => !!d)),
    [allBookings],
  );
  const summary = useMemo(
    () => ({
      total: allBookings.length,
      completed: history.filter((b) => b.status === "completed").length,
      expired: allBookings.filter((b) => isExpiredBooking(b)).length,
    }),
    [allBookings, history],
  );

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayStr = new Date().toISOString().split("T")[0];

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Bookings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your upcoming and past sessions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex gap-2 border-b border-border-light">
            <a
              href="#upcoming-sessions"
              className="border-b-2 border-accent-link px-4 py-2.5 text-sm font-semibold text-accent-link"
            >
              Upcoming
            </a>
            <a
              href="#session-history"
              className="px-4 py-2.5 text-sm font-semibold text-text-muted hover:text-text-secondary"
            >
              History
            </a>
          </div>

          {error ? <p className="text-sm text-accent-error">{error}</p> : null}

          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">Loading bookings…</p>
          ) : (
            <>
              <section
                id="upcoming-sessions"
                className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 scroll-mt-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
                    <CalendarCheck size={15} className="text-accent-link" />
                    Upcoming Sessions
                  </h2>
                  {upcomingCount > PREVIEW_COUNT ? (
                    <button
                      type="button"
                      onClick={() => setShowAllUpcoming((v) => !v)}
                      className="text-xs font-semibold text-accent-link"
                    >
                      {showAllUpcoming ? "Show less" : "View all"}
                    </button>
                  ) : null}
                </div>
                {upcomingCount === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-link/10 text-accent-link">
                      <CalendarCheck size={24} />
                    </span>
                    <p className="text-sm font-semibold text-text-primary">No upcoming sessions</p>
                    <p className="max-w-xs text-xs text-text-muted">
                      Book a session with your favorite mentor and it will appear here.
                    </p>
                    <Link
                      href={ROUTES.discover}
                      className="mt-1 rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent"
                      style={{ backgroundImage: "var(--gradient-button-primary)" }}
                    >
                      Explore Mentors
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {reschedulePending.map((booking) => (
                      <RescheduleBanner
                        key={booking.id}
                        booking={booking}
                        variant="learner"
                        proposal={proposalByBookingId.get(booking.id) || null}
                      />
                    ))}
                    {visibleActiveUpcoming.map((booking) => (
                      <BookingListItem key={booking.id} booking={booking} onCancel={handleCancel} />
                    ))}
                    {visibleExpired.map((booking) => (
                      <BookingListItem key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </section>

              <section
                id="session-history"
                className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 scroll-mt-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
                    <History size={15} className="text-accent-link" />
                    Session History
                  </h2>
                  {history.length > PREVIEW_COUNT ? (
                    <button
                      type="button"
                      onClick={() => setShowAllHistory((v) => !v)}
                      className="text-xs font-semibold text-accent-link"
                    >
                      {showAllHistory ? "Show less" : "View all"}
                    </button>
                  ) : null}
                </div>
                {history.length === 0 ? (
                  <p className="py-8 text-center text-sm text-text-muted">No past sessions yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {visibleHistory.map((booking) => (
                      <BookingListItem
                        key={booking.id}
                        booking={booking}
                        reviewed={booking.status === "completed" ? reviewedIds.has(booking.id) : undefined}
                        recordingUrl={recordingByBooking.get(booking.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
                <CalendarIcon size={15} className="text-accent-link" />
                Calendar
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
                  aria-label="Previous month"
                  className="rounded-lg p-1 text-text-secondary hover:text-text-primary"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="min-w-24 text-center text-xs font-semibold text-text-secondary">
                  {monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
                  aria-label="Next month"
                  className="rounded-lg p-1 text-text-secondary hover:text-text-primary"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-text-muted">
              {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
                <span key={`${label}-${i}`}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />;
                const cellStr = toDateStr(new Date(year, month, day));
                const hasBooking = bookingDatesSet.has(cellStr);
                const isToday = cellStr === todayStr;
                return (
                  <div
                    key={cellStr}
                    className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs ${
                      isToday ? "bg-accent-link text-text-on-accent font-semibold" : "text-text-secondary"
                    }`}
                  >
                    {day}
                    <span
                      className={`h-1 w-1 rounded-full ${hasBooking ? (isToday ? "bg-text-on-accent" : "bg-accent-link") : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border-light bg-surface-panel p-4">
            <h3 className="mb-3 text-sm font-bold text-text-primary">Booking Summary</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-link/10 text-accent-link">
                  <ListChecks size={14} />
                </span>
                <span className="flex-1 text-xs text-text-secondary">Total Sessions</span>
                <span className="text-sm font-bold text-text-primary">{summary.total}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-success/10 text-accent-success">
                  <CalendarCheck size={14} />
                </span>
                <span className="flex-1 text-xs text-text-secondary">Completed</span>
                <span className="text-sm font-bold text-text-primary">{summary.completed}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-warning/10 text-accent-warning">
                  <Clock3 size={14} />
                </span>
                <span className="flex-1 text-xs text-text-secondary">Expired</span>
                <span className="text-sm font-bold text-text-primary">{summary.expired}</span>
              </div>
              <div className="flex items-center gap-2.5 border-t border-border-light pt-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-secondary/10 text-accent-secondary">
                  <Wallet size={14} />
                </span>
                <span className="flex-1 text-xs text-text-secondary">Total Spent</span>
                <span className="text-sm font-bold text-text-primary">₹{totalSpent.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-link/10 text-accent-link">
                <HeadphonesIcon size={16} />
              </span>
              <h3 className="text-sm font-bold text-text-primary">Need Help?</h3>
            </div>
            <p className="text-xs text-text-muted">
              Our support team is here to help you with your bookings and sessions.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Connectiqo Support")}`}
              className="rounded-full border border-border-light px-4 py-2 text-center text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Contact Support
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
