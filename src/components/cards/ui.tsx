"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { StageKind } from "@/lib/types";
import { BookOpen, FlaskConical, Eye, Sigma, Wrench, Siren, Scale } from "lucide-react";
import { sfx } from "@/lib/sfx";
import { fadeQuick, feedbackSheet } from "@/lib/motion";

export const STAGE_META: Record<StageKind, { label: string; short: string; Icon: typeof BookOpen }> = {
  // Stage kinds are not colour-coded (§5.12: neutral eyebrow + icon).
  theory: { label: "Field theory", short: "Field Theory", Icon: BookOpen },
  sim: { label: "Intuition lab", short: "Intuition Lab", Icon: FlaskConical },
  predict: { label: "Predict the outcome", short: "Predict", Icon: Eye },
  equation: { label: "Equation forge", short: "Equation Forge", Icon: Sigma },
  numeric: { label: "Quantitative workbench", short: "Workbench", Icon: Wrench },
  crisis: { label: "Shift crisis", short: "Shift Crisis", Icon: Siren },
  swipe: { label: "Statutory swipe", short: "Statutory Swipe", Icon: Scale },
};

/**
 * Stage shell (DESIGN.md §1.1, §5.12): the stage sits directly on the canvas — a neutral stage-kind eyebrow with
 * its icon, the stage title (§3 `display`) and the content. The optional footer is lifted into the bottom action
 * bar (§5.1), which turns into the feedback sheet (§5.7) while a verdict is showing.
 */
export function CardFrame({ kind, title, children, footer, compact = false, footerKey }: { kind: StageKind; title: string; children: ReactNode; footer?: ReactNode; compact?: boolean; footerKey?: string }) {
  const m = STAGE_META[kind];
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, boolean>>({});
  const report = useCallback((id: string, ok: boolean | null) => {
    setVerdicts((v) => {
      if (ok === null) {
        if (!(id in v)) return v;
        const n = { ...v };
        delete n[id];
        return n;
      }
      return v[id] === ok ? v : { ...v, [id]: ok };
    });
  }, []);
  const ctx = useMemo(() => ({ el: slot, report }), [slot, report]);
  const shown = Object.values(verdicts);
  const tone = shown.length ? shown[shown.length - 1] : null;
  return (
    <FeedbackSlot.Provider value={ctx}>
      <section className="lesson-screen">
        <div className="t-eyebrow flex items-center gap-1.5">
          <m.Icon size={16} strokeWidth={2.4} aria-hidden />
          {m.label}
        </div>
        {compact ? <h2 className="sr-only">{title}</h2> : <h2 className="t-display text-fg mt-3 text-balance">{title}</h2>}
        <div className="mt-8 space-y-8">{children}</div>
      </section>
      <ActionBar slotRef={setSlot} force={tone !== null} verdict={tone} reserve={SHEET_RESERVE}>
        {footer && footerKey ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={footerKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fadeQuick}>
              {footer}
            </motion.div>
          </AnimatePresence>
        ) : (
          footer
        )}
      </ActionBar>
    </FeedbackSlot.Provider>
  );
}

/** Bottom space reserved up front in stage frames: a two-line verdict sheet with its button (§5.7: reserve the tallest footer state). */
const SHEET_RESERVE = 232;

/**
 * Fixed bottom footer (§4, §5.1): solid --bg, 16 px sides, 12 px top, 16 px + safe area bottom. While a verdict is
 * showing it becomes the §5.7 feedback sheet: a success / danger tint that rises over the footer (`feedbackSheet`),
 * radius 24 at the top. The spacer below the content only ever grows (the tallest state seen), so nothing above
 * moves when the sheet opens.
 */
