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
          {achieved ? "Continue" : "Reach the objective to continue"}
        </PrimaryButton>
      }
    >
      <Lines lines={[stage.brief]} />
      <SimView
        def={def}
        values={values}
        onChange={change}
        objective={{ text: stage.goal.text, met: met && touched, tag: "Objective" }}
        corner={
          <button type="button" onClick={() => setValues(start)} aria-label="Reset the rig" title="Reset the rig" className="w-11 h-11 rounded-full flex items-center justify-center bg-white/90 text-[#334155] shadow-[0_1px_3px_rgba(15,23,42,0.25)] hover:bg-white">
            <RotateCcw size={17} />
          </button>
        }
      />
      <Feedback show={achieved} ok compact title="Objective reached">
        {stage.insight}
      </Feedback>
    </CardFrame>
  );
}
