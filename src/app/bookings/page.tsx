"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BookingListItem } from "@/components/booking/BookingListItem";
import { RescheduleBanner } from "@/components/booking/RescheduleBanner";
import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { rescheduleApi, type ProposalWithBooking } from "@/lib/api/rescheduleApi";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { ROUTES } from "@/lib/routes";
import { isBookingSessionPast } from "@/lib/utils/bookingSession";
import { useBookingsRealtime } from "@/lib/hooks/useBookingsRealtime";

type Tab = "upcoming" | "history";

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [history, setHistory] = useState<BookingRow[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [proposals, setProposals] = useState<ProposalWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace(ROUTES.login);
  }, [authLoading, user, router]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [up, hist, pendingProposals] = await Promise.all([
        bookingApi.getUpcomingBookingsByLearner(user.id),
        bookingApi.getBookingHistoryByLearner(user.id),
        rescheduleApi.getProposalsForLearner(user.id),
      ]);
      setUpcoming(up);
      setHistory(hist);
      setProposals(pendingProposals);

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

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary">My Bookings</h1>

      <div className="flex gap-2 border-b border-border-light">
        {(["upcoming", "history"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === key
                ? "border-b-2 border-accent-link text-accent-link"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading bookings…</p>
      ) : tab === "upcoming" ? (
        <div className="flex flex-col gap-3">
          {reschedulePending.length === 0 && activeUpcoming.length === 0 && expired.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              No upcoming sessions. Go book one!
            </p>
          ) : (
            <>
              {reschedulePending.map((booking) => (
                <RescheduleBanner
                  key={booking.id}
                  booking={booking}
                  variant="learner"
                  proposal={proposalByBookingId.get(booking.id) || null}
                />
              ))}
              {activeUpcoming.map((booking) => (
                <BookingListItem key={booking.id} booking={booking} onCancel={handleCancel} />
              ))}
              {expired.map((booking) => (
                <BookingListItem key={booking.id} booking={booking} />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">No past sessions yet.</p>
          ) : (
            history.map((booking) => (
              <BookingListItem
                key={booking.id}
                booking={booking}
                reviewed={booking.status === "completed" ? reviewedIds.has(booking.id) : undefined}
              />
            ))
          )}
        </div>
      )}
    </main>
  );
}
