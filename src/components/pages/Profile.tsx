"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stageSlide } from "@/lib/motion";
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
    { label: "Total XP", v: s.xp, Icon: Zap },
    { label: "Lessons mastered", v: `${done}/${total}`, Icon: Trophy },
    { label: "Codex sheets", v: `${Object.keys(s.codex).length}/${allCodex().length}`, Icon: BookMarked },
    { label: "Verified formulas", v: Object.keys(s.formulas).length, Icon: Sigma },
    { label: "Current streak", v: liveStreak(s.streak, s.lastActiveDay), Icon: Flame },
    { label: "Longest streak", v: s.longestStreak, Icon: Flame },
    { label: "Hearts lost", v: s.heartsLost, Icon: HeartCrack },
    { label: "SRS concepts", v: Object.keys(s.srs).length, Icon: Repeat },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8 space-y-8">
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Rank badge: a §5.11-style tile, neutral (no gradient), badge text in --text */}
          <div className="unit-tile w-20 h-20 sm:w-24 sm:h-24 shrink-0 readout t-title" style={{ fontWeight: 800 }} aria-label={`Rank badge ${rank.badge}`}>
            {rank.badge}
          </div>
          <div className="min-w-0 flex-1">
            <div className="t-eyebrow">Current competency</div>
            <div className="t-title text-fg mt-1 text-balance">{rank.title}</div>
            <div className="ds-progress mt-3" aria-hidden>
              <motion.div className="ds-progress-fill" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={stageSlide} />
            </div>
            <div className="readout t-label text-fg-2 mt-2" style={{ fontWeight: 400 }}>{next ? `${s.xp} / ${next.min} XP → ${next.title}` : `${s.xp} XP · maximum rank`}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((x) => (
          <div key={x.label} className="card p-4">
            <span className="w-10 h-10 rounded-[12px] bg-surface-2 text-fg flex items-center justify-center" aria-hidden>
              <x.Icon size={20} />
            </span>
            <div className="readout t-heading text-fg mt-3" style={{ fontWeight: 800 }}>{x.v}</div>
            <div className="t-label text-fg-2" style={{ fontWeight: 400 }}>{x.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-8 md:gap-6">
        <div className="card p-5">
          <div className="t-eyebrow mb-4">Activity · last 28 days</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            {days.map((d) => {
              const v = s.xpByDay[d] ?? 0;
              const a = v === 0 ? 0 : 0.3 + 0.7 * (v / maxDay);
              return (
                <div key={d} title={`${d}: ${v} XP`} className="relative aspect-square rounded-[8px] bg-surface-2 overflow-hidden">
                  {v > 0 && <span className="absolute inset-0 bg-success" style={{ opacity: a }} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="t-eyebrow mb-4">Rank ladder</div>
          <ol className="space-y-2">
            {RANKS.map((r, i) => (
              <li key={r.title} className={`flex items-center gap-3 rounded-[12px] px-3 py-2 t-label ${i === index ? "bg-ink text-canvas" : i < index ? "bg-success-tint text-success-tint-text" : "bg-surface-2 text-fg-3"}`} aria-current={i === index ? "step" : undefined}>
                <span className="readout w-8" style={{ fontWeight: 800 }}>{r.badge}</span>
                <span className="flex-1" style={{ fontWeight: 700 }}>{r.title}</span>
                <span className="readout" style={{ fontWeight: 400 }}>{r.min} XP</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="t-eyebrow flex items-center gap-2">
          <Palette size={16} aria-hidden /> Appearance & sound
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ v, label, Icon }) => (
            <button key={v} type="button" data-on={prefs.theme === v} aria-pressed={prefs.theme === v} onClick={() => prefs.setTheme(v)} className="tile-3d flex flex-col items-center gap-2 py-3 t-label text-fg data-[on=true]:text-action-tint-text" style={{ fontWeight: 700 }}>
              <Icon size={20} aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <Toggle on={!prefs.muted} onClick={prefs.toggleMuted} Icon={prefs.muted ? VolumeX : Volume2} title="Tactile sound & haptics" desc="Soft synthesized clicks, chimes and vibration on phones." silent />
      </div>

      <div className="card p-5 space-y-3">
        <div className="t-eyebrow flex items-center gap-2">
          <BookOpen size={16} aria-hidden /> Lesson pace
        </div>
        <Toggle on={prefs.theoryFirst} onClick={() => prefs.setTheoryFirst(!prefs.theoryFirst)} Icon={BookOpen} title="Theory-first lessons" desc="Equation and numerical stages become optional “Bonus maths”, so a lesson completes without them. They still earn XP and still appear in the exam simulator." />
      </div>

      <div className="card p-5 space-y-3">
        <div className="t-eyebrow flex items-center gap-2">
          <KeyRound size={16} aria-hidden /> Inspector Mode
        </div>
        <Toggle on={prefs.masterUnlock} onClick={() => setInspector(!prefs.masterUnlock)} Icon={KeyRound} title="Open every lesson, boss and Codex sheet" desc="Inspector runs are sandboxes: no XP, hearts, streak, completions, review queue or Codex unlocks are saved. Shortcut: Shift + M." />
        {prefs.masterUnlock && <PhoneKit />}
      </div>

      <SyncCard />
      <div className="card p-5 space-y-3">
        <div className="t-eyebrow">Troubleshooting</div>
        <RepairButton />
      </div>
      <p className="text-center readout t-label text-fg-2" style={{ fontWeight: 400 }}>STRATA build {BUILD}</p>

      <div className="card p-5 space-y-4">
        <div className="t-eyebrow">Study settings</div>
        <label className="flex items-center gap-3 cursor-pointer rounded-[12px] bg-surface-2 px-4 py-3 min-h-[48px]">
          <input type="checkbox" checked={s.freeRoam} onChange={(e) => s.setFreeRoam(e.target.checked)} className="w-5 h-5 shrink-0 accent-[var(--action)]" />
          <Unlock size={18} className="text-fg-2 shrink-0" aria-hidden />
          <span className="t-label text-fg-2" style={{ fontWeight: 400 }}>
            <b className="text-fg">Free-roam mode</b> — unlock every lesson and boss exam (for revision before DGMS exams)
          </span>
        </label>
        <Dialog.Root open={confirm} onOpenChange={setConfirm}>
          <Dialog.Trigger asChild>
            <button type="button" className="btn-3d btn-sm tone-ghost" style={{ ["--t" as string]: "var(--danger-tint-text)" }}>
              <Trash2 size={16} aria-hidden /> Reset all progress
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[fadein_160ms_ease-out]" />
            <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] ds-pop p-6 space-y-4 focus:outline-none">
              <Dialog.Title className="t-heading text-fg">Erase all progress?</Dialog.Title>
              <Dialog.Description className="t-secondary">XP, streaks, completed lessons, Field Codex unlocks, exam history and the review queue on this device will be deleted. Export your progress first if you want a backup.</Dialog.Description>
              <div className="flex gap-3 pt-1">
                <Dialog.Close asChild>
                  <button type="button" className="btn-3d tone-ghost flex-1">
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
                  className="btn-3d tone-crit flex-1"
                >
                  Erase
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="rounded-[20px] bg-energy-tint p-5 t-label text-fg flex gap-3" style={{ fontWeight: 400 }}>
        <Shield size={18} className="shrink-0 text-energy-tint-text mt-0.5" aria-hidden />
        <p>
          STRATA is a study aid. Statutory figures reflect commonly examined provisions of the Mines Act 1952, Mines Rules 1955, CMR 2017, MMR 1961, Mines Rescue Rules 1985, CEA safety regulations and DGMS circulars, and the transition to the OSH&WC Code 2020. Always verify against the current gazette
          text, DGMS circulars and your mine&apos;s approved Safety Management Plan before acting in the field.
        </p>
      </div>
    </div>
  );
}

/** A settings row that switches one preference on or off (selectable tile, §5.2). */
function Toggle({ on, onClick, Icon, title, desc, silent }: { on: boolean; onClick: () => void; Icon: typeof Sun; title: string; desc: string; silent?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} data-silent={silent ? "1" : undefined} onClick={onClick} data-on={on} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
      <Icon size={20} className={on ? "text-action-tint-text shrink-0" : "text-fg-2 shrink-0"} aria-hidden />
      <span className="flex-1 min-w-0">
        <span className="block t-label text-fg" style={{ fontWeight: 700 }}>{title}</span>
        <span className="block t-label text-fg-2" style={{ fontWeight: 400 }}>{desc}</span>
      </span>
      <span className={`readout t-label shrink-0 ${on ? "text-action-tint-text" : "text-fg-2"}`} style={{ fontWeight: 800 }}>{on ? "On" : "Off"}</span>
    </button>
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
        <button type="button" disabled={!reports.length} onClick={() => downloadJson(`strata-reports-${new Date().toISOString().slice(0, 10)}.json`, { app: "strata", kind: "reports", build: BUILD, reports })} className="tile-3d flex-1 flex items-center gap-2 px-4 py-3 text-left min-h-[48px] disabled:text-fg-3">
          <Download size={18} className="shrink-0" aria-hidden />
          <span className="flex-1 t-label" style={{ fontWeight: 700 }}>Export reports</span>
          <span className="readout t-label" style={{ fontWeight: 800 }}>{reports.length}</span>
        </button>
        {reports.length > 0 && (
          <button type="button" onClick={clear} className="tile-3d px-4 py-3 min-h-[48px] t-label text-fg" style={{ fontWeight: 700 }}>
            Clear
          </button>
        )}
      </div>
      <p className="t-label text-fg-2 flex items-center gap-2" style={{ fontWeight: 400 }}>
        <Flag size={16} aria-hidden /> Tap the amber flag on any screen to save a report.
      </p>
      <button type="button" role="switch" aria-checked={fps} data-on={fps} onClick={() => setFps(!fps)} className="tile-3d w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-left">
        <Gauge size={18} className={fps ? "text-action-tint-text" : "text-fg-2"} aria-hidden />
        <span className="flex-1 t-label text-fg" style={{ fontWeight: 700 }}>FPS meter</span>
        <span className={`readout t-label ${fps ? "text-action-tint-text" : "text-fg-2"}`} style={{ fontWeight: 800 }}>{fps ? "On" : "Off"}</span>
      </button>
      <Link href="/sound-test" className="tile-3d w-full flex items-center gap-3 px-4 py-3 min-h-[48px] text-left">
        <Music size={18} className="text-fg-2" aria-hidden />
        <span className="flex-1 t-label text-fg" style={{ fontWeight: 700 }}>Sound test</span>
      </Link>
    </div>
  );
}
