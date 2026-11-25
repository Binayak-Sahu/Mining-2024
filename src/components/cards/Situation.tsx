"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Briefcase, HardHat, Users, Bomb, Wind, Compass, ShieldCheck, ClipboardCheck, GraduationCap, type LucideIcon } from "lucide-react";
import type { SituationRole } from "@/lib/types";
import { nb } from "./ui";

/** Icon + accent per role. `fill` (icon disc) keeps white glyphs ≥ 3:1; `text` pairs are AA on the tinted badge in both themes. */
export const ROLE_META: Record<SituationRole, { Icon: LucideIcon; tint: string; fill: string; text: string }> = {
  Manager: { Icon: Briefcase, tint: "#3B82F6", fill: "#2563EB", text: "text-blue-700 dark:text-blue-300" },
  Overman: { Icon: HardHat, tint: "#F59E0B", fill: "#B45309", text: "text-amber-800 dark:text-amber-300" },
  Sirdar: { Icon: Users, tint: "#F97316", fill: "#C2410C", text: "text-orange-700 dark:text-orange-300" },
  Shotfirer: { Icon: Bomb, tint: "#EF4444", fill: "#DC2626", text: "text-red-700 dark:text-red-300" },
  "Ventilation Officer": { Icon: Wind, tint: "#0EA5E9", fill: "#0369A1", text: "text-sky-700 dark:text-sky-300" },
  Surveyor: { Icon: Compass, tint: "#8B5CF6", fill: "#7C3AED", text: "text-violet-700 dark:text-violet-300" },
  "Safety Officer": { Icon: ShieldCheck, tint: "#10B981", fill: "#047857", text: "text-emerald-700 dark:text-emerald-300" },
  "DGMS Inspector": { Icon: ClipboardCheck, tint: "#475569", fill: "#475569", text: "text-slate-700" },
  "Exam candidate": { Icon: GraduationCap, tint: "#6366F1", fill: "#4F46E5", text: "text-indigo-700 dark:text-indigo-300" },
};

/**
 * Role-based situation header: who you are (badge with a springing role icon), an optional focused sim,
 * the scene, and someone's claim in a speech bubble. Compact so the options stay above the fold.
 * Motion is transform-only, so the global MotionConfig (reducedMotion="user") turns it off.
 */
export function SituationHeader({ role, scene, claim, claimBy, visual }: { role: SituationRole; scene: string; claim?: string; claimBy?: string; visual?: ReactNode }) {
  const m = ROLE_META[role];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-[14px] font-bold ${m.text}`} style={{ background: `${m.tint}1f` }}>
          <motion.span className="inline-flex w-8 h-8 rounded-full items-center justify-center text-white" style={{ background: m.fill }} initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
            <m.Icon size={16} strokeWidth={2.4} />
          </motion.span>
          You are the {role}
        </span>
      </div>
      {visual}
      <p className="flow-body text-slate-800">{nb(scene)}</p>
      {claim && (
        <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 30, delay: 0.15 }} className="relative ml-3 rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3">
          <span className="absolute -top-2 left-3 w-4 h-4 rotate-45 bg-slate-100" aria-hidden />
          {claimBy && <div className="relative text-[13px] font-bold text-slate-600 mb-0.5">{claimBy} says</div>}
          <p className="relative flow-body text-slate-900">“{nb(claim)}”</p>
        </motion.div>
      )}
      <p className="flow-q text-slate-900">What do you do?</p>
    </div>
  );
}
