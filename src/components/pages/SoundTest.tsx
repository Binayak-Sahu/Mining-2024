"use client";

import { SFX_PALETTE, sfx } from "@/lib/sfx";
import { usePrefs } from "@/lib/prefs";

/** Audition panel for the synthesized sound palette (linked from Profile while Inspector Mode is on). */
export function SoundTest() {
  const muted = usePrefs((p) => p.muted);
  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-3">
      <h1 className="text-2xl font-extrabold text-slate-900">Sound test</h1>
      {muted && <p className="text-sm text-red-700">Sound is muted — unmute in the header to audition.</p>}
      {SFX_PALETTE.map((s) => (
        <button key={s.key} type="button" data-silent="1" onClick={() => sfx[s.key]()} className="tile-3d w-full text-left px-4 py-3">
          <span className="block font-bold text-slate-900">{s.label}</span>
          <span className="block text-[12.5px] text-slate-500">{s.note}</span>
        </button>
      ))}
      <button type="button" data-silent="1" onClick={() => { for (let i = 0; i < 40; i++) setTimeout(() => sfx.tick(), i * 12); }} className="tile-3d w-full text-left px-4 py-3">
        <span className="block font-bold text-slate-900">Fast drag (40 ticks in 0.5 s)</span>
        <span className="block text-[12.5px] text-slate-500">throttled to ≤ 25 ticks per second</span>
      </button>
    </div>
  );
}
