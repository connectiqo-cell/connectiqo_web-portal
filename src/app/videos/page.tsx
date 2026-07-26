"use client";

import { Lock, Play, User, Video as VideoIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { videoLibraryApi, type PublicVideo } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 20;

export default function VideosDiscoveryPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [unlocks, setUnlocks] = useState<Map<string, { expiresAt: string | null }>>(new Map());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

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

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const rows = await videoLibraryApi.getAllPublicVideos({ page, pageSize: PAGE_SIZE });
      setVideos((prev) => [...prev, ...rows]);
      setPage((p) => p + 1);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setError((err as Error)?.message || "Could not load more videos");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Videos</h1>
        <p className="mt-1 text-text-secondary">
          Free previews and full libraries from mentors across Connectiqo.
        </p>
      </div>

      {error ? <p className="text-sm text-accent-error">{error}</p> : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-text-muted">Loading…</p>
      ) : videos.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-muted">No videos yet. Check back soon.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {videos.map((video) => {
              const canPlay = video.is_free || unlocks.has(video.mentor_id);
              const mentorName = video.profiles?.name || "Mentor";

              return (
                <Link
                  key={video.id}
                  href={ROUTES.mentorProfile(video.mentor_id)}
                  className="flex flex-col gap-2"
                >
                  <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-meeting-canvas">
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="h-full w-full object-cover opacity-80"
                      />
                    ) : (
                      <VideoIcon size={24} className="text-text-muted" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      {canPlay ? (
                        <Play size={20} className="fill-white text-white" />
                      ) : (
                        <Lock size={18} className="text-white" />
                      )}
                    </span>
                    {video.is_free ? (
                      <span className="absolute left-2 top-2 rounded-full bg-accent-success/90 px-2 py-0.5 text-[10px] font-bold text-white">
                        FREE
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs font-semibold text-text-primary">{video.title}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-chip">
                      {video.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                        <img
                          src={video.profiles.avatar_url}
                          alt={mentorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={10} className="text-text-muted" />
                      )}
                    </div>
                    <span className="truncate text-[11px] text-text-muted">{mentorName}</span>
                  </div>
                </Link>
              );
            })}
          </div>

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
        </>
      )}
    </main>
  );
}
