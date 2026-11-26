"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Flag, Heart, X } from "lucide-react";
import { useReportUi } from "@/lib/reports";

/**
 * Inspector sheet (Inspector Mode only, opened from the lesson top bar's ⋯ menu): stage jumper, sandbox heart refill
 * and "Report this screen". The stage-jumper and sandbox logic live in LessonPlayer and are unchanged.
 */
export function InspectorMenu({ stages, index, onJump, onRefill, open, setOpen }: { stages: string[]; index: number; onJump: (i: number) => void; onRefill?: () => void; open: boolean; setOpen: (v: boolean) => void }) {
  const report = useReportUi((u) => u.setOpen);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl sheet-face p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] focus:outline-none" aria-describedby={undefined}>
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="t-heading text-fg">Inspector</Dialog.Title>
            <Dialog.Close className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="text-[14px] font-semibold text-slate-600 mb-2">Jump to a stage (the run becomes a sandbox)</div>
          <div className="grid grid-cols-6 gap-2" role="group" aria-label="Stage jumper">
            {stages.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onJump(i);
                  setOpen(false);
                }}
                aria-current={i === index ? "step" : undefined}
                title={`Stage ${i + 1}: ${label}`}
                className={`readout h-11 rounded-xl text-[14px] font-bold ${i === index ? "bg-ink text-canvas" : "bg-surface text-fg border-2 border-line-strong"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {onRefill && (
              <button type="button" onClick={() => { onRefill(); setOpen(false); }} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
                <Heart size={18} className="text-danger fill-current" /> <span className="font-semibold text-slate-900">Refill sandbox hearts</span>
              </button>
            )}
            <button type="button" onClick={() => { setOpen(false); setTimeout(() => report(true), 150); }} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
              <Flag size={18} className="text-energy-tint-text" /> <span className="font-semibold text-slate-900">Report this screen</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
