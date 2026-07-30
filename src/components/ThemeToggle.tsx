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
      className={`relative inline-flex h-7 w-14 items-center justify-between rounded-full px-1 transition-colors ${
        mode === "dark" ? "bg-accent-primary" : "bg-yellow-300 dark:bg-gray-600"
      }`}
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      <Sun size={16} className={`transition-opacity ${mode === "dark" ? "opacity-0" : "opacity-100"} text-yellow-600`} />
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
          mode === "dark" ? "translate-x-6" : "translate-x-0"
        }`}
      />
      <Moon size={16} className={`transition-opacity ${mode === "dark" ? "opacity-100" : "opacity-0"} text-purple-200`} />
    </button>
  );
}
