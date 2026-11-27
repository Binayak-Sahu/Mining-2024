"use client";

import { useRef, useState } from "react";
import { Download, Upload, Smartphone } from "lucide-react";
import { downloadProgress, importProgress } from "@/lib/sync";
import { toast } from "sonner";

/** Export / import progress JSON so XP, streaks, Codex unlocks and SRS move between PC and phone. */
export function SyncCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      if (mode === "replace" && !window.confirm("Replace ALL progress on this device with the imported file?")) return;
      const r = importProgress(text, mode);
      toast.success(`Imported (${mode}): ${r.xp} XP, ${r.lessons} lessons, ${r.codex} Codex sheets.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div id="sync" className="card p-5 space-y-3 scroll-mt-24">
      <div className="t-eyebrow flex items-center gap-2">
        <Smartphone size={16} aria-hidden /> Move progress between devices
      </div>
      <p className="t-secondary">
        Progress lives in this browser. Export it as a JSON file on one device and import it on the other — XP, streaks, lessons, Codex unlocks, spaced-repetition queue and exam history all transfer.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <button type="button" onClick={downloadProgress} className="btn-3d tone-tech">
          <Download size={18} aria-hidden /> Export progress (JSON)
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-3d tone-ghost">
          <Upload size={18} aria-hidden /> Import progress (JSON)
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Progress file" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <div className="flex flex-wrap gap-x-6 t-label text-fg">
        <label className="flex items-center gap-2 min-h-[44px]">
          <input type="radio" name="sync-mode" checked={mode === "merge"} onChange={() => setMode("merge")} className="w-5 h-5 accent-[var(--action)]" />
          Merge (keep the best of both)
        </label>
        <label className="flex items-center gap-2 min-h-[44px]">
          <input type="radio" name="sync-mode" checked={mode === "replace"} onChange={() => setMode("replace")} className="w-5 h-5 accent-[var(--action)]" />
          Replace this device
        </label>
      </div>
    </div>
  );
}
