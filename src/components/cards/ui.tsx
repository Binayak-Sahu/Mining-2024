"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import type { StageKind } from "@/lib/types";
import { BookOpen, FlaskConical, Eye, Sigma, Calculator, Siren, Scale, CheckCircle2, XCircle } from "lucide-react";
import { sfx } from "@/lib/sfx";

export const STAGE_META: Record<StageKind, { label: string; short: string; color: string; Icon: typeof BookOpen }> = {
  theory: { label: "Stage 1 · Field Theory", short: "Field Theory", color: "#3B82F6", Icon: BookOpen },
  sim: { label: "Stage 2 · Intuition Lab", short: "Intuition Lab", color: "#10B981", Icon: FlaskConical },
  predict: { label: "Stage 2 · Predict the Outcome", short: "Predict", color: "#10B981", Icon: Eye },
  equation: { label: "Stage 3 · Equation Forge", short: "Equation Forge", color: "#8B5CF6", Icon: Sigma },
  numeric: { label: "Stage 4 · Quantitative Workbench", short: "Workbench", color: "#F59E0B", Icon: Calculator },
  crisis: { label: "Stage 5 · Shift Crisis", short: "Shift Crisis", color: "#EF4444", Icon: Siren },
  swipe: { label: "Stage 5 · Statutory Swipe", short: "Statutory Swipe", color: "#EF4444", Icon: Scale },
};

/**
 * Stage card shell. The optional footer is lifted into a thumb-zone action bar pinned to the bottom of
 * the viewport (Duolingo-style check/continue drawer); a spacer keeps content scrollable above it.
 */
export function CardFrame({ kind, title, children, footer }: { kind: StageKind; title: string; children: ReactNode; footer?: ReactNode }) {
  const m = STAGE_META[kind];
  return (
    <>
      <div className="card p-4 sm:p-7 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}55)` }} aria-hidden />
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em]" style={{ color: m.color, background: `${m.color}18` }}>
            <span className="inline-flex w-5 h-5 rounded-full items-center justify-center text-white" style={{ background: m.color }}>
              <m.Icon size={11} strokeWidth={2.6} />
            </span>
            {m.label}
          </span>
        </div>
        <h2 className="text-[22px] sm:text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] text-slate-900 mb-4 text-balance">{title}</h2>
        <div className="space-y-4">{children}</div>
      </div>
      <ActionBar>{footer}</ActionBar>
    </>
  );
}

/** Fixed bottom action drawer; animates in whenever its content appears. */
export function ActionBar({ children }: { children?: ReactNode }) {
  const has = !!children;
  return (
    <>
      <div className="h-28" aria-hidden />
      <AnimatePresence>
        {has && (
          <motion.div
            key="bar"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="action-bar fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-canvas/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
          >
            <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3">{children}</div>
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
    <button type="button" onClick={onClick} disabled={disabled} className={`btn-3d ${TONE[tone]} w-full px-4 py-3.5 text-[13px] sm:text-sm ${className}`}>
      <span className="inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

/** Inline verdict panel. Plays a chime / thud (and a haptic tick on phones) the moment it appears. */
export function Feedback({ show, ok, title, children }: { show: boolean; ok: boolean; title: string; children?: ReactNode }) {
  const played = useRef(false);
  useEffect(() => {
    if (show && !played.current) {
      played.current = true;
      if (ok) sfx.correct();
      else sfx.wrong();
    }
    if (!show) played.current = false;
  }, [show, ok]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`rounded-2xl p-3.5 sm:p-4 ${ok ? "bg-emerald-50 shadow-[inset_0_0_0_2px_#10B98155]" : "bg-red-50 shadow-[inset_0_0_0_2px_#EF444455]"}`}
        >
          <div className={`flex items-center gap-2 font-extrabold text-[15px] ${ok ? "text-emerald-700" : "text-red-700"}`}>
            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 14, delay: 0.05 }}>
              {ok ? <CheckCircle2 size={20} className="fill-emerald-500 text-white" /> : <XCircle size={20} className="fill-red-500 text-white" />}
            </motion.span>
            {title}
          </div>
          {children && <div className="text-[14px] text-slate-700 mt-1.5 leading-relaxed">{children}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Class for a chunky answer tile in one of four states. */
export function optionClass(state: "idle" | "right" | "wrong" | "dim"): string {
  const base = "tile-3d w-full text-left px-4 py-3 text-[14.5px] font-semibold leading-snug";
  if (state === "right") return `${base} !border-emerald-500 !bg-emerald-50 !shadow-[0_3px_0_#10B981] text-emerald-900`;
  if (state === "wrong") return `${base} !border-red-500 !bg-red-50 !shadow-[0_3px_0_#EF4444] text-red-900`;
  if (state === "dim") return `${base} opacity-45 text-slate-500`;
  return `${base} text-slate-800 hover:!border-blue-400`;
}

export function OptionKey({ i, state }: { i: number; state: "idle" | "right" | "wrong" | "dim" }) {
  const c = state === "right" ? "bg-emerald-500 text-white border-emerald-500" : state === "wrong" ? "bg-red-500 text-white border-red-500" : "text-slate-400 border-slate-200";
  return <span className={`readout mr-3 inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-lg border-2 text-[12px] font-extrabold align-middle ${c}`}>{String.fromCharCode(65 + i)}</span>;
}

export function Lines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <p key={i} className="text-[16px] leading-relaxed text-slate-700">
          {l}
        </p>
      ))}
    </div>
  );
}

export interface CardProps<S> {
  stage: S;
  onMistake: (concept: string) => void;
  onDone: () => void;
}
