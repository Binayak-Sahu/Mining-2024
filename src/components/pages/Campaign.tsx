"use client";

import Link from "next/link";
import { Flame, Dumbbell, BookMarked, ChevronRight, Zap, Play, GraduationCap, Shield, Pickaxe } from "lucide-react";
import { UNITS, allCodex } from "@/content";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor, RANKS } from "@/lib/ranks";
import { lessonUnlocked, bossUnlocked, unitProgress } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { todayKey } from "@/lib/date";
import { CourseCard, ProgressBar } from "./course";
import { stratumFor } from "./strata";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function Campaign() {
  const hydrated = useHydrated();
  const s = useStrata();
  const done = hydrated ? s.lessons : {};
  const free = hydrated && s.freeRoam;
  const xp = hydrated ? s.xp : 0;
  const { rank, next, progress, index } = rankFor(xp);
  const today = todayKey();
  const due = hydrated ? Object.values(s.srs).filter((i) => i.due <= today).length : 0;
  const codexTotal = allCodex().length;
  const codexHave = hydrated ? Object.keys(s.codex).length : 0;
  const streak = hydrated ? liveStreak(s.streak, s.lastActiveDay) : 0;
  const lessonsDone = Object.keys(done).length;
  const totalLessons = UNITS.reduce((a, u) => a + u.lessons.length + 1, 0);

  // Recommended next lesson: first unlocked, uncompleted lesson in curriculum order.
  let rec: { id: string; title: string; unit: string; n: number; boss: boolean; unitId: string } | null = null;
  for (const u of UNITS) {
    const i = u.lessons.findIndex((l, k) => !done[l.id] && lessonUnlocked(u, k, done, free));
    if (i >= 0) {
      rec = { id: u.lessons[i].id, title: u.lessons[i].title, unit: `Unit ${u.n} · Lesson ${u.n}.${i + 1}`, n: u.n, boss: false, unitId: u.id };
      break;
    }
    if (!done[u.boss.id] && bossUnlocked(u, done, free) && u.lessons.length) {
      rec = { id: u.boss.id, title: u.boss.title, unit: `Unit ${u.n} · Boss Exam`, n: u.n, boss: true, unitId: u.id };
      break;
    }
  }
  const recSt = stratumFor(rec?.n ?? 0);
  const dow = (new Date().getDay() + 6) % 7;

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-8 pb-8 sm:pb-10 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-12">
      <section className="min-w-0 max-w-[640px] w-full mx-auto lg:mx-0">
        {/* Continue the expedition: on the canvas, one filled button */}
        <div>
          <div className="t-eyebrow flex items-center gap-2">
            <Pickaxe size={16} aria-hidden /> {hydrated && lessonsDone > 0 ? "Continue your expedition" : "Begin your descent"}
          </div>
          <h1 className="t-display mt-3 text-fg text-balance">{rec ? rec.title : "Every stratum mastered"}</h1>
          <p className="t-secondary mt-3">{rec ? `${rec.unit} · ${recSt.name}` : "You hold every lesson. Sit a DGMS paper to stay sharp."}</p>
          <Link href={rec ? `/lesson/${rec.id}` : "/exam"} className="btn-3d tone-tech w-full sm:w-auto sm:px-10 mt-6 inline-flex items-center justify-center gap-2">
            <Play size={20} fill="currentColor" strokeWidth={0} aria-hidden /> {rec ? (hydrated && lessonsDone > 0 ? "Continue" : "Start shift") : "Open exam hall"}
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar f={lessonsDone / totalLessons} label="Expedition progress" />
            </div>
            <span className="t-label text-fg-2 readout">
              {lessonsDone}/{totalLessons}
            </span>
          </div>
        </div>

        {/* Mobile quick bento */}
        <div className="grid grid-cols-2 gap-4 mt-8 lg:hidden">
          <Link href="/warmup" className="card course-card p-4 flex items-center gap-3">
            <span className="w-11 h-11 rounded-[12px] bg-surface-2 text-fg flex items-center justify-center shrink-0" aria-hidden>
              <Dumbbell size={22} />
            </span>
            <span className="min-w-0">
              <span className="block t-label text-fg" style={{ fontWeight: 700 }}>Warmup</span>
              <span className="block t-label text-fg-2 truncate" style={{ fontWeight: 400 }}>{due > 0 ? `${due} due` : "SRS review"}</span>
            </span>
          </Link>
          <Link href="/profile" className="card course-card p-4 flex items-center gap-3">
            <span className="w-11 h-11 rounded-[12px] bg-surface-2 text-fg flex items-center justify-center shrink-0" aria-hidden>
              <Shield size={22} />
            </span>
            <span className="min-w-0">
              <span className="block t-label text-fg truncate" style={{ fontWeight: 700 }}>{rank.title}</span>
              <span className="block t-label text-fg-2 readout" style={{ fontWeight: 400 }}>{xp} XP</span>
            </span>
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="t-title text-fg">The expedition</h2>
          <p className="t-secondary mt-1">Descend through eleven strata, from daylight to DGMS command.</p>
        </div>

        {/* §5.4 course spine: cards stacked 32 px apart, the line only in the gaps */}
        <div className="ds-spine mt-8">
          {UNITS.map((u, k) => {
            const f = unitProgress(u, done);
            return (
              <div key={u.id} className="flex flex-col">
                {k > 0 && <div className="ds-spine-gap" aria-hidden />}
                <CourseCard unit={u} progress={f} badge={rec && rec.unitId === u.id ? "Next" : undefined} />
              </div>
            );
          })}
        </div>
      </section>

      <aside className="hidden lg:block space-y-6 lg:sticky lg:top-24 self-start">
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
    </div>
  );
}
