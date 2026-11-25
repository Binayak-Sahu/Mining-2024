"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { X, Heart, BookMarked, RotateCcw, ArrowRight, ShieldAlert, Crown, Trophy, Zap, Map as MapIcon, KeyRound } from "lucide-react";
import { getLesson, getUnit, UNITS } from "@/content";
import { usePrefs } from "@/lib/prefs";
import { genuinelyOpen } from "@/lib/progress";
import { useStrata } from "@/lib/store";
import { BOSS_BONUS, HEARTS_PER_LESSON, LESSON_BONUS, STAGE_XP } from "@/lib/ranks";
import { nextLesson } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { sfx } from "@/lib/sfx";
import { StageRenderer } from "./cards/StageRenderer";
import { STAGE_META } from "./cards/ui";

export function Hearts({ n, big = false }: { n: number; big?: boolean }) {
  const controls = useAnimationControls();
  const prev = useRef(n);
  useEffect(() => {
    if (n < prev.current) void controls.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
    prev.current = n;
  }, [n, controls]);
  const sz = big ? 26 : 22;
  return (
    <motion.div animate={controls} className="flex items-center gap-1" aria-label={`${n} safety hearts`}>
      {Array.from({ length: HEARTS_PER_LESSON }).map((_, i) => {
        const on = i < n;
        return (
          <motion.span key={i} className="relative" animate={on ? { scale: [1, 1.08, 1] } : { scale: 0.85 }} transition={on ? { duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" } : { type: "spring" }}>
            <Heart size={sz} className={on ? "fill-[#FF4B6E] text-[#E11D48] drop-shadow-[0_2px_0_#BE123C]" : "fill-slate-200 text-slate-300"} strokeWidth={2.2} />
            <AnimatePresence>
              {!on && (
                <motion.span key="burst" initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -18, scale: 1.6 }} transition={{ duration: 0.7 }} className="absolute inset-0 pointer-events-none">
                  <Heart size={sz} className="fill-[#FF4B6E] text-[#E11D48]" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>
        );
      })}
    </motion.div>
  );
}

const CONFETTI = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#F472B6"];

/** canvas-confetti celebration: a full emerald + amber burst for Boss Exams (unit cleared), a small one for lessons. */
function celebrate(big: boolean) {
  const colors = ["#10B981", "#34D399", "#047857", "#F59E0B", "#FBBF24"];
  const base = { colors, disableForReducedMotion: true, ticks: 140, scalar: 0.95 };
  if (!big) {
    void confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 38, origin: { y: 0.35 } });
    return;
  }
  const end = Date.now() + 1500;
  const frame = () => {
    void confetti({ ...base, particleCount: 6, angle: 60, spread: 60, startVelocity: 55, origin: { x: 0, y: 0.6 } });
    void confetti({ ...base, particleCount: 6, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.6 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
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
  // Visual-only fill of the active progress segment (cards report how far through the stage they are).
  const [sub, setSub] = useState(0);
  const [mistakesTotal, setMistakesTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [burst, setBurst] = useState<{ id: number; xp: number } | null>(null);
  const [jumped, setJumped] = useState(false);
  const [jumpSeq, setJumpSeq] = useState(0);
  useEffect(() => setSub(0), [index, jumpSeq, attempt]);
  const [celebrated, setCelebrated] = useState(false);
  const started = useRef(-1);

  // Inspector Mode: a lesson opened only because Inspector unlocked it — or any run where the Stage
  // Jumper was used — is a sandbox: nothing is written to the progress store.
  const master = usePrefs((p) => p.masterUnlock);
  const doneMap = useStrata((st) => st.lessons);
  const freeRoam = useStrata((st) => st.freeRoam);
  const [genuine] = useState(() => (lesson ? genuinelyOpen(UNITS, lesson.id, useStrata.getState().lessons, useStrata.getState().freeRoam) : false));
  const genuineNow = hydrated && lesson ? genuinelyOpen(UNITS, lesson.id, doneMap, freeRoam) : genuine;
  const sandbox = hydrated && ((master && !genuineNow) || jumped);
  const sandboxRef = useRef(sandbox);
  sandboxRef.current = sandbox;

  // The attempt is recorded on the first real answer of a non-sandbox run, so merely opening a lesson
  // (or opening it and then using the Inspector stage jumper) never touches saved progress.
  const recordAttempt = useCallback(() => {
    if (!lesson || sandboxRef.current || started.current === attempt) return;
    started.current = attempt;
    useStrata.getState().startAttempt(lesson.id);
  }, [lesson, attempt]);

  const failed = hearts <= 0;

  const onMistake = useCallback(
    (concept: string, opts?: { heart?: boolean; screen?: number }) => {
      const keepHeart = opts?.heart === false;
      if (!lesson) return;
      // QA flag (localStorage "strata-qa" = "1") keeps one heart so automated walkthroughs can traverse a whole lesson.
      let qa = false;
      try {
        qa = localStorage.getItem("strata-qa") === "1";
      } catch {
        qa = false;
      }
      if (!keepHeart) setHearts((h) => Math.max(qa ? 1 : 0, h - 1));
      setCardMistakes((m) => m + 1);
      setMistakesTotal((m) => m + 1);
      if (!keepHeart) sfx.heart();
      if (sandboxRef.current) return;
      recordAttempt();
      const s = useStrata.getState();
      if (!keepHeart) s.loseHeart();
      s.recordMiss(lesson.id, index, concept, opts?.screen);
    },
    [lesson, index, recordAttempt],
  );

  const onDone = useCallback(() => {
    if (!lesson || failed) return;
    const stage = lesson.stages[index];
    const sb = sandboxRef.current;
    if (!sb) recordAttempt();
    const s = useStrata.getState();
    const base = STAGE_XP[stage.kind] ?? 10;
    const gained = cardMistakes === 0 ? base : Math.round(base / 2);
    if (!sb) s.addXp(gained);
    let total = xp + gained;
    let filed = false;
    if (stage.kind === "theory") {
      if (!sb && !s.codex[stage.codex.id]) {
        setUnlocked((u) => [...u, stage.codex.title]);
        toast.success(`Field Codex: “${stage.codex.title}” unlocked`, { icon: <BookMarked size={16} /> });
        filed = true;
      }
      if (!sb) s.unlockCodex(stage.codex.id, lesson.id);
    }
    if (stage.kind === "equation") {
      const id = `${lesson.id}#eq${index}`;
      if (!sb && !s.formulas[id]) {
        setUnlocked((u) => [...u, stage.formula.expr]);
        toast.success(`Verified formula filed: ${stage.formula.expr}`, { icon: <BookMarked size={16} /> });
        filed = true;
      }
      if (!sb) s.unlockFormula(id, lesson.id);
    }
    if (filed) sfx.unlock();
    setCardMistakes(0);
    setBurst({ id: Date.now(), xp: gained });
    if (index + 1 >= lesson.stages.length) {
      const bonus = lesson.boss ? BOSS_BONUS : LESSON_BONUS;
      if (!sb) {
        s.addXp(bonus);
        s.completeLesson(lesson.id, hearts, total + bonus);
      }
      total += bonus;
      setFinished(true);
      sfx.fanfare();
    } else {
      setIndex(index + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setXp(total);
  }, [lesson, index, cardMistakes, xp, hearts, failed, recordAttempt]);


  useEffect(() => {
    if (!burst) return;
    const id = setTimeout(() => setBurst(null), 1200);
    return () => clearTimeout(id);
  }, [burst]);

  useEffect(() => {
    if (finished && !celebrated && lesson) {
      setCelebrated(true);
      celebrate(!!lesson.boss);
    }
  }, [finished, celebrated, lesson]);

  const retry = () => {
    setAttempt((a) => a + 1);
    setIndex(0);
    setHearts(HEARTS_PER_LESSON);
    setXp(0);
    setCardMistakes(0);
    setMistakesTotal(0);
    setFinished(false);
    setUnlocked([]);
    window.scrollTo({ top: 0 });
  };

  if (!lesson || !unit) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p className="text-slate-600">Lesson not found.</p>
        <Link href="/" className="text-blue-600 underline">
          Back to the expedition
        </Link>
      </div>
    );
  }

  if (!hydrated) return <div className="max-w-2xl mx-auto p-6 text-slate-500 readout text-sm">Loading shift briefing…</div>;

  /** Inspector Stage Jumper: go straight to any stage (the run becomes a sandbox). */
  const jumpTo = (i: number) => {
    setJumped(true);
    setJumpSeq((n) => n + 1);
    setFinished(false);
    setCardMistakes(0);
    setIndex(i);
    window.scrollTo({ top: 0 });
  };

  const inspectorChip = sandbox && (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-extrabold tracking-wide" role="status">
      <KeyRound size={12} /> INSPECTOR · progress not saved
    </span>
  );

  if (finished) {
    const nxt = nextLesson(unit, lesson);
    const stagesN = lesson.stages.length;
    const acc = Math.max(0, Math.round(((stagesN - Math.min(stagesN, mistakesTotal)) / stagesN) * 100));
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 max-w-xl w-full mx-auto px-4 pt-10 sm:pt-16 pb-8 flex flex-col items-center text-center">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }} className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-60" style={{ background: lesson.boss ? "#F59E0B" : "#10B981" }} />
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center text-white" style={{ background: lesson.boss ? "linear-gradient(135deg,#FBBF24,#F97316)" : "linear-gradient(135deg,#34D399,#059669)", boxShadow: `0 8px 0 ${lesson.boss ? "#B45309" : "#047857"}, 0 24px 40px -12px rgba(0,0,0,0.4)` }}>
              {lesson.boss ? <Crown size={60} className="fill-white/30" strokeWidth={2.2} /> : <Trophy size={58} className="fill-white/30" strokeWidth={2.2} />}
            </div>
          </motion.div>
          {inspectorChip && <div className="mt-6">{inspectorChip}</div>}
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-8 text-[30px] sm:text-[38px] leading-tight font-extrabold tracking-[-0.02em] text-slate-900">
            {lesson.boss ? "Boss Exam cleared!" : "Lesson mastered!"}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-slate-500 mt-1 text-[15px]">
            {lesson.title}
          </motion.p>

          <div className="mt-8 grid grid-cols-3 gap-3 w-full">
            {[
              { k: "Total XP", v: `+${xp}`, c: "#F59E0B", e: "#B45309", Icon: Zap },
              { k: "Accuracy", v: `${acc}%`, c: "#10B981", e: "#047857", Icon: Trophy },
              { k: "Hearts", v: `${hearts}/${HEARTS_PER_LESSON}`, c: "#F43F5E", e: "#BE123C", Icon: Heart },
            ].map((t, i) => (
              <motion.div key={t.k} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 360, damping: 22, delay: 0.55 + i * 0.1 }} className="rounded-2xl p-[2px]" style={{ background: t.c, boxShadow: `0 4px 0 ${t.e}` }}>
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white py-1">{t.k}</div>
                <div className="rounded-[14px] bg-surface py-3 flex items-center justify-center gap-1.5">
                  <t.Icon size={18} color={t.c} className="shrink-0" />
                  <span className="readout text-xl font-extrabold" style={{ color: t.c }}>
                    {t.v}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {unlocked.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-5 w-full text-left card p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-600 flex items-center gap-1.5 mb-2">
                <BookMarked size={13} /> Filed to your Field Codex
              </div>
              <ul className="space-y-1.5">
                {unlocked.map((u) => (
                  <li key={u} className="readout text-[13px] text-slate-800 flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    {u}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
        <div className="sticky bottom-0 border-t border-slate-200/80 bg-canvas/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-xl mx-auto px-4 py-3 flex gap-3">
            <Link href={`/unit/${unit.id}`} className="btn-3d tone-ghost flex-1 py-3.5 text-[15px] inline-flex items-center justify-center gap-2">
              <MapIcon size={16} /> Unit map
            </Link>
            {nxt ? (
              <Link href={`/lesson/${nxt.id}`} className="btn-3d tone-safe flex-[1.4] py-3.5 text-[15px] inline-flex items-center justify-center gap-2 min-w-0">
                <span className="truncate">{nxt.boss ? "Boss Exam" : "Next lesson"}</span> <ArrowRight size={16} className="shrink-0" />
              </Link>
            ) : (
              <Link href="/" className="btn-3d tone-safe flex-[1.4] py-3.5 text-[15px] inline-flex items-center justify-center gap-2">
                Expedition <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stage = lesson.stages[index];

  return (
    <div className="min-h-[100dvh]">
      <div className="sticky top-0 z-20 hairline-b surface-sticky pt-[env(safe-area-inset-top)]">
        <div className="max-w-2xl mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center gap-2.5 sm:gap-3">
          <Link href={`/unit/${unit.id}`} aria-label="Exit lesson" className="-ml-1 flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={24} strokeWidth={2.6} />
          </Link>
          <div className="flex-1 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={lesson.stages.length} aria-valuenow={index} aria-label="Lesson progress">
            {lesson.stages.map((s, i) => {
              const c = STAGE_META[s.kind].color;
              return (
                <div key={i} className="relative h-3.5 sm:h-4 flex-1 rounded-full overflow-hidden bg-slate-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.12)]">
                  <motion.div className="h-full rounded-full relative" style={{ background: c }} initial={false} animate={{ width: i < index ? "100%" : i === index ? `${Math.round(12 + 88 * sub)}%` : "0%" }} transition={{ type: "spring", stiffness: 160, damping: 22 }}>
                    <span className="absolute left-1.5 right-1.5 top-[3px] h-[4px] rounded-full bg-white/35" />
                  </motion.div>
                </div>
              );
            })}
          </div>
          <Hearts n={hearts} />
        </div>
        {hydrated && master && (
          <div className="max-w-2xl mx-auto px-2 sm:px-4 pb-2 flex items-center gap-2">
            <div className="flex-1 min-w-0 flex gap-1 overflow-x-auto no-scrollbar" role="group" aria-label="Stage jumper">
              {lesson.stages.map((st, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-current={i === index ? "step" : undefined}
                  title={`Jump to stage ${i + 1}: ${STAGE_META[st.kind].label}`}
                  className={`readout shrink-0 min-h-0 h-7 min-w-7 px-2 rounded-full text-[12px] font-extrabold transition-colors ${i === index ? "bg-slate-900 text-slate-50" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {sandbox && (
              <button type="button" onClick={() => setHearts(HEARTS_PER_LESSON)} className="shrink-0 min-h-0 h-7 inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2.5 text-[12px] font-extrabold" title="Refill sandbox hearts">
                <Heart size={13} className="fill-current" /> Refill
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-3 sm:pt-6">
        {inspectorChip && <div className="px-1.5 mb-1.5">{inspectorChip}</div>}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${attempt}-${index}-${jumpSeq}`} initial={{ opacity: 0, x: 48, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -48, scale: 0.98 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
            <StageRenderer stage={stage} onMistake={onMistake} onDone={onDone} onSubProgress={setSub} seed={`${lesson.id}#${index}`} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* XP burst */}
      <AnimatePresence>
        {burst && (
          <motion.div key={burst.id} className="pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2" initial={{ opacity: 0, y: 20, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: [20, 0, -10, -40], scale: [0.6, 1.15, 1, 0.9] }} transition={{ duration: 1.1, times: [0, 0.2, 0.7, 1] }}>
            <div className="relative rounded-full px-4 py-2 text-white font-extrabold readout text-lg flex items-center gap-1.5" style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B)", boxShadow: "0 4px 0 #B45309, 0 12px 24px -8px rgba(180,83,9,0.6)" }}>
              <Zap size={18} className="fill-white" /> +{burst.xp} XP
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <motion.span key={i} className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full" style={{ background: CONFETTI[i % CONFETTI.length] }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(a) * 70, y: Math.sin(a) * 40, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} />;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {failed && (
          <motion.div initial={{ y: 260 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed bottom-0 inset-x-0 z-40 bg-red-50 border-t-2 border-red-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.4)]">
            <div className="max-w-2xl mx-auto p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 flex items-start gap-3">
                <span className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-[0_3px_0_#991B1B]">
                  <ShieldAlert size={24} />
                </span>
                <div>
                  <div className="font-extrabold text-[17px] text-red-700">Out of safety hearts — shift stood down</div>
                  <p className="text-[13.5px] text-red-800/80 leading-snug mt-0.5">Missed concepts are queued for your spaced-repetition warmup. Review the feedback, then re-attempt.</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <Link href={`/unit/${unit.id}`} className="btn-3d tone-ghost flex-1 sm:flex-none px-5 py-3 text-[15px] inline-flex items-center justify-center">
                  Exit
                </Link>
                <button type="button" onClick={retry} className="btn-3d tone-crit flex-1 sm:flex-none px-5 py-3 text-[15px] inline-flex items-center justify-center gap-2">
                  <RotateCcw size={15} /> Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
