"use client";

import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className="rounded-full border border-border-light bg-surface-chip px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
    >
      {mode === "dark" ? "Switch to light" : "Switch to dark"}
    </button>
    
  );
}
