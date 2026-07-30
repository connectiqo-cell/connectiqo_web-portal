"use client";

import { ChevronRight, Star, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

interface TrendingCreatorsProps {
  mentors: MentorProfileRow[];
}

export function TrendingCreators({ mentors }: TrendingCreatorsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      scroll(diff > 0 ? "right" : "left");
    }
    setTouchStart(null);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!mentors.length) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Trending Creators 🔥</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Top mentors loved by our community
          </p>
        </div>
        <Link
          href="/discover"
          className="hidden items-center gap-1 text-sm font-semibold text-accent-link hover:text-accent-link-hover sm:flex"
        >
          View All Creators
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="relative">
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:thin] [scrollbar-color:var(--color-border-light)_transparent]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mentors.map((mentor) => (
            <CreatorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>

        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll left"
          >
            <ChevronRight size={20} className="rotate-180 text-text-primary" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} className="text-text-primary" />
          </button>
        )}
      </div>
    </div>
  );
}

function CreatorCard({ mentor }: { mentor: MentorProfileRow }) {
  const name = mentor.profiles?.name || "Mentor";
  const avatarUrl = mentor.profiles?.avatar_url;
  const reviewCount = mentor.total_sessions || 0;

  return (
    <Link
      href={ROUTES.mentorProfile(mentor.id)}
      className="group flex w-72 shrink-0 gap-3 rounded-2xl border border-border-light bg-surface-panel p-3 transition-all hover:border-border-default hover:shadow-lg"
    >
      {/* Avatar Section - Left Side */}
      <div className="flex-shrink-0">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-surface-chip to-surface-panel">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <User size={32} className="text-text-muted" />
          )}
        </div>
      </div>

      {/* Content Section - Right Side */}
      <div className="flex flex-1 flex-col justify-between gap-2">
        {/* Name & Badge */}
        <div>
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-bold text-text-primary">{name}</p>
            {mentor.rating && mentor.rating >= 4.5 && (
              <span className="inline-block text-sm">✓</span>
            )}
          </div>
          <p className="truncate text-xs text-text-muted">{mentor.specialization || "Mentor"}</p>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Star size={12} className="fill-accent-secondary text-accent-secondary" />
            <span className="text-xs font-semibold text-text-primary">
              {mentor.rating?.toFixed(1) || "0"}
            </span>
          </div>
          <span className="text-xs text-text-muted">
            ({(reviewCount / 1000).toFixed(1)}k)
          </span>
        </div>

        {/* Price & Button Row */}
        <div className="flex items-center justify-between gap-2">
          {mentor.price_per_hour ? (
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-accent-secondary">
                ₹{mentor.price_per_hour}
              </span>
              <span className="text-xs text-text-muted">/session</span>
            </div>
          ) : null}

          {/* Book Now Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex-shrink-0 rounded-lg bg-accent-primary px-4 py-1.5 text-white font-semibold text-xs hover:bg-accent-primary-hover transition-colors whitespace-nowrap"
          >
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
}
