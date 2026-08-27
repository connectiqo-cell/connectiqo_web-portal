"use client";

import { ChevronLeft, ChevronRight, Star, BadgeCheck, User } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { mentorSlug, type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";
import { useHorizontalScroll } from "@/lib/hooks/useHorizontalScroll";

export function PopularCreatorsCarousel({
  creators,
}: {
  creators: MentorProfileRow[];
}) {
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll(
    creators,
    "[data-card]",
  );

  if (!creators || creators.length === 0) return null;

  return (
    <section className="w-full py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text-primary">Popular Creators</h2>
        <Link
          href={ROUTES.discover}
          className="flex items-center gap-0.5 text-sm font-medium text-accent-link"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Previous Button */}
        {canScrollLeft ? (
          <button
            onClick={() => scroll("left")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light bg-surface-panel shadow-sm hover:bg-surface-chip transition-all"
            aria-label="Previous creators"
          >
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>
        ) : null}

        {/* Carousel Container */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-hidden scroll-smooth"
          >
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={ROUTES.mentorProfile(mentorSlug(creator))}
                data-card
                className="group flex h-32 w-80 shrink-0 flex-row items-center gap-4 overflow-hidden rounded-2xl border border-border-light bg-surface-panel p-4 hover:shadow-lg transition-all duration-300"
              >
                {/* Photo Section */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-accent-link/15 to-accent-link/25">
                  {creator.profiles?.avatar_url ? (
                    <OptimizedImage src={creator.profiles.avatar_url} alt={creator.profiles?.name || ""} width={96} height={96} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-8 w-8 text-accent-link/60" />
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
                  {/* Header */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-text-primary truncate">
                        {creator.profiles?.name}
                      </span>
                      <BadgeCheck
                        className="w-4 h-4 text-accent-link shrink-0"
                        strokeWidth={2}
                        fill="currentColor"
                      />
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {creator.specialization || "Mentor"}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent-warning text-accent-warning" />
                    <span className="text-sm font-semibold text-text-secondary">
                      {creator.rating?.toFixed(1) || "0"}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({((creator.total_sessions || 0) / 1000).toFixed(1)}k)
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-text-primary whitespace-nowrap">
                      ₹{creator.price_per_hour}
                      <span className="text-xs font-normal text-text-muted ml-1">/session</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="rounded-lg bg-accent-primary px-3 py-1.5 text-xs font-bold text-text-on-accent hover:bg-accent-primary-hover transition-colors shrink-0 whitespace-nowrap"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Next Button */}
        {canScrollRight ? (
          <button
            onClick={() => scroll("right")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light bg-surface-panel shadow-sm hover:bg-surface-chip transition-all"
            aria-label="Next creators"
          >
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
