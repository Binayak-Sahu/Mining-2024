"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addDays, dayDiff, todayKey } from "./date";

/** Leitner intervals (days) for spaced repetition boxes 0..5. */
export const SRS_INTERVALS = [1, 2, 4, 7, 15, 30];

export interface SrsItem {
  key: string; // `${lessonId}#${stageIndex}` or, for a ConceptFlow screen, `${lessonId}#${stageIndex}@${screen}`
  lessonId: string;
  stageIndex: number;
  /** ConceptFlow screen index (per-screen review items only; additive optional field, no version bump). */
  screen?: number;
  concept: string;
  box: number;
  due: string; // YYYY-MM-DD
  misses: number;
  lastSeen: string;
}

export interface LessonRecord {
  completedAt: string;
  attempts: number;
  bestHearts: number;
  bestXp: number;
}

export interface ExamAttempt {
  at: string;
  score: number;
  total: number;
  seconds: number;
  /** unitId -> [correct, asked] */
  byUnit: Record<string, [number, number]>;
}

export interface CodexUnlock {
  unlockedAt: string;
  lessonId: string;
}

interface StrataState {
  xp: number;
  xpByDay: Record<string, number>;
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  heartsLost: number;
  lessons: Record<string, LessonRecord>;
  attempts: Record<string, number>;
  codex: Record<string, CodexUnlock>;
  formulas: Record<string, CodexUnlock>;
  srs: Record<string, SrsItem>;
  warmupDoneDay: string | null;
  exams: ExamAttempt[];
  freeRoam: boolean;

  addXp: (amount: number) => void;
  touchStreak: () => void;
  loseHeart: () => void;
  startAttempt: (lessonId: string) => void;
  completeLesson: (lessonId: string, hearts: number, xp: number) => void;
  unlockCodex: (entryId: string, lessonId: string) => void;
  unlockFormula: (entryId: string, lessonId: string) => void;
  recordMiss: (lessonId: string, stageIndex: number, concept: string, screen?: number) => void;
  reviewResult: (key: string, correct: boolean) => void;
  markWarmupDone: () => void;
  setFreeRoam: (v: boolean) => void;
  recordExam: (a: ExamAttempt) => void;
  resetAll: () => void;
}

const initial = {
  xp: 0,
  xpByDay: {} as Record<string, number>,
  streak: 0,
  longestStreak: 0,
  lastActiveDay: null as string | null,
  heartsLost: 0,
  lessons: {} as Record<string, LessonRecord>,
  attempts: {} as Record<string, number>,
  codex: {} as Record<string, CodexUnlock>,
  formulas: {} as Record<string, CodexUnlock>,
  srs: {} as Record<string, SrsItem>,
  warmupDoneDay: null as string | null,
  freeRoam: false,
  exams: [] as ExamAttempt[],
};

