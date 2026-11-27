"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Heart, BookMarked, RotateCcw, ArrowRight, ShieldAlert, Crown, Trophy, Zap, Map as MapIcon, Check } from "lucide-react";
import { getLesson, getUnit, UNITS } from "@/content";
import { usePrefs } from "@/lib/prefs";
import { genuinelyOpen } from "@/lib/progress";
import { useStrata } from "@/lib/store";
import { BOSS_BONUS, HEARTS_PER_LESSON, LESSON_BONUS, STAGE_XP } from "@/lib/ranks";
import { nextLesson } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { sfx } from "@/lib/sfx";
import { StageRenderer } from "./cards/StageRenderer";
import { BonusCard } from "./cards/BonusCard";
import { ActionBar, PrimaryButton } from "./cards/ui";
import { useResume } from "@/lib/resume";
import { InspectorMenu } from "./shell/InspectorMenu";
import { RecapSheet } from "./shell/LessonSheets";
import { ExitLesson, HeartsPill, InspectorStrip, LessonProgress, MoreMenu } from "./shell/LessonTopBar";
import { fadeQuick, feedbackSheet, stageSlide, tactilePress } from "@/lib/motion";
import { useNotes } from "@/lib/notes";
import { useWhere } from "@/lib/reports";
import { STAGE_META } from "./cards/ui";

/** XP-burst dots: the §2.2 faces. */
const CONFETTI = ["#3B5BF6", "#15803D", "#F5B417", "#DC2626"];

