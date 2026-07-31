"use client";

import { useEffect, useRef, useState } from "react";

import { SearchInput } from "@/components/discover/SearchInput";
import { MentorCard } from "@/components/mentor/MentorCard";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { createClient } from "@/lib/supabase/client";
import { mentorApi, type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

export function DiscoverView({
  grouped,
  initialQuery = "",
}: {
  grouped: Record<string, MentorProfileRow[]>;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MentorProfileRow[] | null>(null);
  const [searching, setSearching] = useState(!!initialQuery.trim());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults(null);
      setSearching(false);
    } else {

      setSearching(true);
    }

  };
  

  useEffect(() => {

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const term = query.replace(/^@/, "").trim();
        const data = await mentorApi.searchMentors(supabase, term);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const categories = Object.keys(grouped).sort();
  const isSearching = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <SearchInput value={query} onChange={handleQueryChange} />

      {isSearching ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-muted">
            {searching ? "Searching…" : `${results?.length ?? 0} mentors found`}
          </h2>
          <div className="flex flex-wrap gap-3">
            {(results ?? []).map((mentor) => (
              <div key={mentor.id} className="w-40">
                <MentorCard mentor={mentor} />
              </div>
            ))}
            
          </div>
          {!searching && results?.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              No mentors found. Try a different keyword.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {categories.map((category) => (
            <CategoryCarousel
              key={category}
              title={category}
              mentors={grouped[category]}
              viewAllLink={ROUTES.category(category)}
            />
          ))}

          {categories.length === 0 ? (
            <p className="py-16 text-center text-sm text-text-muted">
              No mentors available yet. Check back soon.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
