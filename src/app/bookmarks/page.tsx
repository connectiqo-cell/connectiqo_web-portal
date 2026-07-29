"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MentorCard } from "@/components/mentor/MentorCard";
import { useAuth } from "@/contexts/AuthContext";
import { bookmarkApi } from "@/lib/api/bookmarkApi";
import type { MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mentors, setMentors] = useState<MentorProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.bookmarks)}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await bookmarkApi.getSavedMentors(user.id);
        if (!cancelled) setMentors(rows);
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load bookmarks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Bookmarks</h1>
        <p className="mt-1 text-text-secondary">Mentors you&apos;ve saved for later.</p>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : mentors.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-chip text-text-muted">
            <Bookmark size={22} />
          </span>
          <p className="text-sm text-text-muted">
            No bookmarks yet. Tap the bookmark icon on a mentor&apos;s profile to save them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {mentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}
    </main>
  );
}
