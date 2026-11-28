import type { Lesson, Unit } from "./types";
import type { LessonRecord } from "./store";
import { bossUnlocked, lessonUnlocked } from "./progress";

/**
 * Levels (DESIGN.md §5.2/§5.3, Phase 15.5-v3c): a derived view of a unit's existing lesson order, never stored.
 * A unit with n lessons gets ceil(n / 6) levels, sized as evenly as possible with the bigger ones first
 * (7 → 4 + 3, 6 → 6, 5 → 5). The boss exam does not count toward the size and closes the last level.
 * Unit 0 (1 lesson) is one short level by Bink's decision (2026-11-28).
 */
export const MAX_LEVEL = 6;

export interface LevelItem {
  lesson: Lesson;
  /** Index in unit.lessons; unit.lessons.length for the boss. */
  index: number;
  boss: boolean;
}

export interface Level {
  n: number;
  items: LevelItem[];
}

export function levelSizes(lessons: number): number[] {
  const k = Math.max(1, Math.ceil(lessons / MAX_LEVEL));
  const base = Math.floor(lessons / k);
  return Array.from({ length: k }, (_, i) => base + (i < lessons % k ? 1 : 0));
}

export function unitLevels(unit: Unit): Level[] {
  let at = 0;
  const levels = levelSizes(unit.lessons.length).map((size, i) => {
    const items = unit.lessons.slice(at, at + size).map((lesson, k) => ({ lesson, index: at + k, boss: false }));
    at += size;
    return { n: i + 1, items };
  });
  levels[levels.length - 1].items.push({ lesson: unit.boss, index: unit.lessons.length, boss: true });
  return levels;
}

/** The level a lesson (or the boss) sits in; 1 when not found. */
export function levelOf(unit: Unit, lessonId: string | null): number {
  if (!lessonId) return unitLevels(unit).length;
  return unitLevels(unit).find((l) => l.items.some((it) => it.lesson.id === lessonId))?.n ?? 1;
}

/**
 * The unit's current lesson: the first unlocked, unfinished lesson, else the boss when it is open and unfinished,
 * else null (unit complete). Same rule the unit page and Home have always used.
 */
export function currentLessonId(unit: Unit, done: Record<string, LessonRecord>, freeRoam: boolean): string | null {
  const i = unit.lessons.findIndex((l, k) => !done[l.id] && lessonUnlocked(unit, k, done, freeRoam));
  if (i >= 0) return unit.lessons[i].id;
  if (!done[unit.boss.id] && bossUnlocked(unit, done, freeRoam)) return unit.boss.id;
  return null;
}

/**
 * Screens a learner steps through in a lesson: a concept flow's screens plus its summary, one per numeric step,
 * crisis phase and swipe card, and one for every other stage.
 */
export function lessonScreens(lesson: Lesson): number {
  return lesson.stages.reduce((sum, s) => {
    switch (s.kind) {
      case "theory":
        return sum + (s.flow?.length ? s.flow.length + 1 : 1);
      case "numeric":
        return sum + s.steps.length;
      case "crisis":
        return sum + s.phases.length;
      case "swipe":
        return sum + s.cards.length;
      default:
        return sum + 1;
    }
  }, 0);
}

/** Lesson-card time: screens × 40 s, rounded to whole minutes (at least 1). */
export function lessonMinutes(lesson: Lesson): number {
  return Math.max(1, Math.round((lessonScreens(lesson) * 40) / 60));
}
