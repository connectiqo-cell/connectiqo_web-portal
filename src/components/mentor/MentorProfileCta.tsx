"use client";

import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";

/**
 * Booking CTA on a mentor's public profile. When the mentor is viewing their
 * own page, booking (and, by extension, subscribing) themselves makes no
 * sense — mirrors mobile's `isOwnProfile` guard (disabled "Book 1-on-1" +
 * "Your channel" label) instead of leaving the normal booking button live.
 */
export function MentorProfileCta({ mentorId }: { mentorId: string }) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === mentorId;

  if (isOwnProfile) {
    return (
      <div className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border-light bg-surface-chip text-sm font-semibold text-text-secondary sm:w-64">
        This is your channel
      </div>
    );
  }

  return (
    <Link
      href={ROUTES.booking(mentorId)}
      className="flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-text-on-accent sm:w-64"
      style={{ backgroundImage: "var(--gradient-button-primary)" }}
    >
      Book a session
    </Link>
  );
}
