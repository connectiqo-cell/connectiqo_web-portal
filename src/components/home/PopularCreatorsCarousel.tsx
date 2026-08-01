"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, BadgeCheck, User } from "lucide-react";
import Link from "next/link";
import { type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

export function PopularCreatorsCarousel({
  creators,
}: {
  creators: MentorProfileRow[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [creators]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const card = container.querySelector('[data-card]') as HTMLElement;
    if (!card) return;

    const cardWidth = card.offsetWidth;
    const gap = 12; // gap-3
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!creators || creators.length === 0) return null;

  return (
    <section className="w-full py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Popular Creators</h2>
        <Link
          href={ROUTES.discover}
          className="flex items-center gap-0.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all"
            aria-label="Previous creators"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        ) : null}

        {/* Carousel Container */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-hidden scroll-smooth"
          >
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={ROUTES.mentorProfile(creator.id)}
                data-card
                className="group flex w-48 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-300"
              >
                {/* Photo Section */}
                <div className="relative h-56 w-full overflow-hidden bg-linear-to-br from-indigo-100 to-indigo-200">
                  {creator.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.profiles.avatar_url}
                      alt={creator.profiles?.name || ""}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-12 w-12 text-indigo-300" />
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col justify-between gap-3 p-3">
                  {/* Header */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {creator.profiles?.name}
                      </span>
                      <BadgeCheck
                        className="w-4 h-4 text-indigo-600 shrink-0"
                        strokeWidth={2}
                        fill="currentColor"
                      />
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {creator.specialization || "Mentor"}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-gray-800">
                      {creator.rating?.toFixed(1) || "0"}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({((creator.total_sessions || 0) / 1000).toFixed(1)}k)
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-900">
                      ₹{creator.price_per_hour}
                      <span className="text-xs font-normal text-gray-500 block">/session</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shrink-0"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all"
            aria-label="Next creators"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
