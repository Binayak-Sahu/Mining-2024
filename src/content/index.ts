import type { Lesson, SimDef, Stage, Unit } from "@/lib/types";
import { UNITS } from "./units";
import { ALL_SIMS } from "./sims";

export { UNITS };

const lessonMap = new Map<string, Lesson>();
for (const u of UNITS) {
  for (const l of u.lessons) lessonMap.set(l.id, l);
  lessonMap.set(u.boss.id, u.boss);
}

const simMap = new Map<string, SimDef>();
for (const s of ALL_SIMS) {
  if (simMap.has(s.id)) throw new Error(`Duplicate sim id ${s.id}`);
  simMap.set(s.id, s);
}

export function getLesson(id: string): Lesson | undefined {
  return lessonMap.get(id);
}

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getSim(id: string): SimDef {
  const s = simMap.get(id);
  if (!s) throw new Error(`Unknown sim "${id}"`);
  return s;
}

export function allLessons(): Lesson[] {
  return [...lessonMap.values()];
}

export function getStage(lessonId: string, index: number): Stage | undefined {
  return lessonMap.get(lessonId)?.stages[index];
}

/** Every codex entry with its source lesson (for the Field Codex library). */
export function allCodex() {
  const out: { entry: import("@/lib/types").CodexEntry; lesson: Lesson; unit: Unit; sims: string[] }[] = [];
  for (const u of UNITS)
    for (const l of u.lessons)
      for (const s of l.stages) if (s.kind === "theory") out.push({ entry: s.codex, lesson: l, unit: u, sims: [s.sim, ...(s.codex.sims ?? [])] });
  return out;
}

/** Every equation-forge formula (verified formulas), keyed `${lessonId}#eq${index}`. */
export function allFormulas() {
  const out: { id: string; formula: import("@/lib/types").Formula; lesson: Lesson; unit: Unit }[] = [];
  for (const u of UNITS)
    for (const l of u.lessons)
      l.stages.forEach((s, i) => {
        if (s.kind === "equation") out.push({ id: `${l.id}#eq${i}`, formula: s.formula, lesson: l, unit: u });
      });
  return out;
}
