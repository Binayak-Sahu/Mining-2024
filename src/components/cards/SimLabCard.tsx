"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { SimStage, Vals } from "@/lib/types";
import { getSim } from "@/content";
import { SimView, defaults } from "@/components/sim/SimView";
import { CardFrame, Feedback, Lines, PrimaryButton, type CardProps } from "./ui";

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
      <Lines lines={[stage.brief]} />
      <SimView def={def} values={values} onChange={change} objective={{ text: stage.goal.text, met: met && touched, tag: "Objective" }} />
      <button type="button" onClick={() => setValues(start)} className="btn-press inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100">
        <RotateCcw size={12} /> Reset rig
      </button>
      <Feedback show={achieved} ok title="Objective reached — here's the physics">
        {stage.insight}
      </Feedback>
    </CardFrame>
  );
}
