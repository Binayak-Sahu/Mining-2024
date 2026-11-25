import type { Lesson, Unit } from "./types";
import type { LessonRecord } from "./store";

export function lessonUnlocked(unit: Unit, index: number, done: Record<string, LessonRecord>, freeRoam: boolean): boolean {
  if (freeRoam || index === 0) return true;
  return !!done[unit.lessons[index - 1].id];
}

export function bossUnlocked(unit: Unit, done: Record<string, LessonRecord>, freeRoam: boolean): boolean {
  if (freeRoam) return true;
  return unit.lessons.every((l) => !!done[l.id]);
}

export function unitProgress(unit: Unit, done: Record<string, LessonRecord>): number {
  const all = [...unit.lessons, unit.boss];
  return all.filter((l) => !!done[l.id]).length / all.length;
}

/** The next lesson after `lesson` in its unit (boss after last lesson), or null. */
export function nextLesson(unit: Unit, lesson: Lesson): Lesson | null {
  if (lesson.boss) return null;
  const i = unit.lessons.findIndex((l) => l.id === lesson.id);
  if (i < 0) return null;
  return unit.lessons[i + 1] ?? unit.boss;
}

/** Whether a lesson or boss is open through real progress (or free-roam) — Inspector Mode never counts. */
export function genuinelyOpen(units: Unit[], lessonId: string, done: Record<string, LessonRecord>, freeRoam: boolean): boolean {
  for (const u of units) {
    if (u.boss.id === lessonId) return bossUnlocked(u, done, freeRoam);
    const i = u.lessons.findIndex((l) => l.id === lessonId);
    if (i >= 0) return lessonUnlocked(u, i, done, freeRoam);
  }
  return false;
}
