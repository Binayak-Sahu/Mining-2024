"use client";

import { motion } from "framer-motion";
import { Calculator, Sigma, ChevronRight } from "lucide-react";
import type { Stage } from "@/lib/types";
import { PrimaryButton, ActionBar } from "./ui";
import { fadeQuick } from "@/lib/motion";

/**
 * Theory-first mode: an Equation / Numeric stage shown collapsed as optional "Bonus maths".
 * Doing it still earns XP (and its formula); skipping it never blocks lesson completion.
 */
export function BonusCard({ stage, onOpen, onSkip }: { stage: Stage; onOpen: () => void; onSkip: () => void }) {
  const eq = stage.kind === "equation";
  const Icon = eq ? Sigma : Calculator;
  return (
    <>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fadeQuick} className="lesson-screen">
        <span className="t-eyebrow inline-flex items-center gap-1.5 py-0.5">
          <Icon size={16} strokeWidth={2.4} aria-hidden />
          Bonus maths · optional
        </span>
        <h2 className="t-display text-fg mt-3 text-balance">{stage.title}</h2>
        <p className="flow-body text-fg mt-8">
          {eq ? "Build the governing equation from its proportionalities." : "A worked numerical, step by step."} Theory-first mode lets you finish the lesson without it. Doing it earns XP{eq ? " and files the formula" : ""}.
        </p>
        <button type="button" onClick={onOpen} className="mt-8 tile-3d w-full min-h-[56px] px-5 flex items-center justify-between text-left text-[18px] font-semibold text-fg">
          <span className="flex items-center gap-2">
            <Icon size={20} className="text-action-tint-text" aria-hidden /> Open the {eq ? "equation" : "numerical"}
          </span>
          <ChevronRight size={20} className="text-fg-3" aria-hidden />
        </button>
      </motion.section>
      <ActionBar>
        <PrimaryButton onClick={onSkip}>Skip for now</PrimaryButton>
      </ActionBar>
    </>
  );
}
