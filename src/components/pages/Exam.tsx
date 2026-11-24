"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, Timer, Flag, ChevronLeft, ChevronRight, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { UNITS } from "@/content";
import { useStrata, type ExamAttempt } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { makePaper, isCorrect, type ExamPaper } from "@/lib/exam";
import { evaluate, fmt } from "@/lib/calc";
import { todayKey } from "@/lib/date";

type Resp = Record<number, string>;

function unitName(id: string) {
  const u = UNITS.find((x) => x.id === id);
  return u ? `U${u.n} ${u.short}` : id;
}

/** Aggregate per-unit accuracy across past attempts. */
function weakUnits(exams: ExamAttempt[]) {
  const agg: Record<string, [number, number]> = {};
  for (const e of exams)
    for (const [u, [c, a]] of Object.entries(e.byUnit)) {
      agg[u] = agg[u] ?? [0, 0];
      agg[u][0] += c;
      agg[u][1] += a;
    }
  return Object.entries(agg)
    .map(([u, [c, a]]) => ({ u, pct: a ? (100 * c) / a : 0, c, a }))
    .sort((x, y) => x.pct - y.pct);
}

export function Exam() {
  const hydrated = useHydrated();
  const exams = useStrata((s) => s.exams);
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [resp, setResp] = useState<Resp>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState<null | { score: number; byUnit: Record<string, [number, number]>; used: number }>(null);
  const [focusWeak, setFocusWeak] = useState(false);

  const weak = useMemo(() => weakUnits(hydrated ? exams : []), [exams, hydrated]);

  useEffect(() => {
    if (!paper || done) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [paper, done]);

  const submit = () => {
    if (!paper || done) return;
    const byUnit: Record<string, [number, number]> = {};
    let score = 0;
    paper.questions.forEach((q, k) => {
      const ok = isCorrect(q, resp[k]);
      if (ok) score++;
      byUnit[q.unitId] = byUnit[q.unitId] ?? [0, 0];
      byUnit[q.unitId][1]++;
      if (ok) byUnit[q.unitId][0]++;
    });
    const used = paper.seconds - left;
    setDone({ score, byUnit, used });
    const s = useStrata.getState();
    s.recordExam({ at: todayKey(), score, total: paper.questions.length, seconds: used, byUnit });
    s.addXp(score * 8);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (paper && !done && left === 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const start = () => {
    const focus = focusWeak ? weak.filter((w) => w.pct < 60).map((w) => w.u) : undefined;
    const p = makePaper(25, Math.random, focus && focus.length ? focus : undefined);
    setPaper(p);
    setLeft(p.seconds);
    setResp({});
    setFlags(new Set());
    setI(0);
    setDone(null);
  };

  if (!hydrated) return null;

  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <GraduationCap /> DGMS Exam Simulator
          </h1>
          <p className="text-slate-400 text-sm mt-1">25 questions · 30 minutes · First-Class Unrestricted weighting: numericals, shift crises and boss items count more; at least 7 numericals and 8 statutory/field items per paper.</p>
        </div>
        <div className="card p-5 space-y-3">
          <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
            <li>Questions are drawn from every unit&apos;s predictions, shift crises, statutory drills and numericals, plus the audited statute register.</li>
            <li>Numerical answers accept expressions (e.g. <span className="readout">2.7*sqrt(120)</span>) and are marked within ±2 % unless stated.</li>
            <li>Review shows step-by-step derivations, citations and a per-unit breakdown. History builds your weak-unit analytics.</li>
          </ul>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={focusWeak} onChange={(e) => setFocusWeak(e.target.checked)} className="w-4 h-4 accent-blue-500" disabled={weak.every((w) => w.pct >= 60)} />
            Double the weight of my weak units (&lt; 60 %) {weak.every((w) => w.pct >= 60) && <span className="text-slate-400">(no weak units recorded yet)</span>}
          </label>
          <button type="button" onClick={start} className="btn-press w-full rounded-xl bg-slate-900 py-3 text-sm font-bold uppercase tracking-wider text-white">
            Start mock exam
          </button>
        </div>
        {exams.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recent attempts</div>
              <ul className="space-y-1">
                {exams
                  .slice(-8)
                  .reverse()
                  .map((e, k) => (
                    <li key={k} className="flex justify-between text-sm readout">
                      <span>{e.at}</span>
                      <span className={e.score / e.total >= 0.6 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                        {e.score}/{e.total} · {Math.round(e.seconds / 60)} min
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="card p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <BarChart3 size={12} /> Weak-unit analytics (all attempts)
              </div>
              <div className="space-y-1.5">
                {weak.map((w) => (
                  <div key={w.u} className="text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold">{unitName(w.u)}</span>
                      <span className="readout">
                        {w.c}/{w.a} · {w.pct.toFixed(0)} %
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full ${w.pct < 60 ? "bg-red-500" : w.pct < 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${w.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (done) {
    const pct = (100 * done.score) / paper.questions.length;
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="card p-5 flex flex-wrap items-center gap-4">
          <div className={`readout text-4xl font-extrabold ${pct >= 60 ? "text-emerald-600" : "text-red-600"}`}>
            {done.score}/{paper.questions.length}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-bold">{pct >= 75 ? "First-class standard" : pct >= 60 ? "Pass standard — keep sharpening" : "Below pass standard"}</div>
            <div className="text-xs text-slate-500">
              {Math.round(done.used / 60)} min used · +{done.score * 8} XP
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={start} className="btn-press rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold uppercase text-white">
              New paper
            </button>
            <button type="button" onClick={() => setPaper(null)} className="btn-press rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-bold uppercase text-slate-700">
              Analytics
            </button>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">This paper by unit</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(done.byUnit)
              .sort()
              .map(([u, [c, a]]) => (
                <div key={u} className={`rounded-lg px-2 py-1.5 text-xs ${c / a >= 0.6 ? "bg-emerald-50" : "bg-red-50"}`}>
                  <div className="font-bold">{unitName(u)}</div>
                  <div className="readout">
                    {c}/{a}
                  </div>
                </div>
              ))}
          </div>
        </div>
        {paper.questions.map((q, k) => {
          const ok = isCorrect(q, resp[k]);
          const r = resp[k];
          return (
            <div key={q.id} className={`card p-4 border-l-4 ${ok ? "border-emerald-500" : "border-red-500"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {ok ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-red-600" />}
                Q{k + 1} · {unitName(q.unitId)} · {q.family}
              </div>
              {q.context && <p className="text-xs text-slate-500 mt-1">{q.context}</p>}
              <p className="font-semibold text-slate-900 mt-1">{q.prompt}</p>
              {q.kind === "num" ? (
                <p className="readout text-sm mt-1">
                  Your answer: {r === undefined || r === "" ? "—" : r} · Correct: {fmt(q.answer, 3)} {q.unit}
                </p>
              ) : (
                <p className="text-sm mt-1">
                  Your answer: <b>{r === undefined ? "—" : q.options![Number(r)]}</b> · Correct: <b className="text-emerald-700">{q.options![q.answer]}</b>
                </p>
              )}
              <ol className="mt-2 space-y-1 text-sm text-slate-700 list-decimal pl-5">
                {q.derivation.map((d, j) => (
                  <li key={j}>{d}</li>
                ))}
              </ol>
              {q.lessonId && (
                <Link href={`/lesson/${q.lessonId}`} className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Revise: {q.source}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const q = paper.questions[i];
  const r = resp[i];
  let preview = "";
  if (q.kind === "num" && r) {
    try {
      preview = `= ${fmt(evaluate(r), 4)}`;
    } catch (e) {
      preview = (e as Error).message;
    }
  }
  const answered = Object.keys(resp).filter((k) => resp[Number(k)] !== "").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className={`readout font-bold flex items-center gap-1 ${left < 300 ? "text-red-400" : "text-slate-200"}`}>
          <Timer size={16} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
        <span className="text-xs text-slate-400">
          {answered}/{paper.questions.length} answered
        </span>
        <button type="button" onClick={submit} className="btn-press ml-auto rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold uppercase text-white">
          Submit
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {paper.questions.map((_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setI(k)}
            className={`readout w-8 h-8 rounded-md text-xs font-bold ${k === i ? "bg-blue-500 text-white" : resp[k] !== undefined && resp[k] !== "" ? "bg-slate-300 text-slate-900" : "bg-slate-800 text-slate-400"} ${flags.has(k) ? "ring-2 ring-amber-400" : ""}`}
          >
            {k + 1}
          </button>
        ))}
      </div>
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Q{i + 1} · {unitName(q.unitId)} · {q.kind === "num" ? "numerical" : q.kind === "tf" ? "true / false" : "multiple choice"}
          <button
            type="button"
            onClick={() =>
              setFlags((f) => {
                const n = new Set(f);
                if (n.has(i)) n.delete(i);
                else n.add(i);
                return n;
              })
            }
            className={`ml-auto inline-flex items-center gap-1 ${flags.has(i) ? "text-amber-600" : "text-slate-400"}`}
          >
            <Flag size={12} /> {flags.has(i) ? "Flagged" : "Flag"}
          </button>
        </div>
        {q.context && <p className="text-sm text-slate-600 leading-snug">{q.context}</p>}
        <p className="font-bold text-slate-900">{q.prompt}</p>
        {q.givens && (
          <div className="flex flex-wrap gap-1.5">
            {q.givens.map((g) => (
              <span key={g.sym} className="readout text-xs rounded border border-slate-300 px-2 py-1">
                {g.label}: {g.value} {g.unit}
              </span>
            ))}
          </div>
        )}
        {q.kind === "num" ? (
          <div>
            <div className="flex gap-2 items-center">
              <input
                value={r ?? ""}
                onChange={(e) => setResp((p) => ({ ...p, [i]: e.target.value }))}
                placeholder="number or expression"
                className="readout flex-1 rounded-lg border-2 border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <span className="readout text-sm text-slate-600">{q.unit}</span>
            </div>
            <p className="readout text-xs text-slate-500 mt-1">{preview}</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {q.options!.map((o, k) => (
              <button
                key={k}
                type="button"
                onClick={() => setResp((p) => ({ ...p, [i]: String(k) }))}
                className={`btn-press text-left rounded-xl border-2 px-3 py-2.5 text-sm ${r === String(k) ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-400"}`}
              >
                <span className="readout mr-2 text-slate-400">{String.fromCharCode(65 + k)}</span>
                {o}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-between pt-1">
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="btn-press inline-flex items-center gap-1 text-sm font-semibold text-slate-600 disabled:opacity-30">
            <ChevronLeft size={16} /> Previous
          </button>
          <button type="button" disabled={i === paper.questions.length - 1} onClick={() => setI(i + 1)} className="btn-press inline-flex items-center gap-1 text-sm font-semibold text-slate-600 disabled:opacity-30">
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
