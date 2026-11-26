"use client";

import { create } from "zustand";

/**
 * The sources behind the lesson screen on show, for the lesson top bar's ⋯ menu (DESIGN.md §5.6). Session-only UI
 * state: ConceptFlow publishes each screen's reference ids and clears them when it unmounts. Not progress.
 */
export const useLessonSources = create<{ ids: string[]; lessonId: string | null; set: (ids: string[], lessonId: string | null) => void }>((set) => ({
  ids: [],
  lessonId: null,
  set: (ids, lessonId) => set({ ids, lessonId }),
}));
