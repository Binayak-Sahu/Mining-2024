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
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { setInspector } from "@/lib/inspector";
import { KeyRound, Flag, Gauge, Music, Download } from "lucide-react";
import Link from "next/link";
import { RepairButton } from "@/components/shell/RepairButton";
import { BUILD, downloadJson, useReports } from "@/lib/reports";

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

      <div className="card p-5 space-y-3">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5">
          <BookOpen size={13} /> Lesson pace
        </div>
        <button type="button" role="switch" aria-checked={prefs.theoryFirst} onClick={() => prefs.setTheoryFirst(!prefs.theoryFirst)} data-on={prefs.theoryFirst} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
          <BookOpen size={20} className={prefs.theoryFirst ? "text-blue-700" : "text-slate-500"} />
          <span className="flex-1">
            <span className="block font-bold text-[14px] text-slate-900">Theory-first lessons</span>
            <span className="block text-[12.5px] text-slate-500">Equation and numerical stages become optional “Bonus maths”, so a lesson completes without them. They still earn XP and still appear in the exam simulator.</span>
          </span>
          <span className={`readout text-[12px] font-extrabold ${prefs.theoryFirst ? "text-blue-700" : "text-slate-400"}`}>{prefs.theoryFirst ? "ON" : "OFF"}</span>
        </button>
      </div>

      <div className="card p-5 space-y-3">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5">
          <KeyRound size={13} /> Inspector Mode
        </div>
        <button type="button" role="switch" aria-checked={prefs.masterUnlock} onClick={() => setInspector(!prefs.masterUnlock)} data-on={prefs.masterUnlock} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
          <KeyRound size={20} className={prefs.masterUnlock ? "text-amber-700" : "text-slate-500"} />
          <span className="flex-1">
            <span className="block font-bold text-[14px] text-slate-900">Open every lesson, boss and Codex sheet</span>
            <span className="block text-[12.5px] text-slate-500">Inspector runs are sandboxes: no XP, hearts, streak, completions, review queue or Codex unlocks are saved. Shortcut: Shift + M.</span>
          </span>
          <span className={`readout text-[12px] font-extrabold ${prefs.masterUnlock ? "text-amber-700" : "text-slate-400"}`}>{prefs.masterUnlock ? "ON" : "OFF"}</span>
        </button>
        {prefs.masterUnlock && <PhoneKit />}
      </div>

      <SyncCard />
      <div className="card p-5 space-y-3">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Troubleshooting</div>
        <RepairButton />
      </div>
      <p className="text-center readout text-[12px] text-slate-500">STRATA build {BUILD}</p>

      <div className="card p-5 space-y-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Study settings</div>
        <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-slate-50 px-4 py-3">
          <input type="checkbox" checked={s.freeRoam} onChange={(e) => s.setFreeRoam(e.target.checked)} className="w-5 h-5 accent-blue-500" />
          <Unlock size={18} className="text-blue-600 shrink-0" />
          <span className="text-[14px] text-slate-700">
            <b className="text-slate-900">Free-roam mode</b> — unlock every lesson and boss exam (for revision before DGMS exams)
          </span>
        </label>
        <Dialog.Root open={confirm} onOpenChange={setConfirm}>
          <Dialog.Trigger asChild>
            <button type="button" className="btn-press inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-[13px] font-bold text-red-700 hover:bg-red-50">
              <Trash2 size={15} /> Reset all progress
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[fadein_160ms_ease-out]" />
            <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] card card-pop p-6 space-y-4 focus:outline-none">
              <Dialog.Title className="text-[19px] font-extrabold text-slate-900">Erase all progress?</Dialog.Title>
              <Dialog.Description className="text-[14px] text-slate-600 leading-relaxed">
                XP, streaks, completed lessons, Field Codex unlocks, exam history and the review queue on this device will be deleted. Export your progress first if you want a backup.
              </Dialog.Description>
              <div className="flex gap-3 pt-1">
                <Dialog.Close asChild>
                  <button type="button" className="btn-3d tone-ghost flex-1 py-3 text-[12.5px]">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => {
                    s.resetAll();
                    setConfirm(false);
                    toast("Progress erased");
                  }}
                  className="btn-3d tone-crit flex-1 py-3 text-[12.5px]"
                >
                  Erase
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="rounded-2xl bg-amber-50 p-4 text-[12.5px] text-slate-600 flex gap-3 leading-relaxed shadow-[inset_0_0_0_1.5px_#F59E0B33]">
        <Shield size={18} className="shrink-0 text-amber-600 mt-0.5" />
        <p>
          STRATA is a study aid. Statutory figures reflect commonly examined provisions of the Mines Act 1952, Mines Rules 1955, CMR 2017, MMR 1961, Mines Rescue Rules 1985, CEA safety regulations and DGMS circulars, and the transition to the OSH&WC Code 2020. Always verify against the current gazette
          text, DGMS circulars and your mine&apos;s approved Safety Management Plan before acting in the field.
        </p>
      </div>
      <QaDesignLink />
      <p className="sr-only">
        <BookOpen aria-hidden /> Profile
      </p>
    </div>
  );
}

/** Link to the /design-system sandbox, shown to everyone while Phase 15.5 runs. Remove in 15.5e (see ROADMAP). */
function QaDesignLink() {
  return (
    <Link href="/design-system" className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
      <Palette size={18} className="text-slate-600" />
      <span className="flex-1 text-[14px] font-bold text-slate-900">Design system sandbox</span>
    </Link>
  );
}

/** Inspector-only phone-testing kit: saved reports (export as JSON), FPS meter, sound test. */
function PhoneKit() {
  const reports = useReports((r) => r.reports);
  const fps = useReports((r) => r.fps);
  const setFps = useReports((r) => r.setFps);
  const clear = useReports((r) => r.clear);
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <button type="button" disabled={!reports.length} onClick={() => downloadJson(`strata-reports-${new Date().toISOString().slice(0, 10)}.json`, { app: "strata", kind: "reports", build: BUILD, reports })} className="tile-3d flex-1 flex items-center gap-2 px-4 py-3 text-left disabled:opacity-60">
          <Download size={18} className="text-slate-600" />
          <span className="flex-1 text-[14px] font-bold text-slate-900">Export reports</span>
          <span className="readout text-[12px] font-extrabold text-slate-600">{reports.length}</span>
        </button>
        {reports.length > 0 && (
          <button type="button" onClick={clear} className="tile-3d px-4 py-3 text-[13px] font-bold text-slate-600">
            Clear
          </button>
        )}
      </div>
      <p className="text-[12.5px] text-slate-500 flex items-center gap-1.5">
        <Flag size={13} /> Tap the amber flag on any screen to save a report.
      </p>
      <button type="button" role="switch" aria-checked={fps} onClick={() => setFps(!fps)} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
        <Gauge size={18} className={fps ? "text-emerald-700" : "text-slate-500"} />
        <span className="flex-1 text-[14px] font-bold text-slate-900">FPS meter</span>
        <span className={`readout text-[12px] font-extrabold ${fps ? "text-emerald-700" : "text-slate-400"}`}>{fps ? "ON" : "OFF"}</span>
      </button>
      <Link href="/sound-test" className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
        <Music size={18} className="text-slate-600" />
        <span className="flex-1 text-[14px] font-bold text-slate-900">Sound test</span>
      </Link>
    </div>
  );
}
