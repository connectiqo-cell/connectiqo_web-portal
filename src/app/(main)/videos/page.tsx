"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { VideoFeed } from "@/components/videos/VideoFeed";
import { useAuth } from "@/contexts/AuthContext";
import { videoLibraryApi, type PublicVideo } from "@/lib/api/videoLibraryApi";

const PAGE_SIZE = 20;

function VideosDiscoveryPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const startVideoId = searchParams.get("videoId");
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [unlocks, setUnlocks] = useState<Map<string, { expiresAt: string | null }>>(new Map());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadingMoreRef = useRef(false);

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
      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        return [...prev, ...rows.filter((v) => !seen.has(v.id))];
      });
      setPage((p) => p + 1);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setError((err as Error)?.message || "Could not load more videos");
    } finally {
      loadingMoreRef.current = false;
    }
  }, [page, hasMore]);

  return (
    <main className={`flex flex-col ${user ? "h-[calc(100dvh-4rem)]" : "h-dvh"}`}>
      {error ? <p className="px-6 py-4 text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="flex-1 py-16 text-center text-sm text-text-muted">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="flex-1 py-16 text-center text-sm text-text-muted">No videos yet. Check back soon.</p>
      ) : (
        <VideoFeed videos={videos} unlocks={unlocks} onNearEnd={handleLoadMore} />
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
