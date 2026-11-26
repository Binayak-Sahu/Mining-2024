"use client";

import { useMemo, useState } from "react";
import { Calculator, Check, CornerDownLeft } from "lucide-react";
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
            Calculation signed off: continue
          </PrimaryButton>
        ) : (
          // Thumb-zone step bar: step indicator, the active answer field and the primary action stay on screen.
          <div className="space-y-2">
            <div className="flex items-baseline gap-2 t-label">
              <span className="readout shrink-0 rounded-full bg-surface-2 text-fg px-2 py-0.5 font-bold">
                Step {step + 1}/{stage.steps.length}
              </span>
              <span className="text-fg line-clamp-2">{cur.prompt}</span>
            </div>
            <div className="flex gap-2 items-stretch">
              <label className="flex-1 min-w-0 flex items-center rounded-[12px] border-2 border-line-strong bg-surface focus-within:border-action">
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
                  className="readout flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[17px] font-bold text-fg outline-none"
                />
                <span className="readout pr-3 text-[14px] text-fg-2 shrink-0">{cur.unit}</span>
              </label>
              {state === "right" || state === "revealed" ? (
                <PrimaryButton onClick={next} tone={state === "right" ? "safe" : "ink"} className="!w-auto shrink-0 !px-5">
                  Next step
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={check} disabled={!input} tone="tech" className="!w-auto shrink-0 !px-5">
                  Check
                </PrimaryButton>
              )}
            </div>
          </div>
        )
      }
    >
      <p className="flow-body text-fg">{stage.problem}</p>
      {def && <SimCanvas def={def} values={defaults(def, stage.params)} />}

      <div>
        <div className="t-eyebrow mb-3">Givens: tap to insert the symbol</div>
        <div className="flex flex-wrap gap-2">
          {stage.givens.map((g) => (
            <button
              key={g.sym}
              type="button"
              onClick={() => setExpr((e) => e + g.sym)}
              className="tile-3d px-3 py-2 text-left"
              title={g.label}
            >
              <span className="readout text-[14px] font-bold text-action-tint-text">{g.sym}</span>
              <span className="readout text-[14px] text-fg"> = {g.value} {g.unit}</span>
              <span className="block text-[14px] text-fg-2 leading-tight">{g.label}</span>
            </button>
          ))}
          {results.map((r, i) => (
            <button key={i} type="button" onClick={() => setExpr((e) => e + `s${i + 1}`)} className="tile-3d !border-success !bg-success-tint px-3 py-2">
              <span className="readout text-[14px] font-bold text-success-tint-text">s{i + 1}</span>
              <span className="readout text-[14px] text-fg"> = {fmt(r, 4)} {stage.steps[i].unit}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 t-label text-fg-2 mb-3">
          <Calculator size={16} aria-hidden /> Scratch calculator · trig in degrees · sqrt ln log exp ^
        </div>
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="e.g. 0.025*H*(w+B)^2/w^2"
          className="readout w-full rounded-[12px] border-2 border-line-strong bg-surface text-fg placeholder:text-fg-3 px-3 py-2.5 text-[17px] outline-none focus:border-action"
          spellCheck={false}
          autoCapitalize="off"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className={`t-readout ${calcVal !== null ? "text-fg" : "text-danger-tint-text"}`}>{calcOut && `= ${calcOut}`}</span>
          {calcVal !== null && !done && state !== "right" && state !== "revealed" && (
            <button type="button" onClick={() => setInput(String(+calcVal!.toPrecision(6)))} className="btn-3d btn-sm tone-ghost">
              <CornerDownLeft size={16} aria-hidden /> Use as answer
            </button>
          )}
        </div>
      </div>

      {stage.steps.map((s, i) =>
        i < step ? (
          <div key={i} className="rounded-[12px] bg-success-tint px-4 py-3 text-[16px] leading-[24px]">
            <span className="font-semibold text-success-tint-text inline-flex items-center gap-1">Step {i + 1} <Check size={16} aria-label="done" /></span> <span className="text-fg">{s.prompt}</span>
            <span className="readout block font-bold text-fg">
              s{i + 1} = {fmt(s.answer, 3)} {s.unit}
            </span>
          </div>
        ) : null,
      )}

      {!done && (
        <div className="space-y-3">
          <div className="text-[16px] leading-[24px] font-semibold text-fg">
            Step {step + 1}/{stage.steps.length}: {cur.prompt}
          </div>
          <Feedback show={state === "wrong"} ok={false} title="Not within tolerance: one more try">
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
