"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Crown, Star, Play } from "lucide-react";
import type { Lesson, Unit } from "@/lib/types";
import type { LessonRecord } from "@/lib/store";
import { lessonUnlocked, bossUnlocked } from "@/lib/progress";
import { HEARTS_PER_LESSON } from "@/lib/ranks";
import { fadeQuick, feedbackSheet } from "@/lib/motion";

const ROW = 112;

/** Horizontal offset (% of band width from centre) for node i — a gentle S-curve per unit. */
function offset(i: number, phase: number): number {
  return Math.sin(i * 1.05 + phase) * 26;
}

type NodeState = "done" | "current" | "open" | "locked" | "inspect";

/* ------------------------------------------------------------------ */
/* Back closes the popover: opening pushes one same-URL history entry;  */
/* closing it any other way pops that entry again.                      */
/* ------------------------------------------------------------------ */
const POP = "strataPopover";
let backPending = false;
let afterBack: (() => void) | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    backPending = false;
    const f = afterBack;
    afterBack = null;
    f?.();
  });
}
const ourEntry = (token: number) => typeof window !== "undefined" && (window.history.state as Record<string, unknown> | null)?.[POP] === token;

function NodePopover({ lesson, label, eyebrow, state, boss, children }: { lesson: Lesson; label: string; eyebrow: string; state: NodeState; boss: boolean; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [padBottom, setPadBottom] = useState(16);
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const trigger = useRef<HTMLButtonElement>(null);
  const token = useRef(0);
  const href = `/lesson/${lesson.id}`;

  const onOpenChange = (v: boolean) => {
    if (v) {
      const push = () => {
        token.current = Date.now() + Math.random();
        window.history.pushState({ ...(window.history.state ?? {}), [POP]: token.current }, "");
        // Clear the fixed tab bar (64 px) on phones; 16 px everywhere else (DESIGN.md §7b).
        setPadBottom(window.matchMedia("(min-width: 768px)").matches ? 16 : 80);
        // Open below a node in the upper half of the screen, above one in the lower half, so it stays next to its node.
        const r = trigger.current?.getBoundingClientRect();
        setSide(r && r.top + r.height / 2 > window.innerHeight / 2 ? "top" : "bottom");
        setOpen(true);
      };
      if (backPending) afterBack = push;
      else push();
    } else {
      setOpen(false);
      if (ourEntry(token.current)) {
        backPending = true;
        window.history.back();
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onPop = () => {
      if (!ourEntry(token.current)) setOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  /** Same navigation as the old direct tap (one history entry, unit page → lesson): replace the popover's entry. */
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (ourEntry(token.current)) router.replace(href);
    else router.push(href);
  };

  const action =
    state === "locked"
      ? null
      : state === "done"
        ? { cls: "tone-ghost", text: "Review" }
        : boss && state !== "inspect"
          ? { cls: "tone-hazard", text: "Fight boss" }
          : { cls: "tone-tech", text: "Start" };
  const stages = lesson.stages.length;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button ref={trigger} type="button" className="path-node ds-node" data-state={state === "done" ? "done" : state === "locked" || state === "inspect" ? "locked" : boss ? "boss" : "current"} aria-label={label}>
          {children}
        </button>
      </Popover.Trigger>
      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content
              forceMount
              side={side}
              align="center"
              sideOffset={12}
              collisionPadding={{ top: 80, left: 16, right: 16, bottom: padBottom }}
              asChild
            >
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
                transition={reduce ? fadeQuick : feedbackSheet}
                className="ds-pop node-pop z-50 w-[300px] max-w-[calc(100vw-32px)] p-5 focus:outline-none"
                data-lesson={lesson.id}
              >
                <div className="t-eyebrow">{eyebrow}</div>
                <div className="t-heading mt-1">{lesson.title}</div>
                {action ? (
                  <>
                    <div className="t-secondary mt-1">
                      {stages} stage{stages === 1 ? "" : "s"}
                      {state === "inspect" ? " · Inspector sandbox, progress not saved" : ""}
                    </div>
                    <Link href={href} onClick={go} className={`btn-3d ${action.cls} w-full mt-5`}>
                      {action.text}
                    </Link>
                  </>
                ) : (
                  <div className="t-secondary mt-1">{boss ? "Finish every lesson in this unit first" : "Finish the previous lesson first"}</div>
                )}
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
}

/**
 * One unit's lessons on STRATA's winding path (S-curve positions unchanged), ending in the Boss Exam node.
 * Nodes are §5.5 pedestals; tapping one opens the §5.5b start popover.
 */
export function ExpeditionPath({
  unit,
  done,
  freeRoam,
  currentId,
  master = false,
}: {
  unit: Unit;
  done: Record<string, LessonRecord>;
  freeRoam: boolean;
  currentId: string | null;
  /** Inspector Mode: locked nodes become playable sandboxes, labelled Master. */
  master?: boolean;
}) {
  const nodes = [...unit.lessons.map((l, i) => ({ lesson: l, i, boss: false })), { lesson: unit.boss, i: unit.lessons.length, boss: true }];
  const phase = unit.n * 0.8;
  const H = nodes.length * ROW;
  const pts = nodes.map((_, k) => [50 + offset(k, phase), k * ROW + ROW / 2] as const);

  const stateOf = (n: (typeof nodes)[number]): NodeState => {
    if (done[n.lesson.id]) return "done";
    const open = n.boss ? bossUnlocked(unit, done, freeRoam) : lessonUnlocked(unit, n.i, done, freeRoam);
    if (!open) return master ? "inspect" : "locked";
    return n.lesson.id === currentId ? "current" : "open";
  };
  const states = nodes.map(stateOf);

  return (
    <section aria-label={`Unit ${unit.n} path`}>
      <div className="relative mx-auto max-w-md" style={{ height: H + 8 }}>
        {/* winding trail: --line, lit in success after a finished node */}
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
          {pts.slice(1).map(([x2, y2], k) => {
            const [x1, y1] = pts[k];
            const d = `M${x1} ${y1} C ${x1} ${y1 + ROW / 2}, ${x2} ${y2 - ROW / 2}, ${x2} ${y2}`;
            const lit = states[k] === "done";
            return <path key={k} d={d} fill="none" stroke={lit ? "var(--success)" : "var(--line-strong)"} strokeWidth={6} strokeLinecap="round" strokeDasharray={lit ? undefined : "2 12"} vectorEffect="non-scaling-stroke" />;
          })}
        </svg>

        {nodes.map((n, k) => {
          const s = states[k];
          const [x, y] = pts[k];
          const rec = done[n.lesson.id];
          const perfect = !n.boss && !!rec && rec.bestHearts >= HEARTS_PER_LESSON;
          const eyebrow = n.boss ? "Boss exam" : `Lesson ${unit.n}.${n.i + 1}`;
          const label = `${eyebrow}: ${n.lesson.title}${s === "locked" ? " (locked)" : s === "done" ? (perfect ? " (perfect)" : " (completed)") : s === "inspect" ? " (Master: Inspector sandbox, progress not saved)" : s === "current" ? " (next)" : ""}`;
          const glyph =
            s === "locked" || s === "inspect" ? (
              n.boss ? <Crown size={18} strokeWidth={2.5} /> : <Lock size={22} strokeWidth={2.5} />
            ) : n.boss ? (
              <Crown size={26} strokeWidth={2.5} />
            ) : s === "done" ? (
              <Check size={28} strokeWidth={3} />
            ) : (
              <Play size={26} fill="currentColor" strokeWidth={0} />
            );
          // Label sits 20 px beside the node, on the side with more room, vertically centred on the 72 px face.
          const right = x <= 50;
          const lockedLabel = s === "locked" || s === "inspect";
          return (
            <div key={n.lesson.id}>
              <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: y }}>
                <NodePopover lesson={n.lesson} label={label} eyebrow={eyebrow} state={s} boss={n.boss}>
                  {s === "current" && <span className="ds-node-ring" aria-hidden />}
                  <span className="ds-node-rim" aria-hidden />
                  <span className="ds-node-face" aria-hidden>
                    {glyph}
                  </span>
                  {perfect && (
                    <span className="ds-node-badge" aria-hidden>
                      <Star size={13} fill="currentColor" strokeWidth={0} />
                    </span>
                  )}
                </NodePopover>
              </div>
              <div
                aria-hidden
                className={`absolute -translate-y-1/2 flex ${right ? "justify-start" : "justify-end"}`}
                style={right ? { left: `calc(${x}% + 56px)`, right: 0, top: y - 5 } : { right: `calc(${100 - x}% + 56px)`, left: 0, top: y - 5 }}
              >
                <span className={`path-label flex flex-col ${right ? "items-start text-left" : "items-end text-right"}`}>
                  <span className="t-heading line-clamp-4" style={{ fontWeight: 600, color: lockedLabel ? "var(--text-3)" : "var(--text)" }}>
                    {n.lesson.title}
                  </span>
                  {s === "inspect" && (
                    <span className="t-label mt-1 rounded-full px-3 bg-action-tint text-action-tint-text" style={{ fontWeight: 700 }}>
                      Master
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

