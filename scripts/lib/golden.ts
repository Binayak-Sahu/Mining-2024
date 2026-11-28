import { resolve } from "node:path";
import { allLessons } from "../../src/content";
import { fmt } from "../../src/lib/calc";
import type { SimDef, SimStage, Vals } from "../../src/lib/types";

export const GOLDEN_FILE = resolve(__dirname, "../../tests/sims.golden.json");

export interface Readout {
  key: string;
  /** raw value, as a string so -0 / NaN / 1e-17 survive JSON exactly */
  raw: string;
  text: string;
  tone: string;
}
export interface GoldenState {
  name: "min" | "default" | "objective-met";
  vals: Vals;
  readouts: Readout[];
  /** objective-met only: the goal text and whether the state meets it */
  goal?: string;
  goalMet?: boolean;
}
export interface Golden {
  params: { key: string; min: number; max: number; step: number; default: number; options?: number[] }[];
  handles: { key: string; axis: string }[];
  outputs: string[];
  states: GoldenState[];
}

export function defaults(def: SimDef, o?: Vals): Vals {
  const v: Vals = {};
  for (const p of def.params) v[p.key] = p.default;
  return { ...v, ...(o ?? {}) };
}

const raw = (v: unknown) => (typeof v === "number" ? (Object.is(v, -0) ? "-0" : String(v)) : String(v));

export function readouts(def: SimDef, vals: Vals): Readout[] {
  const out = def.compute(vals);
  return def.outputs.map((o) => {
    const v = out[o.key];
    const text = o.format ? String(o.format(v, out, vals)) : `${fmt(v, o.digits ?? 2)}${o.unit ? ` ${o.unit}` : ""}`;
    return { key: o.key, raw: raw(v), text, tone: o.tone ? o.tone(v, out, vals) : "info" };
  });
}

export function firstGoal(simId: string): { goal: SimStage["goal"]; start?: Vals } | null {
  for (const l of allLessons()) for (const s of l.stages) if (s.kind === "sim" && s.sim === simId) return { goal: s.goal, start: s.start };
  return null;
}

/** Values a param can take for the search: options, or up to `n` evenly spaced snapped values. */
function grid(p: SimDef["params"][number], n: number): number[] {
  if (p.options) return p.options.map((o) => o.value);
  const steps = Math.round((p.max - p.min) / p.step);
  const k = Math.min(n, steps);
  const out = new Set<number>();
  for (let i = 0; i <= k; i++) out.add(+(p.min + Math.round((steps * i) / k) * p.step).toFixed(6));
  return [...out];
}

/** Deterministic search for a state meeting the goal: start state, one param at a time, then pairs, then a seeded scan. */
export function findGoalState(def: SimDef, goal: SimStage["goal"], start?: Vals): Vals | null {
  const base = defaults(def, start);
  const meets = (v: Vals) => {
    try {
      return !!goal.test(v, def.compute(v));
    } catch {
      return false;
    }
  };
  if (meets(base)) return base;
  const ps = def.params;
  for (const p of ps) for (const x of grid(p, 60)) if (meets({ ...base, [p.key]: x })) return { ...base, [p.key]: x };
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++)
      for (const a of grid(ps[i], 24)) for (const b of grid(ps[j], 24)) {
        const v = { ...base, [ps[i].key]: a, [ps[j].key]: b };
        if (meets(v)) return v;
      }
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < 40000; k++) {
    const v = { ...base };
    for (const p of ps) {
      const g = grid(p, 40);
      v[p.key] = g[Math.floor(rnd() * g.length)];
    }
    if (meets(v)) return v;
  }
  return null;
}

export function goldenFor(def: SimDef): Golden {
  const min: Vals = {};
  for (const p of def.params) min[p.key] = p.options ? p.options[0].value : p.min;
  const states: GoldenState[] = [
    { name: "min", vals: min, readouts: readouts(def, min) },
    { name: "default", vals: defaults(def), readouts: readouts(def, defaults(def)) },
  ];
  const g = firstGoal(def.id);
  if (g) {
    // Hand-derived goal states for goals the blind search cannot reach (it changes at most two params, then a random scan).
    // u10-fta: the lesson goal fixes p1-p3 and needs P(explosion) = P(gas) x P(ignition) <= 0.002; P(gas) = 0.2355, so P(ignition) <= 0.0085: p4 = 0.005, p5 = p6 = 0 gives 0.005 and P(explosion) = 0.00118.
    const MANUAL: Record<string, Vals> = { "u10-fta": { p4: 0.005, p5: 0, p6: 0 } };
    const manual = MANUAL[def.id] ? defaults(def, { ...g.start, ...MANUAL[def.id] }) : null;
    const v = manual && g.goal.test(manual, def.compute(manual)) ? manual : findGoalState(def, g.goal, g.start);
    if (v) states.push({ name: "objective-met", vals: v, readouts: readouts(def, v), goal: g.goal.text, goalMet: true });
    else states.push({ name: "objective-met", vals: defaults(def, g.start), readouts: readouts(def, defaults(def, g.start)), goal: g.goal.text, goalMet: false });
  }
  return {
    params: def.params.map((p) => ({ key: p.key, min: p.min, max: p.max, step: p.step, default: p.default, ...(p.options ? { options: p.options.map((o) => o.value) } : {}) })),
    handles: (def.handles ?? []).map((h) => ({ key: h.key, axis: h.axis })),
    outputs: def.outputs.map((o) => o.key),
    states,
  };
}
