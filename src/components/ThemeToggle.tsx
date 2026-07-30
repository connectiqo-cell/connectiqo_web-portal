"use client";

import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        mode === "dark" ? "bg-accent-primary" : "bg-gray-300 dark:bg-gray-600"
      }`}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      <span
        suppressHydrationWarning
        className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform ${
          mode === "dark" ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
