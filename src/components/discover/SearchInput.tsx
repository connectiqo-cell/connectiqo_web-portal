"use client";

import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search by name, @username or skill",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border-light bg-surface-sheet px-3 sm:px-4 py-3 sm:py-2.5">
      <Search size={18} className="shrink-0 text-text-secondary" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="flex h-8 w-8 items-center justify-center -mr-2 sm:-mr-1 rounded-full hover:bg-surface-chip"
        >
          <X size={16} className="text-text-secondary" />
        </button>
      ) : null}
    </div>
  );
}
