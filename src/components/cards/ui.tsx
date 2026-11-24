"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import type { StageKind } from "@/lib/types";
import { BookOpen, FlaskConical, Eye, Sigma, Calculator, Siren, Scale, CheckCircle2, XCircle } from "lucide-react";

export const STAGE_META: Record<StageKind, { label: string; color: string; Icon: typeof BookOpen }> = {
  theory: { label: "Stage 1 · Field Theory", color: "#3B82F6", Icon: BookOpen },
  sim: { label: "Stage 2 · Intuition Lab", color: "#10B981", Icon: FlaskConical },
  predict: { label: "Stage 2 · Predict the Outcome", color: "#10B981", Icon: Eye },
  equation: { label: "Stage 3 · Equation Forge", color: "#8B5CF6", Icon: Sigma },
  numeric: { label: "Stage 4 · Quantitative Workbench", color: "#F59E0B", Icon: Calculator },
  crisis: { label: "Stage 5 · Shift Crisis", color: "#EF4444", Icon: Siren },
  swipe: { label: "Stage 5 · Statutory Swipe", color: "#EF4444", Icon: Scale },
};

export function CardFrame({ kind, title, children, footer }: { kind: StageKind; title: string; children: ReactNode; footer?: ReactNode }) {
  const m = STAGE_META[kind];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="card p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <m.Icon size={14} color={m.color} />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: m.color }}>
          {m.label}
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mb-3">{title}</h2>
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-5">{footer}</div>}
    </motion.div>
  );
}

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
  tone?: "ink" | "safe" | "crit" | "tech";
  className?: string;
}) {
  const bg = { ink: "bg-slate-900 hover:bg-slate-800", safe: "bg-emerald-500 hover:bg-emerald-600", crit: "bg-red-500 hover:bg-red-600", tech: "bg-blue-500 hover:bg-blue-600" }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-press w-full rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_3px_0_rgba(0,0,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed ${bg} ${className}`}
    >
      {children}
    </button>
  );
}

export function Feedback({ show, ok, title, children }: { show: boolean; ok: boolean; title: string; children?: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`rounded-xl border-2 p-3 ${ok ? "border-emerald-500 bg-emerald-50" : "border-red-500 bg-red-50"}`}
        >
          <div className={`flex items-center gap-2 font-bold text-sm ${ok ? "text-emerald-700" : "text-red-700"}`}>
            {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {title}
          </div>
          {children && <div className="text-sm text-slate-700 mt-1 leading-snug">{children}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Lines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => (
        <p key={i} className="text-[15px] leading-snug text-slate-800">
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
