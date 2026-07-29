"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { VideoFeed } from "@/components/videos/VideoFeed";
import { useAuth } from "@/contexts/AuthContext";
import { videoLibraryApi, type PublicVideo } from "@/lib/api/videoLibraryApi";

const PAGE_SIZE = 20;

export default function VideosDiscoveryPage() {
  const { user } = useAuth();
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
        setVideos(rows);
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
  }, [user]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    try {
      const rows = await videoLibraryApi.getAllPublicVideos({ page, pageSize: PAGE_SIZE });
      setVideos((prev) => [...prev, ...rows]);
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
