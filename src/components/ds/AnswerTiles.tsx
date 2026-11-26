"use client";

import { useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { fadeQuick, tactilePress } from "@/lib/motion";

const STATES = [
  ["idle", "Idle"],
  ["selected", "Selected"],
  ["correct", "Correct after check"],
  ["wrong", "Wrong after check"],
] as const;

const WORDS = ["5 %", "15 %", "9.5 %", "25 %"];

/** §5.2 answer tiles in every state, and a word-bank well filling a blank in a sentence. */
export function AnswerTiles() {
  const reduce = useReducedMotion();
  const [placed, setPlaced] = useState<string | null>(null);
  return (
    <div className="space-y-8">
      <ul className="grid gap-3">
        {STATES.map(([state, label]) => (
          <li key={state}>
            <div className="t-label mb-2" style={{ color: "var(--text-2)" }}>
              {label}
            </div>
            <div data-state={state} className="tile-3d">
              Yes, on its way down to 1 %
            </div>
          </li>
        ))}
      </ul>
      <LayoutGroup>
        <div>
          <div className="t-label mb-3" style={{ color: "var(--text-2)" }}>
            Word bank: tap a chip to fill the blank, tap the blank to clear it
          </div>
          <p className="t-body-lg">
            Methane in air can explode between 5 % and{" "}
            <button type="button" aria-label={placed ? `Blank: ${placed}. Tap to clear` : "Empty blank"} onClick={() => setPlaced(null)} className="ds-blank ds-focus align-middle" data-filled={placed ? "true" : undefined}>
              {placed && (
                <motion.span layoutId={`chip-${placed}`} transition={reduce ? fadeQuick : tactilePress} className="tile-3d tile-chip" style={{ padding: "4px 12px", lineHeight: "32px" }}>
                  {placed}
                </motion.span>
              )}
            </button>{" "}
            methane.
          </p>
          <div className="ds-well mt-6">
            {WORDS.map((w) =>
              placed === w ? (
                <span key={w} aria-hidden className="tile-3d tile-chip invisible">
                  {w}
                </span>
              ) : (
                <motion.button key={w} layoutId={`chip-${w}`} transition={reduce ? fadeQuick : tactilePress} type="button" onClick={() => setPlaced(w)} className="tile-3d tile-chip">
                  {w}
                </motion.button>
              ),
            )}
          </div>
        </div>
      </LayoutGroup>
    </div>
  );
}