export const useStrata = create<StrataState>()(
  persist(
    (set, get) => ({
      ...initial,

      addXp: (amount) => {
        const day = todayKey();
        set((s) => ({
          xp: s.xp + amount,
          xpByDay: { ...s.xpByDay, [day]: (s.xpByDay[day] ?? 0) + amount },
        }));
        get().touchStreak();
      },

      touchStreak: () => {
        const day = todayKey();
        const { lastActiveDay, streak, longestStreak } = get();
        if (lastActiveDay === day) return;
        const gap = lastActiveDay ? dayDiff(lastActiveDay, day) : Infinity;
        const next = gap === 1 ? streak + 1 : 1;
        set({ streak: next, longestStreak: Math.max(longestStreak, next), lastActiveDay: day });
      },

      loseHeart: () => set((s) => ({ heartsLost: s.heartsLost + 1 })),

      startAttempt: (lessonId) =>
        set((s) => ({ attempts: { ...s.attempts, [lessonId]: (s.attempts[lessonId] ?? 0) + 1 } })),

      completeLesson: (lessonId, hearts, xp) => {
        const prev = get().lessons[lessonId];
        set((s) => ({
          lessons: {
            ...s.lessons,
            [lessonId]: {
              completedAt: prev?.completedAt ?? todayKey(),
              attempts: s.attempts[lessonId] ?? 1,
              bestHearts: Math.max(prev?.bestHearts ?? 0, hearts),
              bestXp: Math.max(prev?.bestXp ?? 0, xp),
            },
          },
        }));
      },

      unlockCodex: (entryId, lessonId) => {
        if (get().codex[entryId]) return;
        set((s) => ({ codex: { ...s.codex, [entryId]: { unlockedAt: todayKey(), lessonId } } }));
      },

      unlockFormula: (entryId, lessonId) => {
        if (get().formulas[entryId]) return;
        set((s) => ({ formulas: { ...s.formulas, [entryId]: { unlockedAt: todayKey(), lessonId } } }));
      },

      recordMiss: (lessonId, stageIndex, concept, screen) => {
        const key = screen === undefined ? `${lessonId}#${stageIndex}` : `${lessonId}#${stageIndex}@${screen}`;
        const day = todayKey();
        const prev = get().srs[key];
        set((s) => ({
          srs: {
            ...s.srs,
            [key]: {
              key,
              lessonId,
              stageIndex,
              ...(screen === undefined ? {} : { screen }),
              concept,
              box: 0,
              due: addDays(day, 1),
              misses: (prev?.misses ?? 0) + 1,
              lastSeen: day,
            },
          },
        }));
      },

      reviewResult: (key, correct) => {
        const item = get().srs[key];
        if (!item) return;
        const day = todayKey();
        const box = correct ? Math.min(item.box + 1, SRS_INTERVALS.length - 1) : 0;
        const due = addDays(day, SRS_INTERVALS[box]);
        set((s) => ({
          srs: {
            ...s.srs,
            [key]: { ...item, box, due, lastSeen: day, misses: item.misses + (correct ? 0 : 1) },
          },
        }));
      },

      markWarmupDone: () => set({ warmupDoneDay: todayKey() }),
      setFreeRoam: (v) => set({ freeRoam: v }),
      recordExam: (a) => set((s) => ({ exams: [...s.exams, a].slice(-30) })),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: "strata-progress-v1",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => migrateState(persisted as Record<string, unknown>, version),
    },
  ),
);

/** Streak is "live" only if the user was active today or yesterday. */
export function liveStreak(streak: number, lastActiveDay: string | null): number {
  if (!lastActiveDay) return 0;
  return dayDiff(lastActiveDay, todayKey()) <= 1 ? streak : 0;
}

/**
 * Phase 6 inserted a new SimLab stage at index 2 in these lessons, shifting later stages by one.
 * Spaced-repetition and formula keys are index-based, so v1 saves are re-keyed here.
 */
export const PHASE6_INSERTED: Record<string, number> = {
  "u1-l3": 2,
  "u3-l6": 2,
  "u6-l1": 2,
  "u6-l2": 2,
  "u8-l4": 2,
  "u8-l5": 2,
};

function shiftKey(key: string): { key: string; index: number | null } {
  const m = /^(.*)#(eq)?(\d+)$/.exec(key);
  if (!m) return { key, index: null };
  const [, lesson, eq, idx] = m;
  let i = Number(idx);
  const at = PHASE6_INSERTED[lesson];
  if (at !== undefined && i >= at) i += 1;
  return { key: `${lesson}#${eq ?? ""}${i}`, index: i };
}

export function migrateState(state: Record<string, unknown>, version: number): Record<string, unknown> {
  if (version >= 2) return state;
  const srs = (state.srs ?? {}) as Record<string, SrsItem>;
  const nextSrs: Record<string, SrsItem> = {};
  for (const item of Object.values(srs)) {
    const { key, index } = shiftKey(item.key);
    nextSrs[key] = { ...item, key, stageIndex: index ?? item.stageIndex };
  }
  const formulas = (state.formulas ?? {}) as Record<string, CodexUnlock>;
  const nextF: Record<string, CodexUnlock> = {};
  for (const [k, v] of Object.entries(formulas)) nextF[shiftKey(k).key] = v;
  return { ...state, srs: nextSrs, formulas: nextF, exams: (state.exams as ExamAttempt[]) ?? [] };
}
