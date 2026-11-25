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

export interface StageRendererProps {
  stage: Stage;
  onMistake: (concept: string, opts?: MistakeOpts) => void;
  onDone: () => void;
  onSubProgress?: (f: number) => void;
  /** `${lessonId}#${stageIndex}` — seeds balanced option order and per-screen review keys. */
  seed?: string;
  /** Warmup: show only this ConceptFlow screen. */
  screen?: number;
}

export function StageRenderer({ stage, onMistake, onDone, onSubProgress, seed, screen }: StageRendererProps) {
  const common = { onMistake, onDone, onSubProgress, seed };
  switch (stage.kind) {
    case "theory":
      return <TheoryBriefingCard stage={stage} {...common} screen={screen} />;
    case "sim":
      return <SimLabCard stage={stage} {...common} />;
    case "predict":
      return <PredictOutcomeCard stage={stage} {...common} />;
    case "equation":
      return <EquationForgeCard stage={stage} {...common} />;
    case "numeric":
      return <NumericWorkbenchCard stage={stage} {...common} />;
    case "crisis":
      return <ShiftCrisisCard stage={stage} {...common} />;
    case "swipe":
      return <RapidStatutorySwipeCard stage={stage} {...common} />;
  }
}
