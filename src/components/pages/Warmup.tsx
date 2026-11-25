"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, CheckCircle2, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "@/lib/sfx";
import { allLessons, getLesson } from "@/content";
import { useStrata } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { todayKey } from "@/lib/date";
import { StageRenderer } from "@/components/cards/StageRenderer";
import type { Stage } from "@/lib/types";

interface Item {
  key: string;
  lessonId: string;
  stageIndex: number;
  stage: Stage;
  srs: boolean;
  concept: string;
  /** ConceptFlow screen to review on its own (per-screen SRS items). */
  screen?: number;
}

/** First check screen of a flow — where legacy whole-stage SRS entries for a flow theory stage now point. */
function firstCheck(st: Stage): number | undefined {
  if (st.kind !== "theory" || !st.flow) return undefined;
  const k = st.flow.findIndex((f) => f.kind === "check");
  return k >= 0 ? k : 0;
}

const WARMUP_SIZE = 5;
const REVIEW_KINDS = new Set(["predict", "swipe", "equation", "numeric", "crisis"]);

function buildQueue(): Item[] {
  const s = useStrata.getState();
  const today = todayKey();
  const due = Object.values(s.srs)
    .filter((i) => i.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || b.misses - a.misses);
  const items: Item[] = [];
  for (const d of due) {
    const st = getLesson(d.lessonId)?.stages[d.stageIndex];
    if (st) items.push({ key: d.key, lessonId: d.lessonId, stageIndex: d.stageIndex, stage: st, srs: true, concept: d.concept, screen: d.screen ?? firstCheck(st) });
    if (items.length >= WARMUP_SIZE) break;
  }
  if (items.length < WARMUP_SIZE) {
    // Top up with random review stages from completed lessons.
    const pool: Item[] = [];
    for (const l of allLessons()) {
      if (!s.lessons[l.id]) continue;
      l.stages.forEach((st, i) => {
        const key = `${l.id}#${i}`;
        if (REVIEW_KINDS.has(st.kind) && !items.some((x) => x.key === key)) pool.push({ key, lessonId: l.id, stageIndex: i, stage: st, srs: false, concept: st.title });
      });
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    items.push(...pool.slice(0, WARMUP_SIZE - items.length));
  }
  return items;
}

export function Warmup() {
  const hydrated = useHydrated();
  const [queue, setQueue] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const srsCount = useStrata((s) => Object.keys(s.srs).length);

  const start = () => {
    setQueue(buildQueue());
    setI(0);
    setScore(0);
    setMissed(false);
  };

  const cur = queue?.[i];

  const onMistake = useCallback(
    (concept: string, opts?: { screen?: number }) => {
      setMissed(true);
      if (cur && !cur.srs) useStrata.getState().recordMiss(cur.lessonId, cur.stageIndex, concept, opts?.screen ?? cur.screen);
    },
    [cur],
  );

  const onDone = useCallback(() => {
    if (!cur || !queue) return;
    const s = useStrata.getState();
    if (cur.srs) s.reviewResult(cur.key, !missed);
    if (!missed) setScore((n) => n + 1);
    s.addXp(missed ? 4 : 10);
    if (i + 1 >= queue.length) {
      s.markWarmupDone();
      sfx.fanfare();
    }
    setMissed(false);
    setI(i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cur, queue, missed, i]);

  const lessonsDone = useMemo(() => (hydrated ? Object.keys(useStrata.getState().lessons).length : 0), [hydrated]);

  if (!hydrated) return null;

  if (!queue) {
    const today = todayKey();
    const due = Object.values(useStrata.getState().srs).filter((x) => x.due <= today).length;
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="card card-pop p-6 sm:p-8 space-y-5 text-center">
          <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="mx-auto w-20 h-20 rounded-[26px] bg-emerald-500 text-white flex items-center justify-center shadow-[0_6px_0_#047857]">
            <Dumbbell size={38} />
          </motion.span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Daily Warmup</h1>
          <p className="text-[14px] text-slate-600 leading-relaxed">
            Leitner spaced repetition: concepts you missed return after 1, 2, 4, 7, 15 and 30 days as you answer them correctly. A miss sends a concept back to box 1.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-red-50 p-4 shadow-[inset_0_0_0_1.5px_#EF444433]">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-red-600">Due today</div>
              <div className="readout text-3xl font-extrabold text-red-600 mt-1">{due}</div>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 shadow-[inset_0_0_0_1.5px_#3B82F633]">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-blue-600">Tracked concepts</div>
              <div className="readout text-3xl font-extrabold text-blue-600 mt-1">{srsCount}</div>
            </div>
          </div>
          <div className="flex justify-center gap-1.5" aria-label="Leitner boxes: 1, 2, 4, 7, 15, 30 days">
            {[1, 2, 4, 7, 15, 30].map((d, k) => (
              <span key={d} className="readout rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-100" style={{ opacity: 0.55 + k * 0.09 }}>
                {d}d
              </span>
            ))}
          </div>
          {due === 0 && lessonsDone === 0 ? (
            <p className="text-[13.5px] text-slate-500">Nothing to review yet. Complete a lesson first — missed concepts and completed stages feed this queue.</p>
          ) : (
            <button type="button" onClick={start} className="btn-3d tone-safe w-full py-4 text-sm">
              Start warmup
            </button>
          )}
          <Link href="/" className="inline-flex items-center gap-1.5 min-h-[44px] text-[13px] font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft size={14} /> Expedition
          </Link>
        </div>
      </div>
    );
  }

  if (!cur) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="card card-pop p-6 sm:p-8 text-center space-y-4">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} className="mx-auto w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_6px_0_#047857]">
            <CheckCircle2 size={42} />
          </motion.span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Warmup complete</h1>
          <p className="readout text-lg font-bold text-slate-700">
            {score}/{queue.length} clean recalls
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={start} className="btn-3d tone-ghost flex-1 py-3.5 text-[15px]">
              Another round
            </button>
            <Link href="/" className="btn-3d tone-safe flex-1 py-3.5 text-[15px] inline-flex items-center justify-center">
              Expedition
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4">
      <div className="flex items-center gap-3 mb-3">
        <button type="button" onClick={() => setQueue(null)} aria-label="Leave warmup" className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100">
          <X size={22} strokeWidth={2.6} />
        </button>
        <div className="flex-1 flex gap-1.5">
          {queue.map((q, k) => (
            <div key={q.key} className="h-4 flex-1 rounded-full bg-slate-200 overflow-hidden shadow-[inset_0_1px_2px_rgba(15,23,42,0.12)]">
              <motion.div className="h-full rounded-full bg-emerald-500" initial={false} animate={{ width: k < i ? "100%" : k === i ? "40%" : "0%" }} transition={{ type: "spring", stiffness: 160, damping: 22 }} />
            </div>
          ))}
        </div>
        <span className="readout text-[12px] font-bold text-slate-500">
          {i + 1}/{queue.length}
        </span>
      </div>
      <div className="text-[12px] font-bold text-slate-500 mb-3 px-1 truncate">
        {cur.srs ? "Spaced repetition · " : "Review · "}
        {getLesson(cur.lessonId)?.title}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${cur.key}-${i}`} initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
          <StageRenderer stage={cur.stage} onMistake={onMistake} onDone={onDone} seed={`${cur.lessonId}#${cur.stageIndex}`} screen={cur.screen} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
