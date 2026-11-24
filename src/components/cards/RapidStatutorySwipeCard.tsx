"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Check, X, Timer } from "lucide-react";
import type { SwipeStage } from "@/lib/types";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

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
      <CardFrame kind="swipe" title={stage.title} footer={<PrimaryButton tone="crit" onClick={() => setStarted(true)}>Start drill · {stage.cards.length} cards · {stage.seconds}s</PrimaryButton>}>
        <p className="text-[15px] text-slate-800 leading-snug">
          Rapid statutory recall. Swipe <b className="text-emerald-600">right = TRUE / compliant</b>, swipe <b className="text-red-600">left = FALSE / violation</b>. Each wrong call costs a safety heart.
        </p>
        <p className="text-[11px] text-slate-500">
          Values reflect commonly examined provisions of the Mines Act 1952, CMR 2017, MMR 1961 and allied rules. Always verify against the current gazette text and DGMS circulars.
        </p>
      </CardFrame>
    );
  }

  const correct = verdicts.filter((v) => v.ok).length;

  return (
    <CardFrame kind="swipe" title={stage.title} footer={finished && <PrimaryButton onClick={onDone}>Continue</PrimaryButton>}>
      <div className="flex items-center justify-between text-sm">
        <span className="readout font-semibold text-slate-600">
          {Math.min(i + 1, stage.cards.length)}/{stage.cards.length}
        </span>
        <span className={`readout font-bold flex items-center gap-1 ${left <= 5 ? "text-red-600" : "text-slate-900"}`}>
          <Timer size={14} /> {left}s
        </span>
      </div>

      {!finished ? (
        <>
          <div className="relative h-48">
            <AnimatePresence custom={exitDir}>
              <motion.div
                key={i}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.9}
                onDragEnd={onDragEnd}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ x: exitDir * 320, opacity: 0, rotate: exitDir * 15 }}
                whileDrag={{ rotate: 0 }}
                className="absolute inset-0 rounded-2xl bg-slate-900 text-slate-50 p-5 flex items-center justify-center text-center cursor-grab active:cursor-grabbing shadow-xl"
              >
                <p className="text-base sm:text-lg font-semibold leading-snug">{stage.cards[i].text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => answer(false)} className="btn-press rounded-xl border-2 border-red-500 text-red-600 py-3 font-bold flex items-center justify-center gap-1">
              <X size={18} /> FALSE
            </button>
            <button type="button" onClick={() => answer(true)} className="btn-press rounded-xl border-2 border-emerald-500 text-emerald-600 py-3 font-bold flex items-center justify-center gap-1">
              <Check size={18} /> TRUE
            </button>
          </div>
          {flash && (
            <Feedback show ok={flash.ok} title={flash.ok ? "Correct call" : "Wrong call"}>
              {flash.why}
            </Feedback>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="readout text-2xl font-extrabold text-slate-900">
            {correct}/{stage.cards.length} <span className="text-sm font-semibold text-slate-500">correct</span>
          </div>
          {verdicts.map((v) => {
            const c = stage.cards[v.index];
            return (
              <div key={v.index} className={`rounded-xl border px-3 py-2 text-sm ${v.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                <div className="font-semibold text-slate-900">
                  {c.truth ? "TRUE" : "FALSE"} — {c.text}
                </div>
                <div className="text-slate-600 text-xs mt-0.5">{v.said === null ? "Unanswered. " : ""}{c.why}</div>
              </div>
            );
          })}
        </div>
      )}
    </CardFrame>
  );
}
