"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, Upload, Wrench, User, X, ChevronRight } from "lucide-react";
import { downloadProgress } from "@/lib/sync";
import { restoreFromFile } from "@/lib/restore";
import { repairAndReload } from "@/lib/repair";

/**
 * The profile (rank) button in the top bar opens this menu: Profile, then "Backup & restore" (Export, Restore,
 * Repair app). Restore merges the file into this device with the same code as Profile › Move progress, so a fresh
 * device gets everything back and nothing already here is lost. Rows are buttons (DESIGN.md §8: no text links in chrome).
 */
export function ProfileMenu({ badge, rankTitle }: { badge: string; rankTitle: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const row = "tile-3d w-full flex items-center gap-3 px-4 min-h-[56px] text-left";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" title={`Profile · ${rankTitle}`} aria-label={`Profile menu, rank ${rankTitle}`} className="ds-focus ml-0.5 flex items-center justify-center w-11 h-11 rounded-full bg-action text-white text-[14px] font-extrabold readout">
          {badge}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl sheet-face p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] focus:outline-none" aria-describedby={undefined}>
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="t-heading text-fg">{rankTitle}</Dialog.Title>
            <Dialog.Close className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-fg-2" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="grid gap-3">
            <Link href="/profile" className={row} onClick={() => setOpen(false)}>
              <User size={20} className="text-fg-2" aria-hidden />
              <span className="flex-1 t-label text-fg">Profile and settings</span>
              <ChevronRight size={20} className="text-fg-3" aria-hidden />
            </Link>
          </div>
          <div className="t-eyebrow mt-6 mb-3">Backup &amp; restore</div>
          <div className="grid gap-3">
            <button type="button" className={row} onClick={downloadProgress}>
              <Download size={20} className="text-fg-2" aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block t-label text-fg">Export progress</span>
                <span className="block t-label text-fg-2" style={{ fontWeight: 400 }}>Saves a backup file to this device.</span>
              </span>
            </button>
            <button type="button" className={row} onClick={() => fileRef.current?.click()}>
              <Upload size={20} className="text-fg-2" aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block t-label text-fg">Restore from backup</span>
                <span className="block t-label text-fg-2" style={{ fontWeight: 400 }}>Merges a backup file into this device.</span>
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label="Backup file"
              onChange={async (e) => {
                await restoreFromFile(e.target.files?.[0], "merge");
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <button
              type="button"
              className={row}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void repairAndReload();
              }}
            >
              <Wrench size={20} className="text-fg-2" aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block t-label text-fg">{busy ? "Repairing…" : "Repair app"}</span>
                <span className="block t-label text-fg-2" style={{ fontWeight: 400 }}>Refreshes offline files. Progress is safe.</span>
              </span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
