"use client";

import { ArrowDown, ArrowUp, Award, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { MentorCard } from "@/components/mentor/MentorCard";
import { mentorApi, type MentorProfileRow } from "@/lib/api/mentorApi";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { key: "rating", label: "Top Rated", icon: Star },
  { key: "price_asc", label: "Price: Low", icon: ArrowUp },
  { key: "price_desc", label: "Price: High", icon: ArrowDown },
  { key: "experience", label: "Experience", icon: Award },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

function applySort(list: MentorProfileRow[], sortBy: SortKey) {
  const copy = [...list];
  switch (sortBy) {
    case "price_asc":
      return copy.sort((a, b) => (a.price_per_hour ?? 0) - (b.price_per_hour ?? 0));
    case "price_desc":
      return copy.sort((a, b) => (b.price_per_hour ?? 0) - (a.price_per_hour ?? 0));
    case "experience":
      return copy.sort((a, b) => (b.experience_years ?? 0) - (a.experience_years ?? 0));
    case "rating":
    default:
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export function CategoryView({
  category,
  initialMentors,
  initialHasMore,
}: {
  category: string;
  initialMentors: MentorProfileRow[];
  initialHasMore: boolean;
}) {
  const [mentors, setMentors] = useState(initialMentors);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("rating");

  const sorted = useMemo(() => applySort(mentors, sortBy), [mentors, sortBy]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const supabase = createClient();
      const data = await mentorApi.getMentorsByCategoryName(supabase, category, page, PAGE_SIZE);
      setMentors((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = sortBy === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "border-accent-link/50 bg-accent-link/15 text-accent-link"
                  : "border-border-light text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon size={13} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-muted">
          No mentors in this category yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mx-auto flex items-center gap-2 rounded-full border border-border-light px-5 py-2.5 text-sm font-semibold text-accent-link disabled:opacity-60"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
