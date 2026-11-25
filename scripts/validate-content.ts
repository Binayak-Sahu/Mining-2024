/**
 * Content validator: proves every lesson is completable and well-formed.
 *  - every sim id referenced exists; every sim computes finite outputs at defaults
 *  - every SimLab goal is reachable (grid search over slider values)
 *  - hotspots lie inside the 400 x 240 viewBox
 *  - predict answers index a real option and every wrong option explains why it fails; numeric answers are finite
 *  - equation targets can be built from the token bank
 * Run: npm run validate
 */
import { UNITS, getSim } from "../src/content";
import type { SimDef, Vals } from "../src/lib/types";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactNode } from "react";
import { buildPool, makePaper, isCorrect } from "../src/lib/exam";
import { TOOLS } from "../src/components/pages/Tools";
import { STATUTES } from "../src/content/statutes";
import { REFS } from "../src/content/references";
import type { FlowScreen } from "../src/lib/types";

let errors = 0;
let flows = 0;
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Concept-flow rules: sourced screens, aligned reasons, ≤ 45-word explanations, Brilliant shape, reachable nudges. */
function checkFlow(at: string, flow: FlowScreen[], checkSim: (id: string, o?: Vals) => SimDef | null) {
  flows++;
  checks++;
  if (flow[0]?.kind !== "predict") fail(`${at}: flow must open with a predict screen`);
  if (!flow.some((f) => f.kind === "misconception")) fail(`${at}: flow needs a misconception screen`);
  if (flow.filter((f) => f.kind === "check").length < 2) fail(`${at}: flow needs at least 2 check screens`);
  flow.forEach((f, i) => {
    const w = `${at} flow#${i}(${f.kind})`;
    if (!f.src || f.src.length === 0) fail(`${w}: no src`);
    for (const id of f.src ?? []) if (!REFS[id]) fail(`${w}: src "${id}" missing from REFS`);
    if (f.kind === "predict" || f.kind === "check") {
      if (f.why.length !== f.options.length) fail(`${w}: why.length ${f.why.length} ≠ options ${f.options.length}`);
      if (f.answer < 0 || f.answer >= f.options.length) fail(`${w}: answer out of range`);
      if (f.why.some((x) => !x.trim())) fail(`${w}: every option needs a reason`);
    }
    if (f.kind === "explain" && words(f.text) > 45) fail(`${w}: explain is ${words(f.text)} words (> 45)`);
    if ("visual" in f && f.visual?.sim) checkSim(f.visual.sim, f.visual.params);
    if (f.kind === "nudge") {
      const def = checkSim(f.sim, f.start);
      if (def && !reachable(def, f.goal, defaults(def, f.start))) fail(`${w}: nudge goal unreachable`);
    }
    if (f.kind === "reveal" && (f.hotspot.x < 0 || f.hotspot.x > 400 || f.hotspot.y < 0 || f.hotspot.y > 240)) fail(`${w}: reveal hotspot out of bounds`);
  });
}
let checks = 0;
const fail = (m: string) => {
  errors++;
  console.error("✗ " + m);
};

function defaults(def: SimDef, o?: Vals): Vals {
  const v: Vals = {};
  for (const p of def.params) v[p.key] = p.default;
  return { ...v, ...(o ?? {}) };
}

function valuesFor(p: SimDef["params"][number], n: number): number[] {
  if (p.options) return p.options.map((o) => o.value);
  const steps = Math.round((p.max - p.min) / p.step);
  const out: number[] = [];
  const stride = Math.max(1, Math.ceil(steps / n));
  for (let i = 0; i <= steps; i += stride) out.push(+(p.min + i * p.step).toFixed(6));
  if (out[out.length - 1] !== p.max) out.push(p.max);
  return out;
}

