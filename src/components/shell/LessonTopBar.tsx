"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { BookOpenCheck, Heart, KeyRound, MoreHorizontal, NotebookText, X } from "lucide-react";
import { HEARTS_PER_LESSON } from "@/lib/ranks";
import { fadeQuick, stageSlide } from "@/lib/motion";
import { useNotes } from "@/lib/notes";
import { useLessonSources } from "@/lib/lessonSources";
import { NotesSheet, SourcesSheet } from "./LessonSheets";

/**
 * §5.6 lesson progress: one 10 px green bar with 2 px notches at stage boundaries. Each finished stage keeps a
 * ≥ 44 px tall invisible button over its section that opens the read-only recap (the old segment taps).
 */
export function LessonProgress({ titles, index, sub, onRecap }: { titles: string[]; index: number; sub: number; onRecap: (i: number) => void }) {
  const reduce = useReducedMotion();
  const n = titles.length;
  const fill = Math.min(1, (index + Math.max(0, Math.min(1, sub))) / n);
  return (
    <div className="relative flex-1 min-w-0" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={index} aria-label="Lesson progress">
      <div className="ds-progress">
        <motion.div className="ds-progress-fill" initial={false} animate={{ width: `${fill * 100}%` }} transition={reduce ? fadeQuick : stageSlide} />
        {Array.from({ length: n - 1 }, (_, i) => (
          <span key={i} className="ds-progress-notch" style={{ left: `${((i + 1) / n) * 100}%` }} aria-hidden />
        ))}
      </div>
      {titles.slice(0, Math.min(index, n)).map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onRecap(i)}
          aria-label={`Re-read stage ${i + 1}: ${t}`}
          className="ds-focus absolute top-1/2 -translate-y-1/2 h-11 rounded-full"
          style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }}
        />
      ))}
    </div>
  );
}

/** §5.6 hearts as one pill: a filled `danger` heart and the count. Shakes once when a heart is lost. */
export function HeartsPill({ n }: { n: number }) {
  const controls = useAnimationControls();
  const prev = useRef(n);
  useEffect(() => {
    if (n < prev.current) void controls.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
    prev.current = n;
  }, [n, controls]);
  return (
    <motion.div animate={controls} className="shrink-0 flex items-center gap-1.5 h-10 px-3 rounded-full bg-surface-2" aria-label={`${n} safety hearts`} role="img">
      <Heart size={20} className={n > 0 ? "fill-danger text-danger" : "fill-none text-fg-3"} strokeWidth={2.2} aria-hidden />
      <span className="t-label !font-bold text-fg readout" aria-hidden>
        {n}
        <span className="sr-only"> of {HEARTS_PER_LESSON}</span>
      </span>
    </motion.div>
  );
}

/**
 * §5.6 ⋯ menu: Notes, Sources (for the screen on show) and, in Inspector Mode, the Inspector sheet. An 8 px
 * `action` dot on ⋯ means the lesson has notes. Each item closes the menu and opens its existing sheet.
 */
export function MoreMenu({ inspector, onInspector }: { inspector: boolean; onInspector: () => void }) {
  const notes = useNotes((s) => s.items.length);
  const src = useLessonSources((s) => s.ids);
  const lessonId = useLessonSources((s) => s.lessonId);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<"notes" | "sources" | null>(null);
  const after = (fn: () => void) => {
    setMenu(false);
    window.setTimeout(fn, 160);
  };
  const item = "tile-3d w-full flex items-center gap-3 px-4 min-h-[56px] text-left";
  return (
    <>
      <Dialog.Root open={menu} onOpenChange={setMenu}>
        <Dialog.Trigger asChild>
          <button type="button" aria-label={`More: notes${src.length ? ", sources" : ""}${inspector ? ", Inspector" : ""}${notes ? ` (${notes} notes)` : ""}`} className="ds-focus relative w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-fg-2">
            <MoreHorizontal size={24} />
            {notes > 0 && <span aria-hidden className="absolute top-2 right-2 w-2 h-2 rounded-full bg-action" />}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl sheet-face p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] focus:outline-none" aria-describedby={undefined}>
            <div className="flex items-center justify-between mb-3">
              <Dialog.Title className="t-heading text-fg">This lesson</Dialog.Title>
              <Dialog.Close className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-fg-2" aria-label="Close">
                <X size={20} />
              </Dialog.Close>
            </div>
            <div className="grid gap-3">
              <button type="button" className={item} aria-label={`Lesson notes (${notes})`} onClick={() => after(() => setSheet("notes"))}>
                <NotebookText size={20} className="text-fg-2" aria-hidden />
                <span className="flex-1 t-label text-fg">Notes</span>
                <span className="t-label text-fg-2 readout">{notes}</span>
              </button>
              {src.length > 0 && (
                <button type="button" className={item} aria-label={`Sources (${src.length})`} onClick={() => after(() => setSheet("sources"))}>
                  <BookOpenCheck size={20} className="text-fg-2" aria-hidden />
                  <span className="flex-1 t-label text-fg">Sources for this screen</span>
                  <span className="t-label text-fg-2 readout">{src.length}</span>
                </button>
              )}
              {inspector && (
                <button type="button" className={item} aria-label="Inspector menu" onClick={() => after(onInspector)}>
                  <KeyRound size={20} className="text-energy-tint-text" aria-hidden />
                  <span className="flex-1 t-label text-fg">Inspector</span>
                </button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <NotesSheet open={sheet === "notes"} onOpenChange={(v) => setSheet(v ? "notes" : null)} />
      <SourcesSheet open={sheet === "sources"} onOpenChange={(v) => setSheet(v ? "sources" : null)} ids={src} lessonId={lessonId} />
    </>
  );
}

/** The X that leaves the lesson for its unit page (§5.6: 24 px, 44 px target, `--text-2`). */
export function ExitLesson({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="Exit lesson" className="ds-focus -ml-2.5 flex items-center justify-center w-11 h-11 shrink-0 rounded-full text-fg-2">
      <X size={24} strokeWidth={2.4} />
    </Link>
  );
}

/** §5.6 Inspector banner: an `energy`-tint strip under the top bar, `label` text. */
export function InspectorStrip() {
  return (
    <div className="bg-energy-tint text-energy-tint-text" role="status">
      <div className="max-w-[640px] mx-auto px-5 sm:px-6 py-2 t-label flex items-center gap-1.5">
        <KeyRound size={16} aria-hidden /> Inspector: this run is a sandbox, progress is not saved
      </div>
    </div>
  );
}