export function ActionBar({ children, slotRef, force, verdict = null, reserve = 112 }: { children?: ReactNode; slotRef?: (el: HTMLElement | null) => void; force?: boolean; verdict?: boolean | null; /** minimum bottom space (px) */ reserve?: number }) {
  const reduce = useReducedMotion();
  const has = !!children || !!force;
  const bar = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(reserve);
  useEffect(() => {
    const el = bar.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setH((prev) => Math.max(prev, Math.ceil(el.getBoundingClientRect().height) + 16)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [has]);
  const sheet = verdict !== null;
  return (
    <>
      <div style={{ height: h }} aria-hidden />
      <AnimatePresence>
        {has && (
          <motion.div
            key="bar"
            ref={bar}
            initial={reduce ? { opacity: 0 } : { y: 120, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 120, opacity: 0 }}
            transition={reduce ? fadeQuick : feedbackSheet}
            data-sheet={sheet ? (verdict ? "ok" : "no") : undefined}
            className="action-bar fixed inset-x-0 bottom-0 z-30 bg-canvas"
          >
            <AnimatePresence>
              {sheet && (
                <motion.div
                  key={verdict ? "ok" : "no"}
                  aria-hidden
                  className={`absolute inset-0 rounded-t-[24px] ${verdict ? "bg-success-tint" : "bg-danger-tint"}`}
                  initial={reduce ? { opacity: 0 } : { y: "100%" }}
                  animate={reduce ? { opacity: 1 } : { y: 0 }}
                  exit={reduce ? { opacity: 0 } : { y: "100%" }}
                  transition={reduce ? fadeQuick : feedbackSheet}
                />
              )}
            </AnimatePresence>
            <div className={`relative max-w-[640px] mx-auto pb-[calc(16px+env(safe-area-inset-bottom))] ${sheet ? "px-5 sm:px-6 pt-5" : "px-4 pt-3"}`}>
              {slotRef && <div ref={slotRef} />}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const TONE: Record<string, string> = { ink: "tone-ink", safe: "tone-safe", crit: "tone-crit", tech: "tone-tech", hazard: "tone-hazard", violet: "tone-violet", ghost: "tone-ghost" };

/** §5.1 footer button: 56 px pill, full width. Tone by state: ink Continue · disabled Check · tech (action) Check / Start · safe Continue. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "ink" | "safe" | "crit" | "tech" | "hazard" | "violet" | "ghost";
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`btn-3d ${TONE[tone]} w-full ${className}`}>
      <span className="inline-flex items-center justify-center gap-2 text-center">{children}</span>
    </button>
  );
}

/** Slot inside the footer that Feedback verdicts portal into, and the verdict register that tints the footer. */
const FeedbackSlot = createContext<{ el: HTMLElement | null; report: (id: string, ok: boolean | null) => void } | null>(null);

/** Register a showing verdict with the enclosing footer so it becomes the success / danger sheet. */
function useVerdictTone(show: boolean, ok: boolean) {
  const ctx = useContext(FeedbackSlot);
  const id = useId();
  const report = ctx?.report;
  useEffect(() => {
    if (!report) return;
    report(id, show ? ok : null);
    return () => report(id, null);
  }, [report, id, show, ok]);
}

/** Plays the chime / thud once each time a verdict appears. */
function useVerdictSound(show: boolean, ok: boolean) {
  const played = useRef(false);
  useEffect(() => {
    if (show && !played.current) {
      played.current = true;
      if (ok) sfx.correct();
      else sfx.wrong();
    }
    if (!show) played.current = false;
  }, [show, ok]);
}

/**
 * §5.7 row 1: the verdict word (`title` 800, tint text) with a ghost "Why?" pill that opens the existing
 * explanation inside the sheet. Correct verdicts scale 0.9 → 1.
 */
function VerdictRow({ ok, title, why }: { ok: boolean; title: string; why?: ReactNode }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  return (
    <div role="status" aria-live="polite" className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <motion.div
          className={`t-title !font-extrabold min-w-0 ${ok ? "text-success-tint-text" : "text-danger-tint-text"}`}
          initial={ok && !reduce ? { scale: 0.9, opacity: 0 } : { opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduce ? fadeQuick : feedbackSheet}
          style={{ transformOrigin: "left center" }}
        >
          {title}
        </motion.div>
        {why && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn-3d btn-sm tone-ghost shrink-0">
            {open ? "Less" : "Why?"}
          </button>
        )}
      </div>
      {why && open && <div className="t-secondary !text-fg mt-3 max-h-[40vh] overflow-y-auto">{typeof why === "string" ? nb(why) : why}</div>}
    </div>
  );
}

/**
 * Verdict from inside a stage's content: portalled into the footer above its button, turning the footer into the
 * feedback sheet. The reason sits behind "Why?".
 */
export function Feedback({ show, ok, title, children }: { show: boolean; ok: boolean; title: string; children?: ReactNode; compact?: boolean }) {
  const ctx = useContext(FeedbackSlot);
  useVerdictSound(show, ok);
  useVerdictTone(show, ok);
  if (!show || !ctx?.el) return null;
  return createPortal(<VerdictRow ok={ok} title={title} why={children} />, ctx.el);
}

/** Class for a chunky answer tile (§5.2) in one of its states. */
export type OptionState = "idle" | "selected" | "right" | "wrong" | "dim";

export function optionClass(state: OptionState): string {
  const base = "tile-3d answer-tile w-full text-left";
  if (state === "right") return `${base} !border-success !bg-success-tint text-fg`;
  if (state === "wrong") return `${base} !border-danger !bg-danger-tint text-fg`;
  if (state === "dim") return `${base} !border-line text-fg-2`;
  if (state === "selected") return `${base} !border-action !bg-action-tint text-fg`;
  return `${base} text-fg`;
}

export function OptionKey({ i, state }: { i: number; state: OptionState }) {
  const c = state === "right" ? "bg-success text-white border-success" : state === "wrong" ? "bg-danger text-white border-danger" : state === "selected" ? "bg-action text-white border-action" : "text-fg-2 border-line-strong";
  return <span className={`readout mr-3 inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-lg border-2 text-[14px] font-extrabold align-middle ${c}`}>{String.fromCharCode(65 + i)}</span>;
}

/** Story copy: calm, full-width paragraphs on the canvas (no clamping), 16 px apart. */
export function Lines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-4">
      {lines.map((l, i) => (
        <p key={i} className="flow-body text-fg">
          {l}
        </p>
      ))}
    </div>
  );
}

export interface MistakeOpts {
  /** false = record the miss for spaced repetition but keep the heart (a kind retry). */
  heart?: boolean;
  /** ConceptFlow screen index: the miss is queued for review as that single screen (`lesson#stage@screen`). */
  screen?: number;
}

export interface CardProps<S> {
  stage: S;
  onMistake: (concept: string, opts?: MistakeOpts) => void;
  onDone: () => void;
  /** Fraction (0–1) of the current stage completed; fills the active lesson progress segment. Visual only. */
  onSubProgress?: (f: number) => void;
  /** Stable item key `${lessonId}#${stageIndex}` — seeds the balanced option order. */
  seed?: string;
  /** Warmup: render only this ConceptFlow screen (a per-screen review item). */
  screen?: number;
}

/** Keep "12 %"-style figures on one line (non-breaking space before the unit sign). */
export function nb(t: string): string {
  return t.replace(/(\d) %/g, "$1\u00a0%").replace(/(\d) (°C|ppm|MPa|m³)/g, "$1\u00a0$2");
}

/** Footer content for a verdict: the §5.7 sheet's verdict row (with "Why?") above its full-width button. */
export function VerdictBar({ ok, title, why, children }: { ok: boolean; title: string; why?: ReactNode; children: ReactNode }) {
  useVerdictSound(true, ok);
  useVerdictTone(true, ok);
  return (
    <div>
      <VerdictRow ok={ok} title={title} why={why} />
      {children}
    </div>
  );
}
