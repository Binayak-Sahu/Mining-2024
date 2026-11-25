"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Siren, Timer } from "lucide-react";
import type { CrisisStage } from "@/lib/types";
import { toneColor } from "@/components/sim/svg";
import { CardFrame, Feedback, Lines, PrimaryButton, optionClass, type CardProps } from "./ui";

export function ShiftCrisisCard({ stage, onMistake, onDone }: CardProps<CrisisStage>) {
  const [phase, setPhase] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [left, setLeft] = useState(stage.seconds);
  const [timedOut, setTimedOut] = useState(false);
  const [started, setStarted] = useState(false);
  const finished = phase >= stage.phases.length;
  const onMistakeRef = useRef(onMistake);
  onMistakeRef.current = onMistake;
  const promptRef = useRef<HTMLDivElement>(null);
  // Each new decision scrolls its prompt to the top so the options sit on screen above the action bar.
  useEffect(() => {
    if (started && !finished && phase > 0) promptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, started, finished]);

  useEffect(() => {
    if (!started || finished || timedOut) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          setTimedOut(true);
          onMistakeRef.current(`${stage.concept} (response time)`);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, finished, timedOut, stage.concept]);

  if (!started) {
    return (
      <CardFrame kind="crisis" title={stage.title} footer={<PrimaryButton tone="crit" onClick={() => setStarted(true)}>Take charge of the district — start clock ({stage.seconds}s)</PrimaryButton>}>
        <div className="alarm-flash rounded-2xl text-white px-4 py-3 flex items-center gap-2 font-extrabold text-sm shadow-[0_4px_0_#7F1D1D]">
          <Siren size={16} /> {stage.alarm}
        </div>
        <p className="text-[16px] leading-relaxed text-slate-700">{stage.scenario}</p>
        <p className="text-xs text-slate-500">You are the competent person on shift. Wrong diagnoses or actions cost safety hearts; the clock is running once you accept.</p>
      </CardFrame>
    );
  }

  const cur = stage.phases[phase];
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    if (!cur.options[i].correct) onMistake(`${stage.concept} — ${cur.label}`);
  };

  return (
    <CardFrame
      kind="crisis"
      title={stage.title}
      footer={
        finished ? (
          <PrimaryButton onClick={onDone}>Debrief complete — Continue</PrimaryButton>
        ) : (
          // Thumb-zone decision bar: which decision, the clock, and the primary action.
          <div className="flex items-center gap-3">
            <div className="shrink-0 leading-tight">
              <div className="readout text-[12px] font-extrabold text-red-700">
                Decision {phase + 1}/{stage.phases.length}
              </div>
              <div className={`readout text-[15px] font-extrabold flex items-center gap-1 ${left <= 10 ? "text-red-700" : "text-slate-800"}`}>
                <Timer size={14} /> {left}s
              </div>
            </div>
            <PrimaryButton
              disabled={pick === null}
              onClick={() => {
                setPhase((p) => p + 1);
                setPick(null);
              }}
            >
              {pick === null ? "Choose an action above" : phase + 1 < stage.phases.length ? "Next decision" : "Stand down & debrief"}
            </PrimaryButton>
          </div>
        )
      }
    >
      <div className={`${finished ? "bg-[#1E293B]" : "alarm-flash"} rounded-2xl text-white px-4 py-3 flex items-center justify-between font-extrabold text-sm`}>
        <span className="flex items-center gap-2">
          <Siren size={16} /> {stage.alarm}
        </span>
        <span className="readout flex items-center gap-1">
          <Timer size={14} /> {left}s
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden shadow-[inset_0_1px_2px_rgba(15,23,42,0.15)]">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500" animate={{ width: `${(left / stage.seconds) * 100}%` }} transition={{ ease: "linear", duration: 1 }} />
      </div>
      {stage.telemetry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stage.telemetry.map((t) => (
            <div key={t.label} className="rounded-xl bg-[#0E1424] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="text-[11px] font-semibold text-[#8B97AE]">{t.label}</div>
              <div className="readout text-sm font-bold" style={{ color: toneColor(t.tone) }}>
                {t.value}
              </div>
            </div>
          ))}
        </div>
      )}
      <Lines lines={[stage.scenario]} />
      {timedOut && !finished && (
        <Feedback show ok={false} title="Response window lapsed — heart lost">
          Hazards escalate while you deliberate. Finish the sequence to learn the correct response.
        </Feedback>
      )}

      {!finished ? (
        <div ref={promptRef} className="space-y-2 scroll-mt-20">
          <div className="text-[13px] font-extrabold text-red-600">
            {cur.label} · {phase + 1}/{stage.phases.length}
          </div>
          <p className="font-extrabold text-[17px] text-slate-900">{cur.prompt}</p>
          <div className="grid gap-2">
            {cur.options.map((o, i) => {
              const st = pick === null ? "idle" : o.correct ? "right" : i === pick ? "wrong" : "dim";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  className={optionClass(st)}
                >
                  {o.text}
                  {pick !== null && (st === "right" || st === "wrong") && <span className="block text-[13px] mt-1.5 text-slate-600 font-medium">{o.why}</span>}
                </button>
              );
            })}
          </div>

        </div>
      ) : (
        <Feedback show ok title="Shift debrief">
          {stage.debrief}
        </Feedback>
      )}
    </CardFrame>
  );
}
