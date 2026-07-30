"use client";

import { User } from "lucide-react";
import { useEffect, useState } from "react";

import type { BookingRow } from "@/lib/api/bookingApi";
import { bookingApi } from "@/lib/api/bookingApi";
import { isBookingSessionPast } from "@/lib/utils/bookingSession";

export function RecentSessionsTable({ mentorId }: { mentorId: string }) {
  const [sessions, setSessions] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [completed, history] = await Promise.all([
          bookingApi.getUpcomingBookingsByMentor(mentorId),
          bookingApi.getBookingHistoryByMentor(mentorId),
        ]);
        const expiredSessions = completed.filter((b) => isBookingSessionPast(b));
        setSessions([...expiredSessions, ...history].slice(0, 10));
      } catch (err) {
        setError((err as Error)?.message || "Could not load sessions");
      } finally {
        setLoading(false);
      }
    })();
  }, [mentorId]);

  if (loading) return <p className="py-4 text-center text-sm text-text-muted">Loading sessions…</p>;
  if (error) return <p className="text-sm text-accent-error">{error}</p>;
  if (sessions.length === 0) return <p className="py-4 text-center text-sm text-text-muted">No sessions yet</p>;

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => (
        <div key={session.id} className="flex items-center gap-3 border-b border-border-light pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
            {session.learner_profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.learner_profile.avatar_url} alt={session.learner_profile.name} className="h-full w-full object-cover" />
            ) : (
              <User size={18} className="text-text-muted" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{session.learner_profile?.name || "Learner"}</p>
            <p className="text-xs text-text-muted">{formatDateTime(session.availability_slots?.date, session.availability_slots?.start_time)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-text-primary">{session.duration_minutes || "—"}</p>
            <p className="text-xs text-text-muted">min</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(date?: string, time?: string) {
  if (!date) return "—";
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!time) return label;
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${label}, ${hour12}:${String(min).padStart(2, "0")} ${period}`;
}

function getStatusLabel(session: BookingRow): string {
  if (isBookingSessionPast(session)) return "Completed";
  if (session.status === "pending" || session.status === "confirmed") return "Booked";
  if (session.status === "completed") return "Completed";
  if (session.status === "cancelled" || session.status === "rejected") return "Cancelled";
  return session.status;
}

function getStatusStyle(session: BookingRow): string {
  const label = getStatusLabel(session);
  const styles: Record<string, string> = {
    Completed: "bg-accent-success/15 text-accent-success",
    Booked: "bg-accent-info/15 text-accent-info",
    Cancelled: "bg-accent-error/15 text-accent-error",
  };
  return styles[label] || "bg-surface-chip text-text-secondary";
}
