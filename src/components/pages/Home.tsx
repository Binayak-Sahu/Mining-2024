"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
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
import { stageSlide } from "@/lib/motion";
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

/** §5.2 level card: node rows for the current lesson and the one after it, then the unit Start button. */
function LevelCard({ unit, done, free, allDone }: { unit: Unit; done: Record<string, LessonRecord>; free: boolean; allDone: boolean }) {
  const cur = currentLessonId(unit, done, free);
  const items = unitLevels(unit).flatMap((l) => l.items);
  const at = cur ? items.findIndex((it) => it.lesson.id === cur) : Math.max(0, items.length - 2);
  const rows = items.slice(at, at + 2);
  const Icon = unitIcon(unit.id);
  const stateOf = (it: (typeof items)[number]): RowState => {
    if (done[it.lesson.id]) return "done";
    if (it.lesson.id === cur) return "current";
    return (it.boss ? bossUnlocked(unit, done, free) : lessonUnlocked(unit, it.index, done, free)) ? "open" : "locked";
  };
  const href = `/lesson/${cur ?? unit.lessons[0]?.id ?? unit.boss.id}`;
  return (
    <div className="card p-6" data-testid="level-card">
      <ul className="space-y-4">
        {rows.map((it) => {
          const s = stateOf(it);
          const label = it.boss ? "Boss exam" : `Lesson ${unit.n}.${it.index + 1}`;
          return (
            <li key={it.lesson.id} className="flex items-center gap-4" data-lesson={it.lesson.id} data-lesson-state={s}>
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
                <span className={`block ${s === "current" ? "t-card-title text-fg" : "t-secondary"}`} style={s === "current" ? undefined : { fontWeight: 500 }} lang="en">
                  {it.lesson.title}
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
      <Link href={allDone ? "/exam" : href} className="btn-3d tone-tech w-full mt-6" data-testid="home-start">
        {cur ? "Start" : allDone ? "Open exam hall" : "Review"}
      </Link>
    </div>
  );
}

/**
 * §5.1/§5.2 Home carousel: one strip holding every unit's art, moved as a whole. Slot pitch = width / 2 + 40, so the
 * centre art is 200 px and each neighbour peeks in from the edge. Drag moves the strip with the finger; release snaps one
 * unit with stageSlide (no animation under reduced motion).
 */
function Carousel({ index, onChange, jump }: { index: number; onChange: (i: number) => void; jump: boolean }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(390);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    setW(el.clientWidth || 390);
    const ro = new ResizeObserver(() => setW(el.clientWidth || 390));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pitch = w / 2 + 40;
  const target = w / 2 - 100 - index * pitch;
  const x = useMotionValue(target);
  useEffect(() => {
    if (jump || reduce) {
      x.set(target);
      return;
    }
    const c = animate(x, target, stageSlide);
    return () => c.stop();
  }, [target, x, jump, reduce]);
  const onEnd = (_: unknown, info: PanInfo) => {
    const d = info.offset.x < -48 || info.velocity.x < -400 ? 1 : info.offset.x > 48 || info.velocity.x > 400 ? -1 : 0;
    const next = Math.min(ORDER.length - 1, Math.max(0, index + d));
    if (next === index) {
      if (reduce) x.set(target);
      else animate(x, target, stageSlide);
    } else onChange(next);
  };
  return (
    <div ref={box} className="relative overflow-hidden" style={{ height: 200 }} aria-roledescription="carousel" aria-label="Units" data-testid="unit-carousel">
      <motion.div
        className="absolute top-0 left-0 h-full"
        style={{ x, width: ORDER.length * pitch, touchAction: "pan-y", cursor: "grab" }}
        drag="x"
        dragMomentum={false}
        dragElastic={0.2}
        dragConstraints={{ left: w / 2 - 100 - (ORDER.length - 1) * pitch, right: w / 2 - 100 }}
        onDragEnd={onEnd}
      >
        {UNITS.map((u, k) => (
          <div key={u.id} className="absolute top-0" style={{ left: k * pitch, width: 200, height: 200 }} aria-hidden={k !== index}>
            {k === index ? (
              <UnitArt unitId={u.id} size={200} title={`Unit ${u.n}: ${u.short}`} />
            ) : (
              <button type="button" tabIndex={-1} className="carousel-slot block" onClick={() => onChange(k)} aria-label={`Unit ${u.n}: ${u.short}`}>
                <UnitArt unitId={u.id} size={200} />
              </button>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/** Five page dots: a window around the current unit (8 px, active = unit ink), each a 44 px target. */
function Dots({ index, onChange }: { index: number; onChange: (i: number) => void }) {
  const first = Math.min(Math.max(0, index - 2), ORDER.length - 5);
  return (
    <div className="flex justify-center gap-1" aria-label="Unit pages">
      {ORDER.slice(first, first + 5).map((id, k) => {
        const i = first + k;
        return (
          <button key={id} type="button" aria-current={i === index ? "true" : undefined} aria-label={`Unit ${UNITS[i].n}: ${UNITS[i].short}`} onClick={() => onChange(i)} className="unit-dot inline-flex items-center justify-center rounded-full" style={{ width: 28, height: 44 }}>
            <span className="block rounded-full" style={{ width: 8, height: 8, background: i === index ? "var(--u-ink)" : "var(--edge-strong)" }} />
          </button>
        );
      })}
    </div>
  );
}

/** §5.2 Home: the current-unit screen (title, LEVEL n, carousel, level card, Start). Wide screens keep the side panel. */
export function Home() {
  const hydrated = useHydrated();
  const s = useStrata();
  const done = hydrated ? s.lessons : {};
  const free = hydrated && s.freeRoam;
  const [picked, setPicked] = useState<number | null>(null);
  const start = startUnitIndex(done, free);
  const index = picked ?? Math.max(0, start);
  const unit = UNITS[index];
  const cur = currentLessonId(unit, done, free);
  const level = levelOf(unit, cur);

  return (
    <div className="max-w-6xl mx-auto lg:px-6 pb-8 sm:pb-10 lg:grid lg:grid-cols-[minmax(0,640px)_320px] lg:justify-center lg:gap-12">
      <section data-family={familyOf(unit.id)} className="page-glow min-w-0 w-full max-w-[640px] mx-auto pt-8" style={{ visibility: hydrated ? "visible" : "hidden" }} aria-label={`Unit ${unit.n}: ${unit.title}`} data-unit={unit.id}>
        <div className="px-6">
          <h1 className="t-hero text-fg text-center text-balance" lang="en">
            {unit.title}
          </h1>
          <div className="t-eyebrow text-center mt-6" style={{ color: "var(--u-ink)" }} data-testid="home-level">
            Level {level}
          </div>
        </div>
        <div className="mt-4">
          <Carousel index={index} onChange={setPicked} jump={picked === null} />
        </div>
        <div className="mt-2">
          <Dots index={index} onChange={setPicked} />
        </div>
        <div className="px-6 mt-4">
          <LevelCard unit={unit} done={done} free={free} allDone={start < 0} />
          <div className="flex justify-center mt-6">
            <Link href={`/unit/${unit.id}`} className="btn-3d tone-ghost btn-sm px-5 inline-flex items-center gap-1">
              All lessons <ChevronRight size={18} aria-hidden />
            </Link>
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
