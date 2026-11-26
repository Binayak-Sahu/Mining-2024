"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fadeQuick, feedbackSheet } from "@/lib/motion";

/**
 * §5.7 feedback sheet, shown inside a phone-sized frame: it rises over the footer (y 100 % → 0, `feedbackSheet`).
 * The frame keeps a fixed height, so nothing above the footer moves when the sheet appears (§1.5).
 */
export function FeedbackSheet() {
  const reduce = useReducedMotion();
  const [verdict, setVerdict] = useState<"ok" | "no" | null>(null);
  const [why, setWhy] = useState(false);
  const open = (v: "ok" | "no") => {
    setWhy(false);
    setVerdict(v);
  };
  const ok = verdict === "ok";
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <button type="button" onClick={() => open("ok")} className="btn-3d btn-sm tone-ghost">
          Show correct
        </button>
        <button type="button" onClick={() => open("no")} className="btn-3d btn-sm tone-ghost">
          Show wrong
        </button>
      </div>
      <div className="relative overflow-hidden rounded-[20px] h-[420px]" style={{ border: "2px solid var(--line)", background: "var(--bg)" }}>
        <div className="p-5">
          <p className="t-body">A roof test reads 3 % methane in clean air. What is the best reading of that?</p>
          <div data-state={verdict === "ok" ? "correct" : verdict === "no" ? "wrong" : "selected"} className="tile-3d mt-4" style={{ fontSize: 18, lineHeight: "28px" }}>
            It can&apos;t ignite, but the margin is thin
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pt-3 pb-4">
          <button type="button" onClick={() => open("ok")} className="btn-3d tone-tech w-full">
            Check
          </button>
        </div>
        <AnimatePresence>
          {verdict && (
            <motion.div
              key={verdict}
              role="status"
              data-ok={ok}
              initial={reduce ? { opacity: 0 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={reduce ? fadeQuick : feedbackSheet}
              className="ds-sheet absolute inset-x-0 bottom-0"
            >
              <div className="flex items-center justify-between gap-3">
                <motion.div
                  className="t-title"
                  style={{ fontWeight: 800, color: ok ? "var(--success-tint-text)" : "var(--danger-tint-text)" }}
                  initial={ok && !reduce ? { scale: 0.9 } : false}
                  animate={{ scale: 1 }}
                  transition={reduce ? fadeQuick : feedbackSheet}
                >
                  {ok ? "Correct!" : "Not quite"}
                </motion.div>
                <button type="button" onClick={() => setWhy((w) => !w)} aria-expanded={why} className="btn-3d btn-sm tone-ghost shrink-0">
                  Why?
                </button>
              </div>
              {why && (
                <p className="t-secondary mt-3" style={{ color: "var(--text)" }}>
                  {ok ? "Below the 5 % lower limit it cannot ignite, but mines need a wide margin below that limit." : "3 % is below the 5 % lower limit, so by itself it cannot ignite."}
                </p>
              )}
              <button type="button" onClick={() => setVerdict(null)} className={`btn-3d ${ok ? "tone-safe" : "tone-ink"} w-full mt-4`}>
                {ok ? "Continue" : "Try again"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
