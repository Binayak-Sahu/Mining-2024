import { useStrata, migrateState, type ExamAttempt, type LessonRecord, type SrsItem, type CodexUnlock } from "./store";
import { todayKey } from "./date";

/** Persisted (non-function) fields of the progress store. */
const KEYS = ["xp", "xpByDay", "streak", "longestStreak", "lastActiveDay", "heartsLost", "lessons", "attempts", "codex", "formulas", "srs", "warmupDoneDay", "freeRoam", "exams"] as const;

export const SCHEMA = 2;

export interface ProgressFile {
  app: "strata";
  schema: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportProgress(): ProgressFile {
  const s = useStrata.getState() as unknown as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of KEYS) data[k] = s[k];
  return { app: "strata", schema: SCHEMA, exportedAt: new Date().toISOString(), data };
}

export function downloadProgress(): void {
  const file = exportProgress();
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `strata-progress-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);

/** Validates an export file and returns clean, current-schema data — throws a readable error otherwise. */
export function parseProgress(text: string): Record<string, unknown> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Not a JSON file.");
  }
  if (!isObj(raw) || raw.app !== "strata" || !isObj(raw.data)) throw new Error("This is not a STRATA progress export.");
  const schema = num(raw.schema, 1);
  if (schema > SCHEMA) throw new Error("This export comes from a newer version of STRATA — update the app first.");
  const d = migrateState(raw.data, schema);
  const objectOr = (v: unknown) => (isObj(v) ? v : {});
  return {
    xp: num(d.xp),
    xpByDay: objectOr(d.xpByDay),
    streak: num(d.streak),
    longestStreak: num(d.longestStreak),
    lastActiveDay: typeof d.lastActiveDay === "string" ? d.lastActiveDay : null,
    heartsLost: num(d.heartsLost),
    lessons: objectOr(d.lessons),
    attempts: objectOr(d.attempts),
    codex: objectOr(d.codex),
    formulas: objectOr(d.formulas),
    srs: objectOr(d.srs),
    warmupDoneDay: typeof d.warmupDoneDay === "string" ? d.warmupDoneDay : null,
    freeRoam: d.freeRoam === true,
    exams: Array.isArray(d.exams) ? d.exams : [],
  };
}

const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

/** Merge two progress snapshots: union of unlocks, best of records, maxima of counters. */
export function mergeProgress(cur: Record<string, unknown>, inc: Record<string, unknown>): Record<string, unknown> {
  const c = cur as Record<string, never>;
  const i = inc as Record<string, never>;
  const xpByDay: Record<string, number> = { ...(c.xpByDay as Record<string, number>) };
  for (const [day, v] of Object.entries(i.xpByDay as Record<string, number>)) xpByDay[day] = Math.max(xpByDay[day] ?? 0, num(v));
  const lessons: Record<string, LessonRecord> = { ...(c.lessons as Record<string, LessonRecord>) };
  for (const [id, r] of Object.entries(i.lessons as Record<string, LessonRecord>)) {
    const o = lessons[id];
    lessons[id] = o
      ? { completedAt: o.completedAt < r.completedAt ? o.completedAt : r.completedAt, attempts: Math.max(o.attempts, r.attempts), bestHearts: Math.max(o.bestHearts, r.bestHearts), bestXp: Math.max(o.bestXp, r.bestXp) }
      : r;
  }
  const attempts: Record<string, number> = { ...(c.attempts as Record<string, number>) };
  for (const [id, n] of Object.entries(i.attempts as Record<string, number>)) attempts[id] = Math.max(attempts[id] ?? 0, num(n));
  const srs: Record<string, SrsItem> = { ...(c.srs as Record<string, SrsItem>) };
  for (const [k, it] of Object.entries(i.srs as Record<string, SrsItem>)) if (!srs[k] || it.lastSeen > srs[k].lastSeen) srs[k] = it;
  const examKey = (e: ExamAttempt) => `${e.at}|${e.score}|${e.total}|${e.seconds}`;
  const exams = [...(c.exams as ExamAttempt[]), ...(i.exams as ExamAttempt[])].filter((e, idx, all) => all.findIndex((x) => examKey(x) === examKey(e)) === idx).slice(-30);
  const lastActive = later(c.lastActiveDay as string | null, i.lastActiveDay as string | null);
  return {
    xp: Math.max(num(c.xp), num(i.xp)),
    xpByDay,
    streak: lastActive === (i.lastActiveDay as string | null) ? Math.max(num(i.streak), lastActive === c.lastActiveDay ? num(c.streak) : 0) : num(c.streak),
    longestStreak: Math.max(num(c.longestStreak), num(i.longestStreak)),
    lastActiveDay: lastActive,
    heartsLost: Math.max(num(c.heartsLost), num(i.heartsLost)),
    lessons,
    attempts,
    codex: { ...(i.codex as Record<string, CodexUnlock>), ...(c.codex as Record<string, CodexUnlock>) },
    formulas: { ...(i.formulas as Record<string, CodexUnlock>), ...(c.formulas as Record<string, CodexUnlock>) },
    srs,
    warmupDoneDay: later(c.warmupDoneDay as string | null, i.warmupDoneDay as string | null),
    freeRoam: (c.freeRoam as boolean) || (i.freeRoam as boolean),
    exams,
  };
}

export function importProgress(text: string, mode: "replace" | "merge"): { lessons: number; codex: number; xp: number } {
  const incoming = parseProgress(text);
  const current = exportProgress().data;
  const next = mode === "merge" ? mergeProgress(current, incoming) : incoming;
  useStrata.setState(next as never);
  return { lessons: Object.keys(next.lessons as object).length, codex: Object.keys(next.codex as object).length, xp: num(next.xp) };
}
