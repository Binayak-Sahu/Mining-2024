"use client";

import { useState } from "react";
import type { PredictStage } from "@/lib/types";
import { getSim } from "@/content";
import { SimCanvas, Readouts, defaults } from "@/components/sim/SimView";
import { CardFrame, Feedback, PrimaryButton, optionClass, OptionKey, type CardProps } from "./ui";

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
      <p className="text-[16px] leading-relaxed text-slate-700">{stage.scenario}</p>
      {def && (
        <div className="space-y-2">
          <SimCanvas def={def} values={values} />
          {revealed && <Readouts def={def} values={values} />}
          {!revealed && <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em] font-bold">Before state — commit to a prediction to run the simulation</p>}
        </div>
      )}
      <p className="font-extrabold text-[17px] text-slate-900">{stage.question}</p>
      <div className="grid gap-2">
        {stage.options.map((o, i) => {
          const state = !revealed ? "idle" : i === stage.answer ? "right" : i === pick ? "wrong" : "dim";
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              className={`${optionClass(state)} flex items-center`}
            >
              <OptionKey i={i} state={state} />
              <span>{o}</span>
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
