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
      <div className="max-w-5xl mx-auto px-3 sm:px-5 py-5 sm:py-8 space-y-4 sm:space-y-5">
        <div className="relative overflow-hidden rounded-[28px] p-5 sm:p-8 text-white" style={{ background: "radial-gradient(120% 140% at 100% 0%, #991B1B 0%, #3F0D12 50%, #0B0F19 100%)", boxShadow: "var(--shadow-pop)" }}>
          <div className="absolute -right-6 -bottom-8 opacity-15 pointer-events-none" aria-hidden>
            <GraduationCap size={220} />
          </div>
          <div className="relative">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FECACA]">Exam hall · First-Class Unrestricted weighting</div>
            <h1 className="mt-2 text-[28px] sm:text-[38px] leading-[1.05] font-extrabold tracking-[-0.02em]">DGMS Exam Simulator</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {["25 questions", "30 minutes", "≥ 7 numericals", "≥ 8 statutory"].map((t) => (
                <span key={t} className="readout rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-5 sm:p-6 space-y-4">
          <ul className="text-[14px] text-slate-600 list-disc pl-5 space-y-1.5 leading-relaxed">
            <li>Questions are drawn from every unit&apos;s predictions, shift crises, statutory drills and numericals, plus the audited statute register.</li>
            <li>Numerical answers accept expressions (e.g. <span className="readout">2.7*sqrt(120)</span>) and are marked within ±2 % unless stated.</li>
            <li>Review shows step-by-step derivations, citations and a per-unit breakdown. History builds your weak-unit analytics.</li>
          </ul>
          <label className="flex items-center gap-3 text-[14px] text-slate-700 min-h-[44px] rounded-xl bg-slate-50 px-3.5 py-2.5">
            <input type="checkbox" checked={focusWeak} onChange={(e) => setFocusWeak(e.target.checked)} className="w-4 h-4 accent-blue-500" disabled={weak.every((w) => w.pct >= 60)} />
            Double the weight of my weak units (&lt; 60 %) {weak.every((w) => w.pct >= 60) && <span className="text-slate-400">(no weak units recorded yet)</span>}
          </label>
          <button type="button" onClick={start} className="btn-3d tone-crit w-full py-4 text-sm">
            Start mock exam
          </button>
        </div>
        {exams.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3">Recent attempts</div>
              <ul className="space-y-1">
                {exams
                  .slice(-8)
                  .reverse()
                  .map((e, k) => (
                    <li key={k} className="flex justify-between text-[13px] readout rounded-lg bg-slate-50 px-3 py-2">
                      <span>{e.at}</span>
                      <span className={e.score / e.total >= 0.6 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                        {e.score}/{e.total} · {Math.round(e.seconds / 60)} min
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="card p-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3 flex items-center gap-1.5">
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
                    <div className="h-2.5 mt-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${w.pct < 60 ? "bg-red-500" : w.pct < 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${w.pct}%` }} />
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
      <div className="max-w-4xl mx-auto px-3 sm:px-5 py-5 sm:py-8 space-y-4">
        <div className="card card-pop p-5 sm:p-6 flex flex-wrap items-center gap-4 sm:gap-6">
          <div className={`readout text-5xl font-extrabold tracking-tight ${pct >= 60 ? "text-emerald-600" : "text-red-600"}`}>
            {done.score}/{paper.questions.length}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-extrabold text-[18px] text-slate-900">{pct >= 75 ? "First-class standard" : pct >= 60 ? "Pass standard — keep sharpening" : "Below pass standard"}</div>
            <div className="text-xs text-slate-500">
              {Math.round(done.used / 60)} min used · +{done.score * 8} XP
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={start} className="btn-3d tone-crit px-4 py-2.5 text-[12px]">
              New paper
            </button>
            <button type="button" onClick={() => setPaper(null)} className="btn-3d tone-ghost px-4 py-2.5 text-[12px]">
              Analytics
            </button>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3">This paper by unit</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(done.byUnit)
              .sort()
              .map(([u, [c, a]]) => (
                <div key={u} className={`rounded-xl px-2.5 py-2 text-xs ${c / a >= 0.6 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                  <div className="font-extrabold">{unitName(u)}</div>
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
            <div key={q.id} className={`card p-4 sm:p-5 border-l-[6px] ${ok ? "border-emerald-500" : "border-red-500"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {ok ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-red-600" />}
                Q{k + 1} · {unitName(q.unitId)} · {q.family}
              </div>
              {q.context && <p className="text-xs text-slate-500 mt-1">{q.context}</p>}
              <p className="font-bold text-[15px] text-slate-900 mt-1.5">{q.prompt}</p>
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
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-3">
      <div className="rounded-2xl bg-[#0E1424] px-4 py-3 flex items-center gap-3 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.6)]">
        <span className={`readout text-[20px] font-extrabold flex items-center gap-1.5 ${left < 300 ? "text-[#F87171]" : "text-[#F1F5F9]"}`}>
          <Timer size={18} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
        <div className="flex-1 hidden sm:block h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" style={{ width: `${(answered / paper.questions.length) * 100}%` }} />
        </div>
        <span className="readout text-[12px] text-[#8B97AE] ml-auto sm:ml-0">
          {answered}/{paper.questions.length}
        </span>
        <button type="button" onClick={submit} className="btn-3d tone-crit px-4 py-2 text-[11.5px]">
          Submit
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap pb-1">
        {paper.questions.map((_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setI(k)}
            className={`readout shrink-0 w-9 h-9 rounded-xl text-[12px] font-extrabold transition ${k === i ? "bg-blue-500 text-white shadow-[0_3px_0_#1D4ED8]" : resp[k] !== undefined && resp[k] !== "" ? "bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1.5px_#10B98166]" : "bg-surface text-slate-500 shadow-[inset_0_0_0_1.5px_var(--n-200)]"} ${flags.has(k) ? "ring-2 ring-amber-400" : ""}`}
          >
            {k + 1}
          </button>
        ))}
      </div>
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
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
        <p className="font-extrabold text-[17px] sm:text-[19px] leading-snug text-slate-900">{q.prompt}</p>
        {q.givens && (
          <div className="flex flex-wrap gap-1.5">
            {q.givens.map((g) => (
              <span key={g.sym} className="readout text-[12px] rounded-lg bg-amber-50 text-amber-800 px-2.5 py-1 font-semibold">
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
                className="readout flex-1 min-w-0 rounded-xl border-2 border-slate-300 bg-surface px-3 py-3 text-[16px] font-bold text-slate-900 outline-none focus:border-blue-500"
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
                data-on={r === String(k)}
                className="tile-3d w-full flex items-center text-left px-4 py-3 text-[14.5px] font-semibold text-slate-800"
              >
                <span className={`readout mr-3 inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-lg border-2 text-[12px] font-extrabold ${r === String(k) ? "bg-blue-500 border-blue-500 text-white" : "border-slate-200 text-slate-400"}`}>{String.fromCharCode(65 + k)}</span>
                <span>{o}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-between gap-3 pt-2">
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="btn-3d tone-ghost inline-flex items-center gap-1 px-4 py-2.5 text-[12px] disabled:opacity-40">
            <ChevronLeft size={16} /> Previous
          </button>
          <button type="button" disabled={i === paper.questions.length - 1} onClick={() => setI(i + 1)} className="btn-3d tone-tech inline-flex items-center gap-1 px-4 py-2.5 text-[12px]">
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
