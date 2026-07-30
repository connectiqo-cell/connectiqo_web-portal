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
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full text-xs sm:text-sm">
        <thead className="hidden sm:table-header-group">
          <tr className="border-b border-border-light">
            <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Learner</th>
            <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Date & Time</th>
            <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Duration</th>
            <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Status</th>
            <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Action</th>
          </tr>
        </thead>
        <tbody className="block sm:table-row-group space-y-2 sm:space-y-0">
          {sessions.map((session) => (
            <tr key={session.id} className="mb-2 sm:mb-0 block sm:table-row border border-border-light sm:border-0 sm:border-b rounded-lg sm:rounded-none p-4 sm:p-0 bg-surface-panel sm:bg-transparent hover:bg-surface-chip/50 transition-colors">
              <td className="flex items-center gap-3 mb-3 sm:mb-0 py-2 sm:py-4 px-0 sm:px-3 min-w-0">
                <div className="flex h-10 sm:h-8 w-10 sm:w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                  {session.learner_profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.learner_profile.avatar_url} alt={session.learner_profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <User size={18} className="sm:size-4 text-text-muted" />
                  )}
                </div>
                <span className="font-semibold text-text-primary truncate">{session.learner_profile?.name || "Learner"}</span>
              </td>
              <td className="flex items-center justify-between mb-3 sm:mb-0 py-2 sm:py-4 px-0 sm:px-3">
                <span className="text-xs text-text-muted sm:hidden mr-2">Date:</span>
                <span className="text-text-secondary text-xs sm:text-sm">
                  {formatDateTime(session.availability_slots?.date, session.availability_slots?.start_time)}
                </span>
              </td>
              <td className="flex items-center justify-between mb-3 sm:mb-0 py-2 sm:py-4 px-0 sm:px-3">
                <span className="text-xs text-text-muted sm:hidden mr-2">Duration:</span>
                <span className="text-text-secondary text-xs sm:text-sm font-medium">
                  30 min
                </span>
              </td>
              <td className="flex items-center justify-between mb-3 sm:mb-0 py-2 sm:py-4 px-0 sm:px-3">
                <span className="text-xs text-text-muted sm:hidden mr-2">Status:</span>
                <span className={`inline-flex rounded-full px-3 py-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold ${getStatusStyle(session)}`}>
                  {getStatusLabel(session)}
                </span>
              </td>
              <td className="flex items-center justify-center gap-2 py-2 sm:py-4 px-0 sm:px-3">
                {session.recording_url && (
                  <div className="flex gap-2">
                    <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 hover:bg-surface-chip rounded-full text-accent-link transition-colors">
                      <Play size={18} className="sm:size-4" />
                    </a>
                    <a href={session.recording_url} download className="inline-flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 hover:bg-surface-chip rounded-full text-text-secondary transition-colors">
                      <Download size={18} className="sm:size-4" />
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
