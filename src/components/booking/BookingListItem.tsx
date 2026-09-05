"use client";

import { Calendar, Clock, Download, MoreVertical, Play, Star, User, Video } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { useEffect, useRef, useState } from "react";

import { ReportUserModal } from "@/components/ReportUserModal";
import type { BookingRow } from "@/lib/api/bookingApi";
import { ROUTES } from "@/lib/routes";
import { isExpiredBooking } from "@/lib/utils/bookingSession";

const STATUS_STYLES: Record<string, string> = {
  Booked: "bg-accent-info/15 text-accent-info",
  Completed: "bg-accent-success/15 text-accent-success",
  Cancelled: "bg-accent-error/15 text-accent-error",
  Expired: "bg-text-disabled/20 text-text-muted",
  "Reschedule Pending": "bg-accent-warning/15 text-accent-warning",
  Unresolved: "bg-text-disabled/20 text-text-muted",
};

// These rows normally render via RescheduleBanner instead of this component —
// these entries are a defensive fallback only.
function statusLabelFor(booking: BookingRow): string {
  if (isExpiredBooking(booking)) return "Expired";
  if (booking.status === "pending" || booking.status === "confirmed") return "Booked";
  if (booking.status === "completed") return "Completed";
  if (booking.status === "cancelled" || booking.status === "rejected") return "Cancelled";
  if (booking.status === "reschedule_needed" || booking.status === "reschedule_proposed") {
    return "Reschedule Pending";
  }
  if (booking.status === "reschedule_unresolved") return "Unresolved";
  return booking.status;
}

function formatTime(time: string) {
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(min).padStart(2, "0")} ${period}`;
}

function formatDateTime(date?: string, time?: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!time) return label;
  return `${label} · ${formatTime(time)}`;
}

function MoreMenu({ otherPartyId, bookingId }: { otherPartyId?: string; bookingId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!otherPartyId) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        className="flex h-10 w-10 sm:h-7 sm:w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface-chip hover:text-text-primary"
      >
        <MoreVertical size={18} className="sm:size-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-10 w-40 rounded-xl border border-border-light bg-surface-panel p-1.5 shadow-lg">
          <div className="px-2 py-1.5">
            <ReportUserModal reportedUserId={otherPartyId} contextType="booking" contextId={bookingId} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BookingListItem({
  booking,
  variant = "learner",
  onCancel,
  reviewed,
  recordingUrl,
  showMoreMenu = true,
}: {
  booking: BookingRow;
  /** "learner" shows the mentor's identity (default); "mentor" shows the learner's. */
  variant?: "learner" | "mentor";
  onCancel?: (bookingId: string) => void;
  /** When known, shows a "Rate" CTA for completed learner bookings without a review yet. */
  reviewed?: boolean;
  /** Playback URL for a recorded session, if one exists. */
  recordingUrl?: string;
  /** Report-user "more options" menu — on by default. */
  showMoreMenu?: boolean;
}) {
  const label = statusLabelFor(booking);
  const canCancel = onCancel && (booking.status === "pending" || booking.status === "confirmed") && label === "Booked";
  const isMentorView = variant === "mentor";
  const canReview = !isMentorView && label === "Completed" && reviewed === false;
  const otherParty = isMentorView ? booking.learner_profile : booking.profiles;
  const otherName = otherParty?.name || (isMentorView ? "Learner" : "Mentor");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-panel p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
          {otherParty?.avatar_url ? (
            <OptimizedImage src={otherParty.avatar_url} alt={otherName} width={40} height={40} className="h-full w-full object-cover" />
          ) : (
            <User size={18} className="text-text-muted" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          {isMentorView ? (
            <span className="text-sm font-semibold text-text-primary">{otherName}</span>
          ) : (
            <Link
              href={ROUTES.mentorProfile(booking.mentor_id)}
              className="text-sm font-semibold text-text-primary hover:text-accent-link"
            >
              {otherName}
            </Link>
          )}
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDateTime(booking.availability_slots?.date)}
            </span>
            {booking.availability_slots?.start_time ? (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTime(booking.availability_slots.start_time)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-row flex-wrap items-center gap-2">
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[label] || "bg-surface-chip text-text-secondary"}`}>
          {label}
        </span>
        {booking.original_booking_id ? (
          <span className="w-fit rounded-full bg-accent-link/15 px-3 py-1.5 text-xs font-semibold text-accent-link">
            Rescheduled
          </span>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:gap-1.5">
          {label === "Booked" ? (
            <Link
              href={ROUTES.call(booking.id)}
              className="flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-text-on-accent shadow-sm"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <Video size={13} />
              <span className="sm:hidden">Join Call</span>
              <span className="hidden sm:inline">Join</span>
            </Link>
          ) : null}
          {recordingUrl ? (
            <>
              <a
                href={recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                <Play size={13} />
                <span className="sm:hidden">Replay</span>
              </a>
              <a
                href={recordingUrl}
                download
                className="flex items-center justify-center gap-1 rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                <Download size={13} />
                <span className="sm:hidden">Download</span>
              </a>
            </>
          ) : null}
          {canReview ? (
            <Link
              href={ROUTES.review(booking.id)}
              className="flex items-center justify-center gap-1 rounded-full bg-accent-primary/15 px-3 py-1.5 text-xs font-semibold text-accent-primary"
            >
              <Star size={13} />
              <span className="sm:hidden">Rate Now</span>
              <span className="hidden sm:inline">Rate</span>
            </Link>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              onClick={() => onCancel!(booking.id)}
              className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-accent-error hover:text-accent-error hover:bg-accent-error/10 rounded-full"
            >
              Cancel
            </button>
          ) : null}
        </div>
        {showMoreMenu ? (
          <div className="ml-auto sm:ml-0">
            <MoreMenu otherPartyId={otherParty?.id} bookingId={booking.id} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
