"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useProfileCompleteness } from "@/contexts/ProfileCompletenessContext";
import { ROUTES } from "@/lib/routes";

/**
 * Reminder shown whenever the signed-in creator's profile_completeness
 * score is below MIN_PROFILE_COMPLETENESS. Dismissible, but disappearing it
 * doesn't silence it forever: it reappears on its own if the condition goes
 * back to true after being fixed — same pattern as InterestsPromptBar.
 */
export function ProfileCompletenessPromptBar() {
  const { needsMoreProfile, completeness } = useProfileCompleteness();
  const [dismissed, setDismissed] = useState(false);

  // Reset a prior dismissal whenever this flips from false to true again —
  // compared during render rather than in an effect, per React's guidance on
  // adjusting state when a prop changes without an extra render pass.
  const [prevNeedsMore, setPrevNeedsMore] = useState(needsMoreProfile);
  if (needsMoreProfile !== prevNeedsMore) {
    setPrevNeedsMore(needsMoreProfile);
    if (needsMoreProfile) setDismissed(false);
  }

  if (!needsMoreProfile || dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b border-accent-warning/40 bg-accent-warning/10 px-4 py-2.5 text-sm sm:px-6">
      <span className="flex-1 text-text-primary">
        Your profile is {completeness}% complete — finish it to appear in more searches.
      </span>
      <Link
        href={ROUTES.editProfileForm}
        className="shrink-0 rounded-full bg-accent-warning/20 px-3.5 py-1.5 text-xs font-semibold text-accent-warning"
      >
        Complete profile
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
