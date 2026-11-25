"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lightbulb, BookMarked } from "lucide-react";
import type { TheoryStage } from "@/lib/types";
import { getSim } from "@/content";
import { SimCanvas, defaults } from "@/components/sim/SimView";
import { C } from "@/components/sim/svg";
import { CardFrame, Lines, PrimaryButton, type CardProps } from "./ui";
import { ConceptFlow } from "./ConceptFlow";

export function TheoryBriefingCard(props: CardProps<TheoryStage>) {
  if (props.stage.flow?.length) return <ConceptFlow {...props} />;
  return <Briefing {...props} />;
}

function Briefing({ stage, onDone }: CardProps<TheoryStage>) {
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-[#0E1424] text-[#F1F5F9] p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]"
          >
            <div className="text-[13px] font-bold text-[#93C5FD]">
              {active + 1} · {stage.hotspots[active].title}
            </div>
            <p className="text-[14.5px] mt-1.5 leading-relaxed text-[#CBD5E1]">{stage.hotspots[active].body}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {stage.chain && (
        <div ref={chainBox} className="rounded-2xl bg-slate-50 shadow-[inset_0_0_0_1px_var(--n-200)] p-4">
          <div className="mb-2">
            <span className="text-[13px] font-bold text-slate-600">Causal chain</span>
          </div>
          <div className="flex flex-col gap-1">
            {stage.chain.map((c, i) => (
              <motion.div
                key={i}
                animate={{ x: chainStep >= i ? 0 : -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className="flex items-start gap-2 text-sm"
              >
                <span
                  className="readout mt-0.5 shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={chainStep >= i ? { background: i === stage.chain!.length - 1 ? "#DC2626" : "#2563EB", color: "#fff" } : { background: "var(--n-200)", color: "var(--n-700)" }}
                >
                  {i + 1}
                </span>
                <span className={`leading-snug text-[14.5px] transition-colors ${chainStep >= i ? "text-slate-900 font-semibold" : "text-slate-500"}`}>{c}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5">
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
