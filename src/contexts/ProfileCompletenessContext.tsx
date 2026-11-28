"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api/profileApi";

/** Below this score (out of 100, from mentor_profiles.profile_completeness —
 * see creator_profile_completeness() in the DB), the creator sees a prompt
 * to finish their profile. */
export const MIN_PROFILE_COMPLETENESS = 70;

interface ProfileCompletenessContextValue {
  /** True while the current creator's profile_completeness is below MIN_PROFILE_COMPLETENESS. */
  needsMoreProfile: boolean;
  /** The raw score (0-100), for displaying "X% complete" in the bar. */
  completeness: number;
  /** Re-run the check immediately — call after saving profile fields in Settings. */
  refresh: () => void;
}

const ProfileCompletenessContext = createContext<ProfileCompletenessContextValue>({
  needsMoreProfile: false,
  completeness: 100,
  refresh: () => {},
});

/**
 * Tracks whether the signed-in creator's profile is complete enough, shared
 * between the persistent ProfileCompletenessPromptBar (in AppShell) and the
 * Settings > Profile editor that lets them fix it — mirrors
 * InterestsStatusContext's pattern exactly.
 */
export function ProfileCompletenessProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [completeness, setCompleteness] = useState(100);
  const isCreator = profile?.role === "mentor" || profile?.role === "both";

  const check = useCallback(async () => {
    if (!user || !isCreator) {
      setCompleteness(100);
      return;
    }
    const score = await profileApi.getProfileCompleteness(user.id).catch(() => 100);
    setCompleteness(score);
  }, [user, isCreator]);

  useEffect(() => {
    // Deferred to a microtask so the setState calls run as a reaction to the
    // effect rather than synchronously inside its body.
    void Promise.resolve().then(() => {
      void check();
    });
  }, [check]);

  return (
    <ProfileCompletenessContext.Provider
      value={{ needsMoreProfile: completeness < MIN_PROFILE_COMPLETENESS, completeness, refresh: check }}
    >
      {children}
    </ProfileCompletenessContext.Provider>
  );
}

export function useProfileCompleteness() {
  return useContext(ProfileCompletenessContext);
}
