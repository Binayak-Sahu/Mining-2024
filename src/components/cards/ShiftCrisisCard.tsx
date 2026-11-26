"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { arrange } from "@/lib/shuffle";
import { motion } from "framer-motion";
import { Siren, Timer } from "lucide-react";
import type { CrisisStage } from "@/lib/types";
import { CardFrame, Feedback, Lines, PrimaryButton, optionClass, type CardProps } from "./ui";

/** Telemetry value colours (§2.2 tint text, AA on the card face in both themes). */
const TELEMETRY_TEXT: Record<string, string> = { ok: "text-success-tint-text", crit: "text-danger-tint-text", warn: "text-energy-tint-text", info: "text-action-tint-text" };

export function ShiftCrisisCard({ stage: authored, onMistake, onDone, seed }: CardProps<CrisisStage>) {
  // Each decision's options are shown in a balanced, deterministic order (authored order puts the right call first).
  const stage = useMemo(
    () => ({
      ...authored,
      phases: authored.phases.map((ph, p) => {
        const perm = arrange(`${seed ?? `crisis:${authored.title}`}#${p}`, ph.options.length, Math.max(0, ph.options.findIndex((o) => o.correct)));
        return { ...ph, options: perm.map((k) => ph.options[k]) };
      }),
    }),
    [authored, seed],
  );
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
      <CardFrame kind="crisis" title={stage.title} footer={<PrimaryButton tone="tech" onClick={() => setStarted(true)}>Take charge: start the clock ({stage.seconds}s)</PrimaryButton>}>
        <div className="rounded-[12px] bg-danger-tint text-danger-tint-text px-4 py-3 flex items-center gap-2 t-label !font-bold" role="status">
          <Siren size={18} aria-hidden /> {stage.alarm}
        </div>
        <p className="flow-body text-fg">{stage.scenario}</p>
        <p className="t-secondary">You are the competent person on shift. Wrong diagnoses or actions cost safety hearts; the clock is running once you accept.</p>
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
          <PrimaryButton tone="safe" onClick={onDone}>Debrief complete: continue</PrimaryButton>
        ) : (
          // Thumb-zone decision bar: which decision, the clock, and the primary action.
          <div className="flex items-center gap-3">
            <div className="shrink-0 leading-tight">
              <div className="readout t-label !font-bold text-fg-2">
                Decision {phase + 1}/{stage.phases.length}
              </div>
              <div className={`readout text-[17px] font-extrabold flex items-center gap-1 ${left <= 10 ? "text-danger-tint-text" : "text-fg"}`}>
                <Timer size={16} aria-hidden /> {left}s
              </div>
            </div>
            <PrimaryButton
              tone={pick !== null && cur.options[pick].correct ? "safe" : "ink"}
              disabled={pick === null}
              onClick={() => {
                setPhase((p) => p + 1);
                setPick(null);
              }}
            >
              {pick === null ? "Choose an action" : phase + 1 < stage.phases.length ? "Next decision" : "Stand down & debrief"}
            </PrimaryButton>
          </div>
        )
      }
    >
      <div className={`${finished ? "bg-surface-2 text-fg" : "bg-danger-tint text-danger-tint-text"} rounded-[12px] px-4 py-3 flex items-center justify-between t-label !font-bold`} role="status">
        <span className="flex items-center gap-2">
          <Siren size={18} aria-hidden /> {stage.alarm}
        </span>
        <span className="readout flex items-center gap-1">
          <Timer size={16} aria-hidden /> {left}s
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
        <motion.div className="h-full rounded-full bg-danger" animate={{ width: `${(left / stage.seconds) * 100}%` }} transition={{ ease: "linear", duration: 1 }} />
      </div>
      {stage.telemetry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stage.telemetry.map((t) => (
            <div key={t.label} className="card px-3 py-2">
              <div className="t-label text-fg-2">{t.label}</div>
              <div className={`t-readout ${TELEMETRY_TEXT[t.tone] ?? "text-fg"}`}>{t.value}</div>
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
          <div className="t-eyebrow">
            {cur.label} · {phase + 1}/{stage.phases.length}
          </div>
          <p className="flow-q text-fg !font-semibold">{cur.prompt}</p>
          <div className="grid gap-3 pt-2">
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
                </button>
              );
            })}
          </div>

        </div>
      ) : null}
      {!finished && pick !== null && (
        // The reasons live in the feedback sheet behind "Why?" (§5.7), so the tiles never grow when a pick is made.
        <Feedback key={phase} show ok={!!cur.options[pick].correct} title={cur.options[pick].correct ? "Correct!" : "Not the right call"}>
          <span className="block">{cur.options[pick].why}</span>
          {!cur.options[pick].correct &&
            cur.options
              .filter((o) => o.correct)
              .map((o) => (
                <span key={o.text} className="block mt-2">
                  <b>Right call: {o.text}.</b> {o.why}
                </span>
              ))}
        </Feedback>
      )}
      {finished && (
        <Feedback show ok title="Shift debrief">
          {stage.debrief}
        </Feedback>
      )}
    </CardFrame>
  );
}