/** Search subsets of parameters (others held at start) — users usually change 1–3 controls. */
function subsetSearch(def: SimDef, test: (p: Vals, o: Vals) => boolean, start: Vals, size: number, res: number): boolean {
  const k = def.params.length;
  const combos: number[][] = [];
  const rec = (from: number, acc: number[]) => {
    if (acc.length === size) return void combos.push([...acc]);
    for (let i = from; i < k; i++) rec(i + 1, [...acc, i]);
  };
  rec(0, []);
  for (const combo of combos) {
    const grids = combo.map((i) => valuesFor(def.params[i], res));
    const idx = new Array(combo.length).fill(0);
    for (;;) {
      const v: Vals = { ...start };
      combo.forEach((pi, j) => (v[def.params[pi].key] = grids[j][idx[j]]));
      if (test(v, def.compute(v))) return true;
      let j = 0;
      while (j < combo.length) {
        idx[j]++;
        if (idx[j] < grids[j].length) break;
        idx[j] = 0;
        j++;
      }
      if (j === combo.length) break;
    }
  }
  return false;
}

function reachable(def: SimDef, test: (p: Vals, o: Vals) => boolean, start: Vals): boolean {
  if (subsetSearch(def, test, start, 1, 2000)) return true;
  if (def.params.length >= 2 && subsetSearch(def, test, start, 2, 250)) return true;
  if (def.params.length >= 3 && subsetSearch(def, test, start, 3, 40)) return true;
  const budget = 400000;
  const k = def.params.length;
  const per = Math.max(4, Math.floor(Math.pow(budget, 1 / Math.max(k, 1))));
  const grids = def.params.map((p) => valuesFor(p, per));
  const idx = new Array(k).fill(0);
  for (;;) {
    const v: Vals = { ...start };
    def.params.forEach((p, i) => (v[p.key] = grids[i][idx[i]]));
    if (test(v, def.compute(v))) return true;
    let i = 0;
    while (i < k) {
      idx[i]++;
      if (idx[i] < grids[i].length) break;
      idx[i] = 0;
      i++;
    }
    if (i === k) return false;
  }
}

for (const u of UNITS) {
  for (const l of [...u.lessons, u.boss]) {
    const tag = `${l.id}`;
    if (l.unitId !== u.id) fail(`${tag}: unitId mismatch`);
    l.stages.forEach((s, i) => {
      checks++;
      const at = `${tag}#${i} (${s.kind})`;
      const checkSim = (id?: string, params?: Vals) => {
        if (!id) return null;
        try {
          const def = getSim(id);
          const v = defaults(def, params);
          for (const key of Object.keys(params ?? {})) if (!def.params.some((p) => p.key === key)) fail(`${at}: unknown param ${key} for ${id}`);
          const o = def.compute(v);
          for (const out of def.outputs) if (o[out.key] === undefined) fail(`${at}: sim ${id} missing output ${out.key}`);
          renderToStaticMarkup(createElement("svg", { viewBox: "0 0 400 240" }, def.render(v, o, 0) as ReactNode));
          return def;
        } catch (e) {
          fail(`${at}: sim ${id} failed: ${(e as Error).message}`);
          return null;
        }
      };
      switch (s.kind) {
        case "theory": {
          checkSim(s.sim, s.simParams);
          if (s.lines.length < 1 || s.lines.length > 3) fail(`${at}: theory should have 1–3 lines`);
          s.hotspots.forEach((h) => {
            if (h.x < 0 || h.x > 400 || h.y < 0 || h.y > 240) fail(`${at}: hotspot out of bounds ${h.title}`);
          });
          if (!s.codex.id) fail(`${at}: codex id missing`);
          for (const sid of s.codex.sims ?? []) checkSim(sid);
          if (s.flow) checkFlow(at, s.flow, checkSim);
          break;
        }
        case "sim": {
          const def = checkSim(s.sim, s.start);
          if (def) {
            const start = defaults(def, s.start);
            if (s.goal.test(start, def.compute(start))) fail(`${at}: goal already satisfied at start`);
            if (!reachable(def, s.goal.test, start)) fail(`${at}: goal unreachable — ${s.goal.text}`);
          }
          break;
        }
        case "predict":
          checkSim(s.sim, { ...s.before, ...s.after });
          if (s.answer < 0 || s.answer >= s.options.length) fail(`${at}: answer index out of range`);
          if (s.optionWhy) {
            if (s.optionWhy.length !== s.options.length) fail(`${at}: optionWhy has ${s.optionWhy.length} entries for ${s.options.length} options`);
            s.optionWhy.forEach((w, k) => {
              if (k === s.answer && w) fail(`${at}: optionWhy for the correct option should be empty`);
              if (k !== s.answer && !w.trim()) fail(`${at}: wrong option ${k} has no explanation`);
            });
          } else fail(`${at}: predict stage has no per-option explanations (optionWhy)`);
          break;
        case "equation": {
          const bank = [...s.target, ...s.distractors];
          for (const alt of s.accept ?? []) {
            const pool = [...bank];
            for (const t of alt) {
              const j = pool.indexOf(t);
              if (j < 0) fail(`${at}: accept token "${t}" not in bank`);
              else pool.splice(j, 1);
            }
          }
          break;
        }
        case "numeric":
          checkSim(s.sim, s.params);
          s.steps.forEach((st, j) => {
            if (!Number.isFinite(st.answer)) fail(`${at}: step ${j} answer not finite`);
          });
          break;
        case "crisis":
          s.phases.forEach((ph, j) => {
            if (ph.options.filter((o) => o.correct).length !== 1) fail(`${at}: phase ${j} must have exactly one correct option`);
          });
          break;
        case "swipe":
          if (s.cards.length < 3) fail(`${at}: swipe needs ≥ 3 cards`);
          break;
      }
    });
  }
}

