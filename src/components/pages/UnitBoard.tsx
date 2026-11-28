"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, ArrowLeft, ArrowUp, Trophy } from "lucide-react";
import { getUnit } from "@/content";
import { useStrata, type LessonRecord } from "@/lib/store";
import { bossUnlocked, lessonUnlocked } from "@/lib/progress";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs } from "@/lib/prefs";
import { familyOf } from "@/lib/family";
import { currentLessonId, lessonMinutes, unitLevels, type Level, type LevelItem } from "@/lib/levels";
import { todayKey } from "@/lib/date";
import { fadeQuick, feedbackSheet } from "@/lib/motion";
import { nbh } from "@/lib/typo";
import type { Unit } from "@/lib/types";
import { StreakPill, XpPill } from "@/components/shell/TopBar";
import { UnitArt } from "./UnitArt";
import { Pedestal, type PedestalState } from "./Pedestal";

const NNBSP = " ";
/** §5.8 zigzag: x offsets from the column centre, one cycle across the whole board; 150 px between nodes. */
const OFFSETS = [-96, -32, 96, 32];
const PITCH = 150;

/** Same states as the Path lesson cards (UnitMap), so the two views always agree. */
type NodeState = "done" | "current" | "open" | "locked" | "inspect";

type BoardNode =
  | { kind: "lesson"; item: LevelItem; state: NodeState; slot: number; prereq: string | null }
  | { kind: "warmup"; level: Level; state: NodeState; slot: number; due: number };

function lessonName(unit: Unit, it: LevelItem) {
  return it.boss ? "Boss exam" : `Lesson ${unit.n}.${it.index + 1}`;
}

function pedestalOf(s: NodeState): PedestalState {
  return s === "inspect" ? "locked" : s;
}

/** §5.8 boss token: a 56 px `energy` disc with an `energy` ledge and a trophy (greyed while locked). */
function TrophyToken({ locked }: { locked: boolean }) {
  return (
    <span className="board-token" data-locked={locked || undefined} aria-hidden>
      <Trophy size={28} strokeWidth={2.4} />
    </span>
  );
}

function Node({ unit, node, onOpen, nodeRef }: { unit: Unit; node: BoardNode; onOpen: (n: BoardNode) => void; nodeRef?: React.Ref<HTMLButtonElement> }) {
  const off = OFFSETS[node.slot % OFFSETS.length];
  const left = off < 0; // node left of centre → label on the right (the open side)
  const state = node.state;
  const isBoss = node.kind === "lesson" && node.item.boss;
  const title = node.kind === "warmup" ? "Warmup" : isBoss ? "Boss exam" : node.item.lesson.title;
  const name = node.kind === "warmup" ? `Warmup after level ${node.level.n}` : lessonName(unit, node.item);
  const note = state === "done" ? (node.kind === "warmup" ? "done today" : "completed") : state === "locked" ? "locked" : state === "current" ? "next" : state === "inspect" ? "Master: Inspector sandbox" : "";
  const floating = state === "current" || isBoss;
  return (
    <li className="board-row" style={{ height: PITCH }} data-slot={node.slot}>
      <button
        ref={nodeRef}
        type="button"
        className="board-node"
        data-side={left ? "left" : "right"}
        style={left ? { left: `calc(50% + ${off - 60}px)`, right: 0 } : { right: `calc(50% - ${off + 60}px)`, left: 0 }}
        onClick={() => onOpen(node)}
        aria-haspopup="dialog"
        aria-label={`${name}${node.kind === "lesson" && !isBoss ? `: ${node.item.lesson.title}` : ""}${note ? ` (${note})` : ""}`}
        data-lesson={node.kind === "lesson" ? node.item.lesson.id : undefined}
        data-warmup={node.kind === "warmup" ? node.level.n : undefined}
        data-lesson-state={state}
      >
        <span className="board-ped">
          <Pedestal state={pedestalOf(state)} mark={node.kind === "warmup" ? "warmup" : undefined} />
          {floating && (
            <span className="board-float" data-bob={state === "current" || undefined} aria-hidden>
              {state === "current" && <span className="board-float-glow" />}
              <span className="board-float-art">{isBoss ? <TrophyToken locked={state === "locked" || state === "inspect"} /> : <UnitArt unitId={unit.id} size={56} eager />}</span>
            </span>
          )}
        </span>
        <span className={`board-label t-card-title ${state === "locked" || state === "inspect" ? "text-fg-2" : "text-fg"}`} lang="en">
          {nbh(title)}
        </span>
      </button>
    </li>
  );
}

