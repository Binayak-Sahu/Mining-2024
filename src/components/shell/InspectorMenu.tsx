"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Flag, Heart, KeyRound, X } from "lucide-react";
import { useReportUi } from "@/lib/reports";

/**
 * Lesson-header Inspector menu (Inspector Mode only): stage jumper, sandbox heart refill and "Report this
 * screen" in one sheet, so nothing extra sits in the header row or floats over the lesson.
 */
export function InspectorMenu({ stages, index, onJump, onRefill }: { stages: string[]; index: number; onJump: (i: number) => void; onRefill?: () => void }) {
  const [open, setOpen] = useState(false);
  const report = useReportUi((u) => u.setOpen);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label="Inspector menu" title="Inspector menu" className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-amber-700 bg-amber-50">
          <KeyRound size={18} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl sheet-face p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] focus:outline-none" aria-describedby={undefined}>
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-[19px] font-bold text-slate-900">Inspector</Dialog.Title>
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
                className={`readout h-11 rounded-xl text-[14px] font-bold ${i === index ? "bg-slate-900 text-slate-50" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {onRefill && (
              <button type="button" onClick={() => { onRefill(); setOpen(false); }} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
                <Heart size={18} className="text-red-600 fill-current" /> <span className="font-semibold text-slate-900">Refill sandbox hearts</span>
              </button>
            )}
            <button type="button" onClick={() => { setOpen(false); setTimeout(() => report(true), 150); }} className="tile-3d w-full flex items-center gap-3 px-4 py-3 text-left">
              <Flag size={18} className="text-amber-700" /> <span className="font-semibold text-slate-900">Report this screen</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
