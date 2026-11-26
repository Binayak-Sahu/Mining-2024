"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check, X, Timer } from "lucide-react";
import type { SwipeStage } from "@/lib/types";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

function SwipeItem({ text, exitDir, onDragEnd }: { text: string; exitDir: number; onDragEnd: (e: unknown, info: PanInfo) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const yes = useTransform(x, [20, 110], [0, 1]);
  const no = useTransform(x, [-110, -20], [1, 0]);
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.9, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ x: exitDir * 360, opacity: 0, rotate: exitDir * 18, transition: { duration: 0.28 } }}
      style={{ x, rotate, touchAction: "pan-y" }}
      className="absolute inset-0 card p-6 flex items-center justify-center text-center cursor-grab active:cursor-grabbing"
    >
      <motion.span style={{ opacity: yes }} className="absolute left-5 top-5 rotate-[-12deg] rounded-xl border-[3px] border-success px-3 py-1 text-success-tint-text font-black tracking-[0.12em] text-lg">
        TRUE
      </motion.span>
      <motion.span style={{ opacity: no }} className="absolute right-5 top-5 rotate-[12deg] rounded-xl border-[3px] border-danger px-3 py-1 text-danger-tint-text font-black tracking-[0.12em] text-lg">
        FALSE
      </motion.span>
      <p className="relative t-body-lg !font-bold text-fg">{text}</p>
    </motion.div>
  );
}

interface Verdict {
  index: number;
  said: boolean | null;
  ok: boolean;
}

export function RapidStatutorySwipeCard({ stage, onMistake, onDone }: CardProps<SwipeStage>) {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [left, setLeft] = useState(stage.seconds);
  const [flash, setFlash] = useState<null | { ok: boolean; why: string }>(null);
  const [exitDir, setExitDir] = useState(0);
  const finished = i >= stage.cards.length;
  const timeUp = left <= 0;
  const onMistakeRef = useRef(onMistake);
  onMistakeRef.current = onMistake;

  useEffect(() => {
    if (!started || finished || timeUp) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [started, finished, timeUp]);

  // When time runs out, the remaining cards are recorded as unanswered (one heart for the lapse).
  useEffect(() => {
    if (!started || !timeUp || finished) return;
    const rest: Verdict[] = [];
    for (let k = i; k < stage.cards.length; k++) rest.push({ index: k, said: null, ok: false });
    setVerdicts((v) => [...v, ...rest]);
    setI(stage.cards.length);
    onMistakeRef.current(`${stage.concept} (time lapsed)`);
  }, [timeUp, started, finished, i, stage.cards.length, stage.concept]);

  const answer = (said: boolean) => {
    if (finished || timeUp) return;
    const card = stage.cards[i];
    const ok = said === card.truth;
    if (!ok) onMistake(`${stage.concept}: ${card.text}`);
    setVerdicts((v) => [...v, { index: i, said, ok }]);
    setFlash({ ok, why: card.why });
    setExitDir(said ? 1 : -1);
    setI((n) => n + 1);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 90) answer(true);
    else if (info.offset.x < -90) answer(false);
  };

  if (!started) {
    return (
      <CardFrame kind="swipe" title={stage.title} footer={<PrimaryButton tone="tech" onClick={() => setStarted(true)}>Start drill · {stage.cards.length} cards · {stage.seconds}s</PrimaryButton>}>
        <p className="flow-body text-fg">
          Rapid statutory recall. Swipe <b className="text-success-tint-text">right = TRUE / compliant</b>, swipe <b className="text-danger-tint-text">left = FALSE / violation</b>. Each wrong call costs a safety heart.
        </p>
        <p className="t-secondary">
          Values reflect commonly examined provisions of the Mines Act 1952, CMR 2017, MMR 1961 and allied rules. Always verify against the current gazette text and DGMS circulars.
        </p>
      </CardFrame>
    );
  }

  const correct = verdicts.filter((v) => v.ok).length;

  return (
    <CardFrame kind="swipe" title={stage.title} footer={finished && <PrimaryButton onClick={onDone}>Continue</PrimaryButton>}>
      <div className="flex items-center justify-between t-label">
        <span className="readout text-fg-2">
          {Math.min(i + 1, stage.cards.length)}/{stage.cards.length}
        </span>
        <span className={`readout font-bold flex items-center gap-1 ${left <= 5 ? "text-danger-tint-text" : "text-fg"}`}>
          <Timer size={16} aria-hidden /> {left}s
        </span>
      </div>

      {!finished ? (
        <>
          <div className="relative h-56">
            <AnimatePresence custom={exitDir}>
              <SwipeItem key={i} text={stage.cards[i].text} exitDir={exitDir} onDragEnd={onDragEnd} />
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => answer(false)} className="btn-3d tone-crit">
              <X size={18} /> FALSE
            </button>
            <button type="button" onClick={() => answer(true)} className="btn-3d tone-safe">
              <Check size={18} /> TRUE
            </button>
          </div>
          {flash && (
            <Feedback key={i} show ok={flash.ok} title={flash.ok ? "Correct call" : "Wrong call"}>
              {flash.why}
            </Feedback>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="t-title readout text-fg">
            {correct}/{stage.cards.length} <span className="t-label text-fg-2">correct</span>
          </div>
          {verdicts.map((v) => {
            const c = stage.cards[v.index];
            return (
              <div key={v.index} className={`rounded-[12px] px-4 py-3 text-[16px] leading-[24px] ${v.ok ? "bg-success-tint" : "bg-danger-tint"}`}>
                <div className="font-semibold text-fg">
                  {c.truth ? "TRUE" : "FALSE"}: {c.text}
                </div>
                <div className="text-fg-2 text-[14px] mt-0.5">{v.said === null ? "Unanswered. " : ""}{c.why}</div>
              </div>
            );
          })}
        </div>
      )}
    </CardFrame>
  );
}
