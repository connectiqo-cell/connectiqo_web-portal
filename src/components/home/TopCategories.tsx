"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { fetchActiveCategories, type MentorCategoryRow } from "@/lib/api/contentApi";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";
import { useHorizontalScroll } from "@/lib/hooks/useHorizontalScroll";

export function TopCategories({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
}) {
  const [categories, setCategories] = useState<MentorCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll(
    categories,
    "[data-category-card]",
  );

  useEffect(() => {
    (async () => {
      const data = await fetchActiveCategories();
      setCategories(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-3">
        <div className="mb-3 h-6 w-32 animate-pulse rounded-lg bg-surface-chip" />
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-24 w-22 shrink-0 animate-pulse rounded-2xl bg-surface-chip"
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
        <h2 className="text-lg font-semibold text-text-primary">Top Categories</h2>
        <Link
          href={ROUTES.discover}
          className="flex items-center gap-0.5 text-sm font-medium text-accent-link hover:text-accent-link-hover"
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
            onClick={() => scroll("left")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light bg-surface-panel shadow-sm hover:bg-surface-chip"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scroll-smooth px-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {categories.map(({ id, name, icon }) => {
            const isSelected = selectedCategory === name;
            const IconComponent = getCategoryIcon(icon, name);
            return (
              <button
                key={id}
                data-category-card
                onClick={() => onSelectCategory(isSelected ? "" : name)}
                className={`flex w-28 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all px-3 py-4 text-center hover:shadow-md ${
                  isSelected
                    ? "border-accent-link bg-accent-link/10"
                    : "border-border-light bg-surface-panel"
                }`}
              >
                <IconComponent
                  className={`w-8 h-8 shrink-0 ${isSelected ? "text-accent-link" : "text-accent-link/80"}`}
                  strokeWidth={1.5}
                />
                <span
                  className={`text-sm font-semibold leading-snug ${isSelected ? "text-accent-link" : "text-text-primary"}`}
                >
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
            onClick={() => scroll("right")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light bg-surface-panel shadow-sm hover:bg-surface-chip"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
