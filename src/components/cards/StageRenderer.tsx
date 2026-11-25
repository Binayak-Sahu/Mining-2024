"use client";

import type { Stage } from "@/lib/types";
import type { MistakeOpts } from "./ui";
import { TheoryBriefingCard } from "./TheoryBriefingCard";
import { SimLabCard } from "./SimLabCard";
import { PredictOutcomeCard } from "./PredictOutcomeCard";
import { EquationForgeCard } from "./EquationForgeCard";
import { NumericWorkbenchCard } from "./NumericWorkbenchCard";
import { ShiftCrisisCard } from "./ShiftCrisisCard";
import { RapidStatutorySwipeCard } from "./RapidStatutorySwipeCard";

export function StageRenderer({ stage, onMistake, onDone, onSubProgress }: { stage: Stage; onMistake: (concept: string, opts?: MistakeOpts) => void; onDone: () => void; onSubProgress?: (f: number) => void }) {
  switch (stage.kind) {
    case "theory":
      return <TheoryBriefingCard stage={stage} onMistake={onMistake} onDone={onDone} onSubProgress={onSubProgress} />;
    case "sim":
      return <SimLabCard stage={stage} onMistake={onMistake} onDone={onDone} onSubProgress={onSubProgress} />;
    case "predict":
      return <PredictOutcomeCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "equation":
      return <EquationForgeCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "numeric":
      return <NumericWorkbenchCard stage={stage} onMistake={onMistake} onDone={onDone} onSubProgress={onSubProgress} />;
    case "crisis":
      return <ShiftCrisisCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "swipe":
      return <RapidStatutorySwipeCard stage={stage} onMistake={onMistake} onDone={onDone} />;
  }
}
