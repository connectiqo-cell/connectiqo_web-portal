"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { bookmarkApi } from "@/lib/api/bookmarkApi";
import { ROUTES } from "@/lib/routes";

export function SaveMentorButton({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const isOwnProfile = user?.id === mentorId;

  useEffect(() => {
    if (!user || isOwnProfile) return;
    let cancelled = false;
    (async () => {
      const isSaved = await bookmarkApi.isSaved(user.id, mentorId);
      if (!cancelled) setSaved(isSaved);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, mentorId, isOwnProfile]);

  if (isOwnProfile) return null;

  const handleClick = async () => {
    if (!user) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.mentorProfile(mentorId))}`);
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        await bookmarkApi.unsaveMentor(user.id, mentorId);
        setSaved(false);
      } else {
        await bookmarkApi.saveMentor(user.id, mentorId);
        setSaved(true);
      }
    } catch {
      // Best-effort — leave state unchanged on failure.
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Save mentor"}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
        saved
          ? "border-accent-link bg-accent-link/10 text-accent-link"
          : "border-border-light text-text-secondary hover:border-border-default hover:text-text-primary"
      }`}
    >
      <Bookmark size={18} className={saved ? "fill-current" : ""} />
    </button>
  );
}
