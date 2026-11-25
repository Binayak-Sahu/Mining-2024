"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";

/** App-wide providers: framer-motion honours prefers-reduced-motion (springs → fades); Radix tooltips. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Tooltip.Provider delayDuration={300}>{children}</Tooltip.Provider>
    </MotionConfig>
  );
}
