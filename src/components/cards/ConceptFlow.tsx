"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { BookMarked, BookOpenCheck, ExternalLink, Lightbulb, X } from "lucide-react";
import type { FlowScreen, FlowVisual, TheoryStage, Vals } from "@/lib/types";
import { getSim } from "@/content";
import { REFS } from "@/content/references";
import { SimCanvas, SimView, defaults } from "@/components/sim/SimView";
import { C } from "@/components/sim/svg";
import { shuffleItem } from "@/lib/shuffle";
import { useWhere } from "@/lib/reports";
import { SituationHeader } from "./Situation";
import { CardFrame, OptionKey, PrimaryButton, VerdictBar, optionClass, type CardProps } from "./ui";

/** Source chip: opens a sheet with the reference title, author, publisher and link. */
function SourceChip({ ids }: { ids: string[] }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="inline-flex items-center gap-1.5 min-h-[44px] -my-2 px-1 text-[13px] font-semibold text-slate-500 hover:text-slate-900">
          <BookOpenCheck size={15} /> Source{ids.length > 1 ? `s (${ids.length})` : ""}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl rounded-t-3xl bg-surface p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl focus:outline-none" aria-describedby={undefined}>
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-[19px] font-bold text-slate-900">Where this comes from</Dialog.Title>
            <Dialog.Close className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>
          <ul className="space-y-3">
            {ids.map((id) => {
              const r = REFS[id];
              if (!r) return null;
              return (
                <li key={id} className="rounded-2xl hairline p-4">
                  <div className="text-[16px] font-semibold text-slate-900 leading-snug">{r.title}</div>
                  <div className="text-[14px] text-slate-600 mt-1">
                    {r.author} · {r.publisher}
                    {r.where ? ` · ${r.where}` : ""}
                  </div>
                  <a href={r.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] text-[14px] font-semibold text-blue-700 break-all">
                    <ExternalLink size={14} className="shrink-0" /> Open source
                  </a>
                </li>
              );
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

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

  useEffect(() => {
    useWhere.setState({ screenIndex: i });
  }, [i]);

  useEffect(() => {
    if (!single) onSubProgress?.(i / total);
  }, [i, total, onSubProgress, single]);

  const next = () => {
    if (single) return onDone();
    setPh(FRESH);
    setNudgeVals(null);
    setI((n) => Math.min(n + 1, screens.length));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const raw: FlowScreen | null = i < screens.length ? screens[i] : null;
  // Balanced deterministic option order (answer and reasons follow their option); key `${lesson}#${stage}@${screen}`.
  const s: FlowScreen | null = useMemo(() => {
    if (!raw || (raw.kind !== "predict" && raw.kind !== "check" && raw.kind !== "situation")) return raw;
    const sh = shuffleItem(`${seed ?? stage.title}@${i}`, raw.options, raw.answer, raw.why);
    return { ...raw, options: sh.options, why: sh.why as string[], answer: sh.answer };
  }, [raw, stage.title, seed, i]);

  const nudgeDef = s?.kind === "nudge" ? getSim(s.sim) : null;
  const nudgeStart = useMemo(() => (s?.kind === "nudge" && nudgeDef ? defaults(nudgeDef, s.start) : null), [s, nudgeDef]);

  const check = () => {
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
      <div className="space-y-5">
        <p className="flow-body text-slate-700">What you now know:</p>
        <ul className="space-y-3">
          {(stage.flowSummary ?? stage.codex.bullets.slice(0, 3)).map((b, k) => (
            <motion.li key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * k }} className="flex gap-3 flow-body text-slate-800">
              <span className="mt-[9px] w-2 h-2 shrink-0 rounded-full bg-emerald-500" />
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    );
    footer = (
      <PrimaryButton tone="safe" onClick={onDone}>
        <BookMarked size={17} /> File to Codex
      </PrimaryButton>
    );
  } else if (s.kind === "predict" || s.kind === "check" || s.kind === "situation") {
    label = s.kind === "predict" ? "Predict first" : s.kind === "situation" ? "On the job" : "Check yourself";
    const done = ph.verdict === "right";
    body = (
      <div className="space-y-5">
        {s.kind === "predict" && s.visual && <Visual stage={stage} v={s.visual} />}
        {s.kind === "situation" ? (
          <SituationHeader role={s.role} scene={s.scene} claim={s.claim} claimBy={s.claimBy} visual={s.visual ? <Visual stage={stage} v={s.visual} /> : undefined} />
        ) : (
          <p className="flow-q text-slate-900">{s.q}</p>
        )}
        <div className="grid gap-2.5" role="radiogroup">
          {s.options.map((o, k) => {
            const tried = ph.tried.includes(k);
            const sel = !done && ph.pick === k && ph.verdict !== "wrong";
            const state = done ? (k === s.answer ? "right" : "dim") : tried ? "dim" : sel ? "selected" : "idle";
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={ph.pick === k}
                disabled={done || tried}
                onClick={() => setPh((p) => ({ ...p, pick: k, verdict: "none" }))}
                className={`${optionClass(state)} flex items-center !text-[16px] min-h-[56px]`}
              >
                <OptionKey i={k} state={state} />
                <span className={tried && !done ? "line-through decoration-slate-400" : ""}>{o}</span>
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
        <VerdictBar ok={false} title="Not quite — try again" why={s.kind === "check" && s.hint && ph.tried.length > 1 ? <span className="font-semibold text-slate-800"><Lightbulb size={14} className="inline -mt-0.5 mr-1" />{s.hint}</span> : s.why[ph.pick]}>
          <PrimaryButton onClick={() => setPh((p) => ({ ...p, pick: null, verdict: "none" }))}>Try again</PrimaryButton>
        </VerdictBar>
      );
    else footer = <PrimaryButton onClick={check} disabled={ph.pick === null}>Check</PrimaryButton>;
  } else if (s.kind === "explain") {
    label = "How it works";
    body = (
      <div className="space-y-5">
        {s.visual && <Visual stage={stage} v={s.visual} />}
        <p className="flow-body text-slate-800">{s.text}</p>
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
      <div className="space-y-5">
        <p className="flow-body text-slate-800">{s.prompt}</p>
        <SimCanvas def={def} values={values} still overlay={overlay} focus={ph.revealed ? [[h.x, h.y]] : undefined} />
        <AnimatePresence>
          {ph.revealed && (
            <motion.div ref={revealBox} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="scroll-mb-40 rounded-2xl bg-slate-50 hairline p-4">
              <div className="text-[15px] font-bold text-slate-900">{h.title}</div>
              <p className="flow-body text-slate-700 mt-1">{h.body}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
    footer = ph.revealed ? <PrimaryButton onClick={next}>Continue</PrimaryButton> : <PrimaryButton disabled>Find the pin to continue</PrimaryButton>;
  } else if (s.kind === "misconception") {
    label = "Common trap";
    body = (
      <div className="space-y-5">
        <div className="rounded-2xl bg-amber-50 p-4 sm:p-5">
          <div className="text-[13px] font-bold text-amber-800 mb-1">Many people think</div>
          <p className="flow-body text-slate-800">“{s.claim}”</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl bg-emerald-50 p-4 sm:p-5">
          <div className="text-[13px] font-bold text-emerald-800 mb-1">What actually happens</div>
          <p className="flow-body text-slate-800">{s.truth}</p>
        </motion.div>
        {s.visual && <Visual stage={stage} v={s.visual} />}
      </div>
    );
    footer = <PrimaryButton onClick={next}>Continue</PrimaryButton>;
  } else if (s.kind === "nudge" && nudgeDef && nudgeStart) {
    label = "Try it";
    const vals = nudgeVals ?? nudgeStart;
    body = (
      <div className="space-y-5">
        <SimView
          def={nudgeDef}
          values={vals}
          onChange={(v) => {
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
        <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18, ease: "easeOut" }} className="space-y-5">
          <div className="flex items-center justify-between gap-3 -mt-1">
            <span className="text-[13px] font-semibold text-slate-600">
              {single ? "Review" : label}
              {!single && (
                <>
                  {" "}
                  · <span className="readout">{i + 1}/{total}</span>
                </>
              )}
            </span>
            {s && <SourceChip ids={s.src} />}
          </div>
          {body}
        </motion.div>
      </AnimatePresence>
    </CardFrame>
  );
}
