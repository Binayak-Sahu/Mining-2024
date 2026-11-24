"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Delete } from "lucide-react";
import type { EquationStage } from "@/lib/types";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

interface Tile {
  id: number;
  text: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function EquationForgeCard({ stage, onMistake, onDone }: CardProps<EquationStage>) {
  const [phase, setPhase] = useState<"intuition" | "forge">("intuition");
  const [bank] = useState<Tile[]>(() => shuffle([...stage.target, ...stage.distractors]).map((text, id) => ({ id, text })));
  const [placed, setPlaced] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "wrong" | "right">("idle");
  const [penalised, setPenalised] = useState(false);
  const [shake, setShake] = useState(0);

  const placedTiles = placed.map((id) => bank.find((t) => t.id === id)!);

  const check = () => {
    const got = placedTiles.map((t) => t.text).join("\u0001");
    const valid = [stage.target, ...(stage.accept ?? [])].some((a) => a.join("\u0001") === got);
    if (valid) setStatus("right");
    else {
      setStatus("wrong");
      setShake((s) => s + 1);
      if (!penalised) {
        setPenalised(true);
        onMistake(stage.concept);
      }
    }
  };

  const reveal = () => {
    const ids: number[] = [];
    for (const tok of stage.target) {
      const t = bank.find((b) => b.text === tok && !ids.includes(b.id));
      if (t) ids.push(t.id);
    }
    setPlaced(ids);
    setStatus("right");
  };

  if (phase === "intuition") {
    return (
      <CardFrame kind="equation" title={stage.title} footer={<PrimaryButton tone="violet" onClick={() => setPhase("forge")}>I feel the proportionality → Forge it</PrimaryButton>}>
        <p className="text-[13px] font-extrabold text-violet-600">Physical proportionality first</p>
        <div className="space-y-2">
          {stage.intuition.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.25 }}
              className="rounded-2xl border-l-4 border-violet-500 bg-violet-50 px-4 py-3 text-[15px] text-slate-800 leading-relaxed"
            >
              {s}
            </motion.div>
          ))}
        </div>
      </CardFrame>
    );
  }

  return (
    <CardFrame
      kind="equation"
      title={stage.title}
      footer={
        status === "right" ? (
          <PrimaryButton onClick={onDone} tone="safe">
            Verified — add to Codex & Continue
          </PrimaryButton>
        ) : (
          <div className="flex gap-2">
            <PrimaryButton onClick={check} disabled={placed.length === 0}>
              Check equation
            </PrimaryButton>
            {status === "wrong" && (
              <button type="button" onClick={reveal} className="btn-3d tone-ghost shrink-0 px-4 text-[12px]">
                Show me
              </button>
            )}
          </div>
        )
      }
    >
      <p className="text-[14px] text-slate-600">Tap blocks to assemble the governing equation. Tap a placed block to return it.</p>
      <motion.div
        key={shake}
        animate={status === "wrong" ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.35 }}
        className={`min-h-[76px] rounded-2xl border-2 border-dashed p-2.5 flex flex-wrap gap-2 items-center ${
          status === "right" ? "border-emerald-500 bg-emerald-50" : status === "wrong" ? "border-red-400 bg-red-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        {placedTiles.length === 0 && <span className="text-xs text-slate-400 px-1">Equation tray</span>}
        {placedTiles.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={status === "right"}
            onClick={() => {
              setPlaced((p) => p.filter((x) => x !== t.id));
              setStatus("idle");
            }}
            className="btn-press readout rounded-xl bg-violet-500 text-white px-3 py-2 text-[17px] font-bold shadow-[0_3px_0_#6D28D9]"
          >
            {t.text}
          </button>
        ))}
        {placed.length > 0 && status !== "right" && (
          <button type="button" onClick={() => setPlaced([])} className="ml-auto text-slate-400 hover:text-slate-700" aria-label="Clear">
            <Delete size={18} />
          </button>
        )}
      </motion.div>
      <div className="flex flex-wrap gap-1.5">
        {bank.map((t) => {
          const used = placed.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={used || status === "right"}
              onClick={() => {
                setPlaced((p) => [...p, t.id]);
                setStatus("idle");
              }}
              className={`readout tile-3d px-3 py-2 text-[17px] font-bold ${used ? "opacity-30 !shadow-none" : "text-slate-900 hover:!border-violet-400"}`}
            >
              {t.text}
            </button>
          );
        })}
      </div>
      <Feedback show={status === "wrong"} ok={false} title="Dimensionally or physically inconsistent — try again">
        Re-read the proportionality statements: which quantity sits in the numerator, and which exponent does the physics demand?
      </Feedback>
      <Feedback show={status === "right"} ok title={stage.formula.expr}>
        {stage.formula.meaning}
        {stage.formula.vars && <span className="block mt-1 text-xs text-slate-500 readout">{stage.formula.vars}</span>}
      </Feedback>
    </CardFrame>
  );
}
