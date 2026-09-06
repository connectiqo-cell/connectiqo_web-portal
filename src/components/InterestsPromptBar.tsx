"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useInterestsStatus } from "@/contexts/InterestsStatusContext";
import { ROUTES } from "@/lib/routes";
import { MIN_LEARNER_INTERESTS } from "@/lib/utils/mentorCategories";

/**
 * Reminder shown whenever the signed-in learner has fewer than
 * MIN_LEARNER_INTERESTS matched interests — e.g. an admin deleted/renamed a
 * category they'd picked, silently dropping their matched count. Dismissible,
 * but disappearing it doesn't silence it forever: it reappears on its own if
 * the condition goes back to true after being fixed (e.g. dismissed once,
 * then a later admin action drops them below 5 again).
 */
export function InterestsPromptBar() {
  const { needsMoreInterests } = useInterestsStatus();
  const [dismissed, setDismissed] = useState(false);

  // Reset a prior dismissal whenever this flips from false to true again —
  // compared during render rather than in an effect, per React's guidance on
  // adjusting state when a prop changes without an extra render pass.
  const [prevNeedsMore, setPrevNeedsMore] = useState(needsMoreInterests);
  if (needsMoreInterests !== prevNeedsMore) {
    setPrevNeedsMore(needsMoreInterests);
    if (needsMoreInterests) setDismissed(false);
  }

  if (!needsMoreInterests || dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b border-accent-warning/40 bg-accent-warning/10 px-4 py-2.5 text-sm sm:px-6">
      <span className="flex-1 text-text-primary">
        Select at least {MIN_LEARNER_INTERESTS} interests to get personalized recommendations.
      </span>
      <Link
        href={ROUTES.editProfileForm}
        className="shrink-0 rounded-full bg-accent-warning/20 px-3.5 py-1.5 text-xs font-semibold text-accent-warning"
      >
        Update interests
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-text-muted hover:text-text-primary"
      >
        <X size={16} />
      </button>
    </div>
  );
}
