"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, BadgeCheck } from "lucide-react";
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
    const gap = 24; // 24px gap
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
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Previous creators"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Carousel Container */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-hidden scroll-smooth"
          >
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={ROUTES.mentorProfile(creator.id)}
                data-card
                className="flex shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                style={{
                  flex: "0 0 calc((100% - 48px) / 2)",
                  height: "140px",
                }}
              >
                {/* Avatar Section */}
                <div className="relative flex h-full w-24 shrink-0 items-center justify-center bg-indigo-100">
                  {creator.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.profiles.avatar_url}
                      alt={creator.profiles?.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-indigo-600">
                      {creator.profiles?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col justify-between p-2.5">
                  <div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {creator.profiles?.name}
                      </span>
                      <BadgeCheck
                        className="w-3 h-3 text-indigo-600 shrink-0"
                        strokeWidth={2}
                        fill="currentColor"
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-600 truncate">
                      {creator.specialization || "Mentor"}
                    </p>

                    <div className="mt-1 flex items-center gap-0.5 text-[10px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-800">
                        {creator.rating?.toFixed(1) || "0"}
                      </span>
                      <span className="text-gray-500">
                        ({((creator.total_sessions || 0) / 1000).toFixed(1)}k)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                      ₹{creator.price_per_hour}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="rounded-md bg-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0 whitespace-nowrap"
                    >
                      Book now
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Next creators"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </section>
  );
}
