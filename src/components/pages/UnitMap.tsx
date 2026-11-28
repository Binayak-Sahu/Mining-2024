"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, Check, CircleHelp, Crown, Lock, Map as MapIcon } from "lucide-react";
import { UNITS, getUnit } from "@/content";
import { useStrata } from "@/lib/store";
import { bossUnlocked, lessonUnlocked, unitProgress } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs } from "@/lib/prefs";
import { unitCounts } from "@/lib/questions";
import { familyOf } from "@/lib/family";
import { currentLessonId, lessonMinutes, unitLevels, type LevelItem } from "@/lib/levels";
import type { Unit } from "@/lib/types";
import type { LessonRecord } from "@/lib/store";
import { nbh } from "@/lib/typo";
import { ProgressBar } from "./course";
import { UnitArt } from "./UnitArt";

const NNBSP = " ";

/** §5.3 unit tabs: 140 × 96 course tabs with the 56 px illustration; the selected one scrolls into view (horizontally only). */
function UnitTabs({ selected }: { selected: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    const tab = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && tab) el.scrollLeft += tab.getBoundingClientRect().left - el.getBoundingClientRect().left - 24;
  }, [selected]);
  return (
    <nav aria-label="Units">
      <div ref={box} className="unit-scroller px-6 pt-1" style={{ scrollPaddingLeft: 24 }}>
        {UNITS.map((u) => {
          const on = u.id === selected;
          return (
            <Link
              key={u.id}
              // §5.8: tapping the selected unit again opens its board.
              href={on ? `/unit/${u.id}/board` : `/unit/${u.id}`}
              replace={!on}
              scroll={on ? undefined : false}
              data-family={familyOf(u.id)}
              aria-current={on ? "page" : undefined}
              data-on={on}
              className="course-tab"
              style={{ width: 140, height: 96, paddingBottom: on ? 12 : 4 }}
            >
              <UnitArt unitId={u.id} size={56} />
              <span className="t-tab" style={{ fontWeight: on ? 800 : 600, color: on ? "var(--text)" : "var(--text-2)" }}>
                {u.short}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type CardState = "done" | "current" | "open" | "locked" | "inspect";

/** §5.3 lesson card: number tile (§5.5 until lessons have art), "N STAGES · ~M MIN", title, progress when done. */
function LessonCard({ unit, item, state }: { unit: Unit; item: LevelItem; state: CardState }) {
  const { lesson, boss, index } = item;
  const stages = lesson.stages.length;
  const meta = `${boss ? "Boss exam · " : ""}${stages}${NNBSP}stage${stages === 1 ? "" : "s"} · ~${lessonMinutes(lesson)}${NNBSP}min`;
  const open = state !== "locked";
  const name = boss ? "Boss exam" : `Lesson ${unit.n}.${index + 1}`;
  const note = state === "done" ? "completed" : state === "locked" ? "locked" : state === "current" ? "next" : state === "inspect" ? "Master: Inspector sandbox, progress not saved" : "";
  const inner = (
    <div className="flex items-center gap-4">
      <span className="lesson-tile" data-state={state === "locked" || state === "inspect" ? "locked" : state === "done" ? "done" : undefined} style={{ width: 96, height: 96, fontSize: 28 }} aria-hidden>
        {boss ? <Crown size={36} strokeWidth={2.2} /> : state === "locked" ? <Lock size={28} strokeWidth={2.4} /> : `${unit.n}.${index + 1}`}
      </span>
      <div className="min-w-0 flex-1">
        <div className="t-eyebrow flex items-center gap-2 flex-wrap">
          <span className="tnum">{meta}</span>
        </div>
        <div className={`t-card-title mt-1 ${open ? "text-fg" : "text-fg-2"}`} style={{ overflowWrap: "anywhere", hyphens: "auto" }} lang="en">
          {nbh(lesson.title)}
        </div>
        {state === "inspect" && (
          <span className="t-label inline-block mt-2 rounded-full px-3" style={{ fontWeight: 700, background: "var(--u-tint)", color: "var(--u-ink)" }}>
            Master
          </span>
        )}
        {state === "current" && (
          <span className="t-label inline-block mt-2 rounded-full px-3 course-badge" data-badge="Next" style={{ fontWeight: 700 }}>
            Next
          </span>
        )}
        {state === "done" && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar f={1} label={`${name} complete`} />
            </div>
            <Check size={18} strokeWidth={3} color="var(--success-tint-text)" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
  const label = `${name}: ${lesson.title}${note ? ` (${note})` : ""}`;
  return open ? (
    <Link href={`/lesson/${lesson.id}`} className="card press-card block p-5" aria-label={label} data-lesson={lesson.id} data-lesson-state={state}>
      {inner}
    </Link>
  ) : (
    <div className="card press-card block p-5" data-state="locked" aria-label={label} role="group" data-lesson={lesson.id} data-lesson-state={state}>
      {inner}
    </div>
  );
}

/** §5.3 Path for one unit: unit tabs, header (glow, eyebrow, hero, counts, 120 px art), then levels of lesson cards. */
export function UnitMap({ unitId }: { unitId: string }) {
  const hydrated = useHydrated();
  const unit = getUnit(unitId);
  const s = useStrata();
  const masterPref = usePrefs((p) => p.masterUnlock);
  if (!unit) return <div className="p-6">Unit not found.</div>;
  const done: Record<string, LessonRecord> = hydrated ? s.lessons : {};
  const free = hydrated && s.freeRoam;
  const master = hydrated && masterPref;
  const cur = currentLessonId(unit, done, free);
  const levels = unitLevels(unit);
  const counts = unitCounts(unit);
  const progress = unitProgress(unit, done);

  const stateOf = (it: LevelItem): CardState => {
    if (done[it.lesson.id]) return "done";
    const genuine = it.boss ? bossUnlocked(unit, done, free) : lessonUnlocked(unit, it.index, done, free);
    if (!genuine) return master ? "inspect" : "locked";
    return it.lesson.id === cur ? "current" : "open";
  };

  return (
    <div className="page-glow" data-family={familyOf(unit.id)}>
      <div className="max-w-[640px] mx-auto pt-2 pb-8 sm:pb-10">
        <div className="px-6">
          <Link href="/" className="t-label inline-flex items-center gap-2 min-h-[44px] text-fg-2 hover:text-fg">
            <ArrowLeft size={20} aria-hidden /> Home
          </Link>
        </div>
        <div className="mt-2">
          <UnitTabs selected={unit.id} />
        </div>

        <header className="px-6 mt-8 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="t-eyebrow">
              Unit {unit.n} · {levels.length} level{levels.length === 1 ? "" : "s"}
            </div>
            <h1 className="t-hero text-fg mt-2 text-balance" lang="en">
              <Link href={`/unit/${unit.id}/board`} data-testid="path-board-link">
                {nbh(unit.shortTitle)}
                <span className="sr-only"> · open the unit board</span>
              </Link>
            </h1>
            <p className="t-secondary mt-2 text-balance" lang="en" data-testid="unit-subtitle">
              {nbh(unit.title)}
            </p>
            <p className="t-secondary mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <BookOpen size={18} aria-hidden /> {counts.lessons}
                {NNBSP}lesson{counts.lessons === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <CircleHelp size={18} aria-hidden /> {counts.questions}
                {NNBSP}questions
              </span>
            </p>
            <Link href={`/unit/${unit.id}/board`} className="btn-3d tone-ghost btn-sm px-5 mt-4 inline-flex items-center gap-2" data-testid="path-board">
              <MapIcon size={18} aria-hidden /> Board
            </Link>
            {progress > 0 && (
              <div className="mt-3 max-w-[240px]">
                <ProgressBar f={progress} label={`Unit ${unit.n} progress`} />
              </div>
            )}
          </div>
          <Link href={`/unit/${unit.id}/board`} className="shrink-0" aria-label={`Open the Unit ${unit.n} board`} tabIndex={-1}>
            <UnitArt unitId={unit.id} size={120} />
          </Link>
        </header>

        <div className="px-6 mt-10 space-y-10" style={{ visibility: hydrated ? "visible" : "hidden" }}>
          {levels.map((lv) => (
            <section key={lv.n} aria-labelledby={`level-${lv.n}`} data-level={lv.n}>
              <h2 id={`level-${lv.n}`} className="t-eyebrow mb-4" style={{ color: "var(--u-ink)" }}>
                Level {lv.n}
              </h2>
              <div>
                {lv.items.map((it, k) => (
                  <div key={it.lesson.id}>
                    {k > 0 && <div className="v3-spine" aria-hidden />}
                    <LessonCard unit={unit} item={it} state={stateOf(it)} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
