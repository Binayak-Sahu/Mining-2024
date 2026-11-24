"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, CheckCircle2, ArrowLeft } from "lucide-react";
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
    if (st) items.push({ key: d.key, lessonId: d.lessonId, stageIndex: d.stageIndex, stage: st, srs: true, concept: d.concept });
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
    (concept: string) => {
      setMissed(true);
      if (cur && !cur.srs) useStrata.getState().recordMiss(cur.lessonId, cur.stageIndex, concept);
    },
    [cur],
  );

  const onDone = useCallback(() => {
    if (!cur || !queue) return;
    const s = useStrata.getState();
    if (cur.srs) s.reviewResult(cur.key, !missed);
    if (!missed) setScore((n) => n + 1);
    s.addXp(missed ? 4 : 10);
    if (i + 1 >= queue.length) s.markWarmupDone();
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
        <div className="card p-6 space-y-4 text-center">
          <Dumbbell size={40} className="mx-auto text-emerald-600" />
          <h1 className="text-2xl font-extrabold">Daily Warmup</h1>
          <p className="text-sm text-slate-600">
            Leitner spaced repetition: concepts you missed return after 1, 2, 4, 7, 15 and 30 days as you answer them correctly. A miss sends a concept back to box 1.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-900 text-white p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Due today</div>
              <div className="readout text-2xl font-bold text-red-400">{due}</div>
            </div>
            <div className="rounded-xl bg-slate-900 text-white p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Tracked concepts</div>
              <div className="readout text-2xl font-bold text-blue-400">{srsCount}</div>
            </div>
          </div>
          {due === 0 && lessonsDone === 0 ? (
            <p className="text-sm text-slate-500">Nothing to review yet. Complete a lesson first — missed concepts and completed stages feed this queue.</p>
          ) : (
            <button type="button" onClick={start} className="btn-press w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold uppercase tracking-wider text-white">
              Start warmup
            </button>
          )}
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold uppercase text-slate-500">
            <ArrowLeft size={12} /> Campaign
          </Link>
        </div>
      </div>
    );
  }

  if (!cur) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="card p-6 text-center space-y-3">
          <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
          <h1 className="text-2xl font-extrabold">Warmup complete</h1>
          <p className="readout text-lg">
            {score}/{queue.length} clean recalls
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={start} className="btn-press flex-1 rounded-xl border-2 border-slate-300 py-3 text-sm font-bold uppercase text-slate-700">
              Another round
            </button>
            <Link href="/" className="btn-press flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold uppercase text-white">
              Campaign
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex gap-1">
          {queue.map((q, k) => (
            <div key={q.key} className={`h-2 flex-1 rounded-full ${k < i ? "bg-emerald-500" : k === i ? "bg-blue-500" : "bg-slate-700"}`} />
          ))}
        </div>
        <span className="readout text-xs text-slate-400">
          {i + 1}/{queue.length}
        </span>
      </div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">
        {cur.srs ? "Spaced repetition · " : "Review · "}
        {getLesson(cur.lessonId)?.title}
      </div>
      <div key={`${cur.key}-${i}`}>
        <StageRenderer stage={cur.stage} onMistake={onMistake} onDone={onDone} />
      </div>
    </div>
  );
}
