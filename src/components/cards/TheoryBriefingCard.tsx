"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Play, Lightbulb, BookMarked } from "lucide-react";
import type { TheoryStage } from "@/lib/types";
import { getSim } from "@/content";
import { SimCanvas, defaults } from "@/components/sim/SimView";
import { C } from "@/components/sim/svg";
import { CardFrame, Lines, PrimaryButton, type CardProps } from "./ui";

export function TheoryBriefingCard({ stage, onDone }: CardProps<TheoryStage>) {
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
  };

  const playChain = () => {
    if (!stage.chain) return;
    setChainStep(0);
    stage.chain.forEach((_, i) => setTimeout(() => setChainStep(i), i * 700));
  };

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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-[#0E1424] text-[#F1F5F9] p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]"
          >
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#93C5FD]">
              {active + 1} · {stage.hotspots[active].title}
            </div>
            <p className="text-[14.5px] mt-1.5 leading-relaxed text-[#CBD5E1]">{stage.hotspots[active].body}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {stage.chain && (
        <div className="rounded-2xl bg-slate-50 shadow-[inset_0_0_0_1px_var(--n-200)] p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Causal chain</span>
            <button type="button" onClick={playChain} className="btn-press inline-flex items-center justify-center gap-1 min-w-[48px] rounded-lg bg-blue-500 text-white px-2.5 py-1 text-xs font-extrabold shadow-[0_2px_0_#1D4ED8]">
              <Play size={12} /> {chainStep < 0 ? "Play" : "Replay"}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {stage.chain.map((c, i) => (
              <motion.div
                key={i}
                animate={{ opacity: chainStep >= i ? 1 : 0.25, x: chainStep >= i ? 0 : -4 }}
                className="flex items-start gap-2 text-sm"
              >
                <span
                  className="readout mt-0.5 shrink-0 w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white"
                  style={{ background: chainStep >= i ? (i === stage.chain!.length - 1 ? C.crit : C.tech) : C.rock }}
                >
                  {i + 1}
                </span>
                <span className="text-slate-700 leading-snug text-[14.5px]">{c}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 flex items-center gap-1.5">
          <Lightbulb size={12} /> Tap to unpack first principles
        </div>
        {stage.drawers.map((d, i) => (
          <div key={i} className={`rounded-2xl overflow-hidden transition-shadow ${open === i ? "bg-surface shadow-[inset_0_0_0_2px_#3B82F655]" : "bg-surface shadow-[inset_0_0_0_1.5px_var(--n-200)]"}`}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-[14.5px] font-bold text-slate-900 hover:bg-slate-50"
            >
              <span>{d.q}</span>
              <ChevronDown size={16} className={`transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-[14.5px] text-slate-600 leading-relaxed">{d.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </CardFrame>
  );
}
