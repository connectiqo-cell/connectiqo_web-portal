"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
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

type Listener = () => void;

// Stored theme preference (localStorage-backed). A small pub-sub on top of
// localStorage lets same-tab writes (setThemePreference) notify subscribers
// immediately — the native "storage" event only fires for other tabs.
const preferenceListeners = new Set<Listener>();

function readStoredPreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (
    stored === THEME_MODES.DARK ||
    stored === THEME_MODES.LIGHT ||
    stored === THEME_MODES.SYSTEM
  ) {
    return stored;
  }
  return THEME_MODES.SYSTEM;
}

function writeStoredPreference(next: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  preferenceListeners.forEach((listener) => listener());
}

function subscribePreference(listener: Listener) {
  preferenceListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    preferenceListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getPreferenceServerSnapshot(): ThemePreference {
  return THEME_MODES.SYSTEM;
}

function subscribePrefersLight(listener: Listener) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function getPrefersLightSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function getPrefersLightServerSnapshot(): boolean {
  return false;
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
  // useSyncExternalStore returns the server snapshot for both the server
  // render and the client's initial (pre-hydration) render, then switches to
  // the real client snapshot right after — avoiding the hydration mismatch
  // that reading localStorage/matchMedia eagerly in useState would cause.
  const preference = useSyncExternalStore(
    subscribePreference,
    readStoredPreference,
    getPreferenceServerSnapshot,
  );
  const prefersLight = useSyncExternalStore(
    subscribePrefersLight,
    getPrefersLightSnapshot,
    getPrefersLightServerSnapshot,
  );

  const mode = useMemo(
    () => resolveMode(preference, prefersLight),
    [preference, prefersLight],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const setThemePreference = useCallback((next: ThemePreference) => {
    writeStoredPreference(next);
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
