import { Calendar, Clock, Star, User, Video } from "lucide-react";
import Link from "next/link";

import type { BookingRow } from "@/lib/api/bookingApi";
import { ROUTES } from "@/lib/routes";
import { isExpiredBooking } from "@/lib/utils/bookingSession";

const STATUS_STYLES: Record<string, string> = {
  Booked: "bg-accent-info/15 text-accent-info",
  Completed: "bg-accent-success/15 text-accent-success",
  Cancelled: "bg-accent-error/15 text-accent-error",
  Expired: "bg-text-disabled/20 text-text-muted",
};

function statusLabelFor(booking: BookingRow): string {
  if (isExpiredBooking(booking)) return "Expired";
  if (booking.status === "pending" || booking.status === "confirmed") return "Booked";
  if (booking.status === "completed") return "Completed";
  if (booking.status === "cancelled" || booking.status === "rejected") return "Cancelled";
  return booking.status;
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
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${label} · ${hour12}:${String(min).padStart(2, "0")} ${period}`;
}

export function BookingListItem({
  booking,
  variant = "learner",
  onCancel,
  reviewed,
}: {
  booking: BookingRow;
  /** "learner" shows the mentor's identity (default); "mentor" shows the learner's. */
  variant?: "learner" | "mentor";
  onCancel?: (bookingId: string) => void;
  /** When known, shows a "Rate" CTA for completed learner bookings without a review yet. */
  reviewed?: boolean;
}) {
  const label = statusLabelFor(booking);
  const canCancel = onCancel && (booking.status === "pending" || booking.status === "confirmed") && label === "Booked";
  const isMentorView = variant === "mentor";
  const canReview = !isMentorView && label === "Completed" && reviewed === false;
  const otherParty = isMentorView ? booking.learner_profile : booking.profiles;
  const otherName = otherParty?.name || (isMentorView ? "Learner" : "Mentor");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
          {otherParty?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
            <img src={otherParty.avatar_url} alt={otherName} className="h-full w-full object-cover" />
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
                {formatDateTime(undefined, booking.availability_slots.start_time).replace(
                  "· ",
                  "",
                )}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[label] || "bg-surface-chip text-text-secondary"}`}>
          {label}
        </span>
        {label === "Booked" ? (
          <Link
            href={ROUTES.call(booking.id)}
            className="flex items-center gap-1 rounded-full bg-accent-link/15 px-2.5 py-1 text-xs font-semibold text-accent-link"
          >
            <Video size={12} />
            Join
          </Link>
        ) : null}
        {canReview ? (
          <Link
            href={ROUTES.review(booking.id)}
            className="flex items-center gap-1 rounded-full bg-accent-primary/15 px-2.5 py-1 text-xs font-semibold text-accent-primary"
          >
            <Star size={12} />
            Rate
          </Link>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            onClick={() => onCancel!(booking.id)}
            className="text-xs font-semibold text-accent-error hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
