"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, X } from "lucide-react";
import { REFS } from "@/content/references";
import { EXCERPTS } from "@/content/excerpts.gen";
import type { ReactNode } from "react";
import type { Stage } from "@/lib/types";
import { useNotes } from "@/lib/notes";
import { StageRecap } from "@/components/cards/StageRecap";

export function Sheet({ open, onOpenChange, title, children, trigger }: { open?: boolean; onOpenChange?: (v: boolean) => void; title: string; children: ReactNode; trigger?: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl max-h-[85dvh] overflow-y-auto sheet-face p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] focus:outline-none" aria-describedby={undefined}>
          <div className="sticky -top-5 sm:-top-6 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-3 px-5 sm:px-6 pt-4 pb-2 flex items-center justify-between bg-surface-2">
            <Dialog.Title className="t-heading text-fg">{title}</Dialog.Title>
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

/** Lesson "Notes" sheet (opened from the top bar's ⋯ menu): every explanation, reveal and trap seen so far in this run. */
export function NotesSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = useNotes((n) => n.items);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Notes from this lesson">
      {items.length === 0 ? (
        <p className="flow-body text-fg-2">Nothing yet. Explanations and reveals you see in this lesson collect here, so you can re-read them any time.</p>
      ) : (
        <ol className="space-y-4">
          {items.map((n) => (
            <li key={n.key} className="rounded-2xl hairline p-4">
              {n.title && <div className="t-label !font-bold text-fg mb-1">{n.title}</div>}
              <p className="flow-body text-fg">{n.text}</p>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}

/** "Where this comes from": the references behind the screen on show (opened from the ⋯ menu). */
export function SourcesSheet({ open, onOpenChange, ids, lessonId }: { open: boolean; onOpenChange: (v: boolean) => void; ids: string[]; lessonId: string | null }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Where this comes from">
      <ul className="space-y-3">
        {ids.map((id) => {
          const r = REFS[id];
          if (!r) return null;
          return (
            <li key={id} className="rounded-2xl hairline p-4">
              <div className="text-[16px] font-semibold text-fg leading-snug">{r.title}</div>
              <div className="text-[14px] text-fg-2 mt-1">
                {r.author} · {r.publisher}
              </div>
              {/* Copyright: copyrighted sources show one quote per lesson; public-domain / Gazette up to three. */}
              {(lessonId ? EXCERPTS[lessonId]?.[id] ?? [] : []).slice(0, r.licence === "public-domain" || r.licence === "govt-India" ? 3 : 1).map((e, k) => (
                <blockquote key={k} className="mt-2 border-l-[3px] border-line-strong pl-3">
                  <p className="text-[15px] text-fg leading-snug">“{e.excerpt}”</p>
                  {e.location && <p className="text-[14px] text-fg-2 mt-0.5">{e.location}</p>}
                </blockquote>
              ))}
              {r.where && <div className="text-[14px] text-fg-2 mt-2">Section: {r.where}</div>}
              <a href={r.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] text-[14px] font-semibold text-action-tint-text break-all">
                <ExternalLink size={14} className="shrink-0" /> Open source
              </a>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/** Read-only view of a completed stage, opened by tapping its section of the progress bar. */
export function RecapSheet({ stage, onClose }: { stage: Stage | null; onClose: () => void }) {
  return (
    <Sheet open={!!stage} onOpenChange={(v) => !v && onClose()} title="Re-read">
      {stage && <StageRecap stage={stage} />}
    </Sheet>
  );
}
