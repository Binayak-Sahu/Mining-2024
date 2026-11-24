"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Trash2, Unlock, Zap, BookOpen, BookMarked, Sigma, Flame, Trophy, HeartCrack, Repeat, Sun, Moon, MonitorSmartphone, Volume2, VolumeX, Palette } from "lucide-react";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor, RANKS } from "@/lib/ranks";
import { useHydrated } from "@/lib/useHydrated";
import { addDays, todayKey } from "@/lib/date";
import { allLessons, allCodex } from "@/content";
import { usePrefs, type ThemePref } from "@/lib/prefs";
import { SyncCard } from "./SyncCard";

const THEMES: { v: ThemePref; label: string; Icon: typeof Sun }[] = [
  { v: "system", label: "Device", Icon: MonitorSmartphone },
  { v: "light", label: "Daylight", Icon: Sun },
  { v: "dark", label: "Shift mode", Icon: Moon },
];

export function Profile() {
  const hydrated = useHydrated();
  const s = useStrata();
  const prefs = usePrefs();
  const [confirm, setConfirm] = useState(false);
  if (!hydrated) return null;

  const { rank, next, progress, index } = rankFor(s.xp);
  const total = allLessons().length;
  const done = Object.keys(s.lessons).length;
  const today = todayKey();
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const maxDay = Math.max(1, ...days.map((d) => s.xpByDay[d] ?? 0));

  const stats = [
    { label: "Total XP", v: s.xp, Icon: Zap, c: "#F59E0B" },
    { label: "Lessons mastered", v: `${done}/${total}`, Icon: Trophy, c: "#10B981" },
    { label: "Codex sheets", v: `${Object.keys(s.codex).length}/${allCodex().length}`, Icon: BookMarked, c: "#3B82F6" },
    { label: "Verified formulas", v: Object.keys(s.formulas).length, Icon: Sigma, c: "#8B5CF6" },
    { label: "Current streak", v: liveStreak(s.streak, s.lastActiveDay), Icon: Flame, c: "#F97316" },
    { label: "Longest streak", v: s.longestStreak, Icon: Flame, c: "#EA580C" },
    { label: "Hearts lost", v: s.heartsLost, Icon: HeartCrack, c: "#F43F5E" },
    { label: "SRS concepts", v: Object.keys(s.srs).length, Icon: Repeat, c: "#0EA5E9" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-5 py-5 sm:py-8 space-y-4 sm:space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[28px] p-5 sm:p-7 text-white" style={{ background: "radial-gradient(120% 140% at 0% 0%, #4338CA 0%, #1E1B4B 55%, #0B0F19 100%)", boxShadow: "var(--shadow-pop)" }}>
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center readout text-2xl sm:text-3xl font-black shadow-[0_6px_0_#3730A3] shrink-0">{rank.badge}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#C7D2FE]">Current competency</div>
            <div className="text-[24px] sm:text-[30px] leading-tight font-extrabold tracking-tight text-balance">{rank.title}</div>
            <div className="mt-3 h-3 rounded-full bg-white/15 overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1 }} />
            </div>
            <div className="readout text-[12px] text-[#C7D2FE] mt-1.5">{next ? `${s.xp} / ${next.min} XP → ${next.title}` : `${s.xp} XP · maximum rank`}</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((x, i) => (
          <motion.div key={x.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card p-4">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${x.c}1f` }}>
              <x.Icon size={18} color={x.c} />
            </span>
            <div className="readout text-[22px] font-extrabold text-slate-900 mt-2 leading-none">{x.v}</div>
            <div className="text-[11.5px] text-slate-500 font-semibold mt-1">{x.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-5">
        <div className="card p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3">Activity · last 28 days</div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            {days.map((d) => {
              const v = s.xpByDay[d] ?? 0;
              const a = v === 0 ? 0 : 0.3 + 0.7 * (v / maxDay);
              return <div key={d} title={`${d}: ${v} XP`} className="aspect-square rounded-lg bg-slate-100" style={v ? { background: `rgba(16,185,129,${a})`, boxShadow: "0 2px 0 rgba(4,120,87,0.35)" } : undefined} />;
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3">Rank ladder</div>
          <ol className="space-y-2">
            {RANKS.map((r, i) => (
              <li key={r.title} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === index ? "bg-slate-900 text-slate-50 shadow-[0_3px_0_var(--n-950)]" : i < index ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-400"}`}>
                <span className="readout w-8 font-extrabold">{r.badge}</span>
                <span className="flex-1 font-bold text-[14px]">{r.title}</span>
                <span className="readout text-[11px]">{r.min} XP</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5">
          <Palette size={13} /> Appearance & sound
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ v, label, Icon }) => (
            <button key={v} type="button" data-on={prefs.theme === v} onClick={() => prefs.setTheme(v)} className="tile-3d flex flex-col items-center gap-1.5 py-3 text-[12.5px] font-bold text-slate-700 data-[on=true]:text-blue-700">
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
        <button type="button" data-silent="1" onClick={prefs.toggleMuted} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left" data-on={!prefs.muted}>
          {prefs.muted ? <VolumeX size={20} className="text-slate-500" /> : <Volume2 size={20} className="text-blue-600" />}
          <span className="flex-1">
            <span className="block font-bold text-[14px] text-slate-900">Tactile sound & haptics</span>
            <span className="block text-[12.5px] text-slate-500">Soft synthesized clicks, chimes and vibration on phones.</span>
          </span>
          <span className={`readout text-[12px] font-extrabold ${prefs.muted ? "text-slate-400" : "text-blue-600"}`}>{prefs.muted ? "OFF" : "ON"}</span>
        </button>
      </div>

      <SyncCard />

      <div className="card p-5 space-y-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Study settings</div>
        <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-slate-50 px-4 py-3">
          <input type="checkbox" checked={s.freeRoam} onChange={(e) => s.setFreeRoam(e.target.checked)} className="w-5 h-5 accent-blue-500" />
          <Unlock size={18} className="text-blue-600 shrink-0" />
          <span className="text-[14px] text-slate-700">
            <b className="text-slate-900">Free-roam mode</b> — unlock every lesson and boss exam (for revision before DGMS exams)
          </span>
        </label>
        {!confirm ? (
          <button type="button" onClick={() => setConfirm(true)} className="btn-press inline-flex items-center gap-2 rounded-xl border-2 border-red-300 px-4 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50">
            <Trash2 size={15} /> Reset all progress
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm rounded-xl bg-red-50 p-3">
            <span className="text-red-700 font-bold flex-1 min-w-[200px]">Erase XP, streaks, codex and SRS queue?</span>
            <button
              type="button"
              onClick={() => {
                s.resetAll();
                setConfirm(false);
              }}
              className="btn-3d tone-crit px-4 py-2 text-[12px]"
            >
              Erase
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="btn-3d tone-ghost px-4 py-2 text-[12px]">
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-amber-50 p-4 text-[12.5px] text-slate-600 flex gap-3 leading-relaxed shadow-[inset_0_0_0_1.5px_#F59E0B33]">
        <Shield size={18} className="shrink-0 text-amber-600 mt-0.5" />
        <p>
          STRATA is a study aid. Statutory figures reflect commonly examined provisions of the Mines Act 1952, Mines Rules 1955, CMR 2017, MMR 1961, Mines Rescue Rules 1985, CEA safety regulations and DGMS circulars, and the transition to the OSH&WC Code 2020. Always verify against the current gazette
          text, DGMS circulars and your mine&apos;s approved Safety Management Plan before acting in the field.
        </p>
      </div>
      <p className="sr-only">
        <BookOpen aria-hidden /> Profile
      </p>
    </div>
  );
}
