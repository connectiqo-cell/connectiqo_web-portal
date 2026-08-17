"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MentorCard } from "@/components/mentor/MentorCard";
import { useAuth } from "@/contexts/AuthContext";
import { type MentorProfileRow, mentorApi } from "@/lib/api/mentorApi";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 12;

export default function RecommendedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [interests, setInterests] = useState<string[]>([]);
  const [mentors, setMentors] = useState<MentorProfileRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.recommended)}`);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const learnerProfile = await profileApi.getLearnerProfile(user.id).catch(() => null);
        const savedInterests = learnerProfile?.interests || [];
        if (cancelled) return;
        setInterests(savedInterests);

        if (savedInterests.length) {
          const data = await mentorApi.getRecommendedMentors(supabase, savedInterests, 0, PAGE_SIZE);
          if (cancelled) return;
          setMentors(data);
          setHasMore(data.length === PAGE_SIZE);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load recommendations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const supabase = createClient();
      const data = await mentorApi.getRecommendedMentors(supabase, interests, page, PAGE_SIZE);
      setMentors((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-accent-secondary">
          <Sparkles size={16} />
          Recommended for you
        </span>
        <h1 className="text-3xl font-bold text-text-primary">Mentors picked for your interests</h1>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-text-muted">Loading recommendations…</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-accent-error">{error}</p>
      ) : !interests.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-light bg-surface-panel py-16 text-center">
          <p className="text-sm text-text-secondary">
            Pick a few categories you&apos;re interested in and we&apos;ll recommend mentors for you.
          </p>
          <Link
            href={ROUTES.interestsOnboarding}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-text-on-accent"
            style={{ backgroundImage: "var(--gradient-button-primary)" }}
          >
            Choose interests
          </Link>
        </div>
      ) : mentors.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-muted">
          No mentors match your interests yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {mentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mx-auto flex items-center gap-2 rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold text-accent-link disabled:opacity-60"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </main>
  );
}
