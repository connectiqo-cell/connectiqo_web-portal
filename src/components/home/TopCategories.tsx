"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { fetchActiveCategories, type MentorCategoryRow } from "@/lib/api/contentApi";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";

export function TopCategories({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [categories, setCategories] = useState<MentorCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchActiveCategories();
      setCategories(data);
      setLoading(false);
    })();
  }, []);

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
  }, [categories]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="w-full py-3">
        <div className="mb-3 h-6 w-32 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-24 w-22 shrink-0 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
        {canScrollLeft ? (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByAmount("left")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scroll-smooth px-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {categories.map(({ id, name, icon }) => {
            const isSelected = selectedCategory === name;
            const IconComponent = getCategoryIcon(icon || name);
            return (
              <button
                key={id}
                onClick={() => onSelectCategory(isSelected ? "" : name)}
                className={`flex w-28 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all px-3 py-4 text-center hover:shadow-md ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <IconComponent className={`w-8 h-8 shrink-0 ${isSelected ? "text-indigo-600" : "text-indigo-500"}`} strokeWidth={1.5} />
                <span className={`text-sm font-semibold leading-snug ${isSelected ? "text-indigo-600" : "text-gray-900"}`}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByAmount("right")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
