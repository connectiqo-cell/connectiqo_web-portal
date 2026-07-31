"use client";

import { ChevronLeft, ChevronRight, Star, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

export function TrendingCreators({
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
      const scrollAmount = 280; // Card width (260px) + gap (20px)
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!creators || creators.length === 0) return null;

  return (
    <section className="w-full mt-8">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Trending Creators</h2>
        <p className="text-base text-gray-500">Discover the most popular mentors on Connectiqo</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Left Arrow - Hidden on tablet/mobile */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto scroll-smooth scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {creators.map((creator) => (
            <Link
              key={creator.id}
              href={ROUTES.mentorProfile(creator.id)}
              className="group flex shrink-0 w-64 h-48 flex-col rounded-3xl border border-[#E8E8F0] bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              {/* Top Section: Image and Info */}
              <div className="flex gap-3 mb-3">
                {/* Avatar */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  {creator.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.profiles.avatar_url}
                      alt={creator.profiles?.name || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users size={24} className="text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-lg font-semibold text-gray-900">
                    {creator.profiles?.name}
                  </h3>
                  <p className="truncate text-sm text-gray-500">
                    {creator.specialization || "Mentor"}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400 shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">
                      {creator.rating?.toFixed(1) || "0"}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({((creator.total_sessions || 0) / 1000).toFixed(1)}k)
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200 my-2" />

              {/* Bottom Section: Price and Button */}
              <div className="flex items-center justify-between mt-auto">
                {creator.price_per_hour && (
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{creator.price_per_hour}
                    <span className="text-xs text-gray-500 font-normal">/session</span>
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="h-11 px-5 rounded-2xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 whitespace-nowrap"
                >
                  Book Now
                </button>
              </div>
            </Link>
          ))}
            </div>
        </div>

        {/* Right Arrow - Hidden on tablet/mobile */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

    </section>
  );
}