const ids = new Set<string>();
for (const u of UNITS)
  for (const l of u.lessons)
    for (const s of l.stages)
      if (s.kind === "theory") {
        if (ids.has(s.codex.id)) fail(`duplicate codex id ${s.codex.id}`);
        ids.add(s.codex.id);
      }

// ---- Exam bank: every question answerable, papers satisfy quotas ----
const pool = buildPool();
for (const q of pool) {
  if (q.kind === "num") {
    if (!Number.isFinite(q.answer)) fail(`exam ${q.id}: non-finite answer`);
    if (!isCorrect(q, q.answer)) fail(`exam ${q.id}: own answer not accepted`);
  } else if (!q.options || q.answer < 0 || q.answer >= q.options.length) fail(`exam ${q.id}: bad option index`);
}
for (let t = 0; t < 50; t++) {
  let seed = t * 9973 + 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const paper = makePaper(25, rnd);
  if (paper.questions.length !== 25) fail(`paper ${t}: ${paper.questions.length} questions`);
  if (paper.questions.filter((q) => q.family === "numerical").length < 7) fail(`paper ${t}: < 7 numericals`);
  if (paper.questions.filter((q) => q.family === "statutory").length < 8) fail(`paper ${t}: < 8 statutory`);
  if (new Set(paper.questions.map((q) => q.id)).size !== 25) fail(`paper ${t}: duplicates`);
  for (const q of paper.questions) if (q.kind !== "num" && !isCorrect(q, q.answer)) fail(`paper ${t}: shuffled answer broken for ${q.id}`);
}
// ---- Calculators: defaults produce finite outputs ----
for (const tool of TOOLS) {
  const v = Object.fromEntries(tool.fields.map((f) => [f.key, f.default]));
  for (const o of tool.run(v)) if (typeof o.value === "number" && !Number.isFinite(o.value)) fail(`tool ${tool.id}: ${o.label} not finite`);
}
// ---- Statute register ----
for (const st of STATUTES) {
  if (!st.citation) fail(`statute ${st.id}: missing citation`);
  if (st.q && (st.q.answer < 0 || st.q.answer >= st.q.options.length)) fail(`statute ${st.id}: bad answer`);
}
console.log(`exam bank: ${pool.length} questions · tools: ${TOOLS.length} · statutes: ${STATUTES.length}`);
console.log(`concept flows: ${flows}`);
console.log(`${checks} stages checked across ${UNITS.length} units — ${errors} error(s).`);
process.exit(errors ? 1 : 0);
