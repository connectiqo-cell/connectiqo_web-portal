"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/lib/routes";

export function HomeSearchBar({
  placeholder = "Search creators, mentors, experts…",
  compact = false,
}: {
  placeholder?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `${ROUTES.discover}?q=${encodeURIComponent(q)}` : ROUTES.discover);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full max-w-md items-center gap-2 rounded-full border border-border-light bg-surface-panel shadow-sm ${
        compact ? "p-2 pl-4" : "p-1.5 pl-4"
      }`}
    >
      <Search size={18} className="shrink-0 text-text-muted" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
      />
      {!compact ? (
        <button
          type="submit"
          className="shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-text-on-accent"
          style={{ backgroundImage: "var(--gradient-button-primary)" }}
        >
          Search
        </button>
      ) : null}
    </form>
  );
}
