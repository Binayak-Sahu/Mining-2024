"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Check, Crown, Play } from "lucide-react";
import { getUnit } from "@/content";
import { useStrata } from "@/lib/store";
import { lessonUnlocked, bossUnlocked } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { STAGE_META } from "@/components/cards/ui";
import type { Lesson } from "@/lib/types";

function StageDots({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex gap-1 mt-1.5">
      {lesson.stages.map((s, i) => {
        const M = STAGE_META[s.kind];
        return (
          <span key={i} title={M.label} className="inline-flex w-5 h-5 rounded items-center justify-center" style={{ background: `${M.color}22` }}>
            <M.Icon size={11} color={M.color} />
          </span>
        );
      })}
    </div>
  );
}

export function UnitMap({ unitId }: { unitId: string }) {
  const hydrated = useHydrated();
  const unit = getUnit(unitId);
  const s = useStrata();
  if (!unit) return <div className="p-6">Unit not found.</div>;
  const done = hydrated ? s.lessons : {};
  const free = hydrated && s.freeRoam;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white">
        <ArrowLeft size={14} /> Campaign
      </Link>
      <div className="mt-3 mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-400">Unit {unit.n}</div>
        <h1 className="text-3xl font-extrabold tracking-tight">{unit.title}</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-xl">{unit.blurb}</p>
      </div>

      <div className="relative">
        {unit.lessons.map((l, i) => {
          const open = lessonUnlocked(unit, i, done, free);
          const complete = !!done[l.id];
          const offset = [0, 48, 72, 48, 0, -48, -72, -48][i % 8];
          return (
            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex justify-center mb-4">
              <div style={{ transform: `translateX(${offset}px)` }} className="w-full max-w-sm">
                {open ? (
                  <Link href={`/lesson/${l.id}`} className={`card p-4 flex items-start gap-3 hover:ring-2 ${complete ? "ring-emerald-500" : "ring-blue-500"}`}>
                    <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${complete ? "bg-emerald-500" : "bg-blue-500"} text-white shadow-[0_3px_0_rgba(0,0,0,0.25)]`}>
                      {complete ? <Check size={20} /> : <Play size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lesson {unit.n}.{i + 1}</div>
                      <div className="font-bold leading-tight">{l.title}</div>
                      <div className="text-xs text-slate-500">{l.subtitle}</div>
                      <StageDots lesson={l} />
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-start gap-3 text-slate-500">
                    <div className="shrink-0 w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider">Lesson {unit.n}.{i + 1}</div>
                      <div className="font-bold leading-tight text-slate-400">{l.title}</div>
                      <div className="text-xs">Complete the previous lesson to unlock</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {(() => {
          const open = bossUnlocked(unit, done, free);
          const complete = !!done[unit.boss.id];
          return (
            <div className="flex justify-center mt-6">
              {open ? (
                <Link href={`/lesson/${unit.boss.id}`} className="w-full max-w-sm rounded-2xl p-5 bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-2xl hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-3">
                    <Crown size={32} />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-100">Unit Boss Exam {complete && "· Cleared"}</div>
                      <div className="font-extrabold text-lg leading-tight">{unit.boss.title}</div>
                      <div className="text-xs text-red-50">{unit.boss.subtitle}</div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="w-full max-w-sm rounded-2xl p-5 border-2 border-dashed border-slate-700 text-slate-500 flex items-center gap-3">
                  <Crown size={28} />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">Unit Boss Exam</div>
                    <div className="font-bold">{unit.boss.title}</div>
                    <div className="text-xs">Master every lesson in this unit to unlock</div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
