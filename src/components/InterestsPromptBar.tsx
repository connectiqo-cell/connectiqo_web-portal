"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { fetchActiveCategoryNames } from "@/lib/api/contentApi";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";
import { MIN_LEARNER_INTERESTS, needsCategoryInterestOnboarding } from "@/lib/utils/mentorCategories";

function dismissedKey(userId: string) {
  return `interests-prompt-dismissed-${userId}`;
}

/**
 * Dismissible reminder shown when a learner has fewer than MIN_LEARNER_INTERESTS
 * matched interests — e.g. an admin deleted or renamed a category they'd
 * picked, silently dropping their matched count. Deliberately non-blocking:
 * links to the existing interests picker in Settings > Profile instead of
 * forcing a full-page onboarding redirect (which read as a forced logout).
 */
export function InterestsPromptBar() {
  const { user, profile } = useAuth();
  const [needsMore, setNeedsMore] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isLearner = profile?.role === "learner" || profile?.role === "both";

  useEffect(() => {
    if (!user || !isLearner) return;
    let cancelled = false;
    // Deferred to a microtask so the setState calls run as a reaction to the
    // effect rather than synchronously inside its body.
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      if (sessionStorage.getItem(dismissedKey(user.id))) {
        setDismissed(true);
        return;
      }
      const [learner, categoryNames] = await Promise.all([
        profileApi.getLearnerProfile(user.id).catch(() => null),
        fetchActiveCategoryNames().catch(() => []),
      ]);
      if (cancelled) return;
      setNeedsMore(needsCategoryInterestOnboarding(learner?.interests, categoryNames));
    });
    return () => {
      cancelled = true;
    };
  }, [user, isLearner]);

  if (!user || !needsMore || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(dismissedKey(user.id), "1");
    setDismissed(true);
  };

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
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-text-muted hover:text-text-primary"
      >
        <X size={16} />
      </button>
    </div>
  );
}
