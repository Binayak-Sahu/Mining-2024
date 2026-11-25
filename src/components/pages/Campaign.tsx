"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Dumbbell, BookMarked, ChevronRight, Zap, Play, GraduationCap, Shield, Pickaxe } from "lucide-react";
import { UNITS, allCodex } from "@/content";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor, RANKS } from "@/lib/ranks";
import { lessonUnlocked, bossUnlocked } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs } from "@/lib/prefs";
import { todayKey } from "@/lib/date";
import { ExpeditionPath } from "./ExpeditionPath";
import { stratumFor } from "./strata";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function Campaign() {
  const hydrated = useHydrated();
  const s = useStrata();
  const done = hydrated ? s.lessons : {};
  const free = hydrated && s.freeRoam;
  const master = usePrefs((p) => p.masterUnlock) && hydrated;
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
  let rec: { id: string; title: string; unit: string; n: number; boss: boolean } | null = null;
  for (const u of UNITS) {
    const i = u.lessons.findIndex((l, k) => !done[l.id] && lessonUnlocked(u, k, done, free));
    if (i >= 0) {
      rec = { id: u.lessons[i].id, title: u.lessons[i].title, unit: `Unit ${u.n} · Lesson ${u.n}.${i + 1}`, n: u.n, boss: false };
      break;
    }
    if (!done[u.boss.id] && bossUnlocked(u, done, free) && u.lessons.length) {
      rec = { id: u.boss.id, title: u.boss.title, unit: `Unit ${u.n} · Boss Exam`, n: u.n, boss: true };
      break;
    }
  }
  const recSt = stratumFor(rec?.n ?? 0);
  const dow = (new Date().getDay() + 6) % 7;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8">
      <section className="min-w-0 space-y-4">
        {/* Hero: continue the expedition */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="relative overflow-hidden rounded-[28px] p-5 sm:p-7 text-white" style={{ background: "radial-gradient(120% 140% at 100% 0%, #1E3A8A 0%, #0B1226 55%, #05070E 100%)", boxShadow: "var(--shadow-pop)" }}>
          <svg className="absolute right-0 bottom-0 w-[230px] sm:w-[360px] opacity-50 sm:opacity-90 pointer-events-none" viewBox="0 0 360 200" aria-hidden>
            {[
              ["#3B82F6", 0.35],
              ["#D6A56B", 0.5],
              ["#E7D29E", 0.45],
              ["#A8B0BC", 0.4],
              ["#1B2230", 0.9],
              ["#C4B5FD", 0.35],
            ].map(([c, o], i) => (
              <path key={i} d={`M0 ${70 + i * 24} C 90 ${52 + i * 24}, 200 ${92 + i * 24}, 360 ${62 + i * 24} L360 200 L0 200 Z`} fill={c as string} opacity={o as number} />
            ))}
            <rect x="248" y="40" width="6" height="140" fill="#E2E8F0" opacity="0.6" />
            <path d="M232 44 h38 l-6 -14 h-26 z" fill="#E2E8F0" opacity="0.7" />
            <circle cx="251" cy="180" r="5" fill="#FBBF24" />
          </svg>
          <div className="relative max-w-[min(100%,420px)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#BFDBFE] flex items-center gap-2">
              <Pickaxe size={13} /> {hydrated && lessonsDone > 0 ? "Continue your expedition" : "Begin your descent"}
            </div>
            <h1 className="mt-2 text-[26px] sm:text-[34px] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance">{rec ? rec.title : "Every stratum mastered"}</h1>
            <p className="mt-1.5 text-[13.5px] text-[#C7D2FE]/80">{rec ? `${rec.unit} · ${recSt.name}` : "You hold every lesson. Sit a DGMS paper to stay sharp."}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={rec ? `/lesson/${rec.id}` : "/exam"} className="btn-3d tone-safe px-6 py-3.5 text-sm inline-flex items-center gap-2">
                <Play size={16} className="fill-white" /> {rec ? (hydrated && lessonsDone > 0 ? "Continue" : "Start shift") : "Open exam hall"}
              </Link>
              <div className="flex items-center gap-2 text-[12px] text-[#C7D2FE]/80">
                <div className="w-28 h-2 rounded-full bg-white/15 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" initial={{ width: 0 }} animate={{ width: `${(lessonsDone / totalLessons) * 100}%` }} transition={{ duration: 1 }} />
                </div>
                <span className="readout">
                  {lessonsDone}/{totalLessons}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile quick bento */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          <Link href="/warmup" className="card p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Dumbbell size={20} className="text-emerald-600" />
            </span>
            <span className="min-w-0">
              <span className="block font-extrabold text-[14px] text-slate-900">Warmup</span>
              <span className="block text-[11.5px] text-slate-500 truncate">{due > 0 ? `${due} due` : "SRS review"}</span>
            </span>
          </Link>
          <Link href="/profile" className="card p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
            <span className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-blue-600" />
            </span>
            <span className="min-w-0">
              <span className="block font-extrabold text-[14px] text-slate-900 truncate">{rank.title}</span>
              <span className="block text-[11.5px] text-slate-500 readout">{xp} XP</span>
            </span>
          </Link>
        </div>

        <div className="flex items-end justify-between pt-2 px-1">
          <div>
            <h2 className="text-[22px] sm:text-2xl font-extrabold tracking-tight text-slate-900">The Expedition</h2>
            <p className="text-[13px] text-slate-500">Descend through eleven strata — from daylight to DGMS command.</p>
          </div>
        </div>

        <div className="space-y-4">
          {UNITS.map((u, k) => (
            <ExpeditionPath key={u.id} unit={u} done={done} freeRoam={free} currentId={rec?.id ?? null} index={k} master={master} />
          ))}
        </div>
      </section>

      <aside className="hidden lg:block space-y-4 lg:sticky lg:top-24 self-start">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Statutory rank</div>
              <div className="text-lg font-extrabold text-slate-900 leading-tight">{rank.title}</div>
            </div>
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white readout font-black text-sm flex items-center justify-center shadow-[0_3px_0_#4338CA]">{rank.badge}</span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden shadow-[inset_0_1px_2px_rgba(15,23,42,0.12)]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1 }} />
          </div>
          <div className="readout text-[11.5px] text-slate-500 mt-1.5 flex justify-between">
            <span className="flex items-center gap-1">
              <Zap size={12} /> {xp} XP
            </span>
            <span>{next ? `${next.min} → ${next.badge}` : "Max rank"}</span>
          </div>
          <div className="flex gap-1.5 mt-4">
            {RANKS.map((r, i) => (
              <div key={r.title} title={r.title} className={`flex-1 text-center rounded-lg py-1.5 readout text-[10.5px] font-extrabold ${i <= index ? "bg-slate-900 text-slate-50" : "bg-slate-100 text-slate-400"}`}>
                {r.badge}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Flame size={28} className={`text-orange-500 ${streak > 0 ? "fill-orange-400" : ""}`} />
            </span>
            <div>
              <div className="readout text-2xl font-extrabold text-slate-900 leading-none">{streak} day{streak === 1 ? "" : "s"}</div>
              <div className="text-[12px] text-slate-500 mt-1">streak · best {hydrated ? s.longestStreak : 0}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {DAYS.map((d, i) => {
              const ago = dow - i;
              const lit = ago >= 0 && ago < streak;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${lit ? "bg-orange-500 text-white shadow-[0_2px_0_#C2410C]" : i === dow ? "bg-slate-100 ring-2 ring-orange-300" : "bg-slate-100 text-slate-400"}`}>
                    {lit ? <Flame size={14} className="fill-white" /> : null}
                  </span>
                  <span className={`text-[10px] font-bold ${i === dow ? "text-slate-900" : "text-slate-400"}`}>{d}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Link href="/warmup" className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <span className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Dumbbell size={22} className="text-emerald-600" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-slate-900">Daily warmup</div>
            <div className="text-[12px] text-slate-500 truncate">{due > 0 ? `${due} missed concept${due > 1 ? "s" : ""} due` : hydrated && s.warmupDoneDay === today ? "Done for today ✓" : "Spaced-repetition review"}</div>
          </div>
          {due > 0 ? <span className="readout rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">{due}</span> : <ChevronRight size={18} className="text-slate-400" />}
        </Link>

        <Link href="/codex" className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <span className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
            <BookMarked size={22} className="text-blue-600" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-slate-900">Field Codex</div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(codexHave / codexTotal) * 100}%` }} />
            </div>
            <div className="text-[11.5px] text-slate-500 mt-1 readout">
              {codexHave}/{codexTotal} cheat sheets
            </div>
          </div>
        </Link>

        <Link href="/exam" className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <span className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center">
            <GraduationCap size={22} className="text-red-600" />
          </span>
          <div className="flex-1">
            <div className="font-extrabold text-slate-900">DGMS Exam Simulator</div>
            <div className="text-[12px] text-slate-500">25 questions · 30 min · derivations</div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
      </aside>
    </div>
  );
}
