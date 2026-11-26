"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { StageKind } from "@/lib/types";
import { BookOpen, FlaskConical, Eye, Sigma, Calculator, Siren, Scale, CheckCircle2, XCircle } from "lucide-react";
import { sfx } from "@/lib/sfx";

export const STAGE_META: Record<StageKind, { label: string; short: string; color: string; text: string; Icon: typeof BookOpen }> = {
  theory: { label: "Field theory", short: "Field Theory", color: "#3B82F6", text: "text-blue-700", Icon: BookOpen },
  sim: { label: "Intuition lab", short: "Intuition Lab", color: "#10B981", text: "text-emerald-700", Icon: FlaskConical },
  predict: { label: "Predict the outcome", short: "Predict", color: "#10B981", text: "text-emerald-700", Icon: Eye },
  equation: { label: "Equation forge", short: "Equation Forge", color: "#8B5CF6", text: "text-violet-600", Icon: Sigma },
  numeric: { label: "Quantitative workbench", short: "Workbench", color: "#F59E0B", text: "text-amber-700", Icon: Calculator },
  crisis: { label: "Shift crisis", short: "Shift Crisis", color: "#EF4444", text: "text-red-700", Icon: Siren },
  swipe: { label: "Statutory swipe", short: "Statutory Swipe", color: "#EF4444", text: "text-red-700", Icon: Scale },
};

/**
 * Stage card shell. The optional footer is lifted into a thumb-zone action bar pinned to the bottom of
 * the viewport (Duolingo-style check/continue drawer); a spacer keeps content scrollable above it.
 */
