"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { repairAndReload } from "@/lib/repair";

/** Clears the offline app cache (never your progress) and reloads. */
export function RepairButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void repairAndReload();
      }}
      className={`tile-3d w-full flex items-center gap-3 px-4 py-3 text-left ${className}`}
    >
      <Wrench size={20} className="text-slate-600" />
      <span className="flex-1">
        <span className="block font-bold text-[14px] text-slate-900">{busy ? "Repairing…" : "Repair app"}</span>
        <span className="block text-[12.5px] text-slate-500">Refreshes the offline app files if something looks stuck. Your progress is not touched.</span>
      </span>
    </button>
  );
}
