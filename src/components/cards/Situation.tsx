"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Briefcase, HardHat, Users, Bomb, Wind, Compass, ShieldCheck, ClipboardCheck, GraduationCap, type LucideIcon } from "lucide-react";
import type { SituationRole } from "@/lib/types";

/** Icon + accent per role. Accents are AA-safe on their tinted badge in both themes. */
export const ROLE_META: Record<SituationRole, { Icon: LucideIcon; tint: string; text: string }> = {
  Manager: { Icon: Briefcase, tint: "#3B82F6", text: "text-blue-700" },
  Overman: { Icon: HardHat, tint: "#F59E0B", text: "text-amber-800" },
  Sirdar: { Icon: Users, tint: "#F97316", text: "text-orange-700" },
  Shotfirer: { Icon: Bomb, tint: "#EF4444", text: "text-red-700" },
  "Ventilation Officer": { Icon: Wind, tint: "#0EA5E9", text: "text-sky-700" },
  Surveyor: { Icon: Compass, tint: "#8B5CF6", text: "text-violet-700" },
  "Safety Officer": { Icon: ShieldCheck, tint: "#10B981", text: "text-emerald-700" },
  "DGMS Inspector": { Icon: ClipboardCheck, tint: "#475569", text: "text-slate-700" },
  "Exam candidate": { Icon: GraduationCap, tint: "#6366F1", text: "text-indigo-700" },
};

/**
 * Role-based situation header: who you are, the scene as a short vignette (a focused sim when one fits,
 * otherwise an illustrated role card with gentle motion), and someone's claim in a speech bubble.
 * Motion is transform-only, so the global MotionConfig (reducedMotion="user") turns it off.
 */
export function SituationHeader({ role, scene, claim, claimBy, visual }: { role: SituationRole; scene: string; claim?: string; claimBy?: string; visual?: ReactNode }) {
  const m = ROLE_META[role];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-[14px] font-bold ${m.text}`} style={{ background: `${m.tint}1f` }}>
          <span className="inline-flex w-7 h-7 rounded-full items-center justify-center text-white" style={{ background: m.tint }}>
            <m.Icon size={15} strokeWidth={2.4} />
          </span>
          You are the {role}
        </span>
      </div>
      {visual ?? (
        <div className="relative overflow-hidden rounded-2xl h-[92px] hairline" style={{ background: `linear-gradient(135deg, ${m.tint}26, ${m.tint}08 60%)` }} aria-hidden>
          <motion.span className="absolute -right-3 -bottom-4 opacity-25" style={{ color: m.tint }} animate={{ y: [0, -5, 0], rotate: [0, -3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
            <m.Icon size={104} strokeWidth={1.6} />
          </motion.span>
          <motion.span className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-[0_3px_0_rgba(15,23,42,0.2)]" style={{ background: m.tint }} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 22 }}>
            <m.Icon size={24} strokeWidth={2.2} />
          </motion.span>
          <span className="absolute left-20 top-1/2 -translate-y-1/2 right-16 h-2 rounded-full bg-slate-900/10" />
        </div>
      )}
      <p className="flow-body text-slate-800">{scene}</p>
      {claim && (
        <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 30, delay: 0.15 }} className="relative ml-3 rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3">
          <span className="absolute -top-2 left-3 w-4 h-4 rotate-45 bg-slate-100" aria-hidden />
          {claimBy && <div className="relative text-[13px] font-bold text-slate-600 mb-0.5">{claimBy} says</div>}
          <p className="relative flow-body text-slate-900">“{claim}”</p>
        </motion.div>
      )}
      <p className="flow-q text-slate-900">What do you do?</p>
    </div>
  );
}
