"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Briefcase, HardHat, Users, Bomb, Wind, Compass, ShieldCheck, ClipboardCheck, GraduationCap, type LucideIcon } from "lucide-react";
import type { SituationRole } from "@/lib/types";
import { nb } from "./ui";
import { feedbackSheet, tactilePress } from "@/lib/motion";

/** Icon per role. The badge is neutral (DESIGN.md §1.4: colour is reserved for meaning); the role reads from icon + label. */
export const ROLE_META: Record<SituationRole, { Icon: LucideIcon }> = {
  Manager: { Icon: Briefcase },
  Overman: { Icon: HardHat },
  Sirdar: { Icon: Users },
  Shotfirer: { Icon: Bomb },
  "Ventilation Officer": { Icon: Wind },
  Surveyor: { Icon: Compass },
  "Safety Officer": { Icon: ShieldCheck },
  "DGMS Inspector": { Icon: ClipboardCheck },
  "Exam candidate": { Icon: GraduationCap },
};

/**
 * Role-based situation header: who you are (neutral badge with the role icon), an optional focused sim,
 * the scene, and someone's claim in a speech bubble. Compact so the options stay above the fold.
 * Motion is transform-only (presets from src/lib/motion.ts), so the global MotionConfig (reducedMotion="user") turns it off.
 */
export function SituationHeader({ role, scene, claim, claimBy, visual }: { role: SituationRole; scene: string; claim?: string; claimBy?: string; visual?: ReactNode }) {
  const m = ROLE_META[role];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 bg-surface-2 t-label !font-bold text-fg">
          <motion.span className="inline-flex w-8 h-8 rounded-full items-center justify-center bg-surface text-fg border-2 border-line" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={tactilePress}>
            <m.Icon size={16} strokeWidth={2.4} aria-hidden />
          </motion.span>
          You are the {role}
        </span>
      </div>
      {visual}
      <p className="flow-body text-fg">{nb(scene)}</p>
      {claim && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...feedbackSheet, delay: 0.15 }} className="relative ml-3 rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3">
          <span className="absolute -top-2 left-3 w-4 h-4 rotate-45 bg-surface-2" aria-hidden />
          {claimBy && <div className="relative t-label text-fg-2 mb-0.5">{claimBy} says</div>}
          <p className="relative flow-body text-fg">“{nb(claim)}”</p>
        </motion.div>
      )}
      <p className="flow-q text-fg">What do you do?</p>
    </div>
  );
}
