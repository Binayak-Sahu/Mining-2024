"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, MoreHorizontal, X } from "lucide-react";
import { fadeQuick, stageSlide } from "@/lib/motion";

const STAGES = 5;

/** §5.6 lesson top bar: X, one notched progress bar (finished sections are tappable), ⋯ with notes dot, hearts pill. */
export function LessonTopBar({ inspector = false }: { inspector?: boolean }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(2);
  const [sub, setSub] = useState(0.4);
  const [recap, setRecap] = useState<number | null>(null);
  const fill = Math.min(1, (index + sub) / STAGES);
  const advance = () => {
    setRecap(null);
    if (index >= STAGES) {
      setIndex(0);
      setSub(0);
    } else if (sub >= 0.8) {
      setIndex((i) => i + 1);
      setSub(0);
    } else setSub((s) => s + 0.4);
  };
  return (
    <div>
      <div className="flex items-center gap-2 h-14" style={{ background: "var(--bg)" }}>
        <button type="button" aria-label="Exit lesson" className="ds-focus w-11 h-11 -ml-2 shrink-0 flex items-center justify-center rounded-full" style={{ color: "var(--text-2)" }}>
          <X size={24} />
        </button>
        <div className="relative flex-1 min-w-0" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={STAGES} aria-valuenow={index}>
          <div className="ds-progress">
            <motion.div className="ds-progress-fill" initial={false} animate={{ width: `${fill * 100}%` }} transition={reduce ? fadeQuick : stageSlide} />
            {Array.from({ length: STAGES - 1 }, (_, i) => (
              <span key={i} className="ds-progress-notch" style={{ left: `${((i + 1) / STAGES) * 100}%` }} aria-hidden />
            ))}
          </div>
          {/* ≥ 44 px tall invisible hit areas over each finished section */}
          {Array.from({ length: Math.min(index, STAGES) }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Re-read stage ${i + 1}`}
              onClick={() => setRecap(i)}
              className="ds-focus absolute top-1/2 -translate-y-1/2 h-11"
              style={{ left: `${(i / STAGES) * 100}%`, width: `${100 / STAGES}%` }}
            />
          ))}
        </div>
        <button type="button" aria-label="More: notes, Inspector, sources (1 new note)" className="ds-focus relative w-11 h-11 shrink-0 flex items-center justify-center rounded-full" style={{ color: "var(--text-2)" }}>
          <MoreHorizontal size={24} />
          <span aria-hidden className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "var(--action)" }} />
        </button>
        <div className="shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-full" style={{ background: "var(--surface-2)" }} aria-label="3 hearts">
          <Heart size={20} fill="var(--danger)" stroke="var(--danger)" aria-hidden />
          <span className="t-label" style={{ fontWeight: 700 }}>
            3
          </span>
        </div>
      </div>
      {inspector && (
        <div className="t-label -mx-5 px-5 py-2" style={{ background: "var(--energy-tint)", color: "var(--energy-tint-text)" }}>
          Inspector mode: this run is a sandbox
        </div>
      )}
      {!inspector && (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button type="button" onClick={advance} className="btn-3d btn-sm tone-ghost">
            Advance progress
          </button>
          <span className="t-secondary" aria-live="polite">
            {recap !== null ? `Recap of stage ${recap + 1} would open` : "Tap a finished section to re-read it"}
          </span>
        </div>
      )}
    </div>
  );
}
