"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Dumbbell, BookMarked, Flame, GraduationCap, Lock, Play, Zap } from "lucide-react";
import { UNITS, allCodex } from "@/content";
import { useStrata, liveStreak, type LessonRecord } from "@/lib/store";
import { rankFor, RANKS } from "@/lib/ranks";
import { useHydrated } from "@/lib/useHydrated";
import { todayKey } from "@/lib/date";
import { familyOf } from "@/lib/family";
import { currentLessonId, levelOf, unitLevels } from "@/lib/levels";
import { bossUnlocked, lessonUnlocked } from "@/lib/progress";
import { unitIcon } from "@/content/unitIcons";
import { nbh } from "@/lib/typo";
import type { Unit } from "@/lib/types";
import { ProgressBar } from "./course";
import { UnitArt } from "./UnitArt";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const ORDER = UNITS.map((u) => u.id);

/** The unit Home opens on: the unit of the recommended lesson (first unit with an unfinished lesson or boss). */
function startUnitIndex(done: Record<string, LessonRecord>, free: boolean): number {
  return UNITS.findIndex((u) => currentLessonId(u, done, free) !== null);
}

type RowState = "done" | "current" | "open" | "locked";

/**
 * §5.2 level card: always 2 node rows (the current lesson and the one after it; at the end of a unit, the last two),
 * then the unit Start button. Row titles clamp to 2 lines, so the card has one height for every unit.
 */
function LevelCard({ unit, done, free, allDone, live }: { unit: Unit; done: Record<string, LessonRecord>; free: boolean; allDone: boolean; live: boolean }) {
  const cur = currentLessonId(unit, done, free);
  const items = unitLevels(unit).flatMap((l) => l.items);
  const found = cur ? items.findIndex((it) => it.lesson.id === cur) : -1;
  const at = Math.max(0, Math.min(found < 0 ? items.length : found, items.length - 2));
  const rows = items.slice(at, at + 2);
  const Icon = unitIcon(unit.id);
  const stateOf = (it: (typeof items)[number]): RowState => {
    if (done[it.lesson.id]) return "done";
    if (it.lesson.id === cur) return "current";
    return (it.boss ? bossUnlocked(unit, done, free) : lessonUnlocked(unit, it.index, done, free)) ? "open" : "locked";
  };
  const href = `/lesson/${cur ?? unit.lessons[0]?.id ?? unit.boss.id}`;
  return (
    <div className="card p-6" data-testid={live ? "level-card" : undefined}>
      <ul className="grid gap-4">
        {rows.map((it) => {
          const s = stateOf(it);
          const label = it.boss ? "Boss exam" : `Lesson ${unit.n}.${it.index + 1}`;
          return (
            <li key={it.lesson.id} className="home-row" data-lesson={it.lesson.id} data-lesson-state={s}>
              <span className="pedestal" data-state={s} aria-hidden>
                <span>
                  {s === "current" ? (
                    <Icon size={26} color="var(--u-ink)" strokeWidth={2.4} />
                  ) : s === "done" ? (
                    <Check size={24} color="var(--text-2)" strokeWidth={3} />
                  ) : s === "locked" ? (
                    <Lock size={20} color="var(--text-3)" strokeWidth={2.4} />
                  ) : (
                    <Play size={20} color="var(--text-2)" fill="currentColor" strokeWidth={0} />
                  )}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="sr-only">{label}: </span>
                <span className={`home-row-title ${s === "current" ? "t-card-title text-fg" : "t-secondary"}`} style={s === "current" ? undefined : { fontWeight: 500 }} lang="en">
                  {nbh(it.lesson.title)}
                </span>
                <span className="sr-only">{s === "done" ? " (completed)" : s === "locked" ? " (locked)" : s === "current" ? " (next)" : ""}</span>
              </span>
              <span className="status-dot" data-state={s === "done" ? "done" : undefined} aria-hidden>
                {s === "done" && <Check size={18} strokeWidth={3} />}
              </span>
            </li>
          );
        })}
      </ul>
      {/* Same target as before v3c: the unit's current lesson; with every unit finished, the exam hall. */}
      <Link href={allDone ? "/exam" : href} className="btn-3d tone-tech w-full mt-6" data-testid={live ? "home-start" : undefined}>
        {cur ? "Start" : allDone ? "Open exam hall" : "Review"}
      </Link>
    </div>
  );
}

