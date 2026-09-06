"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { VideoFeed } from "@/components/videos/VideoFeed";
import { useAuth } from "@/contexts/AuthContext";
import { videoLibraryApi, type PublicVideo } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 20;

type ReactionCounts = { likeCount: number; dislikeCount: number };

function VideosDiscoveryPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startVideoId = searchParams.get("videoId");
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [unlocks, setUnlocks] = useState<Map<string, { expiresAt: string | null }>>(new Map());
  const [reactionCounts, setReactionCounts] = useState<Map<string, ReactionCounts>>(new Map());
  const [myReactions, setMyReactions] = useState<Map<string, "like" | "dislike">>(new Map());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadingMoreRef = useRef(false);

  const loadReactions = useCallback(
    async (videoIds: string[]) => {
      const [counts, mine] = await Promise.all([
        videoLibraryApi.getVideoReactionCounts(videoIds).catch(() => new Map<string, ReactionCounts>()),
        user
          ? videoLibraryApi.getMyVideoReactions(user.id, videoIds).catch(() => new Map<string, "like" | "dislike">())
          : Promise.resolve(new Map<string, "like" | "dislike">()),
      ]);
      setReactionCounts((prev) => new Map([...prev, ...counts]));
      setMyReactions((prev) => new Map([...prev, ...mine]));
    },
    [user],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rows, unlockMap] = await Promise.all([
          videoLibraryApi.getAllPublicVideos({ page: 0, pageSize: PAGE_SIZE }),
          user ? videoLibraryApi.getLearnerUnlocks(user.id) : Promise.resolve(new Map()),
        ]);
        if (cancelled) return;

        let ordered = rows;
        // Came here from a specific video's card (e.g. Home's "Recommended
        // For You") — pull it to the front so the feed opens on it instead
        // of always on the newest video overall. It may not be in this first
        // page at all (feed is paginated), so fetch it directly if missing.
        if (startVideoId) {
          const already = rows.find((v) => v.id === startVideoId);
          const target = already || (await videoLibraryApi.getPublicVideoById(startVideoId).catch(() => null));
          if (target) {
            ordered = [target, ...rows.filter((v) => v.id !== target.id)];
          }
        }

        setVideos(ordered);
        setUnlocks(unlockMap);
        setPage(1);
        setHasMore(rows.length === PAGE_SIZE);
        void loadReactions(ordered.map((v) => v.id));
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message || "Could not load videos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startVideoId]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    try {
      const rows = await videoLibraryApi.getAllPublicVideos({ page, pageSize: PAGE_SIZE });
      const fresh = rows.filter((v) => !videos.some((existing) => existing.id === v.id));
      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        return [...prev, ...rows.filter((v) => !seen.has(v.id))];
      });
      setPage((p) => p + 1);
      setHasMore(rows.length === PAGE_SIZE);
      if (fresh.length) void loadReactions(fresh.map((v) => v.id));
    } catch (err) {
      setError((err as Error)?.message || "Could not load more videos");
    } finally {
      loadingMoreRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, videos, loadReactions]);

  const handleReact = useCallback(
    (videoId: string, reaction: "like" | "dislike") => {
      if (!user) {
        router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.videos)}`);
        return;
      }

      const current = myReactions.get(videoId) ?? null;
      const next = current === reaction ? null : reaction;

      // Optimistic: flip the button state and adjust counts immediately,
      // then reconcile with the server in the background. Reverts on failure
      // so a flaky request doesn't leave the UI lying about the real count.
      setMyReactions((prev) => {
        const copy = new Map(prev);
        if (next) copy.set(videoId, next);
        else copy.delete(videoId);
        return copy;
      });
      setReactionCounts((prev) => {
        const copy = new Map(prev);
        const counts = copy.get(videoId) ?? { likeCount: 0, dislikeCount: 0 };
        const adjusted = { ...counts };
        if (current === "like") adjusted.likeCount = Math.max(0, adjusted.likeCount - 1);
        if (current === "dislike") adjusted.dislikeCount = Math.max(0, adjusted.dislikeCount - 1);
        if (next === "like") adjusted.likeCount += 1;
        if (next === "dislike") adjusted.dislikeCount += 1;
        copy.set(videoId, adjusted);
        return copy;
      });

      videoLibraryApi.setVideoReaction({ videoId, userId: user.id, reaction: next }).catch(() => {
        // Revert on failure.
        setMyReactions((prev) => {
          const copy = new Map(prev);
          if (current) copy.set(videoId, current);
          else copy.delete(videoId);
          return copy;
        });
        setReactionCounts((prev) => {
          const copy = new Map(prev);
          const counts = copy.get(videoId) ?? { likeCount: 0, dislikeCount: 0 };
          const reverted = { ...counts };
          if (next === "like") reverted.likeCount = Math.max(0, reverted.likeCount - 1);
          if (next === "dislike") reverted.dislikeCount = Math.max(0, reverted.dislikeCount - 1);
          if (current === "like") reverted.likeCount += 1;
          if (current === "dislike") reverted.dislikeCount += 1;
          copy.set(videoId, reverted);
          return copy;
        });
      });
    },
    [user, myReactions, router],
  );

  return (
    <main className={`flex flex-col ${user ? "h-[calc(100dvh-4rem)]" : "h-dvh"}`}>
      {error ? <p className="px-6 py-4 text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="flex-1 py-16 text-center text-sm text-text-muted">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="flex-1 py-16 text-center text-sm text-text-muted">No videos yet. Check back soon.</p>
      ) : (
        <VideoFeed
          videos={videos}
          unlocks={unlocks}
          reactionCounts={reactionCounts}
          myReactions={myReactions}
          onReact={handleReact}
          onNearEnd={handleLoadMore}
        />
      )}
    </main>
  );
}

export default function VideosDiscoveryPage() {
  return (
    <Suspense fallback={<main className="flex flex-1 items-center justify-center text-sm text-text-muted">Loading…</main>}>
      <VideosDiscoveryPageInner />
    </Suspense>
  );
}
