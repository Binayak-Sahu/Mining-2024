"use client";

import { motion } from "framer-motion";
import { Calculator, Sigma, ChevronRight } from "lucide-react";
import type { Stage } from "@/lib/types";
import { PrimaryButton, ActionBar } from "./ui";

/**
 * Theory-first mode: an Equation / Numeric stage shown collapsed as optional "Bonus maths".
 * Doing it still earns XP (and its formula); skipping it never blocks lesson completion.
 */
export function BonusCard({ stage, onOpen, onSkip }: { stage: Stage; onOpen: () => void; onSkip: () => void }) {
  const eq = stage.kind === "equation";
  const Icon = eq ? Sigma : Calculator;
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 sm:p-8 relative overflow-hidden">
        <span className="t-eyebrow inline-flex items-center gap-1.5 py-0.5">
          <Icon size={16} strokeWidth={2.4} aria-hidden />
          Bonus maths · optional
        </span>
        <h2 className="text-[24px] sm:text-[30px] leading-[1.2] font-bold tracking-[-0.015em] text-slate-900 mt-4 text-balance">{stage.title}</h2>
        <p className="flow-body text-slate-700 mt-4">
          {eq ? "Build the governing equation from its proportionalities." : "A worked numerical, step by step."} Theory-first mode lets you finish the lesson without it. Doing it earns XP{eq ? " and files the formula" : ""}.
        </p>
        <button type="button" onClick={onOpen} className="mt-5 w-full min-h-[52px] rounded-2xl hairline px-4 flex items-center justify-between text-left text-[15px] font-semibold text-slate-800 hover:bg-slate-50">
          <span className="flex items-center gap-2">
            <Icon size={18} className="text-violet-600" /> Open the {eq ? "equation" : "numerical"}
          </span>
          <ChevronRight size={18} className="text-slate-400" />
        </button>
      </motion.div>
      <ActionBar>
        <PrimaryButton onClick={onSkip}>Skip for now</PrimaryButton>
      </ActionBar>
    </>
  );
}
