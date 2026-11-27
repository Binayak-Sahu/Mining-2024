import type { Lesson, Stage, Unit } from "./types";

/**
 * Answerable screens (DESIGN.md §5.10): every screen where the learner commits to an answer that is marked right or
 * wrong. One helper so every screen shows the same number; computed from content, never typed.
 *
 * Counted: concept-flow predict, check and situation screens; predict stages; equation stages (one assembled
 * equation); each numeric step; each crisis phase; each swipe card. Boss lessons count the same way.
 * Not counted: read-only screens (explain, reveal, misconception, briefings) and open goal tasks (sim stages, flow
 * nudges), which have no wrong answer.
 */
export function stageQuestions(s: Stage): number {
  switch (s.kind) {
    case "theory":
      return (s.flow ?? []).filter((f) => f.kind === "predict" || f.kind === "check" || f.kind === "situation").length;
    case "predict":
    case "equation":
      return 1;
    case "numeric":
      return s.steps.length;
    case "crisis":
      return s.phases.length;
    case "swipe":
      return s.cards.length;
    case "sim":
      return 0;
  }
}

export function lessonQuestions(l: Lesson): number {
  return l.stages.reduce((a, s) => a + stageQuestions(s), 0);
}

/** Lessons and questions in a unit. Lessons excludes the boss exam; questions includes it. */
export function unitCounts(u: Unit): { lessons: number; questions: number } {
  return { lessons: u.lessons.length, questions: [...u.lessons, u.boss].reduce((a, l) => a + lessonQuestions(l), 0) };
}
