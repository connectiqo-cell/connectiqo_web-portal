"use client";

import { TimerOff } from "lucide-react";
import { useState } from "react";

import type { BookingRow } from "@/lib/api/bookingApi";
import { rescheduleApi } from "@/lib/api/rescheduleApi";

/**
 * Shown in the learner's Upcoming list for a booking whose session window
 * has closed with the mentor never joining, and no reschedule has been
 * requested yet. Lets them request one directly from the list instead of
 * having to click "Join" into the call page to discover the option — calls
 * the same markForReschedule action the call page's button uses. On
 * success the booking's status flips to reschedule_needed, so the parent's
 * refetch naturally hands it off to the existing RescheduleBanner.
 */
export function RequestRescheduleBanner({
  booking,
  onRequested,
}: {
  booking: BookingRow;
  onRequested: () => void;
}) {
  const mentorName = booking.profiles?.name || "Your mentor";
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async () => {
    setRequesting(true);
    setError("");
    try {
      await rescheduleApi.markForReschedule(booking.id, "mentor_noshow");
      onRequested();
    } catch (err) {
      setError((err as Error)?.message || "Failed to request reschedule");
      setRequesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-accent-warning/40 bg-accent-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <TimerOff size={18} className="shrink-0 text-accent-warning" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-text-primary">
            {mentorName} didn&apos;t join the session
          </span>
          <span className="text-xs text-text-muted">{error || "You can request a free reschedule."}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleRequest}
        disabled={requesting}
        className="shrink-0 rounded-full bg-accent-warning/20 px-3.5 py-1.5 text-xs font-semibold text-accent-warning disabled:opacity-60"
      >
        {requesting ? "Requesting…" : "Request reschedule"}
      </button>
    </div>
  );
}
