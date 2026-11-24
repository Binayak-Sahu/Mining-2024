import { UNITS } from "@/content";
import { STATUTES } from "@/content/statutes";
import { evaluate } from "./calc";

export type ExamKind = "mcq" | "tf" | "num";

export interface ExamQuestion {
  id: string;
  unitId: string;
  unitN: number;
  kind: ExamKind;
  /** "numerical" or "statutory/field" — used for quotas and analytics. */
  family: "numerical" | "statutory" | "concept";
  weight: number;
  prompt: string;
  context?: string;
  givens?: { sym: string; label: string; value: number; unit: string }[];
  options?: string[];
  /** mcq/tf: index of the correct option; num: numeric answer. */
  answer: number;
  tol?: number;
  unit?: string;
  derivation: string[];
  source: string;
  lessonId?: string;
}

/** Every examinable item in the curriculum. Orientation (unit 0) is excluded. */
export function buildPool(): ExamQuestion[] {
  const pool: ExamQuestion[] = [];
  for (const u of UNITS) {
    if (u.n === 0) continue;
    for (const l of [...u.lessons, u.boss]) {
      const bossMul = l.boss ? 1.5 : 1;
      l.stages.forEach((s, i) => {
        const base = { unitId: u.id, unitN: u.n, source: `${l.boss ? "Boss · " : ""}${l.title}`, lessonId: l.id };
        if (s.kind === "predict") {
          pool.push({ ...base, id: `${l.id}#${i}`, kind: "mcq", family: "concept", weight: 2 * bossMul, prompt: `${s.scenario} ${s.question}`, options: s.options, answer: s.answer, derivation: [s.explain] });
        } else if (s.kind === "crisis") {
          s.phases.forEach((ph, j) => {
            const correct = ph.options.findIndex((o) => o.correct);
            pool.push({
              ...base,
              id: `${l.id}#${i}.${j}`,
              kind: "mcq",
              family: "statutory",
              weight: 2.5 * bossMul,
              prompt: `${ph.label}: ${ph.prompt}`,
              context: `${s.alarm} — ${s.scenario}`,
              options: ph.options.map((o) => o.text),
              answer: correct,
              derivation: [ph.options[correct].why, s.debrief],
            });
          });
        } else if (s.kind === "swipe") {
          s.cards.forEach((c, j) =>
            pool.push({ ...base, id: `${l.id}#${i}.${j}`, kind: "tf", family: "statutory", weight: 1 * bossMul, prompt: c.text, options: ["True", "False"], answer: c.truth ? 0 : 1, derivation: [c.why] }),
          );
        } else if (s.kind === "numeric") {
          const last = s.steps[s.steps.length - 1];
          pool.push({
            ...base,
            id: `${l.id}#${i}`,
            kind: "num",
            family: "numerical",
            weight: 3 * bossMul,
            prompt: last.prompt,
            context: s.problem,
            givens: s.givens,
            answer: last.answer,
            tol: last.tol ?? 0.02,
            unit: last.unit,
            derivation: s.steps.map((st, k) => `Step ${k + 1} — ${st.prompt}: ${st.explain}`),
          });
        }
      });
    }
  }
  for (const st of STATUTES) {
    if (!st.q) continue;
    pool.push({
      id: `statute:${st.id}`,
      unitId: "u10",
      unitN: 10,
      kind: "mcq",
      family: "statutory",
      weight: st.status === "verified" ? 3 : 2,
      prompt: st.q.prompt,
      options: st.q.options,
      answer: st.q.answer,
      derivation: [st.q.explain, `Citation: ${st.citation}`],
      source: "Statute register",
    });
  }
  return pool;
}

export interface ExamPaper {
  questions: ExamQuestion[];
  seconds: number;
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/**
 * First-Class style paper: weighted sampling (numericals, crises and boss items weigh more),
 * quotas of ≥ 7 numericals and ≥ 8 statutory/field items, ≤ 4 questions per unit, options shuffled.
 */
export function makePaper(n = 25, rnd: () => number = Math.random, focusUnits?: string[]): ExamPaper {
  const pool = buildPool();
  const ranked = pool
    .map((q) => {
      const focus = focusUnits && focusUnits.includes(q.unitId) ? 2 : 1;
      return { q, key: -Math.log(Math.max(rnd(), 1e-12)) / (q.weight * focus) };
    })
    .sort((a, b) => a.key - b.key)
    .map((r) => r.q);
  const chosen: ExamQuestion[] = [];
  const perUnit: Record<string, number> = {};
  const take = (pred: (q: ExamQuestion) => boolean, upTo: number) => {
    for (const q of ranked) {
      if (chosen.length >= n || chosen.filter(pred).length >= upTo) break;
      if (!pred(q) || chosen.includes(q) || (perUnit[q.unitId] ?? 0) >= 4) continue;
      chosen.push(q);
      perUnit[q.unitId] = (perUnit[q.unitId] ?? 0) + 1;
    }
  };
  take((q) => q.family === "numerical", 7);
  take((q) => q.family === "statutory", 8);
  take(() => true, n);
  const questions = shuffle(chosen, rnd).map((q) => {
    if (q.kind !== "mcq" || !q.options) return q;
    const order = shuffle(q.options.map((_, i) => i), rnd);
    return { ...q, options: order.map((i) => q.options![i]), answer: order.indexOf(q.answer) };
  });
  return { questions, seconds: n * 72 };
}

export function isCorrect(q: ExamQuestion, response: string | number | undefined): boolean {
  if (response === undefined || response === "") return false;
  if (q.kind === "num") {
    let v: number;
    try {
      v = typeof response === "number" ? response : evaluate(String(response));
    } catch {
      v = NaN;
    }
    if (!Number.isFinite(v)) return false;
    if (q.answer === 0) return Math.abs(v) <= (q.tol ?? 0.02);
    return Math.abs(v - q.answer) / Math.abs(q.answer) <= (q.tol ?? 0.02);
  }
  return Number(response) === q.answer;
}
