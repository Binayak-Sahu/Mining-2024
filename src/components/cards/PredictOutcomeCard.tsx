"use client";

import { useState } from "react";
import type { PredictStage } from "@/lib/types";
import { getSim } from "@/content";
import { SimCanvas, Readouts, defaults } from "@/components/sim/SimView";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

export function PredictOutcomeCard({ stage, onMistake, onDone }: CardProps<PredictStage>) {
  const [pick, setPick] = useState<number | null>(null);
  const def = stage.sim ? getSim(stage.sim) : null;
  const revealed = pick !== null;
  const values = def ? defaults(def, revealed ? { ...stage.before, ...stage.after } : stage.before) : {};

  const choose = (i: number) => {
    if (revealed) return;
    setPick(i);
    if (i !== stage.answer) onMistake(stage.concept);
  };

  return (
    <CardFrame
      kind="predict"
      title={stage.title}
      footer={revealed && <PrimaryButton onClick={onDone}>Continue</PrimaryButton>}
    >
      <p className="text-[15px] leading-snug text-slate-800">{stage.scenario}</p>
      {def && (
        <div className="space-y-2">
          <SimCanvas def={def} values={values} />
          {revealed && <Readouts def={def} values={values} />}
          {!revealed && <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Before state — commit to a prediction to run the simulation</p>}
        </div>
      )}
      <p className="font-bold text-slate-900">{stage.question}</p>
      <div className="grid gap-2">
        {stage.options.map((o, i) => {
          const state = !revealed ? "idle" : i === stage.answer ? "right" : i === pick ? "wrong" : "dim";
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              className={`btn-press text-left rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                state === "idle"
                  ? "border-slate-200 hover:border-slate-900 bg-white"
                  : state === "right"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : state === "wrong"
                      ? "border-red-500 bg-red-50 text-red-900"
                      : "border-slate-100 text-slate-400"
              }`}
            >
              <span className="readout mr-2 text-slate-400">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          );
        })}
      </div>
      <Feedback show={revealed} ok={pick === stage.answer} title={pick === stage.answer ? "Prediction confirmed" : "Simulation disagrees — safety heart lost"}>
        {stage.explain}
      </Feedback>
    </CardFrame>
  );
}
