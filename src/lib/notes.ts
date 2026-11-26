"use client";

import { create } from "zustand";

/** One recap item: an explain / reveal / misconception screen the learner has seen in this lesson run. */
export interface Note {
  key: string; // `${stageIndex}@${screenIndex}` — dedupes re-visits
  stageIndex: number;
  kind: "explain" | "reveal" | "misconception" | "briefing";
  title?: string;
  text: string;
}

/** Session-only lesson notes (not persisted, never progress): powers the lesson header "Notes" sheet. */
interface NotesState {
  lesson: string | null;
  items: Note[];
  start: (lesson: string) => void;
  add: (n: Note) => void;
}

export const useNotes = create<NotesState>()((set) => ({
  lesson: null,
  items: [],
  start: (lesson) => set((s) => (s.lesson === lesson ? s : { lesson, items: [] })),
  add: (n) => set((s) => (s.items.some((x) => x.key === n.key) ? s : { items: [...s.items, n] })),
}));

/** Stage index from a `${lessonId}#${stageIndex}` seed. */
export function stageOf(seed?: string): number {
  const m = /#(\d+)$/.exec(seed ?? "");
  return m ? Number(m[1]) : 0;
}
