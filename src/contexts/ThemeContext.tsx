"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const THEME_MODES = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const;

export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];
export type ThemePreference = ThemeMode;

export const THEME_STORAGE_KEY = "@connectiqo/theme_mode";

function resolveMode(
  preference: ThemePreference,
  prefersLight: boolean,
): "dark" | "light" {
  if (preference === THEME_MODES.SYSTEM) {
    return prefersLight ? "light" : "dark";
  }
  return preference === THEME_MODES.LIGHT ? "light" : "dark";
}

interface ThemeContextValue {
  mode: "dark" | "light";
  preference: ThemePreference;
  isDark: boolean;
  followsSystem: boolean;
  setThemePreference: (next: ThemePreference) => void;
  toggleTheme: () => void;
  resetToSystemTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return THEME_MODES.SYSTEM;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (
      stored === THEME_MODES.DARK ||
      stored === THEME_MODES.LIGHT ||
      stored === THEME_MODES.SYSTEM
    ) {
      return stored;
    }
    return THEME_MODES.SYSTEM;
  });
  const [prefersLight, setPrefersLight] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const listener = (event: MediaQueryListEvent) =>
      setPrefersLight(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const mode = useMemo(
    () => resolveMode(preference, prefersLight),
    [preference, prefersLight],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const setThemePreference = useCallback((next: ThemePreference) => {
    setPreference(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const isDark = mode === "dark";

  const toggleTheme = useCallback(() => {
    setThemePreference(isDark ? THEME_MODES.LIGHT : THEME_MODES.DARK);
  }, [isDark, setThemePreference]);

  const resetToSystemTheme = useCallback(() => {
    setThemePreference(THEME_MODES.SYSTEM);
  }, [setThemePreference]);

  const value = useMemo(
    () => ({
      mode,
      preference,
      isDark,
      followsSystem: preference === THEME_MODES.SYSTEM,
      setThemePreference,
      toggleTheme,
      resetToSystemTheme,
    }),
    [mode, preference, isDark, setThemePreference, toggleTheme, resetToSystemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
  
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;

}
