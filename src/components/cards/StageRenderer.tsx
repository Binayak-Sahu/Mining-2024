"use client";

import type { Stage } from "@/lib/types";
import { TheoryBriefingCard } from "./TheoryBriefingCard";
import { SimLabCard } from "./SimLabCard";
import { PredictOutcomeCard } from "./PredictOutcomeCard";
import { EquationForgeCard } from "./EquationForgeCard";
import { NumericWorkbenchCard } from "./NumericWorkbenchCard";
import { ShiftCrisisCard } from "./ShiftCrisisCard";
import { RapidStatutorySwipeCard } from "./RapidStatutorySwipeCard";

export function StageRenderer({ stage, onMistake, onDone }: { stage: Stage; onMistake: (concept: string) => void; onDone: () => void }) {
  switch (stage.kind) {
    case "theory":
      return <TheoryBriefingCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "sim":
      return <SimLabCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "predict":
      return <PredictOutcomeCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "equation":
      return <EquationForgeCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "numeric":
      return <NumericWorkbenchCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "crisis":
      return <ShiftCrisisCard stage={stage} onMistake={onMistake} onDone={onDone} />;
    case "swipe":
      return <RapidStatutorySwipeCard stage={stage} onMistake={onMistake} onDone={onDone} />;
  }
}