/** canvas-confetti celebration: a full emerald + amber burst for Boss Exams (unit cleared), a small one for lessons. */
function celebrate(big: boolean) {
  const colors = ["#15803D", "#4ADE80", "#0F5E2C", "#F5B417", "#F5C84A"];
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
  // Theory-first mode: Equation/Numeric stages are collapsed "Bonus maths" unless opened.
  const theoryFirst = usePrefs((p) => p.theoryFirst);
  const [openBonus, setOpenBonus] = useState<number[]>([]);
  // Resume: offered once when a lesson is reopened mid-way (separate device-local store, not progress).
  const [resumeAsk, setResumeAsk] = useState<number | null>(null);
  const resumeChecked = useRef(false);
  // The sticky lesson header grows when the Inspector strip shows (and when that strip wraps). Sim plates pin just
  // under it, so its height (without the safe-area padding, which SimView adds itself) feeds --sim-top.
  const headObserver = useRef<ResizeObserver | null>(null);
  const headRef = useCallback((el: HTMLDivElement | null) => {
    headObserver.current?.disconnect();
    headObserver.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    const root = el.parentElement;
    const set = () => root?.style.setProperty("--sim-top", `${el.offsetHeight - (parseFloat(getComputedStyle(el).paddingTop) || 0)}px`);
    set();
    headObserver.current = new ResizeObserver(set);
    headObserver.current.observe(el);
  }, []);
  const [celebrated, setCelebrated] = useState(false);
  const [recap, setRecap] = useState<number | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const reduce = useReducedMotion();
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

  /** Theory-first: skip a collapsed Bonus maths stage (no XP); finishing the lesson never requires it. */
  const skipBonus = useCallback(() => {
    if (!lesson || failed) return;
    const sb = sandboxRef.current;
    setCardMistakes(0);
    if (index + 1 >= lesson.stages.length) {
      const s = useStrata.getState();
      const bonus = lesson.boss ? BOSS_BONUS : LESSON_BONUS;
      if (!sb) {
        recordAttempt();
        s.addXp(bonus);
        s.completeLesson(lesson.id, hearts, xp + bonus);
      }
      setXp(xp + bonus);
      setFinished(true);
      sfx.fanfare();
    } else {
      setIndex(index + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lesson, failed, index, hearts, xp, recordAttempt]);

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

  // Lesson notes (session only): a fresh list per lesson run.
  useEffect(() => {
    if (lesson) useNotes.getState().start(`${lesson.id}#${attempt}`);
  }, [lesson, attempt]);

  // Phone-testing kit: keep "where am I" current for Inspector reports.
  useEffect(() => {
    useWhere.setState({ lessonId: lesson?.id ?? null, stageIndex: index, screenIndex: null });
  }, [lesson, index]);

  // Remember where you are (never in sandbox/jumper runs); forget it once the lesson is finished.
  useEffect(() => {
    if (!hydrated || !lesson || jumped) return;
    const r = useResume.getState();
    if (finished) r.clear(lesson.id);
    else if (index > 0) r.setAt(lesson.id, index);
  }, [hydrated, lesson, index, finished, jumped]);

  useEffect(() => {
    if (!hydrated || !lesson || resumeChecked.current) return;
    resumeChecked.current = true;
    const at = useResume.getState().at[lesson.id];
    if (at && at.index > 0 && at.index < lesson.stages.length) setResumeAsk(at.index);
  }, [hydrated, lesson]);

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

  if (finished) {
    const nxt = nextLesson(unit, lesson);
    const stagesN = lesson.stages.length;
    const acc = Math.max(0, Math.round(((stagesN - Math.min(stagesN, mistakesTotal)) / stagesN) * 100));
    const boss = !!lesson.boss;
    return (
      <div className="min-h-[100dvh] flex flex-col">
        {sandbox && <InspectorStrip />}
        <div className="flex-1 max-w-[640px] w-full mx-auto px-5 sm:px-6 pt-12 pb-8 flex flex-col items-center text-center">
          <motion.div initial={reduce ? { opacity: 0 } : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? fadeQuick : { ...feedbackSheet, delay: 0.1 }} className="relative w-[120px] h-[130px]" aria-hidden>
            <span className={`absolute left-0 top-[10px] w-[120px] h-[120px] rounded-full ${boss ? "bg-[var(--energy-ledge)]" : "bg-[var(--success-ledge)]"}`} />
            <span className={`absolute left-0 top-0 w-[120px] h-[120px] rounded-full flex items-center justify-center ${boss ? "bg-energy text-energy-on" : "bg-success text-white"}`}>
              {boss ? <Crown size={56} strokeWidth={2.2} /> : <Trophy size={54} strokeWidth={2.2} />}
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...fadeQuick, delay: 0.3 }} className="mt-8 t-display text-fg">
            {boss ? "Boss Exam cleared!" : "Lesson mastered!"}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...fadeQuick, delay: 0.4 }} className="t-secondary mt-3">
            {lesson.title}
          </motion.p>

          <div className="mt-8 grid grid-cols-3 gap-3 w-full">
            {[
              { k: "Total XP", v: `+${xp}`, c: "text-fg", Icon: Zap },
              { k: "Accuracy", v: `${acc}%`, c: "text-fg", Icon: Trophy },
              { k: "Hearts", v: `${hearts}/${HEARTS_PER_LESSON}`, c: "text-danger-tint-text", Icon: Heart },
            ].map((t, i) => (
              <motion.div key={t.k} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? fadeQuick : { ...tactilePress, delay: 0.5 + i * 0.08 }} className="card px-2 py-3">
                <div className="t-label text-fg-2">{t.k}</div>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <t.Icon size={18} className={`shrink-0 ${t.c}`} aria-hidden />
                  <span className={`t-readout !text-[20px] !font-extrabold ${t.c}`}>{t.v}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {unlocked.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...fadeQuick, delay: 0.8 }} className="mt-8 w-full text-left">
              <div className="t-eyebrow flex items-center gap-1.5 mb-3">
                <BookMarked size={16} aria-hidden /> Filed to your Field Codex
              </div>
              <ul className="space-y-2">
                {unlocked.map((u) => (
                  <li key={u} className="readout text-[15px] text-fg flex gap-2 items-start">
                    <Check size={18} className="text-success-tint-text shrink-0 mt-0.5" aria-hidden />
                    {u}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
        <div className="sticky bottom-0 bg-canvas">
          <div className="max-w-[640px] mx-auto px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] flex gap-3">
            <Link href={`/unit/${unit.id}`} className="btn-3d tone-ghost flex-1 !px-4">
              <MapIcon size={18} aria-hidden /> Unit map
            </Link>
            {nxt ? (
              <Link href={`/lesson/${nxt.id}`} className="btn-3d tone-safe flex-[1.4] min-w-0 !px-4">
                <span className="truncate">{nxt.boss ? "Boss Exam" : "Next lesson"}</span> <ArrowRight size={18} className="shrink-0" aria-hidden />
              </Link>
            ) : (
              <Link href="/" className="btn-3d tone-safe flex-[1.4] !px-4">
                Expedition <ArrowRight size={18} aria-hidden />
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
      <div ref={headRef} className="sticky top-0 z-20 bg-canvas pt-[env(safe-area-inset-top)]">
        <div className="max-w-[640px] mx-auto px-5 sm:px-6 h-14 flex items-center gap-2">
          <ExitLesson href={`/unit/${unit.id}`} />
          <LessonProgress titles={lesson.stages.map((s) => s.title)} index={index} sub={sub} onRecap={setRecap} />
          <MoreMenu inspector={hydrated && master} onInspector={() => setInspectorOpen(true)} />
          <HeartsPill n={hearts} />
        </div>
        {sandbox && <InspectorStrip />}
      </div>
      {hydrated && master && (
        <InspectorMenu
          stages={lesson.stages.map((st) => STAGE_META[st.kind].label)}
          index={index}
          onJump={jumpTo}
          onRefill={sandbox ? () => setHearts(HEARTS_PER_LESSON) : undefined}
          open={inspectorOpen}
          setOpen={setInspectorOpen}
        />
      )}

      <div className="max-w-[640px] mx-auto px-5 sm:px-6 pt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${attempt}-${index}-${jumpSeq}-${resumeAsk ?? "go"}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={reduce ? fadeQuick : stageSlide}
          >
            {resumeAsk !== null && index === 0 ? (
              <section className="lesson-screen">
                <h2 className="t-display text-fg">Welcome back</h2>
                <p className="flow-body text-fg mt-8">
                  You left this lesson at stage {resumeAsk + 1} of {lesson.stages.length}.
                </p>
                <button type="button" className="mt-4 min-h-[44px] px-0 t-label text-fg-2 underline underline-offset-4" onClick={() => { useResume.getState().clear(lesson.id); setResumeAsk(null); }}>
                  Start over instead
                </button>
                <ActionBar>
                  <PrimaryButton tone="tech" onClick={() => { setIndex(resumeAsk); setResumeAsk(null); }}>
                    Continue from stage {resumeAsk + 1}
                  </PrimaryButton>
                </ActionBar>
              </section>
            ) : theoryFirst && (stage.kind === "equation" || stage.kind === "numeric") && !openBonus.includes(index) ? (
              <BonusCard stage={stage} onOpen={() => setOpenBonus((b) => [...b, index])} onSkip={skipBonus} />
            ) : (
              <StageRenderer stage={stage} onMistake={onMistake} onDone={onDone} onSubProgress={setSub} seed={`${lesson.id}#${index}`} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* XP burst */}
      <AnimatePresence>
        {burst && (
          <motion.div key={burst.id} className="pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2" initial={{ opacity: 0, y: 20, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: [20, 0, -10, -40], scale: [0.6, 1.15, 1, 0.9] }} transition={{ duration: 1.1, times: [0, 0.2, 0.7, 1] }}>
            <div className="relative rounded-full px-4 py-2 bg-energy text-energy-on font-extrabold readout text-lg flex items-center gap-1.5" style={{ boxShadow: "0 4px 0 var(--energy-ledge)" }}>
              <Zap size={18} className="fill-current" /> +{burst.xp} XP
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <motion.span key={i} className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full" style={{ background: CONFETTI[i % CONFETTI.length] }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(a) * 70, y: Math.sin(a) * 40, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} />;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <RecapSheet stage={recap !== null ? lesson.stages[recap] : null} onClose={() => setRecap(null)} />

      <AnimatePresence>
        {failed && (
          <motion.div initial={reduce ? { opacity: 0 } : { y: "100%" }} animate={reduce ? { opacity: 1 } : { y: 0 }} transition={reduce ? fadeQuick : feedbackSheet} className="fixed bottom-0 inset-x-0 z-40 bg-danger-tint rounded-t-[24px] pb-[calc(16px+env(safe-area-inset-bottom))]" role="alertdialog" aria-label="Out of safety hearts">
            <div className="max-w-[640px] mx-auto px-5 sm:px-6 pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert size={28} className="text-danger-tint-text shrink-0 mt-0.5" aria-hidden />
                <div>
                  <div className="t-heading text-danger-tint-text">Out of safety hearts: shift stood down</div>
                  <p className="t-secondary !text-fg mt-1">Missed concepts are queued for your spaced-repetition warmup. Review the feedback, then re-attempt.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href={`/unit/${unit.id}`} className="btn-3d tone-ghost flex-1">
                  Exit
                </Link>
                <button type="button" onClick={retry} className="btn-3d tone-ink flex-1">
                  <RotateCcw size={18} aria-hidden /> Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
