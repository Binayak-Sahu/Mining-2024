"use client";

import { useEffect } from "react";
import { applyTheme, usePrefs } from "@/lib/prefs";
import { installGlobalSfx } from "@/lib/sfx";
import { toggleInspector } from "@/lib/inspector";

/** Applies the theme preference (and follows the OS when on "system") and installs global tactile audio. */
export function ClientEffects() {
  const theme = usePrefs((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);
  useEffect(() => installGlobalSfx(), []);
  // Shift+M toggles Inspector Mode (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== "m") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']") || t.isContentEditable)) return;
      e.preventDefault();
      toggleInspector();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