/** §5.8 node sheet: eyebrow, title, one button (Start / Review / disabled "Finish … first"). */
function NodeSheet({ unit, node, open, onClose }: { unit: Unit; node: BoardNode | null; open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  if (!node) return null;
  let eyebrow: string;
  let title: string;
  let action: React.ReactNode;
  if (node.kind === "warmup") {
    eyebrow = `Spaced review · ${node.due}${NNBSP}due`;
    title = "Daily warmup";
    action =
      node.state === "locked" ? (
        <button type="button" disabled className="btn-3d w-full">
          Finish Level {node.level.n} first
        </button>
      ) : (
        <Link href="/warmup" className={`btn-3d w-full ${node.state === "done" ? "tone-ink" : "tone-tech"}`}>
          {node.state === "done" ? "Review" : "Start"}
        </Link>
      );
  } else {
    const { lesson, boss } = node.item;
    const stages = lesson.stages.length;
    eyebrow = `${boss ? "Boss exam · " : ""}${stages}${NNBSP}stage${stages === 1 ? "" : "s"} · ~${lessonMinutes(lesson)}${NNBSP}min`;
    title = lesson.title;
    const href = `/lesson/${lesson.id}`;
    action =
      node.state === "locked" ? (
        <button type="button" disabled className="btn-3d w-full">
          Finish {node.prereq ?? "the previous lesson"} first
        </button>
      ) : node.state === "inspect" ? (
        <Link href={href} className="btn-3d tone-ink w-full">
          Inspect (not saved)
        </Link>
      ) : node.state === "done" ? (
        <Link href={href} className="btn-3d tone-ink w-full">
          Review
        </Link>
      ) : (
        <Link href={href} className="btn-3d tone-tech w-full" data-testid="board-start">
          Start
        </Link>
      );
  }
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fadeQuick} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                data-family={familyOf(unit.id)}
                className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[640px] sheet-face px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] focus:outline-none"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={reduce ? fadeQuick : feedbackSheet}
                data-testid="board-sheet"
              >
                <div className="t-eyebrow tnum">{eyebrow}</div>
                <Dialog.Title className="t-title text-fg mt-2" lang="en">
                  {nbh(title)}
                </Dialog.Title>
                <div className="mt-6">{action}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Back: one step in the app's history, or the unit's Path page when the board was the first page loaded. */
function BackButton({ unitId }: { unitId: string }) {
  const router = useRouter();
  const onClick = (e: React.MouseEvent) => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const landed = !nav || /\/unit\/[^/]+\/board\/?$/.test(new URL(nav.name).pathname);
    if (landed || window.history.length < 2) return; // the Link's own href (Path) handles it
    e.preventDefault();
    router.back();
  };
  return (
    <Link href={`/unit/${unitId}`} onClick={onClick} className="w-11 h-11 -ml-1 rounded-full inline-flex items-center justify-center text-fg-2 hover:text-fg" aria-label="Back">
      <ArrowLeft size={24} aria-hidden />
    </Link>
  );
}

/**
 * §5.8 unit gameboard: board top bar, then one section per derived level (a sticky header card and its zigzag of
 * pedestals, then a warmup node), the boss as the last node, a node sheet, a scroll-to-current button and the dark
 * bottom glow. Reads progress only; never writes it.
 */
