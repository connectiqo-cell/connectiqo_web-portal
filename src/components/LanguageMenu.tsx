"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-chip hover:text-text-primary"
      >
        <Globe size={16} />
        English
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-border-light bg-surface-panel p-1.5 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-text-primary"
          >
            English
            <Check size={14} className="text-accent-link" />
          </button>
          <p className="px-3 py-1.5 text-xs text-text-muted">More languages coming soon</p>
        </div>
      ) : null}
    </div>
  );
}
