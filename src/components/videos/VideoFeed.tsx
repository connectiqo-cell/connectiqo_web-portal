"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PublicVideo } from "@/lib/api/videoLibraryApi";

import { VideoFeedSlide } from "./VideoFeedSlide";

export function VideoFeed({
  videos,
  unlocks,
  onNearEnd,
}: {
  videos: PublicVideo[];
  unlocks: Map<string, { expiresAt: string | null }>;
  onNearEnd?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { root, threshold: [0, 0.6, 1] },
    );

    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [videos.length]);

  useEffect(() => {
    if (!onNearEnd) return;
    if (activeIndex >= videos.length - 3) onNearEnd();
  }, [activeIndex, videos.length, onNearEnd]);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, slideRefs.current.length - 1));
    slideRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, scrollToIndex]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {videos.map((video, i) => (
          <div key={video.id} ref={(el) => { slideRefs.current[i] = el; }} className="h-full snap-start">
            <VideoFeedSlide
              video={video}
              canPlay={video.is_free || unlocks.has(video.mentor_id)}
              active={i === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Previous video"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-surface-panel text-text-secondary shadow-sm hover:text-text-primary disabled:opacity-40"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === videos.length - 1}
          aria-label="Next video"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-surface-panel text-text-secondary shadow-sm hover:text-text-primary disabled:opacity-40"
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
}
