"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Target, CheckCircle2 } from "lucide-react";
import type { SimStage, Vals } from "@/lib/types";
import { getSim } from "@/content";
import { SimView, defaults } from "@/components/sim/SimView";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

export function SimLabCard({ stage, onDone }: CardProps<SimStage>) {
  const def = getSim(stage.sim);
  const start = useMemo(() => defaults(def, stage.start), [def, stage.start]);
  const [values, setValues] = useState<Vals>(start);
  const [achieved, setAchieved] = useState(false);
  const [touched, setTouched] = useState(false);

  const out = useMemo(() => def.compute(values), [def, values]);
  const met = stage.goal.test(values, out);

  const change = (v: Vals) => {
    setValues(v);
    setTouched(true);
    const o = def.compute(v);
    if (stage.goal.test(v, o)) setAchieved(true);
  };

  return (
    <CardFrame
      kind="sim"
      title={stage.title}
      footer={
        <PrimaryButton onClick={onDone} disabled={!achieved} tone={achieved ? "safe" : "ink"}>
          {achieved ? "Lock in insight & Continue" : "Reach the objective to continue"}
        </PrimaryButton>
      }
    >
      <p className="text-[16px] leading-relaxed text-slate-700">{stage.brief}</p>
      <div className={`flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-[14px] font-bold transition-colors ${met && touched ? "bg-emerald-50 text-emerald-800 shadow-[inset_0_0_0_2px_#10B98155]" : "bg-blue-50 text-blue-900 shadow-[inset_0_0_0_2px_#3B82F633]"}`}>
        {met && touched ? <CheckCircle2 size={18} className="shrink-0 fill-emerald-500 text-white" /> : <Target size={18} className="shrink-0 text-blue-500" />}
        <span>Objective: {stage.goal.text}</span>
      </div>
      <SimView def={def} values={values} onChange={change} />
      <button type="button" onClick={() => setValues(start)} className="btn-press inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100">
        <RotateCcw size={12} /> Reset rig
      </button>
      <Feedback show={achieved} ok title="Objective reached — here's the physics">
        {stage.insight}
      </Feedback>
    </CardFrame>
  );
}
