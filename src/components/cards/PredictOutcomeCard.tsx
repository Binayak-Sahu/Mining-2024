"use client";

import { useMemo, useState } from "react";
import { shuffleItem } from "@/lib/shuffle";
import type { PredictStage } from "@/lib/types";
import { getSim } from "@/content";
import { SimCanvas, Readouts, defaults } from "@/components/sim/SimView";
import { CardFrame, Feedback, PrimaryButton, optionClass, OptionKey, type CardProps } from "./ui";

/**
 * Predict-then-reveal. A first wrong pick shows why that option fails and allows one retry without
 * costing a heart; a second miss costs the heart and reveals the outcome.
 */
export function PredictOutcomeCard({ stage: authored, onMistake, onDone, seed }: CardProps<PredictStage>) {
  // Balanced, deterministic option order (content keeps its authored order); reasons follow their option.
  const stage = useMemo(() => {
    const sh = shuffleItem(seed ?? `predict:${authored.title}`, authored.options, authored.answer, authored.optionWhy);
    return { ...authored, options: sh.options, answer: sh.answer, optionWhy: sh.why };
  }, [authored, seed]);
  const [pick, setPick] = useState<number | null>(null);
  const [tried, setTried] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const def = stage.sim ? getSim(stage.sim) : null;
  const revealed = pick !== null;
  const values = def ? defaults(def, revealed ? { ...stage.before, ...stage.after } : stage.before) : {};

  const choose = (i: number | null) => {
    if (i === null || revealed || tried.includes(i)) return;
    setSel(null);
    if (i === stage.answer) {
      setHint(false);
      setPick(i);
      return;
    }
    if (tried.length === 0) {
      setTried([i]);
      setHint(true);
      onMistake(stage.concept, { heart: false });
      return;
    }
    setHint(false);
    setTried((t) => [...t, i]);
    setPick(i);
    onMistake(stage.concept);
  };

  const first = tried[0];
  const ok = pick === stage.answer;

  return (
    <CardFrame
      kind="predict"
      title={stage.title}
      footer={
        revealed ? (
          <PrimaryButton onClick={onDone}>Continue</PrimaryButton>
        ) : hint ? (
          <PrimaryButton onClick={() => setHint(false)}>Try again</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => choose(sel)} disabled={sel === null}>
            Check
          </PrimaryButton>
        )
      }
    >
      <p className="flow-body text-slate-700">{stage.scenario}</p>
      {def && (
        <div className="space-y-2">
          <SimCanvas def={def} values={values} />
          {revealed && <Readouts def={def} values={values} />}
          {!revealed && <p className="text-[13px] text-slate-500 font-semibold">Before state — commit to a prediction to run the simulation</p>}
        </div>
      )}
      <p className="flow-q text-slate-900">{stage.question}</p>
      <div className="grid gap-2.5">
        {stage.options.map((o, i) => {
          const state = revealed ? (i === stage.answer ? "right" : i === pick ? "wrong" : "dim") : tried.includes(i) ? "dim" : sel === i && !hint ? "selected" : "idle";
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setHint(false);
                setSel(i);
              }}
              aria-pressed={sel === i}
              disabled={revealed || tried.includes(i)}
              className={`${optionClass(state)} flex items-center !text-[16px] min-h-[56px]`}
            >
              <OptionKey i={i} state={state} />
              <span className={!revealed && tried.includes(i) ? "line-through decoration-slate-400" : ""}>{o}</span>
            </button>
          );
        })}
      </div>
      <Feedback show={hint && first !== undefined} ok={false} title="Not quite — one more try">
        {first !== undefined && (stage.optionWhy?.[first] || "That outcome doesn't follow. Think about what changes first.")}
      </Feedback>
      <Feedback show={revealed} ok={ok} title={ok ? (tried.length ? "That's it" : "Prediction confirmed") : "The simulation disagrees"}>
        {!ok && pick !== null && stage.optionWhy?.[pick] && (
          <span className="block mb-1.5">
            <b className="text-slate-900">Why “{stage.options[pick]}” fails: </b>
            {stage.optionWhy[pick]}
          </span>
        )}
        <span className="block">{!ok && <b className="text-slate-900">What actually happens: </b>}{stage.explain}</span>
      </Feedback>
    </CardFrame>
  );
}
