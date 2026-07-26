"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SearchInput } from "@/components/discover/SearchInput";
import { MentorCard } from "@/components/mentor/MentorCard";
import { createClient } from "@/lib/supabase/client";
import { mentorApi, type MentorProfileRow } from "@/lib/api/mentorApi";
import { ROUTES } from "@/lib/routes";

export function DiscoverView({ grouped }: { grouped: Record<string, MentorProfileRow[]> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MentorProfileRow[] | null>(null);
  const [searching, setSearching] = useState(false);
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
    <div className="flex flex-col gap-8">
      <SearchInput value={query} onChange={handleQueryChange} />

      {isSearching ? (
        <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-10">
          {categories.map((category) => (
            <div key={category} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-text-primary">{category}</h2>
                <Link
                  href={ROUTES.category(category)}
                  className="text-xs font-semibold text-accent-link"
                >
                  View all ({grouped[category].length})
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {grouped[category].map((mentor) => (
                  <div key={mentor.id} className="w-40 shrink-0">
                    <MentorCard mentor={mentor} />
                  </div>
                ))}
              </div>
            </div>
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
