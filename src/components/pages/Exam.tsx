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
    const noWeak = weak.every((w) => w.pct >= 60);
    return (
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8 space-y-8">
        {/* §5.13 Exam hero: follows the theme (card, no gradient) */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="unit-tile w-14 h-14 shrink-0" aria-hidden>
              <GraduationCap size={26} />
            </span>
            <div className="min-w-0">
              <div className="t-eyebrow">Exam hall · First-Class Unrestricted weighting</div>
              <h1 className="t-display text-fg mt-1">DGMS Exam Simulator</h1>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["25 questions", "30 minutes", "≥ 7 numericals", "≥ 8 statutory"].map((t) => (
              <span key={t} className="readout t-label rounded-[12px] bg-surface-2 text-fg px-3 py-1">
                {t}
              </span>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3 t-label text-fg min-h-[48px]" style={{ fontWeight: 400 }}>
            <input type="checkbox" checked={focusWeak} onChange={(e) => setFocusWeak(e.target.checked)} className="w-5 h-5 shrink-0 accent-[var(--action)]" disabled={noWeak} />
            <span>
              Double the weight of my weak units (&lt; 60 %) {noWeak && <span className="text-fg-2">(no weak units recorded yet)</span>}
            </span>
          </label>
          <button type="button" onClick={start} className="btn-3d tone-tech w-full mt-6">
            Start mock exam
          </button>
        </div>
        <ul className="t-secondary list-disc pl-5 space-y-2">
          <li>Questions are drawn from every unit&apos;s predictions, shift crises, statutory drills and numericals, plus the audited statute register.</li>
          <li>
            Numerical answers accept expressions (e.g. <span className="readout">2.7*sqrt(120)</span>) and are marked within ±2 % unless stated.
          </li>
          <li>Review shows step-by-step derivations, citations and a per-unit breakdown. History builds your weak-unit analytics.</li>
        </ul>
        {exams.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8 md:gap-6">
            <div className="card p-5">
              <div className="t-eyebrow">Recent attempts</div>
              <div className="mt-2">
                {exams
                  .slice(-8)
                  .reverse()
                  .map((e, k) => (
                    <div key={k} className="ds-readout-row last:border-b-0">
                      <span className="t-label text-fg-2 readout" style={{ fontWeight: 400 }}>{e.at}</span>
                      <span className={`t-readout ${e.score / e.total >= 0.6 ? "text-success-tint-text" : "text-danger-tint-text"}`}>
                        {e.score}/{e.total} · {Math.round(e.seconds / 60)} min
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="card p-5">
              <div className="t-eyebrow flex items-center gap-2">
                <BarChart3 size={16} aria-hidden /> Weak-unit analytics
              </div>
              <div className="mt-4 space-y-4">
                {weak.map((w) => (
                  <div key={w.u}>
                    <div className="flex justify-between gap-3 t-label">
                      <span className="text-fg">{unitName(w.u)}</span>
                      <span className="readout text-fg-2" style={{ fontWeight: 400 }}>
                        {w.c}/{w.a} · {w.pct.toFixed(0)} %
                      </span>
                    </div>
                    <div className="ds-progress mt-2" aria-hidden>
                      <div className={`ds-progress-fill ${w.pct < 60 ? "!bg-danger" : w.pct < 80 ? "!bg-energy" : ""}`} style={{ width: `${w.pct}%` }} />
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
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-8 space-y-8">
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className={`readout t-display ${pct >= 60 ? "text-success-tint-text" : "text-danger-tint-text"}`}>
              {done.score}/{paper.questions.length}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="t-heading text-fg">{pct >= 75 ? "First-class standard" : pct >= 60 ? "Pass standard — keep sharpening" : "Below pass standard"}</div>
              <div className="t-label text-fg-2 readout" style={{ fontWeight: 400 }}>
                {Math.round(done.used / 60)} min used · +{done.score * 8} XP
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button type="button" onClick={start} className="btn-3d tone-tech flex-1">
              New paper
            </button>
            <button type="button" onClick={() => setPaper(null)} className="btn-3d tone-ghost flex-1">
              Analytics
            </button>
          </div>
        </div>
        <div>
          <div className="t-eyebrow">This paper by unit</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
            {Object.entries(done.byUnit)
              .sort()
              .map(([u, [c, a]]) => (
                <div key={u} className={`rounded-[12px] px-3 py-2 t-label ${c / a >= 0.6 ? "bg-success-tint text-success-tint-text" : "bg-danger-tint text-danger-tint-text"}`}>
                  <div style={{ fontWeight: 800 }}>{unitName(u)}</div>
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
            <div key={q.id} className="card p-5 sm:p-6">
              <div className="t-eyebrow flex items-center gap-2">
                {ok ? <CheckCircle2 size={16} className="text-success-tint-text shrink-0" aria-label="Correct" /> : <XCircle size={16} className="text-danger-tint-text shrink-0" aria-label="Wrong" />}
                <span className="min-w-0">
                  Q{k + 1} · {unitName(q.unitId)} · {q.family}
                </span>
              </div>
              {q.context && <p className="t-label text-fg-2 mt-2" style={{ fontWeight: 400 }}>{q.context}</p>}
              <p className="t-body text-fg mt-2" style={{ fontWeight: 700 }}>{q.prompt}</p>
              {q.kind === "num" ? (
                <p className="readout t-label text-fg mt-2" style={{ fontWeight: 400 }}>
                  Your answer: {r === undefined || r === "" ? "—" : r} · Correct: {fmt(q.answer, 3)} {q.unit}
                </p>
              ) : (
                <p className="t-secondary !text-fg mt-2">
                  Your answer: <b>{r === undefined ? "—" : q.options![Number(r)]}</b> · Correct: <b className="text-success-tint-text">{q.options![q.answer]}</b>
                </p>
              )}
              {!ok && q.kind !== "num" && r !== undefined && q.optionWhy?.[Number(r)] && (
                <p className="t-label mt-3 rounded-[12px] bg-danger-tint text-danger-tint-text px-4 py-3" style={{ fontWeight: 400 }}>
                  <b>Why that fails: </b>
                  {q.optionWhy[Number(r)]}
                </p>
              )}
              <ol className="mt-3 space-y-1 t-secondary list-decimal pl-5">
                {q.derivation.map((d, j) => (
                  <li key={j}>{d}</li>
                ))}
              </ol>
              {q.lessonId && (
                <Link href={`/lesson/${q.lessonId}`} className="inline-flex items-center min-h-[44px] mt-1 t-label text-action-tint-text" style={{ fontWeight: 700 }}>
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
    <div className="max-w-4xl mx-auto px-5 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* §5.13 instrument strip: follows the theme */}
      <div className="card px-4 py-2 flex items-center gap-3">
        <span className={`t-readout flex items-center gap-2 ${left < 300 ? "text-danger-tint-text" : "text-fg"}`} style={{ fontSize: 20 }}>
          <Timer size={18} aria-hidden /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
        <div className="flex-1 hidden sm:block ds-progress" aria-hidden>
          <div className="ds-progress-fill" style={{ width: `${(answered / paper.questions.length) * 100}%` }} />
        </div>
        <span className="readout t-label text-fg-2 ml-auto sm:ml-0" style={{ fontWeight: 400 }} aria-label={`${answered} of ${paper.questions.length} answered`}>
          {answered}/{paper.questions.length}
        </span>
        <button type="button" onClick={submit} className="btn-3d btn-sm tone-ghost">
          Submit
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap pt-1 pb-2" aria-label="Questions">
        {paper.questions.map((_, k) => {
          const has = resp[k] !== undefined && resp[k] !== "";
          return (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              data-on={k === i}
              aria-current={k === i ? "step" : undefined}
              aria-label={`Question ${k + 1}${has ? ", answered" : ""}${flags.has(k) ? ", flagged" : ""}`}
              className={`tile-3d readout t-label shrink-0 w-11 h-11 !rounded-[12px] flex items-center justify-center ${k === i ? "text-action-tint-text" : has ? "!bg-success-tint !border-success text-success-tint-text" : "text-fg-2"} ${flags.has(k) ? "ring-2 ring-energy ring-offset-2 ring-offset-[var(--bg)]" : ""}`}
              style={{ fontWeight: 800 }}
            >
              {k + 1}
            </button>
          );
        })}
      </div>
      <div className="card p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 t-eyebrow">
          <span className="min-w-0">
            Q{i + 1} · {unitName(q.unitId)} · {q.kind === "num" ? "numerical" : q.kind === "tf" ? "true / false" : "multiple choice"}
          </span>
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
            aria-pressed={flags.has(i)}
            className={`ml-auto shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-2 t-label normal-case tracking-normal ${flags.has(i) ? "text-energy-tint-text" : "text-fg-2"}`}
          >
            <Flag size={16} aria-hidden fill={flags.has(i) ? "currentColor" : "none"} /> {flags.has(i) ? "Flagged" : "Flag"}
          </button>
        </div>
        {q.context && <p className="t-secondary">{q.context}</p>}
        <p className="t-body text-fg" style={{ fontWeight: 700 }}>{q.prompt}</p>
        {q.givens && (
          <div className="flex flex-wrap gap-2">
            {q.givens.map((g) => (
              <span key={g.sym} className="readout t-label rounded-[12px] bg-surface-2 text-fg px-3 py-1">
                {g.label}: {g.value} {g.unit}
              </span>
            ))}
          </div>
        )}
        {q.kind === "num" ? (
          <div>
            <div className="flex gap-3 items-center">
              <input value={r ?? ""} onChange={(e) => setResp((p) => ({ ...p, [i]: e.target.value }))} placeholder="number or expression" aria-label="Your answer" className="field-input readout flex-1 min-w-0" />
              <span className="readout t-label text-fg-2">{q.unit}</span>
            </div>
            <p className="readout t-label text-fg-2 mt-2 min-h-[20px]" style={{ fontWeight: 400 }}>{preview}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {q.options!.map((o, k) => (
              <button key={k} type="button" onClick={() => setResp((p) => ({ ...p, [i]: String(k) }))} data-on={r === String(k)} aria-pressed={r === String(k)} className="tile-3d w-full flex items-center text-left px-4 py-3 t-secondary !text-fg" style={{ fontWeight: 600 }}>
                <span className={`readout t-label mr-3 inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-[8px] border-2 ${r === String(k) ? "bg-action border-action text-[var(--action-on)]" : "border-line-strong text-fg-2"}`} style={{ fontWeight: 800 }} aria-hidden>
                  {String.fromCharCode(65 + k)}
                </span>
                <span>{o}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-between gap-3 pt-2">
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="btn-3d tone-ghost flex-1 sm:flex-none">
            <ChevronLeft size={20} aria-hidden /> Previous
          </button>
          <button type="button" disabled={i === paper.questions.length - 1} onClick={() => setI(i + 1)} className="btn-3d tone-tech flex-1 sm:flex-none">
            Next <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
