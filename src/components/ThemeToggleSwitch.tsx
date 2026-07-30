"use client";

import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggleSwitch() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        mode === "dark" ? "bg-accent-primary" : "bg-gray-300 dark:bg-gray-600"
      }`}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      <span
        suppressHydrationWarning
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
          mode === "dark" ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
