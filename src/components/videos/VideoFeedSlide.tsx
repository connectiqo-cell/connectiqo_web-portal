"use client";

import { Check, Link2, Lock, Pause, Play, User, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { PublicVideo } from "@/lib/api/videoLibraryApi";
import { ROUTES } from "@/lib/routes";

export function VideoFeedSlide({
  video,
  canPlay,
  active,
  muted,
  onToggleMute,
}: {
  video: PublicVideo;
  canPlay: boolean;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const mentorName = video.profiles?.name || "Mentor";

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !canPlay) return;
    if (active) {
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active, canPlay]);

  const handleVideoClick = () => {
    const el = videoRef.current;
    if (!el || !canPlay) return;
    if (el.paused) {
      el.play().catch(() => {});
      setIsPaused(false);
    } else {
      el.pause();
      setIsPaused(true);
    }
    setShowPlayPauseIcon(true);
    setTimeout(() => setShowPlayPauseIcon(false), 500);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${ROUTES.mentorProfile(video.mentor_id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // user cancelled share/clipboard prompt — nothing to do
    }
  };

  return (
    <section className="flex h-full w-full shrink-0 snap-start snap-always items-center justify-center px-4 py-6">
      <div
        className={`group relative flex h-full max-h-[760px] w-full max-w-[400px] items-center justify-center overflow-hidden rounded-2xl bg-black shadow-xl`}
      >
        {canPlay ? (
          <>
            <video
              ref={videoRef}
              src={video.video_url}
              poster={video.thumbnail_url || undefined}
              muted={muted}
              loop
              playsInline
              onClick={handleVideoClick}
              className="h-full w-full cursor-pointer object-cover"
            />
            {/* Play button overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-black hover:bg-white">
                <Play size={32} className="ml-1" fill="currentColor" />
              </div>
            </div>

            {/* Play/Pause icon on click */}
            {showPlayPauseIcon && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-black animate-pulse">
                  {isPaused ? (
                    <Play size={40} className="ml-1" fill="currentColor" />
                  ) : (
                    <Pause size={40} fill="currentColor" />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {video.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : null}
            <Link
              href={ROUTES.mentorProfile(video.mentor_id)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 text-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                <Lock size={20} />
              </span>
              <span className="text-sm font-semibold">Unlock to watch</span>
            </Link>
          </>
        )}

        {video.is_free ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent-success/90 px-2.5 py-1 text-[11px] font-bold text-white">
            FREE
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 text-white">
          <p className="line-clamp-2 text-sm font-semibold">{video.title}</p>
          <Link
            href={ROUTES.mentorProfile(video.mentor_id)}
            className="flex w-fit items-center gap-1.5 text-xs text-white/80 hover:text-white"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
              {video.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase storage URL
                <img
                  src={video.profiles.avatar_url}
                  alt={mentorName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={11} />
              )}
            </span>
            {mentorName}
          </Link>
        </div>

        <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4">
          {canPlay ? (
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
          >
            {copied ? <Check size={18} /> : <Link2 size={18} />}
          </button>
        </div>
      </div>

    </section>
  );
}