export function CardFrame({ kind, title, children, footer, compact = false, footerKey }: { kind: StageKind; title: string; children: ReactNode; footer?: ReactNode; compact?: boolean; footerKey?: string }) {
  const m = STAGE_META[kind];
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [fb, setFb] = useState(0);
  const bump = useCallback((d: number) => setFb((n) => n + d), []);
  const ctx = useMemo(() => ({ el: slot, bump }), [slot, bump]);
  return (
    <FeedbackSlot.Provider value={ctx}>
      <div className="card p-5 sm:p-8 overflow-clip relative">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}55)` }} aria-hidden />
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 sm:py-1 text-[12.5px] font-bold ${m.text}`} style={{ background: `${m.color}18` }}>
            <span className="inline-flex w-5 h-5 rounded-full items-center justify-center text-white" style={{ background: m.color }}>
              <m.Icon size={11} strokeWidth={2.6} />
            </span>
            {m.label}
          </span>
        </div>
        {compact ? (
          <h2 className="sr-only">{title}</h2>
        ) : (
          <h2 className="text-[24px] sm:text-[30px] leading-[1.2] font-bold tracking-[-0.015em] text-slate-900 mb-5 sm:mb-6 text-balance">{title}</h2>
        )}
        <div className="space-y-5 sm:space-y-6">{children}</div>
      </div>
      <ActionBar slotRef={setSlot} force={fb > 0}>
        {footer && footerKey ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={footerKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}>
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

/** Fixed bottom action drawer; animates in whenever its content appears. */
export function ActionBar({ children, slotRef, force }: { children?: ReactNode; slotRef?: (el: HTMLElement | null) => void; force?: boolean }) {
  const has = !!children || !!force;
  const bar = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(112);
  useEffect(() => {
    const el = bar.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setH(Math.max(112, Math.ceil(el.getBoundingClientRect().height) + 16)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [has]);
  return (
    <>
      <div style={{ height: h }} aria-hidden />
      <AnimatePresence>
        {has && (
          <motion.div
            key="bar"
            ref={bar}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="action-bar fixed inset-x-0 bottom-0 z-30 hairline-t surface-sticky pb-[env(safe-area-inset-bottom)]"
          >
            <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3">
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
    <button type="button" onClick={onClick} disabled={disabled} className={`btn-3d ${TONE[tone]} w-full px-4 py-3.5 min-h-[52px] ${className}`}>
      <span className="inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

/** Slot inside the card's bottom action bar that Feedback verdicts portal into. */
const FeedbackSlot = createContext<{ el: HTMLElement | null; bump: (d: number) => void } | null>(null);

/**
 * Verdict, shown as a tinted state of the bottom action bar (no inline panel, no scroll hacks): the
 * verdict, a short reason (expandable with "Why?") and the bar's own action underneath. Plays a chime /
 * thud once when it appears.
 */
export function Feedback({ show, ok, title, children, compact = false }: { show: boolean; ok: boolean; title: string; children?: ReactNode; /** one-line verdict; the reason only on "Why?" */ compact?: boolean }) {
  const ctx = useContext(FeedbackSlot);
  const played = useRef(false);
  const [open, setOpen] = useState(false);
  const txt = useRef<HTMLDivElement>(null);
  const [short, setShort] = useState(true);
  const bump = ctx?.bump;
  // Only offer "Why?" when the reason is longer than the two-line strip.
  useEffect(() => {
    const el = txt.current;
    if (!show || !el) return;
    setShort((el.textContent ?? "").length < 120);
  }, [show, ctx?.el]);
  useEffect(() => {
    if (show && !played.current) {
      played.current = true;
      if (ok) sfx.correct();
      else sfx.wrong();
    }
    if (!show) {
      played.current = false;
      setOpen(false);
    }
  }, [show, ok]);
  useEffect(() => {
    if (!show || !bump) return;
    bump(1);
    return () => bump(-1);
  }, [show, bump]);
  if (!show || !ctx?.el) return null;
  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      role="status"
      aria-live="polite"
      className={`-mx-3 sm:-mx-4 -mt-3 mb-3 px-4 sm:px-5 pt-3.5 pb-3 ${ok ? "verdict-ok" : "verdict-no"}`}
    >
      <div className={`flex items-center gap-2 font-bold text-[17px] ${ok ? "text-emerald-800" : "text-amber-800"}`}>
        <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 14, delay: 0.05 }}>
          {ok ? <CheckCircle2 size={22} className="fill-emerald-500 text-white" /> : <XCircle size={22} className="fill-amber-500 text-white" />}
        </motion.span>
        <span className="flex-1 min-w-0">{title}</span>
        {children && (compact || !short) && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="shrink-0 min-h-[44px] -my-2 px-2 text-[14px] font-semibold text-slate-700 hover:text-slate-900">
            {open ? "Less" : "Why?"}
          </button>
        )}
      </div>
      {children && (!compact || open) && <div ref={txt} className={`text-[15px] leading-[1.5] text-slate-700 mt-1 ${open || short ? "max-h-[40vh] overflow-y-auto" : "line-clamp-2"}`}>{children}</div>}
    </motion.div>,
    ctx.el,
  );
}

/** Class for a chunky answer tile in one of four states. */
export type OptionState = "idle" | "selected" | "right" | "wrong" | "dim";

export function optionClass(state: OptionState): string {
  const base = "tile-3d w-full text-left px-4 py-3 text-[14.5px] font-semibold leading-snug";
  if (state === "right") return `${base} !border-emerald-500 !bg-emerald-50 !shadow-[0_3px_0_#10B981] text-emerald-900`;
  if (state === "wrong") return `${base} !border-red-500 !bg-red-50 !shadow-[0_3px_0_#EF4444] text-red-900`;
  if (state === "dim") return `${base} !shadow-none !border-slate-100 text-slate-500`;
  if (state === "selected") return `${base} !border-blue-500 !bg-blue-50 !shadow-[0_3px_0_#3B82F6] text-slate-900`;
  return `${base} text-slate-800 hover:!border-blue-400`;
}

export function OptionKey({ i, state }: { i: number; state: OptionState }) {
  const c = state === "right" ? "bg-[#047857] text-white border-[#047857]" : state === "wrong" ? "bg-[#B91C1C] text-white border-[#B91C1C]" : state === "selected" ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "text-slate-500 border-slate-200";
  return <span className={`readout mr-3 inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-lg border-2 text-[12px] font-extrabold align-middle ${c}`}>{String.fromCharCode(65 + i)}</span>;
}

/** Story copy: calm, full-width paragraphs (no clamping). */
export function Lines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-3">
      {lines.map((l, i) => (
        <p key={i} className="flow-body text-slate-700">
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

/**
 * Verdict state of the bottom action bar (Brilliant-style): a tinted strip with the verdict, a short
 * reason and the next action. Plays the chime / thud once when it appears.
 */
/** Keep "12 %"-style figures on one line (non-breaking space before the unit sign). */
export function nb(t: string): string {
  return t.replace(/(\d) %/g, "$1\u00a0%").replace(/(\d) (°C|ppm|MPa|m³)/g, "$1\u00a0$2");
}

export function VerdictBar({ ok, title, why, children }: { ok: boolean; title: string; why?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (ok) sfx.correct();
    else sfx.wrong();
  }, [ok, title]);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} className="space-y-3" role="status" aria-live="polite">
      <div className={`-mx-3 sm:-mx-4 -mt-3 px-4 sm:px-5 pt-3.5 pb-1 ${ok ? "verdict-ok" : "verdict-no"}`}>
        <div className={`flex items-center gap-2 font-bold text-[17px] ${ok ? "text-emerald-800" : "text-amber-800"}`}>
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 14, delay: 0.05 }}>
            {ok ? <CheckCircle2 size={22} className="fill-emerald-500 text-white" /> : <XCircle size={22} className="fill-amber-500 text-white" />}
          </motion.span>
          {title}
        </div>
        {why && <div className="text-[15px] leading-[1.5] text-slate-700 mt-1 max-h-[32vh] overflow-y-auto">{typeof why === "string" ? nb(why) : why}</div>}
      </div>
      {children}
    </motion.div>
  );
}
