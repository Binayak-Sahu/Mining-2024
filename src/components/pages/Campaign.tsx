"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Dumbbell, BookMarked, ChevronRight, Lock, Crown, Zap } from "lucide-react";
import { UNITS } from "@/content";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor, RANKS } from "@/lib/ranks";
import { unitProgress, lessonUnlocked, bossUnlocked } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { todayKey } from "@/lib/date";
import { allCodex } from "@/content";

function Ring({ f, size = 64, color = "#10B981", children }: { f: number; size?: number; color?: string; children?: React.ReactNode }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1E293B" strokeWidth={6} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - f) }}
          transition={{ duration: 0.8 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Campaign() {
  const hydrated = useHydrated();
  const s = useStrata();
  const done = hydrated ? s.lessons : {};
  const xp = hydrated ? s.xp : 0;
  const { rank, next, progress, index } = rankFor(xp);
  const today = todayKey();
  const due = hydrated ? Object.values(s.srs).filter((i) => i.due <= today).length : 0;
  const codexTotal = allCodex().length;
  const codexHave = hydrated ? Object.keys(s.codex).length : 0;

  // Recommended next lesson: first unlocked, uncompleted lesson in curriculum order.
  let rec: { href: string; title: string; unit: string } | null = null;
  for (const u of UNITS) {
    const i = u.lessons.findIndex((l, k) => !done[l.id] && lessonUnlocked(u, k, done, s.freeRoam));
    if (i >= 0) {
      rec = { href: `/lesson/${u.lessons[i].id}`, title: u.lessons[i].title, unit: `Unit ${u.n}` };
      break;
    }
    if (!done[u.boss.id] && bossUnlocked(u, done, s.freeRoam) && u.lessons.length) {
      rec = { href: `/lesson/${u.boss.id}`, title: u.boss.title, unit: `Unit ${u.n} Boss` };
      break;
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_300px] gap-6">
      <section>
        <div className="mb-5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Campaign</h1>
          <p className="text-slate-400 text-sm mt-1">Ten units. Five-stage mastery loop. From strata genesis to statutory command.</p>
        </div>
        <div className="relative">
          <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-800" aria-hidden />
          <div className="space-y-3">
            {UNITS.map((u, k) => {
              const f = unitProgress(u, done);
              const boss = !!done[u.boss.id];
              return (
                <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.04 }}>
                  <Link href={`/unit/${u.id}`} className="group relative flex items-center gap-4 rounded-2xl p-2 pr-4 hover:bg-slate-800/60">
                    <div className="relative z-10 bg-[#0F172A] rounded-full">
                      <Ring f={f} size={64} color={boss ? "#F59E0B" : "#10B981"}>
                        {boss ? <Crown size={22} className="text-amber-400" /> : <span className="readout font-extrabold text-lg">{String(u.n).padStart(2, "0")}</span>}
                      </Ring>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">Unit {u.n} · {u.short}</div>
                      <div className="font-bold text-slate-50 leading-tight">{u.title}</div>
                      <div className="text-xs text-slate-400 truncate">{u.blurb}</div>
                    </div>
                    <div className="hidden sm:block readout text-xs text-slate-400">{Math.round(f * 100)}%</div>
                    <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 self-start">
        <div className="card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Statutory rank</div>
          <div className="text-lg font-extrabold">{rank.title}</div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
            <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} />
          </div>
          <div className="readout text-xs text-slate-500 mt-1 flex justify-between">
            <span className="flex items-center gap-1">
              <Zap size={12} /> {xp} XP
            </span>
            <span>{next ? `${next.min} → ${next.title}` : "Max rank"}</span>
          </div>
          <div className="flex gap-1 mt-3">
            {RANKS.map((r, i) => (
              <div key={r.title} title={r.title} className={`flex-1 text-center rounded-md py-1 readout text-[10px] font-bold ${i <= index ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                {r.badge}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <Flame size={30} className="text-amber-500" />
          <div>
            <div className="readout text-2xl font-extrabold">{hydrated ? liveStreak(s.streak, s.lastActiveDay) : 0} day</div>
            <div className="text-xs text-slate-500">streak · best {hydrated ? s.longestStreak : 0}</div>
          </div>
        </div>

        {rec && (
          <Link href={rec.href} className="card p-4 block hover:ring-2 ring-blue-500">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Up next · {rec.unit}</div>
            <div className="font-bold">{rec.title}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase text-slate-900">
              Start shift <ChevronRight size={14} />
            </div>
          </Link>
        )}

        <Link href="/warmup" className="card p-4 flex items-center gap-3 hover:ring-2 ring-emerald-500">
          <Dumbbell size={26} className="text-emerald-600" />
          <div className="flex-1">
            <div className="font-bold">Daily warmup</div>
            <div className="text-xs text-slate-500">
              {due > 0 ? `${due} missed concept${due > 1 ? "s" : ""} due for review` : hydrated && s.warmupDoneDay === today ? "Done for today ✓" : "Spaced-repetition review"}
            </div>
          </div>
          {due > 0 && <span className="readout rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">{due}</span>}
        </Link>

        <Link href="/codex" className="card p-4 flex items-center gap-3 hover:ring-2 ring-blue-500">
          <BookMarked size={26} className="text-blue-600" />
          <div className="flex-1">
            <div className="font-bold">Field Codex</div>
            <div className="text-xs text-slate-500">
              {codexHave}/{codexTotal} cheat sheets unlocked
            </div>
          </div>
          {codexHave === 0 && <Lock size={16} className="text-slate-400" />}
        </Link>
      </aside>
    </div>
  );
}
