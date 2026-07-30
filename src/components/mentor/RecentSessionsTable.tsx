"use client";

import { Download, Play, User } from "lucide-react";
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
        <thead className="hidden sm:table-header-group">
          <tr className="border-b border-border-light">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Learner</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Date & Time</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Duration</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Status</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Action</th>
          </tr>
        </thead>
        <tbody className="block sm:table-row-group">
          {sessions.map((session) => (
            <tr key={session.id} className="mb-3 block sm:mb-0 sm:table-row border border-border-light sm:border-0 sm:border-b rounded-lg sm:rounded-none p-3 sm:p-0 bg-surface-panel sm:bg-transparent">
              <td className="flex items-center gap-2 py-2 sm:py-3 px-0 sm:px-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                  {session.learner_profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.learner_profile.avatar_url} alt={session.learner_profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <User size={16} className="text-text-muted" />
                  )}
                </div>
                <span className="font-semibold text-text-primary">{session.learner_profile?.name || "Learner"}</span>
              </td>
              <td className="py-2 sm:py-3 px-0 sm:px-3 text-text-secondary text-sm">
                {formatDateTime(session.availability_slots?.date, session.availability_slots?.start_time)}
              </td>
              <td className="py-2 sm:py-3 px-0 sm:px-3 text-text-secondary text-sm">
                {session.duration_minutes || "—"} min
              </td>
              <td className="py-2 sm:py-3 px-0 sm:px-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(session)}`}>
                  {getStatusLabel(session)}
                </span>
              </td>
              <td className="py-2 sm:py-3 px-0 sm:px-3">
                {session.recording_url && (
                  <div className="flex gap-2">
                    <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 hover:bg-surface-chip rounded-full text-accent-link">
                      <Play size={16} />
                    </a>
                    <a href={session.recording_url} download className="inline-flex items-center justify-center h-8 w-8 hover:bg-surface-chip rounded-full text-text-secondary">
                      <Download size={16} />
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
