"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Device-local UI preferences (theme + sound). Kept out of the progress store so they are never
 * exported/imported with study progress.
 */
export type ThemePref = "system" | "light" | "dark";

interface Prefs {
  theme: ThemePref;
  muted: boolean;
  /** Inspector Mode: everything playable as a sandbox. Device-local; never exported with progress. */
  masterUnlock: boolean;
  setTheme: (t: ThemePref) => void;
  toggleMuted: () => void;
  setMasterUnlock: (v: boolean) => void;
}

export const PREFS_KEY = "strata-prefs";

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: "system",
      muted: false,
      masterUnlock: false,
      setMasterUnlock: (masterUnlock) => set({ masterUnlock }),
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
    }),
    { name: PREFS_KEY, version: 1 },
  ),
);

export function resolveDark(theme: ThemePref): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: ThemePref) {
  if (typeof document === "undefined") return;
  const dark = resolveDark(theme);
  document.documentElement.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0B0F19" : "#F7F7F5");
}

/** Inline, render-blocking script that sets the theme class before first paint (no flash). */
export const THEME_BOOT = `(function(){try{var p=JSON.parse(localStorage.getItem("${PREFS_KEY}")||"{}");var t=(p.state&&p.state.theme)||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
