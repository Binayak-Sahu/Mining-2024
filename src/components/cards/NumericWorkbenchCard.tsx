"use client";

import { useMemo, useState } from "react";
import { Calculator, CornerDownLeft } from "lucide-react";
import type { NumericStage } from "@/lib/types";
import { closeEnough, evaluate, fmt } from "@/lib/calc";
import { getSim } from "@/content";
import { SimCanvas, defaults } from "@/components/sim/SimView";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

export function NumericWorkbenchCard({ stage, onMistake, onDone }: CardProps<NumericStage>) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [input, setInput] = useState("");
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<"idle" | "wrong" | "right" | "revealed">("idle");
  const [expr, setExpr] = useState("");

  const vars = useMemo(() => {
    const v: Record<string, number> = {};
    for (const g of stage.givens) v[g.sym] = g.value;
    results.forEach((r, i) => (v[`s${i + 1}`] = r));
    return v;
  }, [stage.givens, results]);

  let calcOut: string = "";
  let calcVal: number | null = null;
  if (expr.trim()) {
    try {
      calcVal = evaluate(expr, vars);
      calcOut = fmt(calcVal, 4);
    } catch (e) {
      calcOut = (e as Error).message;
    }
  }

  const cur = stage.steps[step];
  const done = step >= stage.steps.length;

  const check = () => {
    let v: number;
    try {
      v = evaluate(input, vars);
    } catch {
      v = NaN;
    }
    if (closeEnough(v, cur.answer, cur.tol ?? 0.02)) {
      setState("right");
    } else {
      if (tries === 0) onMistake(stage.concept);
      const n = tries + 1;
      setTries(n);
      setState(n >= 2 ? "revealed" : "wrong");
    }
  };

  const next = () => {
    setResults((r) => [...r, cur.answer]);
    setStep((s) => s + 1);
    setInput("");
    setTries(0);
    setState("idle");
  };

  const def = stage.sim ? getSim(stage.sim) : null;

  return (
    <CardFrame
      kind="numeric"
      title={stage.title}
      footer={
        done ? (
          <PrimaryButton onClick={onDone} tone="safe">
            Calculation signed off — Continue
          </PrimaryButton>
        ) : (
          // Thumb-zone step bar: step indicator, the active answer field and the primary action stay on screen.
          <div className="space-y-2">
            <div className="flex items-baseline gap-2 text-[13px] leading-snug">
              <span className="readout shrink-0 rounded-md bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[11.5px] font-extrabold">
                Step {step + 1}/{stage.steps.length}
              </span>
              <span className="font-semibold text-slate-800 line-clamp-2">{cur.prompt}</span>
            </div>
            <div className="flex gap-2 items-stretch">
              <label className="flex-1 min-w-0 flex items-center rounded-xl border border-slate-400 bg-surface focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30">
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (state === "wrong") setState("idle");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && state !== "right" && state !== "revealed" && input && check()}
                  disabled={state === "right" || state === "revealed"}
                  placeholder="answer"
                  aria-label={`Answer for step ${step + 1}`}
                  inputMode="decimal"
                  className="readout flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[16px] font-bold text-slate-900 outline-none"
                />
                <span className="readout pr-3 text-[13px] text-slate-600 shrink-0">{cur.unit}</span>
              </label>
              {state === "right" || state === "revealed" ? (
                <PrimaryButton onClick={next} tone={state === "right" ? "safe" : "ink"} className="!w-auto shrink-0 px-5">
                  Next step
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={check} disabled={!input} tone="hazard" className="!w-auto shrink-0 px-5">
                  Check
                </PrimaryButton>
              )}
            </div>
          </div>
        )
      }
    >
      <p className="text-[16px] leading-relaxed text-slate-700">{stage.problem}</p>
      {def && <SimCanvas def={def} values={defaults(def, stage.params)} />}

      <div>
        <div className="text-[12.5px] font-bold text-slate-500 mb-1">Givens — tap to insert symbol</div>
        <div className="flex flex-wrap gap-1.5">
          {stage.givens.map((g) => (
            <button
              key={g.sym}
              type="button"
              onClick={() => setExpr((e) => e + g.sym)}
              className="tile-3d px-2.5 py-1.5 text-left hover:!border-amber-400"
              title={g.label}
            >
              <span className="readout text-xs font-bold text-amber-700">{g.sym}</span>
              <span className="readout text-xs text-slate-900"> = {g.value} {g.unit}</span>
              <span className="block text-[10px] text-slate-500 leading-tight">{g.label}</span>
            </button>
          ))}
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => setExpr((e) => e + `s${i + 1}`)} className="tile-3d !border-emerald-300 !bg-emerald-50 px-2.5 py-1.5">
              <span className="readout text-xs font-bold text-emerald-700">s{i + 1}</span>
              <span className="readout text-xs text-slate-900"> = {fmt(r, 4)} {stage.steps[i].unit}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#0E1424] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#8B97AE] mb-2">
          <Calculator size={12} /> Scratch calculator · trig in degrees · sqrt ln log exp ^
        </div>
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="e.g. 0.025*H*(w+B)^2/w^2"
          className="readout w-full rounded-xl bg-[#1B2336] text-[#F1F5F9] placeholder:text-[#5D6B89] px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-amber-500"
          spellCheck={false}
          autoCapitalize="off"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className={`readout text-[15px] font-bold ${calcVal !== null ? "text-[#FCD34D]" : "text-[#FCA5A5]"}`}>{calcOut && `= ${calcOut}`}</span>
          {calcVal !== null && !done && state !== "right" && state !== "revealed" && (
            <button type="button" onClick={() => setInput(String(+calcVal!.toPrecision(6)))} className="btn-press inline-flex items-center gap-1 rounded-lg bg-[#FBBF24] text-[#422006] px-2.5 py-1.5 text-xs font-extrabold">
              <CornerDownLeft size={12} /> Use as answer
            </button>
          )}
        </div>
      </div>

      {stage.steps.map((s, i) =>
        i < step ? (
          <div key={i} className="rounded-2xl bg-emerald-50 shadow-[inset_0_0_0_1.5px_#10B98155] px-3.5 py-2.5 text-sm">
            <span className="font-semibold text-emerald-800">Step {i + 1} ✓</span> <span className="text-slate-700">{s.prompt}</span>
            <span className="readout block font-bold text-slate-900">
              s{i + 1} = {fmt(s.answer, 3)} {s.unit}
            </span>
          </div>
        ) : null,
      )}

      {!done && (
        <div className="rounded-2xl hairline bg-amber-50/40 p-3.5 space-y-3">
          <div className="text-sm font-semibold text-slate-900">
            Step {step + 1}/{stage.steps.length}: {cur.prompt}
          </div>
          <Feedback show={state === "wrong"} ok={false} title="Not within tolerance — one more try">
            Hint: {cur.hint}
          </Feedback>
          <Feedback show={state === "right"} ok title={`Correct: ${fmt(cur.answer, 3)} ${cur.unit}`}>
            {cur.explain}
          </Feedback>
          <Feedback show={state === "revealed"} ok={false} title={`Answer: ${fmt(cur.answer, 3)} ${cur.unit}`}>
            {cur.explain}
          </Feedback>
        </div>
      )}
    </CardFrame>
  );
}
