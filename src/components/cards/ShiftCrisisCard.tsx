"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Siren, Timer } from "lucide-react";
import type { CrisisStage } from "@/lib/types";
import { toneColor } from "@/components/sim/svg";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

export function ShiftCrisisCard({ stage, onMistake, onDone }: CardProps<CrisisStage>) {
  const [phase, setPhase] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [left, setLeft] = useState(stage.seconds);
  const [timedOut, setTimedOut] = useState(false);
  const [started, setStarted] = useState(false);
  const finished = phase >= stage.phases.length;
  const onMistakeRef = useRef(onMistake);
  onMistakeRef.current = onMistake;

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
        <div className="alarm-flash rounded-xl text-white px-3 py-2 flex items-center gap-2 font-bold text-sm">
          <Siren size={16} /> {stage.alarm}
        </div>
        <p className="text-[15px] leading-snug text-slate-800">{stage.scenario}</p>
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
    <CardFrame kind="crisis" title={stage.title} footer={finished && <PrimaryButton onClick={onDone}>Debrief complete — Continue</PrimaryButton>}>
      <div className={`${finished ? "bg-slate-800" : "alarm-flash"} rounded-xl text-white px-3 py-2 flex items-center justify-between font-bold text-sm`}>
        <span className="flex items-center gap-2">
          <Siren size={16} /> {stage.alarm}
        </span>
        <span className="readout flex items-center gap-1">
          <Timer size={14} /> {left}s
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <motion.div className="h-full bg-red-500" animate={{ width: `${(left / stage.seconds) * 100}%` }} transition={{ ease: "linear", duration: 1 }} />
      </div>
      {stage.telemetry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stage.telemetry.map((t) => (
            <div key={t.label} className="rounded-lg bg-slate-900 px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">{t.label}</div>
              <div className="readout text-sm font-bold" style={{ color: toneColor(t.tone) }}>
                {t.value}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm leading-snug text-slate-700">{stage.scenario}</p>
      {timedOut && !finished && (
        <Feedback show ok={false} title="Response window lapsed — heart lost">
          Hazards escalate while you deliberate. Finish the sequence to learn the correct response.
        </Feedback>
      )}

      {!finished ? (
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-red-600">
            {cur.label} · {phase + 1}/{stage.phases.length}
          </div>
          <p className="font-bold text-slate-900">{cur.prompt}</p>
          <div className="grid gap-2">
            {cur.options.map((o, i) => {
              const st = pick === null ? "idle" : o.correct ? "right" : i === pick ? "wrong" : "dim";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  className={`btn-press text-left rounded-xl border-2 px-3 py-2.5 text-sm font-medium ${
                    st === "idle" ? "border-slate-200 bg-white hover:border-red-500" : st === "right" ? "border-emerald-500 bg-emerald-50" : st === "wrong" ? "border-red-500 bg-red-50" : "border-slate-100 text-slate-400"
                  }`}
                >
                  {o.text}
                  {pick !== null && (st === "right" || st === "wrong") && <span className="block text-xs mt-1 text-slate-600 font-normal">{o.why}</span>}
                </button>
              );
            })}
          </div>
          {pick !== null && (
            <PrimaryButton
              onClick={() => {
                setPhase((p) => p + 1);
                setPick(null);
              }}
            >
              {phase + 1 < stage.phases.length ? "Next decision" : "Stand down & debrief"}
            </PrimaryButton>
          )}
        </div>
      ) : (
        <Feedback show ok title="Shift debrief">
          {stage.debrief}
        </Feedback>
      )}
    </CardFrame>
  );
}
