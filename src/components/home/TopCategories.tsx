"use client";

import { useRef, useState, useEffect } from "react";
import {
  Gamepad2,
  Rocket,
  BarChart3,
  Cpu,
  Briefcase,
  Dumbbell,
  MonitorPlay,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

type Category = {
  label: string;
  icon: React.ElementType;
  color: string;
};

const categories: Category[] = [
  { label: "Gaming & Esports", icon: Gamepad2, color: "text-violet-500" },
  { label: "Business & Startup", icon: Rocket, color: "text-amber-500" },
  { label: "Stock Market", icon: BarChart3, color: "text-violet-500" },
  { label: "AI & Technology", icon: Cpu, color: "text-blue-500" },
  { label: "Career Growth", icon: Briefcase, color: "text-violet-500" },
  { label: "Fitness & Wellness", icon: Dumbbell, color: "text-teal-500" },
  { label: "Content Creation", icon: MonitorPlay, color: "text-pink-500" },
  { label: "Spirituality & Astrology", icon: Sparkles, color: "text-amber-500" },
];

export function TopCategories() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
        <Link
          href={ROUTES.discover}
          className="flex items-center gap-0.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByAmount("left")}
          disabled={!canScrollLeft}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>

        <div
          ref={scrollRef}
          className="flex flex-1 gap-2 overflow-x-auto scroll-smooth px-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {categories.map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              className="flex shrink-0 w-18 flex-col items-center justify-center gap-0.5 rounded-md border border-gray-200 bg-white px-1 py-1.5 text-center transition hover:shadow-sm"
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.75} />
              <span className="text-[9px] font-medium leading-tight text-gray-700">
                {label}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByAmount("right")}
          disabled={!canScrollRight}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </section>
  );
}
