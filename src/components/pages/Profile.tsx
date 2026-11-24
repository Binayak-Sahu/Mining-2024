"use client";

import { useState } from "react";
import { Shield, Trash2, Unlock } from "lucide-react";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor, RANKS } from "@/lib/ranks";
import { useHydrated } from "@/lib/useHydrated";
import { addDays, todayKey } from "@/lib/date";
import { allLessons, allCodex } from "@/content";
import { SyncCard } from "./SyncCard";

export function Profile() {
  const hydrated = useHydrated();
  const s = useStrata();
  const [confirm, setConfirm] = useState(false);
  if (!hydrated) return null;

  const { rank, index } = rankFor(s.xp);
  const total = allLessons().length;
  const done = Object.keys(s.lessons).length;
  const today = todayKey();
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const maxDay = Math.max(1, ...days.map((d) => s.xpByDay[d] ?? 0));

  const stats = [
    { label: "Total XP", v: s.xp },
    { label: "Lessons mastered", v: `${done}/${total}` },
    { label: "Codex sheets", v: `${Object.keys(s.codex).length}/${allCodex().length}` },
    { label: "Verified formulas", v: Object.keys(s.formulas).length },
    { label: "Current streak", v: liveStreak(s.streak, s.lastActiveDay) },
    { label: "Longest streak", v: s.longestStreak },
    { label: "Hearts lost", v: s.heartsLost },
    { label: "SRS concepts", v: Object.keys(s.srs).length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center readout text-xl font-extrabold">{rank.badge}</div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current competency</div>
          <div className="text-2xl font-extrabold">{rank.title}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((x) => (
          <div key={x.label} className="card p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{x.label}</div>
            <div className="readout text-xl font-extrabold">{x.v}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Activity · last 28 days</div>
        <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
          {days.map((d) => {
            const v = s.xpByDay[d] ?? 0;
            const a = v === 0 ? 0.08 : 0.25 + 0.75 * (v / maxDay);
            return <div key={d} title={`${d}: ${v} XP`} className="aspect-square rounded" style={{ background: `rgba(16,185,129,${a})` }} />;
          })}
        </div>
      </div>

      <div className="card p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Rank ladder</div>
        <ol className="space-y-2">
          {RANKS.map((r, i) => (
            <li key={r.title} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i === index ? "bg-slate-900 text-white" : i < index ? "bg-emerald-50" : "bg-slate-50 text-slate-400"}`}>
              <span className="readout w-8 font-bold">{r.badge}</span>
              <span className="flex-1 font-semibold">{r.title}</span>
              <span className="readout text-xs">{r.min} XP</span>
            </li>
          ))}
        </ol>
      </div>

      <SyncCard />

      <div className="card p-5 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Settings</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={s.freeRoam} onChange={(e) => s.setFreeRoam(e.target.checked)} className="w-5 h-5 accent-blue-500" />
          <Unlock size={16} />
          <span className="text-sm">
            <b>Free-roam mode</b> — unlock every lesson and boss exam (for revision before DGMS exams)
          </span>
        </label>
        {!confirm ? (
          <button type="button" onClick={() => setConfirm(true)} className="btn-press inline-flex items-center gap-2 rounded-xl border-2 border-red-300 px-4 py-2 text-sm font-bold text-red-600">
            <Trash2 size={14} /> Reset all progress
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-700 font-semibold">Erase XP, streaks, codex and SRS queue?</span>
            <button
              type="button"
              onClick={() => {
                s.resetAll();
                setConfirm(false);
              }}
              className="btn-press rounded-lg bg-red-600 text-white px-3 py-1.5 font-bold"
            >
              Erase
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="btn-press rounded-lg border px-3 py-1.5">
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 p-4 text-xs text-slate-400 flex gap-2">
        <Shield size={16} className="shrink-0 text-amber-400" />
        <p>
          STRATA is a study aid. Statutory figures reflect commonly examined provisions of the Mines Act 1952, Mines Rules 1955, CMR 2017, MMR 1961, Mines Rescue Rules 1985, CEA safety regulations and DGMS circulars, and the transition to the OSH&WC Code 2020. Always verify against the current gazette
          text, DGMS circulars and your mine&apos;s approved Safety Management Plan before acting in the field.
        </p>
      </div>
    </div>
  );
}
