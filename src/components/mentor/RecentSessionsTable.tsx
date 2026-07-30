"use client";

import { Download, Play } from "lucide-react";
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-light">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Date & Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Duration</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b border-border-light hover:bg-surface-chip/50">
              <td className="px-4 py-3 text-text-primary font-semibold">{session.learner_profile?.name || "Learner"}</td>
              <td className="px-4 py-3 text-text-secondary">{formatDateTime(session.availability_slots?.date, session.availability_slots?.start_time)}</td>
              <td className="px-4 py-3 text-text-secondary">{session.duration_minutes || "—"} min</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(session)}`}>
                  {getStatusLabel(session)}
                </span>
              </td>
              <td className="px-4 py-3 text-accent-link">
                {session.recording_url && (
                  <div className="flex gap-2">
                    <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                      <Play size={14} />
                    </a>
                    <a href={session.recording_url} download className="inline-flex items-center gap-1 hover:underline">
                      <Download size={14} />
                    </a>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
