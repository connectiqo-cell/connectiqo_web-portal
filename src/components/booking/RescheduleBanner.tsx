"use client";

import { CalendarClock, CalendarX2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { BookingRow } from "@/lib/api/bookingApi";
import type { ProposalWithBooking } from "@/lib/api/rescheduleApi";
import { rescheduleApi, rescheduleReasonLabel } from "@/lib/api/rescheduleApi";
import { ROUTES } from "@/lib/routes";

const MAX_ATTEMPTS = 3;

/**
 * Shown in place of a regular BookingListItem for bookings in one of the
 * three reschedule statuses (reschedule_needed, reschedule_proposed,
 * reschedule_unresolved) — all three live in the History tab now, since none
 * represent a confirmed upcoming session.
 */
export function RescheduleBanner({
  booking,
  variant,
  proposal,
}: {
  booking: BookingRow;
  variant: "mentor" | "learner";
  /** Learner only: the mentor's proposal for this booking, once one exists. */
  proposal?: ProposalWithBooking | null;
}) {
  const isMentorView = variant === "mentor";
  const otherParty = isMentorView ? booking.learner_profile : booking.profiles;
  const otherName = otherParty?.name || (isMentorView ? "Learner" : "Mentor");
  const reasonLabel = rescheduleReasonLabel(booking.reschedule_reason, variant);
  const isUnresolved = booking.status === "reschedule_unresolved";
  const isProposed = booking.status === "reschedule_proposed";

  const [declinedCount, setDeclinedCount] = useState<number | null>(null);
  useEffect(() => {
    if (isUnresolved) return;
    let cancelled = false;
    rescheduleApi
      .getDeclinedCount(booking.id)
      .then((count) => {
        if (!cancelled) setDeclinedCount(count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [booking.id, isUnresolved]);

  if (isUnresolved) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-border-light bg-surface-chip p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarX2 size={18} className="shrink-0 text-text-muted" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-text-secondary">
              {isMentorView ? `${otherName} — Reschedule unresolved` : "Reschedule unresolved"}
            </span>
            <span className="text-xs text-text-muted">
              Unable to reach an agreement on a new time. This booking is now closed.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-accent-warning/40 bg-accent-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <CalendarClock size={18} className="shrink-0 text-accent-warning" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-text-primary">
            {isMentorView ? `${otherName} — Reschedule needed` : "Reschedule needed"}
          </span>
          <span className="text-xs text-text-muted">
            {reasonLabel}
            {declinedCount ? ` · Attempt ${declinedCount + 1} of ${MAX_ATTEMPTS}` : ""}
          </span>
        </div>
      </div>

      {isMentorView ? (
        isProposed ? (
          <span className="shrink-0 rounded-full bg-surface-chip px-3.5 py-1.5 text-xs font-semibold text-text-muted">
            Waiting for {otherName}&apos;s response
          </span>
        ) : (
          <Link
            href={ROUTES.rescheduleRequest(booking.id)}
            className="shrink-0 rounded-full bg-accent-warning/20 px-3.5 py-1.5 text-xs font-semibold text-accent-warning"
          >
            Propose time
          </Link>
        )
      ) : isProposed && proposal ? (
        <Link
          href={ROUTES.rescheduleResponse(proposal.id)}
          className="shrink-0 rounded-full bg-accent-warning/20 px-3.5 py-1.5 text-xs font-semibold text-accent-warning"
        >
          Review proposal
        </Link>
      ) : (
        <span className="shrink-0 rounded-full bg-surface-chip px-3.5 py-1.5 text-xs font-semibold text-text-muted">
          Waiting for {otherName}
        </span>
      )}
    </div>
  );
}