export function UnitBoard({ unitId }: { unitId: string }) {
  const hydrated = useHydrated();
  const unit = getUnit(unitId);
  const s = useStrata();
  const masterPref = usePrefs((p) => p.masterUnlock);
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<BoardNode | null>(null);
  const [open, setOpen] = useState(false);
  const [away, setAway] = useState<"up" | "down" | null>(null);
  const curRef = useRef<HTMLButtonElement>(null);

  const done: Record<string, LessonRecord> = useMemo(() => (hydrated ? s.lessons : {}), [hydrated, s.lessons]);
  const free = hydrated && s.freeRoam;
  const master = hydrated && masterPref;
  const today = todayKey();
  const due = hydrated ? Object.values(s.srs).filter((i) => i.due <= today).length : 0;
  const warmDone = hydrated && s.warmupDoneDay === today;

  const sections = useMemo(() => {
    if (!unit) return [];
    const cur = currentLessonId(unit, done, free);
    let slot = 0;
    const stateOf = (it: LevelItem): NodeState => {
      if (done[it.lesson.id]) return "done";
      const genuine = it.boss ? bossUnlocked(unit, done, free) : lessonUnlocked(unit, it.index, done, free);
      if (!genuine) return master ? "inspect" : "locked";
      return it.lesson.id === cur ? "current" : "open";
    };
    const prereqOf = (it: LevelItem): string | null => {
      const need = it.boss ? unit.lessons.findIndex((l) => !done[l.id]) : it.index - 1;
      return need >= 0 ? `Lesson ${unit.n}.${need + 1}` : null;
    };
    return unitLevels(unit).map((lv) => {
      const nodes: BoardNode[] = lv.items.map((item) => ({ kind: "lesson", item, state: stateOf(item), slot: slot++, prereq: prereqOf(item) }));
      const levelDone = lv.items.filter((it) => !it.boss).every((it) => !!done[it.lesson.id]);
      const warm: BoardNode = { kind: "warmup", level: lv, slot: slot++, due, state: !levelDone && !free ? "locked" : warmDone ? "done" : "open" };
      // The boss closes the unit: it stays the last node, so the last level's warmup sits before it.
      const bossAt = nodes.findIndex((n) => n.kind === "lesson" && n.item.boss);
      if (bossAt >= 0) {
        const boss = nodes.splice(bossAt, 1)[0];
        warm.slot = boss.slot;
        boss.slot = slot - 1;
        nodes.push(warm, boss);
      } else nodes.push(warm);
      const lessons = lv.items.filter((it) => !it.boss);
      const range = lessons.length ? `${unit.n}.${lessons[0].index + 1}${lessons.length > 1 ? `–${unit.n}.${lessons[lessons.length - 1].index + 1}` : ""}` : "";
      return { level: lv, nodes, title: `Lesson${lessons.length > 1 ? "s" : ""} ${range}` };
    });
  }, [unit, done, free, master, due, warmDone]);

  // On load, centre the current node once.
  const centred = useRef(false);
  useEffect(() => {
    if (!hydrated || centred.current || !curRef.current) return;
    centred.current = true;
    curRef.current.scrollIntoView({ block: "center", behavior: "auto" });
  }, [hydrated, sections]);

  // §5.8 scroll-to-current: shown only while the current node is off screen.
  useEffect(() => {
    const el = curRef.current;
    if (!el) {
      setAway(null);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setAway(null);
      else setAway(e.boundingClientRect.top < 0 ? "up" : "down");
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hydrated, sections]);

  if (!unit) return <div className="p-6">Unit not found.</div>;
  const fam = familyOf(unit.id);
  const curId = sections.flatMap((x) => x.nodes).find((n) => n.state === "current");

  return (
    <div className="board relative isolate" data-family={fam}>
      <div className="board-glow" aria-hidden />
      <header className="board-bar chrome" data-testid="board-bar">
        <div className="max-w-[640px] mx-auto h-14 px-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <BackButton unitId={unit.id} />
            <StreakPill />
          </div>
          <span data-family={fam} className="inline-flex">
            <UnitArt unitId={unit.id} size={48} title={`Unit ${unit.n}: ${unit.shortTitle}`} eager />
          </span>
          <div className="flex items-center justify-end">
            <XpPill />
          </div>
        </div>
      </header>

      <h1 className="sr-only">
        Unit {unit.n}: {unit.title}, board
      </h1>
      <div className="max-w-[640px] mx-auto px-6 pt-4 pb-24" style={{ visibility: hydrated ? "visible" : "hidden" }}>
        {sections.map(({ level, nodes, title }) => (
          <section key={level.n} className="board-level" aria-labelledby={`board-level-${level.n}`} data-level={level.n}>
            <div className="board-head card" id={`board-level-${level.n}`}>
              <div className="t-eyebrow" style={{ color: "var(--u-ink)" }}>
                Level {level.n}
              </div>
              <div className="t-card-title text-fg mt-1 tnum">{title}</div>
            </div>
            <ol className="board-nodes">
              {nodes.map((n) => (
                <Node
                  key={n.kind === "lesson" ? n.item.lesson.id : `warm-${level.n}`}
                  unit={unit}
                  node={n}
                  nodeRef={n === curId ? curRef : undefined}
                  onOpen={(x) => {
                    setSel(x);
                    setOpen(true);
                  }}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>

      {curId && away && (
        <button
          type="button"
          className="btn-3d tone-ghost board-jump"
          aria-label="Scroll to your current lesson"
          data-testid="board-jump"
          onClick={() => curRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })}
        >
          {away === "up" ? <ArrowUp size={24} aria-hidden /> : <ArrowDown size={24} aria-hidden />}
        </button>
      )}

      <NodeSheet unit={unit} node={sel} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
