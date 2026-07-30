"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className="flex items-center gap-2 rounded-full border border-border-light bg-surface-chip px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
    >
      {mode === "dark" ? (
        <>
          <Sun size={16} />
          Switch to light
        </>
      ) : (
        <>
          <Moon size={16} />
          Switch to dark
        </>
      )}
    </button>
  );
}
