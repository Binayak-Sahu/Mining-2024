"use client";

import { useEffect } from "react";
import { applyTheme, usePrefs } from "@/lib/prefs";
import { installGlobalSfx } from "@/lib/sfx";

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
  return null;
}
