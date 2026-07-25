"use client";

import { useCallback, useEffect, useState } from "react";

import { BookingListItem } from "@/components/booking/BookingListItem";
import { useAuth } from "@/contexts/AuthContext";
import { bookingApi, type BookingRow } from "@/lib/api/bookingApi";
import { useBookingsRealtime } from "@/lib/hooks/useBookingsRealtime";
import { isBookingSessionPast } from "@/lib/utils/bookingSession";

type Tab = "upcoming" | "history";

export default function MentorSessionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [history, setHistory] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [up, hist] = await Promise.all([
        bookingApi.getUpcomingBookingsByMentor(user.id),
        bookingApi.getBookingHistoryByMentor(user.id),
      ]);
      setUpcoming(up);
      setHistory(hist);
    } catch (err) {
      setError((err as Error)?.message || "Could not load sessions");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => loadSessions());
  }, [user, loadSessions]);

  useBookingsRealtime(user?.id, loadSessions);

  const activeUpcoming = upcoming.filter((b) => !isBookingSessionPast(b));
  const expired = upcoming.filter((b) => isBookingSessionPast(b));

  return (
    <div className="flex flex-col gap-6">
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
        <p className="py-8 text-center text-sm text-text-muted">Loading sessions…</p>
      ) : tab === "upcoming" ? (
        <div className="flex flex-col gap-3">
          {activeUpcoming.length === 0 && expired.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">No upcoming sessions.</p>
          ) : (
            <>
              {activeUpcoming.map((booking) => (
                <BookingListItem key={booking.id} booking={booking} variant="mentor" />
              ))}
              {expired.map((booking) => (
                <BookingListItem key={booking.id} booking={booking} variant="mentor" />
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
              <BookingListItem key={booking.id} booking={booking} variant="mentor" />
            ))
          )}
        </div>
      )}
    </div>
  );
}
