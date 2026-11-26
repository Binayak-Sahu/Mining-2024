"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BookMarked, Lightbulb } from "lucide-react";
import type { FlowScreen, FlowVisual, TheoryStage, Vals } from "@/lib/types";
import { getSim } from "@/content";
import { useLessonSources } from "@/lib/lessonSources";
import { fadeQuick, stageSlide } from "@/lib/motion";
import { SimCanvas, SimView, defaults } from "@/components/sim/SimView";
import { C } from "@/components/sim/svg";
import { shuffleItem } from "@/lib/shuffle";
import { useWhere } from "@/lib/reports";
import { useNotes, stageOf } from "@/lib/notes";
import { ChevronLeft } from "lucide-react";
import { SituationHeader } from "./Situation";
import { nb } from "./ui";
import { CardFrame, OptionKey, PrimaryButton, VerdictBar, optionClass, type CardProps } from "./ui";

function Visual({ stage, v }: { stage: TheoryStage; v?: FlowVisual }) {
  const def = getSim(v?.sim ?? stage.sim);
  const values = defaults(def, v?.params ?? stage.simParams);
  const pins = (v?.focus ?? []).map((i) => stage.hotspots[i]).filter(Boolean);
  const overlay = (
    <g>
      {pins.map((h, i) => (
        <g key={i}>
          <circle cx={h.x} cy={h.y} r={9} fill={C.tech} stroke="white" strokeWidth={2} />
          <text x={h.x} y={h.y + 3.5} fontSize={9} fill="white" textAnchor="middle" fontWeight={700}>
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
  return <SimCanvas def={def} values={values} still focus={pins.map((h) => [h.x, h.y] as [number, number])} overlay={pins.length ? overlay : undefined} />;
}

type Phase = { pick: number | null; tried: number[]; verdict: "none" | "wrong" | "right"; revealed: boolean; met: boolean };
const FRESH: Phase = { pick: null, tried: [], verdict: "none", revealed: false, met: false };

export function ConceptFlow({ stage, onMistake, onDone, onSubProgress, seed, screen }: CardProps<TheoryStage>) {
  const screens = stage.flow ?? [];
  // Warmup review renders exactly one screen (a per-screen SRS item) and finishes after it.
  const single = screen !== undefined && screen >= 0 && screen < screens.length;
  const total = single ? 1 : screens.length + 1; // + summary
  const [i, setI] = useState(single ? (screen as number) : 0);
  const [ph, setPh] = useState<Phase>(FRESH);
  const missed = useRef<Set<number>>(new Set());
  const [nudgeVals, setNudgeVals] = useState<Vals | null>(null);
  const revealBox = useRef<HTMLDivElement>(null);
  // Back navigation: screens before `furthest` are already done and reopen in a review state (their final
  // answer shown, no re-scoring, no hearts). `done` keeps each finished screen's end state.
  const [furthest, setFurthest] = useState(single ? (screen as number) : 0);
  const done = useRef<Map<number, Phase>>(new Map());
  const review = !single && i < furthest;
  const touch0 = useRef<{ x: number; y: number; ok: boolean } | null>(null);

  useEffect(() => {
    useWhere.setState({ screenIndex: i });
  }, [i]);

  useEffect(() => {
    if (!single) onSubProgress?.(i / total);
  }, [i, total, onSubProgress, single]);

  const go = (to: number) => {
    const target = Math.max(0, Math.min(to, screens.length));
    setNudgeVals(null);
    setPh(done.current.get(target) ?? FRESH);
    setI(target);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    if (single) return onDone();
    if (!review) done.current.set(i, { ...ph, verdict: ph.verdict === "none" ? "right" : ph.verdict, revealed: true, met: true });
    setFurthest((f) => Math.max(f, i + 1));
    go(i + 1);
  };
  const back = () => {
    if (single || i === 0) return;
    if (!review && i >= furthest) setFurthest(i);
    go(i - 1);
  };
  // Swipe right (outside sliders, grips and the diagram) goes back one screen.
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      const el = e.target as Element;
      touch0.current = { x: t.clientX, y: t.clientY, ok: !el.closest(".slider, [data-grip], svg, input, textarea, button[role=radio]") };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s0 = touch0.current;
      touch0.current = null;
      const t = e.changedTouches[0];
      if (!s0 || !s0.ok || !t) return;
      const dx = t.clientX - s0.x;
      const dy = Math.abs(t.clientY - s0.y);
      if (dx > 70 && dy < 45) back();
    },
  };

  // Notes: every explain / misconception / revealed screen seen in this lesson run.
  const addNote = useNotes((n) => n.add);
  const stageIndex = stageOf(seed);

  const raw: FlowScreen | null = i < screens.length ? screens[i] : null;
  // Balanced deterministic option order (answer and reasons follow their option); key `${lesson}#${stage}@${screen}`.
  const s: FlowScreen | null = useMemo(() => {
    if (!raw || (raw.kind !== "predict" && raw.kind !== "check" && raw.kind !== "situation")) return raw;
    const sh = shuffleItem(`${seed ?? stage.title}@${i}`, raw.options, raw.answer, raw.why);
    return { ...raw, options: sh.options, why: sh.why as string[], answer: sh.answer };
  }, [raw, stage.title, seed, i]);

  // The top bar's ⋯ menu shows the sources behind the screen on show (§5.6); cleared when the flow unmounts.
  const srcKey = s ? s.src.join("|") : "";
  useEffect(() => {
    useLessonSources.getState().set(srcKey ? srcKey.split("|") : [], seed?.split("#")[0] ?? null);
  }, [srcKey, seed]);
  useEffect(() => () => useLessonSources.getState().set([], null), []);
  const reduce = useReducedMotion();

  const nudgeDef = s?.kind === "nudge" ? getSim(s.sim) : null;
  const nudgeStart = useMemo(() => (s?.kind === "nudge" && nudgeDef ? defaults(nudgeDef, s.start) : null), [s, nudgeDef]);

  useEffect(() => {
    if (!s || single) return;
    const key = `${stageIndex}@${i}`;
    if (s.kind === "explain") addNote({ key, stageIndex, kind: "explain", text: s.text });
    if (s.kind === "misconception") addNote({ key, stageIndex, kind: "misconception", title: `Not: “${s.claim}”`, text: s.truth });
    if (s.kind === "reveal" && ph.revealed) addNote({ key, stageIndex, kind: "reveal", title: s.hotspot.title, text: s.hotspot.body });
  }, [s, i, ph.revealed, single, stageIndex, addNote]);

  const check = () => {
    if (review) return;
    if (!s || (s.kind !== "predict" && s.kind !== "check" && s.kind !== "situation") || ph.pick === null) return;
    if (ph.pick === s.answer) {
      setPh((p) => ({ ...p, verdict: "right" }));
    } else {
      if (!missed.current.has(i)) {
        missed.current.add(i);
        onMistake(s.concept, { heart: false, screen: i });
      }
      setPh((p) => ({ ...p, verdict: "wrong", tried: [...p.tried, p.pick as number] }));
    }
  };

  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;
  let label = "";

  if (!s) {
    label = "Summary";
    body = (
      <div className="space-y-4">
        <p className="flow-body text-fg">What you now know:</p>
        <ul className="space-y-4">
          {(stage.flowSummary ?? stage.codex.bullets.slice(0, 3)).map((b, k) => (
            <motion.li key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...fadeQuick, delay: 0.06 * k }} className="flex gap-3 flow-body text-fg">
              <span className="mt-[11px] w-2 h-2 shrink-0 rounded-full bg-success" />
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    );
    footer = (
      <PrimaryButton onClick={onDone}>
        <BookMarked size={18} /> File to Codex
      </PrimaryButton>
    );
  } else if (s.kind === "predict" || s.kind === "check" || s.kind === "situation") {
    label = s.kind === "predict" ? "Predict first" : s.kind === "situation" ? "On the job" : "Check yourself";
    const done = ph.verdict === "right";
    body = (
      <div className="space-y-8">
        {s.kind === "predict" && s.visual && <Visual stage={stage} v={s.visual} />}
        {s.kind === "situation" ? (
          <SituationHeader role={s.role} scene={s.scene} claim={s.claim} claimBy={s.claimBy} visual={s.visual ? <Visual stage={stage} v={s.visual} /> : undefined} />
        ) : (
          <p className="flow-q text-fg">{nb(s.q)}</p>
        )}
        <div className="grid gap-3" role="radiogroup">
          {s.options.map((o, k) => {
            const tried = ph.tried.includes(k);
            const sel = !done && ph.pick === k && ph.verdict !== "wrong";
            // While the "Not quite" sheet is up, the pick shows as wrong (§5.2); after Try again it is struck through.
            const wrongNow = ph.verdict === "wrong" && ph.pick === k;
            const state = done ? (k === s.answer ? "right" : "dim") : wrongNow ? "wrong" : tried ? "dim" : sel ? "selected" : "idle";
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={ph.pick === k}
                disabled={done || tried}
                onClick={() => setPh((p) => ({ ...p, pick: k, verdict: "none" }))}
                className={optionClass(state)}
              >
                <OptionKey i={k} state={state} />
                <span className={tried && !done && !wrongNow ? "line-through decoration-[var(--text-3)]" : ""}>{nb(o)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
    if (ph.verdict === "right")
      footer = (
        <VerdictBar ok title={s.kind === "predict" && ph.tried.length === 0 ? "Good prediction" : s.kind === "situation" && ph.tried.length === 0 ? "Right call" : "That's it"} why={s.why[s.answer]}>
          <PrimaryButton tone="safe" onClick={next}>{single ? "Done" : "Continue"}</PrimaryButton>
        </VerdictBar>
      );
    else if (ph.verdict === "wrong" && ph.pick !== null)
      footer = (
        <VerdictBar ok={false} title="Not quite" why={s.kind === "check" && s.hint && ph.tried.length > 1 ? <span className="font-semibold text-fg"><Lightbulb size={16} className="inline -mt-0.5 mr-1" />{s.hint}</span> : s.why[ph.pick]}>
          <PrimaryButton onClick={() => setPh((p) => ({ ...p, pick: null, verdict: "none" }))}>Try again</PrimaryButton>
        </VerdictBar>
      );
    else footer = <PrimaryButton tone="tech" onClick={check} disabled={ph.pick === null}>Check</PrimaryButton>;
  } else if (s.kind === "explain") {
    label = "How it works";
    body = (
      <div className="space-y-8">
        {s.visual && <Visual stage={stage} v={s.visual} />}
        <p className="flow-body text-fg">{nb(s.text)}</p>
      </div>
    );
    footer = <PrimaryButton onClick={next}>Continue</PrimaryButton>;
  } else if (s.kind === "reveal") {
    label = "Look closer";
    const def = getSim(s.visual?.sim ?? stage.sim);
    const values = defaults(def, s.visual?.params ?? stage.simParams);
    const h = s.hotspot;
    const overlay = (
      <g
        role="button"
        aria-label={`Reveal: ${h.title}`}
        tabIndex={0}
        onClick={() => {
          setPh((p) => ({ ...p, revealed: true }));
          window.setTimeout(() => revealBox.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 250);
        }}
        style={{ cursor: "pointer" }}
      >
        <circle cx={h.x} cy={h.y} r={30} fill="transparent" />
        {!ph.revealed && <circle cx={h.x} cy={h.y} r={6} fill="none" stroke={C.tech} strokeWidth={2} className="hotspot-ring" />}
        <circle cx={h.x} cy={h.y} r={9} fill={ph.revealed ? C.safe : C.tech} stroke="white" strokeWidth={2} />
      </g>
    );
    body = (
      <div className="space-y-8">
        <p className="flow-body text-fg">{s.prompt}</p>
        <SimCanvas def={def} values={values} still overlay={overlay} focus={ph.revealed ? [[h.x, h.y]] : undefined} />
        <AnimatePresence>
          {ph.revealed && (
            <motion.div ref={revealBox} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fadeQuick} className="scroll-mb-40">
              <div className="t-heading text-fg">{h.title}</div>
              <p className="flow-body text-fg mt-2">{h.body}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
    footer = ph.revealed ? <PrimaryButton onClick={next}>Continue</PrimaryButton> : <PrimaryButton disabled>Find the pin to continue</PrimaryButton>;
  } else if (s.kind === "misconception") {
    label = "Common trap";
    body = (
      <div className="space-y-8">
        <div className="rounded-[20px] bg-danger-tint p-5">
          <div className="t-label !font-bold text-danger-tint-text mb-1">Many people think</div>
          <p className="flow-body text-fg">“{s.claim}”</p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...fadeQuick, delay: 0.25 }} className="rounded-[20px] bg-success-tint p-5">
          <div className="t-label !font-bold text-success-tint-text mb-1">What actually happens</div>
          <p className="flow-body text-fg">{s.truth}</p>
        </motion.div>
        {s.visual && <Visual stage={stage} v={s.visual} />}
      </div>
    );
    footer = <PrimaryButton onClick={next}>Continue</PrimaryButton>;
  } else if (s.kind === "nudge" && nudgeDef && nudgeStart) {
    label = "Try it";
    const vals = nudgeVals ?? nudgeStart;
    body = (
      <div className="space-y-8">
        <SimView
          def={nudgeDef}
          values={vals}
          onChange={(raw) => {
            const v = s.couple ? s.couple(raw) : raw;
            setNudgeVals(v);
            if (s.goal(v, nudgeDef.compute(v))) setPh((p) => ({ ...p, met: true }));
          }}
          objective={{ text: s.ask, met: ph.met, tag: "Try" }}
        />
      </div>
    );
    footer = ph.met ? (
      <VerdictBar ok title="You found it" why={s.after}>
        <PrimaryButton tone="safe" onClick={next}>Continue</PrimaryButton>
      </VerdictBar>
    ) : (
      <PrimaryButton disabled>Reach the target to continue</PrimaryButton>
    );
  }

  return (
    <CardFrame kind="theory" title={stage.title} compact={i > 0 && !single} footer={footer} footerKey={`${i}-${ph.verdict}-${ph.revealed}-${ph.met}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={i}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={reduce ? fadeQuick : stageSlide}
          className="flow-screen space-y-8"
          {...swipe}
        >
          <div className="flex items-center justify-between gap-3 -mt-4">
            <span className="flex items-center gap-1 t-label text-fg-2">
              {!single && i > 0 && (
                <button type="button" onClick={back} aria-label="Previous screen" className="-ml-3 w-11 h-11 -my-2 rounded-full flex items-center justify-center text-fg-2">
                  <ChevronLeft size={22} />
                </button>
              )}
              {review && <span className="rounded-full bg-surface-2 px-2.5 py-0.5 t-label !font-bold text-fg mr-1">Review</span>}
              {single ? "Review" : label}
              {!single && (
                <>
                  {" "}
                  · <span className="readout">{i + 1}/{total}</span>
                </>
              )}
            </span>
          </div>
          {body}
        </motion.div>
      </AnimatePresence>
    </CardFrame>
  );
}
