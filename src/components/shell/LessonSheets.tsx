"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { NotebookText, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Stage } from "@/lib/types";
import { useNotes } from "@/lib/notes";
import { StageRecap } from "@/components/cards/StageRecap";

function Sheet({ open, onOpenChange, title, children, trigger }: { open?: boolean; onOpenChange?: (v: boolean) => void; title: string; children: ReactNode; trigger?: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl focus:outline-none" aria-describedby={undefined}>
          <div className="sticky -top-5 sm:-top-6 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-3 px-5 sm:px-6 pt-4 pb-2 flex items-center justify-between surface-sticky">
            <Dialog.Title className="text-[19px] font-bold text-slate-900">{title}</Dialog.Title>
            <Dialog.Close className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Lesson-header "Notes": every explanation, reveal and trap seen so far in this lesson run. */
export function NotesButton() {
  const items = useNotes((n) => n.items);
  return (
    <Sheet
      title="Notes from this lesson"
      trigger={
        <button type="button" aria-label={`Lesson notes (${items.length})`} title="Lesson notes" className="relative w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100">
          <NotebookText size={19} />
          {items.length > 0 && <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-4 text-center readout">{items.length}</span>}
        </button>
      }
    >
      {items.length === 0 ? (
        <p className="flow-body text-slate-600">Nothing yet. Explanations and reveals you see in this lesson collect here, so you can re-read them any time.</p>
      ) : (
        <ol className="space-y-4">
          {items.map((n) => (
            <li key={n.key} className="rounded-2xl hairline p-4">
              {n.title && <div className="text-[15px] font-bold text-slate-900 mb-1">{n.title}</div>}
              <p className="flow-body text-slate-800">{n.text}</p>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}

/** Read-only view of a completed stage, opened by tapping its progress segment. */
export function RecapSheet({ stage, onClose }: { stage: Stage | null; onClose: () => void }) {
  return (
    <Sheet open={!!stage} onOpenChange={(v) => !v && onClose()} title="Re-read">
      {stage && <StageRecap stage={stage} />}
    </Sheet>
  );
}
