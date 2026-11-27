/**
 * Prints every sim stage and every ConceptFlow "nudge" (try-it) screen as JSON, for the Phase 15.5e Playwright sweep
 * (scripts/sweep.mjs reaches each one through the Inspector stage jumper).
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/list-sim-stages.ts
 */
import { UNITS } from "../src/content";

const out: { lessonId: string; stage: number; kind: string; sim: string; last: string; stages: number }[] = [];
for (const u of UNITS)
  for (const l of [...u.lessons, u.boss])
    l.stages.forEach((st, i) => {
      const last = l.stages[l.stages.length - 1].kind;
      if (st.kind === "sim") out.push({ lessonId: l.id, stage: i, kind: "sim", sim: st.sim, last, stages: l.stages.length });
      if (st.kind === "theory" && st.flow?.some((f) => f.kind === "nudge")) out.push({ lessonId: l.id, stage: i, kind: "nudge", sim: "", last, stages: l.stages.length });
    });
console.log(JSON.stringify(out));
