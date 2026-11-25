"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Check, Crown, Play } from "lucide-react";
import { getUnit } from "@/content";
import { useStrata } from "@/lib/store";
import { lessonUnlocked, bossUnlocked, unitProgress } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs } from "@/lib/prefs";
import { STAGE_META } from "@/components/cards/ui";
import type { Lesson } from "@/lib/types";
import { ExpeditionPath, ProgressRing } from "./ExpeditionPath";
import { stratumFor } from "./strata";

function StageDots({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {lesson.stages.map((s, i) => {
        const M = STAGE_META[s.kind];
        return (
          <span key={i} title={M.label} className="inline-flex w-6 h-6 rounded-lg items-center justify-center" style={{ background: `${M.color}1f` }}>
            <M.Icon size={12} color={M.color} strokeWidth={2.4} />
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
  const masterPref = usePrefs((p) => p.masterUnlock);
  if (!unit) return <div className="p-6">Unit not found.</div>;
  const done = hydrated ? s.lessons : {};
  const free = hydrated && s.freeRoam;
  const master = hydrated && masterPref;
  const st = stratumFor(unit.n);
  const f = unitProgress(unit, done);

  let currentId: string | null = null;
  const i0 = unit.lessons.findIndex((l, k) => !done[l.id] && lessonUnlocked(unit, k, done, free));
  if (i0 >= 0) currentId = unit.lessons[i0].id;
  else if (!done[unit.boss.id] && bossUnlocked(unit, done, free)) currentId = unit.boss.id;

  const all = [...unit.lessons.map((l, i) => ({ l, i, boss: false })), { l: unit.boss, i: unit.lessons.length, boss: true }];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 min-h-[44px] text-[13px] font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Expedition
      </Link>

      <div
        className="mt-2 rounded-[28px] p-5 sm:p-7 flex items-center gap-4 sm:gap-6"
        style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${st.tint} 45%, var(--surface)), color-mix(in oklab, ${st.tint} 12%, var(--surface)))`, boxShadow: "var(--shadow-card)" }}
      >
        <ProgressRing f={f} size={84} color={st.accent} width={7}>
          <span className="readout text-xl font-extrabold text-slate-900">{Math.round(f * 100)}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em]" style={{ color: st.accent }}>
            Unit {unit.n} · {st.name} · <span className="readout normal-case">{st.depth}</span>
          </div>
          <h1 className="text-[24px] sm:text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-slate-900 mt-1 text-balance">{unit.title}</h1>
          <p className="text-slate-600 text-[13.5px] mt-1.5 max-w-2xl">{unit.blurb}</p>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        <ExpeditionPath unit={unit} done={done} freeRoam={free} currentId={currentId} header={false} master={master} />

        <div className="space-y-3">
          <h2 className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-slate-500 px-1">Shift briefings</h2>
          {all.map(({ l, i, boss }) => {
            const genuine = boss ? bossUnlocked(unit, done, free) : lessonUnlocked(unit, i, done, free);
            const open = genuine || master;
            const inspect = open && !genuine;
            const complete = !!done[l.id];
            const inner = (
              <div className="flex items-start gap-3">
                <span
                  className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                  style={{
                    background: !open ? "var(--n-200)" : boss ? "linear-gradient(135deg,#EF4444,#F59E0B)" : complete ? st.accent : "#3B82F6",
                    boxShadow: open ? `0 3px 0 ${boss ? "#991B1B" : complete ? st.edge : "#1D4ED8"}` : "none",
                    color: open ? "#fff" : "var(--n-400)",
                  }}
                >
                  {!open ? <Lock size={18} /> : boss ? <Crown size={20} /> : complete ? <Check size={20} strokeWidth={3} /> : <Play size={17} className="fill-white" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{inspect && <span className="mr-1.5 rounded bg-amber-400 text-[#422006] px-1 py-[1px] tracking-[0.1em]">MASTER</span>}{boss ? `Unit Boss Exam${complete ? " · Cleared" : ""}` : `Lesson ${unit.n}.${i + 1}${complete ? " · Mastered" : ""}`}</div>
                  <div className={`font-extrabold leading-snug ${open ? "text-slate-900" : "text-slate-400"}`}>{l.title}</div>
                  <div className="text-[12.5px] text-slate-500 leading-snug">{open ? l.subtitle : boss ? "Master every lesson in this unit to unlock" : "Complete the previous lesson to unlock"}</div>
                  {open && <StageDots lesson={l} />}
                </div>
              </div>
            );
            return open ? (
              <Link key={l.id} href={`/lesson/${l.id}`} className={`card block p-4 transition-transform hover:-translate-y-0.5 ${l.id === currentId ? "ring-2 ring-blue-500" : ""}`}>
                {inner}
              </Link>
            ) : (
              <div key={l.id} className="rounded-[1.25rem] p-4 bg-slate-50 shadow-[inset_0_0_0_1.5px_var(--n-200)]">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
