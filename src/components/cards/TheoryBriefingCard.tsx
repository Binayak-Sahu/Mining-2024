"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lightbulb, BookMarked } from "lucide-react";
import type { TheoryStage } from "@/lib/types";
import { getSim } from "@/content";
import { SimCanvas, defaults } from "@/components/sim/SimView";
import { C } from "@/components/sim/svg";
import { CardFrame, Lines, PrimaryButton, type CardProps } from "./ui";
import { fadeQuick, tactilePress } from "@/lib/motion";
import { ConceptFlow } from "./ConceptFlow";
import { useNotes, stageOf } from "@/lib/notes";

export function TheoryBriefingCard(props: CardProps<TheoryStage>) {
  if (props.stage.flow?.length) return <ConceptFlow {...props} />;
  return <Briefing {...props} />;
}

function Briefing({ stage, onDone, seed }: CardProps<TheoryStage>) {
  // Lesson notes: the briefing lines, plus each hotspot the learner opens.
  const addNote = useNotes((n) => n.add);
  const si = stageOf(seed);
  useEffect(() => {
    addNote({ key: `${si}@lines`, stageIndex: si, kind: "briefing", title: stage.title, text: stage.lines.join(" ") });
  }, [addNote, si, stage.title, stage.lines]);
  const def = getSim(stage.sim);
  const values = defaults(def, stage.simParams);
  const [active, setActive] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [chainStep, setChainStep] = useState(-1);
  const [open, setOpen] = useState<number | null>(null);

  const allSeen = seen.size >= stage.hotspots.length;

  const tap = (i: number) => {
    setActive(i);
    setSeen((s) => new Set(s).add(i));
    addNote({ key: `${si}@h${i}`, stageIndex: si, kind: "reveal", title: stage.hotspots[i].title, text: stage.hotspots[i].body });
  };

  // The causal chain plays itself once it scrolls into view (no competing Play button); timers are
  // cleared on unmount.
  const chainBox = useRef<HTMLDivElement>(null);
  const chainLen = stage.chain?.length ?? 0;
  useEffect(() => {
    const el = chainBox.current;
    if (!el || !chainLen) return;
    const timers: number[] = [];
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const play = () => {
      if (reduce) return setChainStep(chainLen - 1);
      for (let i = 0; i < chainLen; i++) timers.push(window.setTimeout(() => setChainStep(i), 200 + i * 700));
    };
    if (typeof IntersectionObserver === "undefined") {
      play();
      return () => timers.forEach(clearTimeout);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [chainLen]);

  const overlay = (
    <g>
      {stage.hotspots.map((h, i) => (
        <g key={i} role="button" aria-label={`Hotspot ${i + 1}: ${h.title}`} onClick={() => tap(i)} style={{ cursor: "pointer" }}>
          {/* invisible enlarged hit area: ≥ 44 px on a phone-width diagram */}
          <circle cx={h.x} cy={h.y} r={28} fill="transparent" />
          {!seen.has(i) && <circle cx={h.x} cy={h.y} r={6} fill="none" stroke={C.tech} strokeWidth={2} className="hotspot-ring" />}
          <circle cx={h.x} cy={h.y} r={8} fill={active === i ? C.ink : seen.has(i) ? C.safe : C.tech} stroke="white" strokeWidth={2} />
          <text x={h.x} y={h.y + 3.5} fontSize={9} fill="white" textAnchor="middle" fontWeight={700}>
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );

  return (
    <CardFrame
      kind="theory"
      title={stage.title}
      footer={
        <PrimaryButton onClick={onDone} disabled={!allSeen}>
          {allSeen ? (
            <span className="inline-flex items-center gap-2">
              <BookMarked size={16} /> File to Field Codex & Continue
            </span>
          ) : (
            `Tap all hotspots (${seen.size}/${stage.hotspots.length})`
          )}
        </PrimaryButton>
      }
    >
      <Lines lines={stage.lines} />
      <SimCanvas def={def} values={values} overlay={overlay} />
      <AnimatePresence mode="wait">
        {active !== null && (
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeQuick}
          >
            <div className="t-heading text-fg">
              <span className="readout text-action-tint-text">{active + 1}</span> · {stage.hotspots[active].title}
            </div>
            <p className="flow-body text-fg mt-2">{stage.hotspots[active].body}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {stage.chain && (
        <div ref={chainBox} className="card p-5">
          <div className="mb-3 t-eyebrow">Causal chain</div>
          <div className="flex flex-col gap-2">
            {stage.chain.map((c, i) => (
              <motion.div
                key={i}
                animate={{ x: chainStep >= i ? 0 : -3 }}
                transition={tactilePress}
                className="flex items-start gap-3"
              >
                <span
                  className="readout mt-0.5 shrink-0 w-6 h-6 rounded-full text-[14px] font-bold flex items-center justify-center"
                  style={chainStep >= i ? { background: i === stage.chain!.length - 1 ? "var(--danger)" : "var(--action)", color: "var(--action-on)" } : { background: "var(--surface-2)", color: "var(--text-2)" }}
                >
                  {i + 1}
                </span>
                <span className={`text-[16px] leading-[24px] transition-colors ${chainStep >= i ? "text-fg font-semibold" : "text-fg-2"}`}>{c}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="t-eyebrow flex items-center gap-1.5">
          <Lightbulb size={16} aria-hidden /> Tap to unpack first principles
        </div>
        {stage.drawers.map((d, i) => (
          <div key={i} className="tile-3d overflow-hidden" data-on={open === i ? "true" : undefined}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="w-full min-h-[56px] flex items-center justify-between gap-3 px-5 py-3 text-left text-[16px] leading-[24px] font-semibold text-fg"
            >
              <span>{d.q}</span>
              <ChevronDown size={18} className={`shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-4 text-[16px] leading-[26px] text-fg">{d.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}
