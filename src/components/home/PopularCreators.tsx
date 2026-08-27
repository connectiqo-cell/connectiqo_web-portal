"use client";

import { ChevronLeft, ChevronRight, Star, Users } from "lucide-react";
import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { useEffect, useRef, useState } from "react";

import { mentorSlug, type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

export function PopularCreators({
  creators,
}: {
  creators: MentorProfileRow[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => checkScroll(), 100);
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      clearTimeout(timer);
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [creators]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const firstCard = container.querySelector('[data-creator-card]') as HTMLElement;
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 16;
        const scrollAmount = cardWidth + gap;
        container.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  if (!creators || creators.length === 0) return null;

  return (
    <section className="w-full mt-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Popular Creators</h3>
        <Link href={ROUTES.discover} className="flex items-center gap-1 text-sm font-semibold text-accent-link hover:text-accent-link/80 transition-colors">
          View all <ChevronRight size={16} />
        </Link>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none"
        >
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={ROUTES.mentorProfile(mentorSlug(creator))}
              data-creator-card
              className="group flex w-52 shrink-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 transition-all hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-gray-100 to-gray-200">
                  {creator.profiles?.avatar_url ? (
                    <OptimizedImage src={creator.profiles.avatar_url} alt={creator.profiles?.name || ""} width={64} height={64} className="h-full w-full object-cover" />
                  ) : (
                    <Users size={24} className="text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{creator.profiles?.name}</p>
                  <p className="truncate text-xs text-gray-600">
                    {creator.specialization || "Mentor"}
                  </p>

                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-900">
                      {creator.rating?.toFixed(1) || "0"}
                    </span>
                    <span className="text-xs text-gray-600">
                      ({((creator.total_sessions || 0) / 1000).toFixed(1)}k)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                {creator.price_per_hour && (
                  <span className="text-sm font-bold text-gray-900">
                    ₹{creator.price_per_hour}
                    <span className="text-xs text-gray-600 font-normal">/session</span>
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="ml-auto shrink-0 rounded-lg bg-accent-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-primary-hover transition-colors whitespace-nowrap"
                >
                  Book Now
                </button>
              </div>
            </Link>
          ))}
        </div>

        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 hover:shadow-lg active:scale-95 transition-all duration-150 z-20"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md p-2 hover:bg-gray-50 hover:shadow-lg active:scale-95 transition-all duration-150 z-20"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        )}
      </div>
    </section>
  );
}
