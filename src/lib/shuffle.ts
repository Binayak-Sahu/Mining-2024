import { UNITS } from "@/content";

/**
 * Deterministic answer-option ordering.
 *
 * Content files keep their authored option order. At render time every multiple-choice item
 * (legacy predict stages, each shift-crisis phase, and ConceptFlow predict/check/situation screens)
 * is shown in an order derived from a stable key:
 *   predict            `${lessonId}#${stageIndex}`
 *   crisis phase       `${lessonId}#${stageIndex}#${phase}`
 *   flow screen        `${lessonId}#${stageIndex}@${screenIndex}`
 * Within each unit the correct option is dealt to the least-used slot, so no slot carries more than
 * its share — balance is guaranteed by construction, not by luck. The wrong
 * options fill the remaining slots in a hashed order.
 */

function hash(seed: string): number {
  let h = 2166136261;
  for (let k = 0; k < seed.length; k++) h = Math.imul(h ^ seed.charCodeAt(k), 16777619);
  return h >>> 0;
}

/** Seeded Fisher–Yates permutation of 0..n-1. */
export function order(n: number, seed: string): number[] {
  let h = hash(seed);
  const idx = Array.from({ length: n }, (_, k) => k);
  for (let k = n - 1; k > 0; k--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const j = h % (k + 1);
    [idx[k], idx[j]] = [idx[j], idx[k]];
  }
  return idx;
}

export interface McItem {
  key: string;
  unitId: string;
  n: number;
  answer: number;
  kind: "predict" | "crisis" | "check" | "situation" | "flow-predict";
  /** Option texts (authored order) — used by the validator's length rule. */
  options: string[];
}

/** Every multiple-choice item in the curriculum, in curriculum order. */
export function allMcItems(): McItem[] {
  const out: McItem[] = [];
  for (const u of UNITS) {
    for (const l of [...u.lessons, u.boss]) {
      l.stages.forEach((s, i) => {
        if (s.kind === "predict") out.push({ key: `${l.id}#${i}`, unitId: u.id, n: s.options.length, answer: s.answer, kind: "predict", options: s.options });
        if (s.kind === "crisis")
          s.phases.forEach((ph, p) => {
            const a = ph.options.findIndex((o) => o.correct);
            out.push({ key: `${l.id}#${i}#${p}`, unitId: u.id, n: ph.options.length, answer: Math.max(0, a), kind: "crisis", options: ph.options.map((o) => o.text) });
          });
        if (s.kind === "theory" && s.flow)
          s.flow.forEach((f, k) => {
            if (f.kind === "predict" || f.kind === "check" || f.kind === "situation")
              out.push({ key: `${l.id}#${i}@${k}`, unitId: u.id, n: f.options.length, answer: f.answer, kind: f.kind === "predict" ? "flow-predict" : f.kind, options: f.options });
          });
      });
    }
  }
  return out;
}

let targets: Map<string, number> | null = null;

/**
 * Target display slot of the correct option for each item key. Greedy per unit: each item takes the
 * least-used slot it has (ties broken by a hash of the key), so every unit stays balanced even when it
 * mixes 3- and 4-option items.
 */
function targetSlots(): Map<string, number> {
  if (targets) return targets;
  targets = new Map();
  const used = new Map<string, number[]>();
  for (const it of allMcItems()) {
    const counts = used.get(it.unitId) ?? [0, 0, 0, 0, 0, 0, 0, 0];
    const min = Math.min(...counts.slice(0, it.n));
    const free = counts.slice(0, it.n).flatMap((c, k) => (c === min ? [k] : []));
    const slot = free[hash(it.key) % free.length];
    counts[slot]++;
    used.set(it.unitId, counts);
    targets.set(it.key, slot);
  }
  return targets;
}

/**
 * Display permutation for an item: `perm[slot] = authored index`. The correct option lands on its
 * balanced target slot; unknown keys fall back to a plain seeded shuffle.
 */
export function arrange(key: string, n: number, answer: number): number[] {
  const target = targetSlots().get(key);
  if (target === undefined || answer < 0 || answer >= n) return order(n, key);
  const rest = order(n, key).filter((k) => k !== answer);
  const perm: number[] = [];
  for (let slot = 0; slot < n; slot++) perm.push(slot === target ? answer : (rest.shift() as number));
  return perm;
}

/** Apply `arrange` to parallel arrays. Returns the shuffled arrays and the new answer index. */
export function shuffleItem<T, W>(key: string, options: T[], answer: number, why?: W[]): { options: T[]; why?: W[]; answer: number; perm: number[] } {
  const perm = arrange(key, options.length, answer);
  return { options: perm.map((k) => options[k]), why: why ? perm.map((k) => why[k]) : undefined, answer: perm.indexOf(answer), perm };
}
