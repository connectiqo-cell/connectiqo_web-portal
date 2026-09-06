"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { fetchActiveCategoryNames } from "@/lib/api/contentApi";
import { profileApi } from "@/lib/api/profileApi";
import { needsCategoryInterestOnboarding } from "@/lib/utils/mentorCategories";

interface InterestsStatusContextValue {
  /** True while the current learner has fewer than MIN_LEARNER_INTERESTS matched interests. */
  needsMoreInterests: boolean;
  /** Re-run the check immediately — call after saving interests in Settings. */
  refresh: () => void;
}

const InterestsStatusContext = createContext<InterestsStatusContextValue>({
  needsMoreInterests: false,
  refresh: () => {},
});

/**
 * Tracks whether the signed-in learner currently has enough matched
 * interests, shared between the persistent InterestsPromptBar (in
 * AppShell) and the Settings > Profile editor that lets them fix it — so
 * saving there makes the bar disappear immediately, without a reload.
 */
export function InterestsStatusProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [needsMore, setNeedsMore] = useState(false);
  const isLearner = profile?.role === "learner" || profile?.role === "both";

  const check = useCallback(async () => {
    if (!user || !isLearner) {
      setNeedsMore(false);
      return;
    }
    const [learner, categoryNames] = await Promise.all([
      profileApi.getLearnerProfile(user.id).catch(() => null),
      fetchActiveCategoryNames().catch(() => []),
    ]);
    setNeedsMore(needsCategoryInterestOnboarding(learner?.interests, categoryNames));
  }, [user, isLearner]);

  useEffect(() => {
    // Deferred to a microtask so the setState calls run as a reaction to the
    // effect rather than synchronously inside its body.
    void Promise.resolve().then(() => {
      void check();
    });
  }, [check]);

  return (
    <InterestsStatusContext.Provider value={{ needsMoreInterests: needsMore, refresh: check }}>
      {children}
    </InterestsStatusContext.Provider>
  );
}

export function useInterestsStatus() {
  return useContext(InterestsStatusContext);
}
