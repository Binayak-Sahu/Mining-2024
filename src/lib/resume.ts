"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Where you left each lesson (device-local). A separate small store: never part of the progress store,
 * export files or sync, so it can't affect saved study data.
 */
interface ResumeState {
  at: Record<string, { index: number; t: number }>;
  setAt: (lessonId: string, index: number) => void;
  clear: (lessonId: string) => void;
}

export const RESUME_KEY = "strata-resume";

export const useResume = create<ResumeState>()(
  persist(
    (set) => ({
      at: {},
      setAt: (lessonId, index) => set((s) => ({ at: { ...s.at, [lessonId]: { index, t: Date.now() } } })),
      clear: (lessonId) =>
        set((s) => {
          if (!s.at[lessonId]) return s;
          const next = { ...s.at };
          delete next[lessonId];
          return { at: next };
        }),
    }),
    { name: RESUME_KEY, version: 1 },
  ),
);
