"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { SunMoonIcon } from "@/components/SunMoonIcon";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${
        mode === "dark"
          ? "text-yellow-300 hover:bg-accent-primary/20"
          : "text-purple-600 hover:bg-yellow-300/20"
      }`}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      <SunMoonIcon className="h-5 w-5" />
    </button>
  );
}
