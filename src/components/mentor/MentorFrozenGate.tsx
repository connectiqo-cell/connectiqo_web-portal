"use client";

import { Snowflake } from "lucide-react";

import { formatMentorFreezeUntil } from "@/lib/utils/mentorFreeze";

/** Shown instead of mentor dashboard tools when the mentor side is frozen. */
export function MentorFrozenGate({
  until = null,
  reason = null,
}: {
  until?: string | null;
  reason?: string | null;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl border border-border-light bg-surface-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
          <Snowflake size={28} />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Mentor account frozen</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Your mentor profile and videos are hidden from others until{" "}
          <span className="font-semibold text-text-primary">{formatMentorFreezeUntil(until)}</span>.
          You can still use learner features.
        </p>
        {reason ? (
          <p className="mt-3 text-xs text-text-muted">Reason: {reason}</p>
        ) : null}
      </div>
    </div>
  );
}
