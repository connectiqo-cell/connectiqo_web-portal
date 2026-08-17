"use client";

import { ChevronRight, Star, User } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { useEffect, useRef, useState } from "react";

import type { MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

interface CategoryCarouselProps {
  title: string;
  mentors: MentorProfileRow[];
  viewAllLink?: string;
}

export function CategoryCarousel({
  title,
  mentors,
  viewAllLink,
}: CategoryCarouselProps) {
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
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-accent-link hover:text-accent-link-hover w-fit"
          >
            View all ({mentors.length})
            <ChevronRight size={14} className="sm:size-4" />
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mentors.map((mentor) => {
            const name = mentor.profiles?.name || "Mentor";
            const avatarUrl = mentor.profiles?.avatar_url;
            const reviewCount = mentor.total_sessions || 0;

            return (
              <Link
                key={mentor.id}
                href={ROUTES.mentorProfile(mentor.id)}
                className="group flex w-44 sm:w-56 shrink-0 flex-col gap-3 rounded-2xl border border-border-light bg-surface-panel p-3 sm:p-4 transition-all hover:border-border-default hover:shadow-lg"
              >
                {/* Avatar */}
                <div className="flex h-24 sm:h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-surface-chip to-surface-panel">
                  {avatarUrl ? (
                    <OptimizedImage src={avatarUrl} alt={name} width={160} height={160} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <User size={20} className="sm:size-8 text-text-muted" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2">
                  <div>
                    <p className="truncate text-xs sm:text-sm font-bold text-text-primary">{name}</p>
                    <p className="truncate text-xs text-text-muted">
                      {mentor.specialization || "Mentor"}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-0.5">
                    <Star size={12} className="sm:size-3.5 fill-accent-secondary text-accent-secondary" />
                    <span className="text-xs font-semibold text-text-primary">
                      {mentor.rating?.toFixed(1) || "0"}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({(reviewCount / 1000).toFixed(1)}k)
                    </span>
                  </div>

                  {/* Price & Button */}
                  <div className="mt-auto flex items-center justify-between gap-2">
                    {mentor.price_per_hour && (
                      <span className="text-xs sm:text-sm font-bold text-accent-secondary">
                        ₹{mentor.price_per_hour}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="shrink-0 rounded-lg bg-accent-primary px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-white hover:bg-accent-primary-hover transition-colors whitespace-nowrap"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll left"
          >
            <ChevronRight size={18} className="rotate-180 text-text-primary" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 z-10"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} className="text-text-primary" />
          </button>
        )}
      </div>
    </section>
  );
}
