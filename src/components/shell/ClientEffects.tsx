"use client";

import { useEffect } from "react";
import { applyTheme, usePrefs } from "@/lib/prefs";
import { installGlobalSfx } from "@/lib/sfx";
import { toggleInspector } from "@/lib/inspector";
import { toast } from "sonner";
import { useStrata } from "@/lib/store";

const PERSIST_FLAG = "strata-storage-persist";
const BACKUP_NUDGE = "strata-backup-nudge";
const WEEK = 7 * 24 * 3600 * 1000;

function hasProgress(s: { xp: number; lessons: Record<string, unknown> }) {
  return s.xp > 0 || Object.keys(s.lessons).length > 0;
}

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
  // Data safety: ask the browser to keep our storage (once, after the first saved progress), and nudge a
  // weekly backup export. Flags live in their own localStorage keys, never in progress.
  useEffect(() => {
    const check = (s: { xp: number; lessons: Record<string, unknown> }) => {
      if (!hasProgress(s)) return;
      try {
        if (!localStorage.getItem(PERSIST_FLAG) && navigator.storage?.persist) {
          localStorage.setItem(PERSIST_FLAG, new Date().toISOString());
          void navigator.storage.persist().then((granted) => localStorage.setItem(PERSIST_FLAG, `${granted ? "granted" : "denied"} ${new Date().toISOString()}`));
        }
        const last = Number(localStorage.getItem(BACKUP_NUDGE) || 0);
        if (!last) {
          localStorage.setItem(BACKUP_NUDGE, String(Date.now()));
        } else if (Date.now() - last > WEEK) {
          localStorage.setItem(BACKUP_NUDGE, String(Date.now()));
          toast("Back up your progress", {
            description: "Your progress lives only in this browser. Export a copy now and then.",
            action: { label: "Export", onClick: () => (window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/profile/#sync`) },
            duration: 10000,
          });
        }
      } catch {
        /* storage unavailable (private mode) */
      }
    };
    const run = () => check(useStrata.getState());
    if (useStrata.persist.hasHydrated()) run();
    const unHyd = useStrata.persist.onFinishHydration(run);
    const unSub = useStrata.subscribe((s, prev) => {
      if (!hasProgress(prev) && hasProgress(s)) check(s);
    });
    return () => {
      unHyd();
      unSub();
    };
  }, []);
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
