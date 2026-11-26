"use client";

import { useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { fadeQuick, tactilePress } from "@/lib/motion";
import { Delete } from "lucide-react";
import type { EquationStage } from "@/lib/types";
import { CardFrame, Feedback, PrimaryButton, type CardProps } from "./ui";

interface Tile {
  id: number;
  text: string;
}

/** Explain exactly what is wrong with this attempt, block by block, compared with the target equation. */
function diagnose(got: string[], target: string[]): { title: string; lines: string[] } {
  const left = [...target];
  const extra: string[] = [];
  for (const g of got) {
    const i = left.indexOf(g);
    if (i >= 0) left.splice(i, 1);
    else extra.push(g);
  }
  const lines: string[] = [];
  if (extra.length) lines.push(`${extra.map((e) => `“${e}”`).join(", ")} ${extra.length > 1 ? "do not belong" : "does not belong"} in this relationship: check it against the proportionality statements.`);
  if (left.length) lines.push(`Still missing ${left.length === 1 ? "one block" : `${left.length} blocks`}: the physics needs ${left.length === 1 ? "another term" : "more terms"} than you placed.`);
  if (!extra.length && !left.length) {
    const k = got.findIndex((g, i) => g !== target[i]);
    lines.push(`Every block is right, but the order is not: block ${k + 1} should be “${target[k]}”. Which quantity sits in the numerator, and what is it raised to?`);
    return { title: "Right blocks, wrong arrangement", lines };
  }
  return { title: extra.length ? "A block here does not fit the physics" : "Not complete yet", lines };
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
  const [diag, setDiag] = useState<{ title: string; lines: string[] } | null>(null);
  const reduce = useReducedMotion();

  const placedTiles = placed.map((id) => bank.find((t) => t.id === id)!);

  const check = () => {
    const got = placedTiles.map((t) => t.text).join("\u0001");
    const valid = [stage.target, ...(stage.accept ?? [])].some((a) => a.join("\u0001") === got);
    if (valid) setStatus("right");
    else {
      setDiag(diagnose(placedTiles.map((t) => t.text), stage.target));
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
      <CardFrame kind="equation" title={stage.title} footer={<PrimaryButton onClick={() => setPhase("forge")}>I feel the proportionality: forge it</PrimaryButton>}>
        <p className="t-eyebrow">Physical proportionality first</p>
        <div className="space-y-4">
          {stage.intuition.map((s, i) => (
            <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...fadeQuick, delay: i * 0.2 }} className="flow-body text-fg border-l-4 border-line-strong pl-4">
              {s}
            </motion.p>
          ))}
        </div>
      </CardFrame>
    );
  }

  const tray = status === "right" ? "!border-solid !border-success bg-success-tint" : status === "wrong" ? "!border-solid !border-danger bg-danger-tint" : "";
  return (
    <CardFrame
      kind="equation"
      title={stage.title}
      footer={
        status === "right" ? (
          <PrimaryButton onClick={onDone} tone="safe">
            Verified: add to Codex and continue
          </PrimaryButton>
        ) : (
          <div className="flex gap-3">
            <PrimaryButton tone="tech" onClick={check} disabled={placed.length === 0}>
              Check equation
            </PrimaryButton>
            {status === "wrong" && (
              <button type="button" onClick={reveal} className="btn-3d btn-sm tone-ghost shrink-0 self-center">
                Show me
              </button>
            )}
          </div>
        )
      }
    >
      <p className="t-secondary">Tap blocks to build the governing equation. Tap a placed block to send it back.</p>
      <LayoutGroup>
        {/* §5.2 blank slot: dashed --text-3 tray; blocks fly in and out with a shared layoutId (tactilePress). */}
        <motion.div
          key={shake}
          animate={status === "wrong" && !reduce ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.35 }}
          aria-label="Equation tray"
          className={`ds-blank !flex w-full min-h-[76px] !rounded-[12px] p-3 flex-wrap gap-3 !justify-start items-center ${tray}`}
        >
          {placedTiles.length === 0 && <span className="t-label text-fg-2 px-1">Equation tray</span>}
          {placedTiles.map((t) => (
            <motion.button
              key={t.id}
              layoutId={`eq-${t.id}`}
              transition={reduce ? fadeQuick : tactilePress}
              type="button"
              disabled={status === "right"}
              onClick={() => {
                setPlaced((p) => p.filter((x) => x !== t.id));
                setStatus("idle");
              }}
              className="tile-3d tile-chip readout min-w-[44px] min-h-[44px] px-3 py-1 text-[20px] font-semibold"
            >
              {t.text}
            </motion.button>
          ))}
          {placed.length > 0 && status !== "right" && (
            <button type="button" onClick={() => setPlaced([])} className="ml-auto w-11 h-11 flex items-center justify-center rounded-full text-fg-2" aria-label="Clear">
              <Delete size={20} />
            </button>
          )}
        </motion.div>
        <div className="ds-well">
          {bank.map((t) =>
            placed.includes(t.id) ? (
              <span key={t.id} aria-hidden className="tile-3d tile-chip readout min-w-[44px] min-h-[44px] px-3 py-1 text-[20px] font-semibold invisible">
                {t.text}
              </span>
            ) : (
              <motion.button
                key={t.id}
                layoutId={`eq-${t.id}`}
                transition={reduce ? fadeQuick : tactilePress}
                type="button"
                disabled={status === "right"}
                onClick={() => {
                  setPlaced((p) => [...p, t.id]);
                  setStatus("idle");
                }}
                className="tile-3d tile-chip readout min-w-[44px] min-h-[44px] px-3 py-1 text-[20px] font-semibold"
              >
                {t.text}
              </motion.button>
            ),
          )}
        </div>
      </LayoutGroup>
      <Feedback show={status === "wrong"} ok={false} title={diag?.title ?? "Not quite"}>
        {diag?.lines.map((l, i) => (
          <span key={i} className="block">
            {l}
          </span>
        ))}
      </Feedback>
      <Feedback show={status === "right"} ok title={stage.formula.expr}>
        {stage.formula.meaning}
        {stage.formula.vars && <span className="block mt-1 t-label text-fg-2 readout">{stage.formula.vars}</span>}
      </Feedback>
    </CardFrame>
  );
}
