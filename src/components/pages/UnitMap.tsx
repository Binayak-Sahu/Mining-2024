"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Check, Crown, Play } from "lucide-react";
import { getUnit } from "@/content";
import { useStrata } from "@/lib/store";
import { lessonUnlocked, bossUnlocked } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs } from "@/lib/prefs";
import { STAGE_META } from "@/components/cards/ui";
import type { Lesson } from "@/lib/types";
import { ExpeditionPath } from "./ExpeditionPath";
import { LevelHeader, UnitHeader } from "./course";
import { stratumFor } from "./strata";

/** §5.12 stage kinds: neutral 16 px icons in --text-3, no per-kind colour. */
function StageIcons({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 text-fg-3" aria-label={`${lesson.stages.length} stages`}>
      {lesson.stages.map((s, i) => {
        const M = STAGE_META[s.kind];
        return <M.Icon key={i} size={16} strokeWidth={2.2} aria-label={M.label} role="img" />;
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

  let currentId: string | null = null;
  const i0 = unit.lessons.findIndex((l, k) => !done[l.id] && lessonUnlocked(unit, k, done, free));
  if (i0 >= 0) currentId = unit.lessons[i0].id;
  else if (!done[unit.boss.id] && bossUnlocked(unit, done, free)) currentId = unit.boss.id;

  const all = [...unit.lessons.map((l, i) => ({ l, i, boss: false })), { l: unit.boss, i: unit.lessons.length, boss: true }];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-2 pb-8 sm:pb-10">
      <Link href="/" className="t-label inline-flex items-center gap-2 min-h-[44px] text-fg-2 hover:text-fg">
        <ArrowLeft size={20} aria-hidden /> Expedition
      </Link>

      <div className="mt-6 mx-auto max-w-[640px]">
        <UnitHeader unit={unit} />
      </div>

      <div className="mt-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 items-start">
        <div className="space-y-10">
          <div className="mx-auto max-w-md">
            <LevelHeader
              eyebrow={
                <>
                  Level <span className="readout normal-case tracking-normal">{st.depth}</span>
                </>
              }
              title={st.name}
            />
          </div>
          <ExpeditionPath unit={unit} done={done} freeRoam={free} currentId={currentId} master={master} />
        </div>

        <div>
          <h2 className="t-eyebrow px-1">Shift briefings</h2>
          <div className="mt-4 space-y-4">
            {all.map(({ l, i, boss }) => {
              const genuine = boss ? bossUnlocked(unit, done, free) : lessonUnlocked(unit, i, done, free);
              const open = genuine || master;
              const inspect = open && !genuine;
              const complete = !!done[l.id];
              const state = complete ? "done" : !genuine ? "locked" : boss ? "boss" : "current";
              const inner = (
                <div className="flex items-start gap-4">
                  <span className="brief-chip shrink-0" data-state={state} aria-hidden>
                    {complete ? <Check size={20} strokeWidth={3} /> : !genuine ? boss ? <Crown size={18} /> : <Lock size={18} /> : boss ? <Crown size={20} /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="t-eyebrow flex items-center gap-2 flex-wrap">
                      {boss ? `Boss exam${complete ? " · Cleared" : ""}` : `Lesson ${unit.n}.${i + 1}${complete ? " · Done" : ""}`}
                      {inspect && (
                        <span className="t-label rounded-full px-3 normal-case tracking-normal bg-action-tint text-action-tint-text" style={{ fontWeight: 700 }}>
                          Master
                        </span>
                      )}
                    </div>
                    <div className={`text-[18px] leading-[24px] font-bold mt-1 ${open ? "text-fg" : "text-fg-3"}`}>{l.title}</div>
                    <div className="t-label mt-1 text-fg-2" style={{ fontWeight: 400 }}>
                      {open ? l.subtitle : boss ? "Finish every lesson in this unit first" : "Finish the previous lesson first"}
                    </div>
                    {open && <StageIcons lesson={l} />}
                  </div>
                </div>
              );
              return open ? (
                <Link key={l.id} href={`/lesson/${l.id}`} className="card course-card relative block p-5">
                  {inner}
                  {l.id === currentId && (
                    <span className="t-label course-badge absolute top-3 right-3 rounded-full px-3" data-badge="Next" style={{ fontWeight: 700 }}>
                      Next
                    </span>
                  )}
                </Link>
              ) : (
                <div key={l.id} className="card block p-5 bg-surface-2">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