/**
 * §5.2 crossfade stack: one layer per unit in `keep`, all in the same grid cell, so the box never changes size. Only the
 * layer for `index` is visible and interactive; the others sit at opacity 0 (inert) and fade in or out on settle
 * (opacity only, 160 ms; the glow uses 240 ms). Neighbours are mounted ahead of time, so nothing loads after a swipe.
 */
function Layers({ keep, index, className, children }: { keep: number[]; index: number; className: string; children: (i: number, live: boolean) => React.ReactNode }) {
  return (
    <div className="xfade-stack">
      {keep.map((i) => (
        <div key={UNITS[i].id} className={className} data-u={UNITS[i].id} data-family={familyOf(UNITS[i].id)} data-on={i === index ? "" : undefined} aria-hidden={i === index ? undefined : true} inert={i !== index}>
          {children(i, i === index)}
        </div>
      ))}
    </div>
  );
}

/**
 * §5.2 carousel: a native scroll-snap track (x mandatory), so the illustrations follow the finger and the browser does
 * the snap. Only the track moves. Slot pitch = 50 % + 40 px of the column, so a neighbour peeks in ~30 % from each edge.
 * The settled slot is read on scrollend (or 120 ms after the last scroll event where scrollend is missing).
 */
function Carousel({ index, onSettle, onPick, go }: { index: number; onSettle: (i: number) => void; onPick: (i: number) => void; go: { i: number; n: number } | null }) {
  const reduce = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const pitch = () => (track.current?.firstElementChild as HTMLElement | null)?.offsetWidth || 1;
  // Place the track on the start unit before the first visible paint (Home is hidden until the store hydrates).
  useLayoutEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = index * pitch();
    // Only on mount and when the start unit is (re)derived; later moves come from the finger or from `go`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const el = track.current;
    if (!el || !go) return;
    el.scrollTo({ left: go.i * pitch(), behavior: reduce ? "auto" : "smooth" });
  }, [go, reduce]);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let t = 0;
    const settle = () => {
      window.clearTimeout(t);
      onSettle(Math.max(0, Math.min(ORDER.length - 1, Math.round(el.scrollLeft / pitch()))));
    };
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(settle, 120);
    };
    const hasEnd = "onscrollend" in window;
    el.addEventListener("scroll", onScroll, { passive: true });
    if (hasEnd) el.addEventListener("scrollend", settle);
    return () => {
      window.clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
      if (hasEnd) el.removeEventListener("scrollend", settle);
    };
  }, [onSettle]);
  // A resize changes the pitch: keep the settled unit centred.
  const at = useRef(index);
  at.current = index;
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === w) return;
      w = el.clientWidth;
      el.scrollLeft = at.current * pitch();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="home-carousel" aria-roledescription="carousel" aria-label="Units" data-testid="unit-carousel">
      <div ref={track} className="home-track" data-testid="unit-track">
        {UNITS.map((u, k) => (
          <div key={u.id} className="home-slot" aria-hidden={k !== index}>
            {k === index ? (
              <UnitArt unitId={u.id} size={200} title={`Unit ${u.n}: ${u.shortTitle}`} eager />
            ) : (
              <button type="button" tabIndex={-1} className="carousel-slot block" onClick={() => onPick(k)} aria-label={`Unit ${u.n}: ${u.shortTitle}`}>
                <UnitArt unitId={u.id} size={200} eager />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Five page dots: a window around the current unit (8 px, active = unit ink), each a 44 px target. Keyed by slot, so no dot ever moves. */
function Dots({ index, onPick }: { index: number; onPick: (i: number) => void }) {
  const first = Math.min(Math.max(0, index - 2), ORDER.length - 5);
  return (
    <div className="flex justify-center gap-1" aria-label="Unit pages" data-family={familyOf(UNITS[index].id)}>
      {[0, 1, 2, 3, 4].map((k) => {
        const i = first + k;
        return (
          <button key={k} type="button" aria-current={i === index ? "true" : undefined} aria-label={`Unit ${UNITS[i].n}: ${UNITS[i].shortTitle}`} onClick={() => onPick(i)} className="unit-dot inline-flex items-center justify-center rounded-full" style={{ width: 28, height: 44 }}>
            <span className="block rounded-full" style={{ width: 8, height: 8, background: i === index ? "var(--u-ink)" : "var(--edge-strong)" }} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * §5.2 Home: the current-unit screen (title, LEVEL n, carousel, level card, Start). Fixed geometry: the title box is
 * 2 lines, the card is 2 rows, the art is a fixed square that flexes 140–200 px with the viewport height (never while
 * the page is open), so a swipe moves only the illustration track and fades the text. Wide screens keep the side panel.
 */
export function Home() {
  const hydrated = useHydrated();
  const s = useStrata();
  const done = hydrated ? s.lessons : {};
  const free = hydrated && s.freeRoam;
  const [picked, setPicked] = useState<number | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [go, setGo] = useState<{ i: number; n: number } | null>(null);
  const start = startUnitIndex(done, free);
  const index = picked ?? Math.max(0, start);
  const settle = useCallback(
    (i: number) => {
      if (i === index) return;
      setPrev(index);
      setPicked(i);
    },
    [index],
  );
  // A dot or a peeking neighbour scrolls the track; the text follows when the scroll settles.
  const pick = (i: number) => setGo((g) => ({ i, n: (g?.n ?? 0) + 1 }));
  const keep = [...new Set([index - 1, index, index + 1, prev ?? index])].filter((i) => i >= 0 && i < ORDER.length).sort((a, b) => a - b);
  const unit = UNITS[index];

  return (
    <div className="max-w-6xl mx-auto lg:px-6 pb-8 sm:pb-10 lg:grid lg:grid-cols-[minmax(0,640px)_320px] lg:justify-center lg:gap-12">
      <section className="home min-w-0 w-full max-w-[640px] mx-auto" style={{ visibility: hydrated ? "visible" : "hidden" }} aria-label={`Unit ${unit.n}: ${unit.title}`} data-unit={unit.id} data-family={familyOf(unit.id)}>
        <Layers keep={keep} index={index} className="home-glow-layer">
          {() => <div className="home-glow" />}
        </Layers>
        <div className="home-body">
          <div className="px-6">
            <Layers keep={keep} index={index} className="xfade">
              {(i, live) => (
                // §5.8: the title and LEVEL n open the unit's board. A plain block link, so the geometry is unchanged.
                <Link href={`/unit/${UNITS[i].id}/board`} className="home-board-link block" data-testid={live ? "home-board-link" : undefined}>
                  <h1 className="home-title t-hero text-fg text-center" lang="en" title={UNITS[i].title}>
                    <span>{nbh(UNITS[i].shortTitle)}</span>
                  </h1>
                  <div className="t-eyebrow text-center mt-6" style={{ color: "var(--u-ink)" }} data-testid={live ? "home-level" : undefined}>
                    Level {levelOf(UNITS[i], currentLessonId(UNITS[i], done, free))}
                    <span className="sr-only"> · open the unit board</span>
                  </div>
                </Link>
              )}
            </Layers>
          </div>
          <div className="mt-4">
            {/* key: the carousel remounts once the store is read, so its first scroll position is the start unit. */}
            <Carousel key={hydrated ? "on" : "off"} index={index} onSettle={settle} onPick={pick} go={go} />
          </div>
          <div className="mt-2">
            <Dots index={index} onPick={pick} />
          </div>
          <div className="px-6 mt-4">
            <Layers keep={keep} index={index} className="xfade">
              {(i, live) => (
                <>
                  <LevelCard unit={UNITS[i]} done={done} free={free} allDone={start < 0} live={live} />
                  <div className="flex justify-center mt-6">
                    <Link href={`/unit/${UNITS[i].id}`} className="btn-3d tone-ghost btn-sm px-5 inline-flex items-center gap-1">
                      All lessons <ChevronRight size={18} aria-hidden />
                    </Link>
                  </div>
                </>
              )}
            </Layers>
          </div>
        </div>
      </section>
      <HomeAside />
    </div>
  );
}

/** The wide-screen side panel kept from the old Home: rank, streak, warmup, codex, exam. */
function HomeAside() {
  const hydrated = useHydrated();
  const s = useStrata();
  const xp = hydrated ? s.xp : 0;
  const { rank, next, progress, index } = rankFor(xp);
  const today = todayKey();
  const due = hydrated ? Object.values(s.srs).filter((i) => i.due <= today).length : 0;
  const codexTotal = allCodex().length;
  const codexHave = hydrated ? Object.keys(s.codex).length : 0;
  const streak = hydrated ? liveStreak(s.streak, s.lastActiveDay) : 0;
  const dow = (new Date().getDay() + 6) % 7;
  return (
    <aside className="hidden lg:block space-y-6 lg:sticky lg:top-24 self-start pt-8">
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="t-eyebrow">Statutory rank</div>
            <div className="t-heading text-fg mt-1">{rank.title}</div>
          </div>
          <span className="w-12 h-12 rounded-[12px] bg-surface-2 border-2 border-line text-fg readout t-label flex items-center justify-center" style={{ fontWeight: 800 }}>
            {rank.badge}
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar f={progress} label="Rank progress" />
        </div>
        <div className="t-label readout text-fg-2 mt-2 flex justify-between" style={{ fontWeight: 400 }}>
          <span className="flex items-center gap-1">
            <Zap size={14} aria-hidden /> {xp} XP
          </span>
          <span>{next ? `${next.min} → ${next.badge}` : "Max rank"}</span>
        </div>
        <div className="flex gap-2 mt-4">
          {RANKS.map((r, i) => (
            <div key={r.title} title={r.title} className={`flex-1 text-center rounded-[8px] py-1 readout t-label ${i <= index ? "bg-ink text-canvas" : "bg-surface-2 text-fg-3"}`} style={{ fontWeight: 800 }}>
              {r.badge}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-[12px] bg-energy-tint flex items-center justify-center" aria-hidden>
            <Flame size={26} className="text-energy-tint-text" fill={streak > 0 ? "currentColor" : "none"} />
          </span>
          <div>
            <div className="readout text-2xl font-extrabold text-fg leading-none">
              {streak} day{streak === 1 ? "" : "s"}
            </div>
            <div className="t-label text-fg-2 mt-1" style={{ fontWeight: 400 }}>
              streak · best {hydrated ? s.longestStreak : 0}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {DAYS.map((d, i) => {
            const ago = dow - i;
            const lit = ago >= 0 && ago < streak;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${lit ? "bg-energy text-energy-on" : i === dow ? "bg-surface-2 border-2 border-energy" : "bg-surface-2"}`} aria-hidden>
                  {lit ? <Flame size={14} fill="currentColor" /> : null}
                </span>
                <span className={`t-label ${i === dow ? "text-fg" : "text-fg-3"}`} style={{ fontWeight: 700 }}>
                  {d}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Link href="/warmup" className="card course-card p-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-[12px] bg-surface-2 text-fg flex items-center justify-center" aria-hidden>
          <Dumbbell size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-fg">Daily warmup</div>
          <div className="t-label text-fg-2 truncate" style={{ fontWeight: 400 }}>
            {due > 0 ? `${due} missed concept${due > 1 ? "s" : ""} due` : hydrated && s.warmupDoneDay === today ? "Done for today" : "Spaced-repetition review"}
          </div>
        </div>
        {due > 0 ? <span className="readout t-label rounded-full bg-danger text-[var(--danger-on)] px-2">{due}</span> : <ChevronRight size={20} className="text-fg-3" aria-hidden />}
      </Link>

      <Link href="/codex" className="card course-card p-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-[12px] bg-surface-2 text-fg flex items-center justify-center" aria-hidden>
          <BookMarked size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-fg">Field Codex</div>
          <div className="mt-2">
            <ProgressBar f={codexHave / codexTotal} label="Codex collected" />
          </div>
          <div className="t-label text-fg-2 mt-1 readout" style={{ fontWeight: 400 }}>
            {codexHave}/{codexTotal} cheat sheets
          </div>
        </div>
      </Link>

      <Link href="/exam" className="card course-card p-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-[12px] bg-surface-2 text-fg flex items-center justify-center" aria-hidden>
          <GraduationCap size={22} />
        </span>
        <div className="flex-1">
          <div className="font-bold text-fg">DGMS Exam Simulator</div>
          <div className="t-label text-fg-2" style={{ fontWeight: 400 }}>25 questions · 30 min · derivations</div>
        </div>
        <ChevronRight size={20} className="text-fg-3" aria-hidden />
      </Link>
    </aside>
  );
}
