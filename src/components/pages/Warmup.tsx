"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, CheckCircle2, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tactilePress, stageSlide } from "@/lib/motion";
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
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="card p-5 sm:p-6 space-y-5 text-center">
          <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={tactilePress} className="unit-tile mx-auto w-[88px] h-[88px]" aria-hidden>
            <Dumbbell size={40} />
          </motion.span>
          <h1 className="t-display text-fg">Daily Warmup</h1>
          <p className="t-secondary text-left">Leitner spaced repetition: concepts you missed return after 1, 2, 4, 7, 15 and 30 days as you answer them correctly. A miss sends a concept back to box 1.</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="rounded-[12px] bg-surface-2 p-4">
              <div className="t-label text-fg-2">Due today</div>
              <div className={`readout t-display mt-1 ${due > 0 ? "text-danger-tint-text" : "text-fg"}`}>{due}</div>
            </div>
            <div className="rounded-[12px] bg-surface-2 p-4">
              <div className="t-label text-fg-2">Tracked concepts</div>
              <div className="readout t-display text-fg mt-1">{srsCount}</div>
            </div>
          </div>
          <div className="flex justify-center flex-wrap gap-2" role="img" aria-label="Leitner boxes: 1, 2, 4, 7, 15, 30 days">
            {[1, 2, 4, 7, 15, 30].map((d) => (
              <span key={d} className="readout t-label rounded-[8px] px-2 py-1 text-fg-2 bg-surface-2" style={{ fontWeight: 700 }} aria-hidden>
                {d}d
              </span>
            ))}
          </div>
          {due === 0 && lessonsDone === 0 ? (
            <p className="t-secondary text-left">Nothing to review yet. Complete a lesson first — missed concepts and completed stages feed this queue.</p>
          ) : (
            <button type="button" onClick={start} className="btn-3d tone-tech w-full">
              Start warmup
            </button>
          )}
          <Link href="/" className="inline-flex items-center gap-2 min-h-[44px] t-label text-fg-2 hover:text-fg" style={{ fontWeight: 700 }}>
            <ArrowLeft size={16} aria-hidden /> Expedition
          </Link>
        </div>
      </div>
    );
  }

  if (!cur) {
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="card p-5 sm:p-6 text-center space-y-4">
          <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={tactilePress} className="mx-auto w-[88px] h-[88px] rounded-full bg-success text-[var(--success-on)] flex items-center justify-center" aria-hidden>
            <CheckCircle2 size={44} />
          </motion.span>
          <h1 className="t-display text-fg">Warmup complete</h1>
          <p className="t-readout text-fg-2">
            {score}/{queue.length} clean recalls
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={start} className="btn-3d tone-ghost flex-1">
              Another round
            </button>
            <Link href="/" className="btn-3d tone-safe flex-1">
              Expedition
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <button type="button" onClick={() => setQueue(null)} aria-label="Leave warmup" className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-fg-2 hover:text-fg">
          <X size={24} strokeWidth={2.4} />
        </button>
        <div className="flex-1 flex gap-1" aria-hidden>
          {queue.map((q, k) => (
            <div key={q.key} className="ds-progress flex-1">
              <motion.div className="ds-progress-fill" initial={false} animate={{ width: k < i ? "100%" : k === i ? "40%" : "0%" }} transition={stageSlide} />
            </div>
          ))}
        </div>
        <span className="readout t-label text-fg-2" aria-label={`Item ${i + 1} of ${queue.length}`}>
          {i + 1}/{queue.length}
        </span>
      </div>
      <div className="t-label text-fg-2 mb-4 truncate">
        {cur.srs ? "Spaced repetition · " : "Review · "}
        {getLesson(cur.lessonId)?.title}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${cur.key}-${i}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={stageSlide}>
          <StageRenderer stage={cur.stage} onMistake={onMistake} onDone={onDone} seed={`${cur.lessonId}#${cur.stageIndex}`} screen={cur.screen} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
