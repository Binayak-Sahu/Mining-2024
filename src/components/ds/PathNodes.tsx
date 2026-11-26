"use client";

import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Crown, Lock, Star } from "lucide-react";
import { fadeQuick, feedbackSheet, tactilePress } from "@/lib/motion";

type Kind = "done" | "current" | "locked" | "boss" | "boss-locked" | "perfect" | "master";

const NODES: { kind: Kind; title: string; stages: number; caption: string }[] = [
  { kind: "done", title: "Mine air", stages: 5, caption: "Done" },
  { kind: "perfect", title: "Methane limits", stages: 6, caption: "Perfect" },
  { kind: "current", title: "Gas detection", stages: 5, caption: "Current" },
  { kind: "locked", title: "Firedamp layering", stages: 4, caption: "Locked" },
  { kind: "boss", title: "Ventilation boss", stages: 8, caption: "Boss" },
  { kind: "boss-locked", title: "Unit 8 boss", stages: 8, caption: "Locked boss" },
  { kind: "master", title: "Fan laws", stages: 5, caption: "Master" },
];

function face(kind: Kind) {
  if (kind === "done" || kind === "perfect") return { state: "done", glyph: <Check size={28} strokeWidth={3} /> };
  if (kind === "current") return { state: "current", glyph: null };
  if (kind === "boss") return { state: "boss", glyph: <Crown size={26} strokeWidth={2.5} /> };
  if (kind === "boss-locked") return { state: "locked", glyph: <Crown size={18} strokeWidth={2.5} /> };
  return { state: "locked", glyph: <Lock size={22} strokeWidth={2.5} /> };
}

function action(kind: Kind) {
  if (kind === "current" || kind === "master") return { cls: "tone-tech", text: "Start" };
  if (kind === "done" || kind === "perfect") return { cls: "tone-ghost", text: "Review" };
  if (kind === "boss") return { cls: "tone-hazard", text: "Fight boss" };
  return null;
}

/** §5.5 / §5.5b one pedestal node with its label; tap opens the Radix start popover. */
function Node({ kind, title, stages, caption }: (typeof NODES)[number]) {
  const reduce = useReducedMotion();
  const f = face(kind);
  const a = action(kind);
  const lockedLabel = kind === "locked" || kind === "boss-locked" || kind === "master";
  const [open, setOpen] = useState(false);
  return (
    <li className="flex flex-col items-center">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className="ds-node ds-focus" data-state={f.state} aria-label={`${title} (${caption})`}>
            {kind === "current" && <span className="ds-node-ring" aria-hidden />}
            <span className="ds-node-rim" aria-hidden />
            <motion.span className="ds-node-face" aria-hidden whileTap={reduce ? undefined : { y: 6 }} transition={reduce ? fadeQuick : tactilePress}>
              {f.glyph}
            </motion.span>
            {kind === "perfect" && (
              <span className="ds-node-badge" aria-hidden>
                <Star size={13} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </button>
        </Popover.Trigger>
        <AnimatePresence>
          {open && (
        <Popover.Portal forceMount>
          <Popover.Content forceMount side="bottom" align="center" sideOffset={12} collisionPadding={16} asChild>
            <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }} transition={reduce ? fadeQuick : feedbackSheet} className="ds2 ds-pop z-50 w-[300px] max-w-[calc(100vw-32px)] p-5 focus:outline-none">
              <div className="t-heading">{title}</div>
              {a ? (
                <>
                  <div className="t-secondary mt-1">{stages} stages</div>
                  <Popover.Close asChild>
                    <button type="button" className={`btn-3d ${a.cls} w-full mt-5`}>
                      {a.text}
                    </button>
                  </Popover.Close>
                </>
              ) : (
                <div className="t-secondary mt-1">Finish the previous lesson first</div>
              )}
            </motion.div>
          </Popover.Content>
        </Popover.Portal>
          )}
        </AnimatePresence>
      </Popover.Root>
      <div className="mt-5 flex items-center gap-2 flex-wrap justify-center text-center">
        <span className="t-heading" style={{ fontWeight: 600, color: lockedLabel ? "var(--text-3)" : "var(--text)" }}>
          {title}
        </span>
        {kind === "master" && (
          <span className="t-label rounded-full px-3" style={{ fontWeight: 700, background: "var(--action-tint)", color: "var(--action-tint-text)" }}>
            Master
          </span>
        )}
      </div>
      <div className="t-label mt-1" style={{ color: "var(--text-2)" }}>
        {caption}
      </div>
    </li>
  );
}

export function PathNodes() {
  return (
    <div>
      <p className="t-secondary mb-8">Tap any node to open its start card.</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10">
        {NODES.map((n) => (
          <Node key={n.kind} {...n} />
        ))}
      </ul>
    </div>
  );
}
