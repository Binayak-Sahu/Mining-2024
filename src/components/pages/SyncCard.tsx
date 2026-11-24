"use client";

import { useRef, useState } from "react";
import { Download, Upload, Smartphone } from "lucide-react";
import { downloadProgress, importProgress } from "@/lib/sync";

/** Export / import progress JSON so XP, streaks, Codex unlocks and SRS move between PC and phone. */
export function SyncCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      if (mode === "replace" && !window.confirm("Replace ALL progress on this device with the imported file?")) return;
      const r = importProgress(text, mode);
      setMsg({ ok: true, text: `Imported (${mode}): ${r.xp} XP, ${r.lessons} lessons, ${r.codex} Codex sheets.` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div id="sync" className="card p-5 space-y-3 scroll-mt-24">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
        <Smartphone size={12} /> Move progress between devices
      </div>
      <p className="text-sm text-slate-600">
        Progress lives in this browser. Export it as a JSON file on one device and import it on the other — XP, streaks, lessons, Codex unlocks, spaced-repetition queue and exam history all transfer.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={downloadProgress} className="btn-press inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          <Download size={14} /> Export progress (JSON)
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-press inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 px-4 py-2 text-sm font-bold text-slate-900">
          <Upload size={14} /> Import progress (JSON)
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Progress file" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <div className="flex flex-wrap gap-x-4 text-sm">
        <label className="flex items-center gap-2 min-h-[44px]">
          <input type="radio" name="sync-mode" checked={mode === "merge"} onChange={() => setMode("merge")} className="w-5 h-5 accent-blue-500" />
          Merge (keep the best of both)
        </label>
        <label className="flex items-center gap-2 min-h-[44px]">
          <input type="radio" name="sync-mode" checked={mode === "replace"} onChange={() => setMode("replace")} className="w-5 h-5 accent-blue-500" />
          Replace this device
        </label>
      </div>
      {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
