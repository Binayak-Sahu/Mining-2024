"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock, Crown, Star, Play, ChevronRight } from "lucide-react";
import type { Unit } from "@/lib/types";
import type { LessonRecord } from "@/lib/store";
import { lessonUnlocked, bossUnlocked, unitProgress } from "@/lib/progress";
import { HEARTS_PER_LESSON } from "@/lib/ranks";
import { stratumFor } from "./strata";

const ROW = 112;

/** Horizontal offset (% of band width from centre) for node i — a gentle S-curve per unit. */
function offset(i: number, phase: number): number {
  return Math.sin(i * 1.05 + phase) * 26;
}

export function ProgressRing({ f, size, color, track = "rgba(148,163,184,0.25)", width = 6, children }: { f: number; size: number; color: string; track?: string; width?: number; children?: React.ReactNode }) {
  const r = size / 2 - width / 2 - 1;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={width} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - f) }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

type NodeState = "done" | "current" | "open" | "locked" | "inspect";

/**
 * One geological stratum on the expedition map: a textured band with its unit header and the unit's
 * lessons laid out on a winding path, ending in a crowned Boss Exam node.
 */
export function ExpeditionPath({
  unit,
  done,
  freeRoam,
  currentId,
  header = true,
  index = 0,
  master = false,
}: {
  unit: Unit;
  done: Record<string, LessonRecord>;
  freeRoam: boolean;
  currentId: string | null;
  header?: boolean;
  index?: number;
  /** Inspector Mode: locked nodes become playable sandboxes, badged MASTER. */
  master?: boolean;
}) {
  const st = stratumFor(unit.n);
  const nodes = [...unit.lessons.map((l, i) => ({ lesson: l, i, boss: false })), { lesson: unit.boss, i: unit.lessons.length, boss: true }];
  const phase = unit.n * 0.8;
  const f = unitProgress(unit, done);
  const H = nodes.length * ROW;
  const pts = nodes.map((_, k) => [50 + offset(k, phase), k * ROW + ROW / 2] as const);

  const stateOf = (n: (typeof nodes)[number]): NodeState => {
    if (done[n.lesson.id]) return "done";
    const open = n.boss ? bossUnlocked(unit, done, freeRoam) : lessonUnlocked(unit, n.i, done, freeRoam);
    if (!open) return master ? "inspect" : "locked";
    return n.lesson.id === currentId ? "current" : "open";
  };
  const states = nodes.map(stateOf);

  return (
    <section
      className="stratum rounded-[28px] overflow-hidden"
      style={{
        background: `linear-gradient(180deg, color-mix(in oklab, ${st.tint} 30%, var(--surface)) 0%, color-mix(in oklab, ${st.tint} 16%, var(--surface)) 100%)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${st.tint} 40%, transparent), var(--shadow-card)`,
        ["--texture" as string]: st.texture,
      }}
      aria-label={`Unit ${unit.n}: ${unit.title}`}
    >
      {header && (
        <Link href={`/unit/${unit.id}`} className="group relative z-[1] flex items-center gap-3 sm:gap-4 p-4 sm:p-5 pb-2">
          <ProgressRing f={f} size={56} color={st.accent} width={5}>
            {f >= 1 ? <Crown size={20} color={st.accent} className="fill-current" /> : <span className="readout text-[15px] font-extrabold text-slate-900">{String(unit.n).padStart(2, "0")}</span>}
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em]" style={{ color: st.accent }}>
              <span className="readout normal-case tracking-normal rounded-md px-1.5 py-0.5 bg-surface/70 text-slate-600">{st.depth}</span>
              <span className="truncate">{st.name}</span>
            </div>
            <div className="font-extrabold text-[17px] sm:text-lg leading-snug text-slate-900 mt-0.5 text-balance">{unit.title}</div>
            <div className="text-[12.5px] text-slate-600 line-clamp-1">{unit.blurb}</div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 group-hover:text-slate-900 shrink-0">
            <span className="readout">{Math.round(f * 100)}%</span> <ChevronRight size={16} />
          </span>
        </Link>
      )}

      <div className="relative mx-auto max-w-md" style={{ height: H + 8, marginTop: header ? 28 : 40 }}>
        {/* winding trail */}
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
          {pts.slice(1).map(([x2, y2], k) => {
            const [x1, y1] = pts[k];
            const d = `M${x1} ${y1} C ${x1} ${y1 + ROW / 2}, ${x2} ${y2 - ROW / 2}, ${x2} ${y2}`;
            const lit = states[k] === "done";
            return (
              <g key={k}>
                <path d={d} fill="none" stroke="rgba(15,23,42,0.12)" strokeWidth={14} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d={d} fill="none" stroke={lit ? st.accent : "var(--surface)"} strokeOpacity={lit ? 0.9 : 0.75} strokeWidth={lit ? 8 : 6} strokeLinecap="round" strokeDasharray={lit ? undefined : "2 12"} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>

        {nodes.map((n, k) => {
          const s = states[k];
          const [x, y] = pts[k];
          const size = n.boss ? 80 : 66;
          const rec = done[n.lesson.id];
          const perfect = rec && rec.bestHearts >= HEARTS_PER_LESSON;
          const face =
            s === "locked"
              ? { c: "var(--n-200)", e: "var(--n-300)", t: "var(--n-400)" }
              : s === "inspect"
                ? { c: "#64748B", e: "#334155", t: "#fff" }
              : n.boss
                ? { c: s === "done" ? "#F59E0B" : "#EF4444", e: s === "done" ? "#B45309" : "#991B1B", t: "#fff" }
                : s === "done"
                  ? { c: st.accent, e: st.edge, t: "#fff" }
                  : { c: "#3B82F6", e: "#1D4ED8", t: "#fff" };
          const Icon = s === "locked" ? Lock : s === "inspect" ? (n.boss ? Crown : Play) : n.boss ? Crown : s === "done" ? (perfect ? Star : Check) : Play;
          const label = `${n.boss ? "Boss Exam" : `Lesson ${unit.n}.${n.i + 1}`}: ${n.lesson.title}${s === "locked" ? " (locked)" : s === "done" ? " (completed)" : s === "inspect" ? " (Inspector sandbox, progress not saved)" : ""}`;

          const body = (
            <motion.span
              whileHover={s !== "locked" ? { scale: 1.06 } : undefined}
              whileTap={s !== "locked" ? { scale: 0.94, y: 5 } : undefined}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
              className="relative flex items-center justify-center rounded-full"
              style={{ width: size, height: size - 6, background: face.c, color: face.t, boxShadow: `0 6px 0 ${face.e}, 0 12px 18px -8px rgba(15,23,42,0.45)` }}
            >
              <span className="absolute inset-x-3 top-1.5 h-3 rounded-full bg-white/25" aria-hidden />
              <Icon size={n.boss ? 32 : 26} strokeWidth={2.6} className={s === "done" || n.boss ? "fill-white/30" : ""} />
            </motion.span>
          );

          return (
            <motion.div
              key={n.lesson.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${x}%`, top: y }}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "40px" }}
              transition={{ type: "spring", stiffness: 380, damping: 22, delay: Math.min(index, 2) * 0.05 + k * 0.03 }}
            >
              {s === "inspect" && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 rounded-md bg-amber-400 text-[#422006] px-1.5 py-[1px] text-[9px] font-black tracking-[0.12em] shadow-[0_2px_0_#B45309]">MASTER</span>
              )}
              {s === "current" && (
                <>
                  <span className="bob absolute left-1/2 -top-11 z-10 rounded-xl bg-surface px-3 py-1.5 text-[12px] font-black tracking-[0.12em] text-blue-600 shadow-[0_3px_0_var(--n-200),0_10px_20px_-8px_rgba(15,23,42,0.35)] whitespace-nowrap">
                    START
                    <span className="absolute left-1/2 -bottom-1.5 -ml-1.5 w-3 h-3 rotate-45 bg-surface" />
                  </span>
                  <motion.span className="absolute rounded-full pointer-events-none" style={{ top: -10, left: "50%", marginLeft: -(size + 20) / 2, width: size + 20, height: size + 14, border: "4px solid rgba(59,130,246,0.45)" }} animate={{ scale: [1, 1.12, 1], opacity: [0.9, 0.25, 0.9] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} aria-hidden />
                </>
              )}
              {s === "locked" ? (
                <span title="Complete the previous lesson to unlock" aria-label={label} role="img">
                  {body}
                </span>
              ) : (
                <Link href={`/lesson/${n.lesson.id}`} aria-label={label} className="rounded-full">
                  {body}
                </Link>
              )}
              <span className={`mt-2 max-w-[156px] text-center text-[11.5px] leading-tight font-bold rounded-lg px-2 py-0.5 bg-surface/75 backdrop-blur-sm ${s === "locked" ? "text-slate-400" : "text-slate-800"} line-clamp-2`}>
                {n.boss ? "Boss · " : ""}
                {n.lesson.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
