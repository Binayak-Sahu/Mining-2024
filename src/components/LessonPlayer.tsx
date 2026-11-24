"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, BookMarked, Trophy, RotateCcw, ArrowRight, ShieldAlert } from "lucide-react";
import { getLesson, getUnit } from "@/content";
import { useStrata } from "@/lib/store";
import { BOSS_BONUS, HEARTS_PER_LESSON, LESSON_BONUS, STAGE_XP } from "@/lib/ranks";
import { nextLesson } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { StageRenderer } from "./cards/StageRenderer";
import { STAGE_META } from "./cards/ui";

export function Hearts({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n} safety hearts`}>
      {Array.from({ length: HEARTS_PER_LESSON }).map((_, i) => (
        <motion.span key={i} animate={{ scale: i < n ? 1 : 0.8 }}>
          <Heart size={18} className={i < n ? "fill-red-500 text-red-500" : "text-slate-600"} />
        </motion.span>
      ))}
    </div>
  );
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const hydrated = useHydrated();
  const lesson = getLesson(lessonId);
  const unit = lesson ? getUnit(lesson.unitId) : undefined;

  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(HEARTS_PER_LESSON);
  const [xp, setXp] = useState(0);
  const [cardMistakes, setCardMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const started = useRef(-1);

  useEffect(() => {
    if (!hydrated || !lesson || started.current === attempt) return;
    started.current = attempt;
    useStrata.getState().startAttempt(lesson.id);
  }, [hydrated, lesson, attempt]);

  const failed = hearts <= 0;

  const onMistake = useCallback(
    (concept: string) => {
      if (!lesson) return;
      // QA flag (localStorage "strata-qa" = "1") keeps one heart so automated walkthroughs can traverse a whole lesson.
      let qa = false;
      try {
        qa = localStorage.getItem("strata-qa") === "1";
      } catch {
        qa = false;
      }
      setHearts((h) => Math.max(qa ? 1 : 0, h - 1));
      setCardMistakes((m) => m + 1);
      const s = useStrata.getState();
      s.loseHeart();
      s.recordMiss(lesson.id, index, concept);
    },
    [lesson, index],
  );

  const onDone = useCallback(() => {
    if (!lesson || failed) return;
    const stage = lesson.stages[index];
    const s = useStrata.getState();
    const base = STAGE_XP[stage.kind] ?? 10;
    const gained = cardMistakes === 0 ? base : Math.round(base / 2);
    s.addXp(gained);
    let total = xp + gained;
    if (stage.kind === "theory") {
      if (!s.codex[stage.codex.id]) {
        setUnlocked((u) => [...u, stage.codex.title]);
        setToast(`Field Codex: “${stage.codex.title}” unlocked`);
      }
      s.unlockCodex(stage.codex.id, lesson.id);
    }
    if (stage.kind === "equation") {
      const id = `${lesson.id}#eq${index}`;
      if (!s.formulas[id]) {
        setUnlocked((u) => [...u, stage.formula.expr]);
        setToast(`Verified formula filed: ${stage.formula.expr}`);
      }
      s.unlockFormula(id, lesson.id);
    }
    setCardMistakes(0);
    if (index + 1 >= lesson.stages.length) {
      const bonus = lesson.boss ? BOSS_BONUS : LESSON_BONUS;
      s.addXp(bonus);
      total += bonus;
      s.completeLesson(lesson.id, hearts, total);
      setFinished(true);
    } else {
      setIndex(index + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setXp(total);
  }, [lesson, index, cardMistakes, xp, hearts, failed]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const retry = () => {
    setAttempt((a) => a + 1);
    setIndex(0);
    setHearts(HEARTS_PER_LESSON);
    setXp(0);
    setCardMistakes(0);
    setFinished(false);
    setUnlocked([]);
    window.scrollTo({ top: 0 });
  };

  if (!lesson || !unit) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p className="text-slate-300">Lesson not found.</p>
        <Link href="/" className="text-blue-400 underline">
          Back to campaign
        </Link>
      </div>
    );
  }

  if (!hydrated) return <div className="max-w-2xl mx-auto p-6 text-slate-400 readout text-sm">Loading shift briefing…</div>;

  if (finished) {
    const nxt = nextLesson(unit, lesson);
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 text-center space-y-4">
          <Trophy size={44} className="mx-auto text-amber-500" />
          <h1 className="text-2xl font-extrabold">{lesson.boss ? "Unit Boss Exam cleared" : "Lesson mastered"}</h1>
          <p className="text-slate-600">{lesson.title}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-900 text-white p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">XP earned</div>
              <div className="readout text-2xl font-bold text-amber-400">+{xp}</div>
            </div>
            <div className="rounded-xl bg-slate-900 text-white p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Hearts kept</div>
              <div className="flex justify-center mt-1">
                <Hearts n={hearts} />
              </div>
            </div>
          </div>
          {unlocked.length > 0 && (
            <div className="text-left rounded-xl border border-slate-200 p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                <BookMarked size={12} /> Filed to your Field Codex
              </div>
              <ul className="text-sm text-slate-800 list-disc pl-5">
                {unlocked.map((u) => (
                  <li key={u} className="readout">
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href={`/unit/${unit.id}`} className="btn-press flex-1 rounded-xl border-2 border-slate-300 py-3 text-sm font-bold uppercase tracking-wider text-slate-700">
              Unit map
            </Link>
            {nxt && (
              <Link href={`/lesson/${nxt.id}`} className="btn-press flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold uppercase tracking-wider text-white inline-flex items-center justify-center gap-1">
                Next: {nxt.boss ? "Boss Exam" : nxt.title} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const stage = lesson.stages[index];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-32 pt-3">
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 bg-[#0F172A]/95 backdrop-blur flex items-center gap-3">
        <Link href={`/unit/${unit.id}`} aria-label="Exit lesson" className="text-slate-400 hover:text-white">
          <X size={22} />
        </Link>
        <div className="flex-1 flex gap-1">
          {lesson.stages.map((s, i) => (
            <div key={i} className="h-2.5 flex-1 rounded-full overflow-hidden bg-slate-700">
              <motion.div
                className="h-full"
                style={{ background: STAGE_META[s.kind].color }}
                initial={false}
                animate={{ width: i < index ? "100%" : i === index ? "35%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <Hearts n={hearts} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
        <span className="uppercase tracking-wider font-semibold">
          {lesson.boss ? "Boss Exam · " : `Unit ${unit.n} · `}
          {lesson.title}
        </span>
        <span className="readout">+{xp} XP</span>
      </div>

      <div key={`${attempt}-${index}`}>
        <StageRenderer stage={stage} onMistake={onMistake} onDone={onDone} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-xl bg-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-xl flex items-center gap-2 max-w-[92vw]"
          >
            <BookMarked size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {failed && (
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="fixed bottom-0 inset-x-0 z-30 bg-red-600 text-white p-4 shadow-2xl">
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="font-extrabold flex items-center gap-2">
                  <ShieldAlert size={18} /> Out of safety hearts — shift stood down
                </div>
                <p className="text-sm text-red-100">Missed concepts are queued for spaced-repetition warmups. Review the feedback above, then re-attempt.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={retry} className="btn-press rounded-xl bg-white text-red-700 px-4 py-2.5 text-sm font-bold uppercase inline-flex items-center gap-1">
                  <RotateCcw size={14} /> Retry
                </button>
                <Link href={`/unit/${unit.id}`} className="btn-press rounded-xl border-2 border-white px-4 py-2.5 text-sm font-bold uppercase">
                  Exit
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
