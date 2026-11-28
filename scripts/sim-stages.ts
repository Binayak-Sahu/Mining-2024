/** Prints JSON: for each sim id, the lesson stages that show it ({ lesson, index, kind, title }). Used by shots-sims.mjs. */
import { UNITS } from "../src/content";
const out: Record<string, { lesson: string; index: number; kind: string; title: string }[]> = {};
for (const u of UNITS)
  for (const l of [...u.lessons, u.boss])
    l.stages.forEach((s, i) => {
      const sim = "sim" in s ? (s as { sim?: string }).sim : undefined;
      if (sim) (out[sim] ??= []).push({ lesson: l.id, index: i, kind: s.kind, title: s.title });
    });
console.log(JSON.stringify(out));
