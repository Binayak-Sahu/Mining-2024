"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, RotateCcw, Search, ListFilter } from "lucide-react";
import { Drawer } from "vaul";
import { ALL_SIMS } from "@/content/sims";
import { allLessons } from "@/content";
import { sfx } from "@/lib/sfx";
import type { SimStage } from "@/lib/types";
import { SimView, defaults } from "@/components/sim/SimView";
import type { Vals } from "@/lib/types";

const UNIT_OF = (id: string) => {
  const m = /^u(\d+)-/.exec(id);
  return m ? Number(m[1]) : -1;
};

/** Every lesson Intuition-lab goal that uses a sim becomes a free-play challenge for it in the Sim Lab. */
const CHALLENGES: Record<string, SimStage["goal"][]> = (() => {
  const m: Record<string, SimStage["goal"][]> = {};
  for (const l of allLessons()) for (const st of l.stages) if (st.kind === "sim") (m[st.sim] ??= []).push(st.goal);
  return m;
})();

export function SimLab() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("sim") ?? ALL_SIMS[1].id;
  const [id, setId] = useState(ALL_SIMS.some((s) => s.id === initial) ? initial : ALL_SIMS[1].id);
  const def = useMemo(() => ALL_SIMS.find((s) => s.id === id)!, [id]);
  const [vals, setVals] = useState<Vals>(() => defaults(def));
  const [q, setQ] = useState("");
  const [ci, setCi] = useState(0);
  const [sheet, setSheet] = useState(false);
  const challenges = CHALLENGES[id] ?? [];
  const ch = challenges[Math.min(ci, Math.max(0, challenges.length - 1))];
  const met = ch ? ch.test(vals, def.compute(vals)) : false;
  const wasMet = useRef(false);
  useEffect(() => {
    if (met && !wasMet.current) sfx.correct();
    wasMet.current = met;
  }, [met]);

  const pick = (sid: string) => {
    const d = ALL_SIMS.find((s) => s.id === sid)!;
    setId(sid);
    setCi(0);
    setVals(defaults(d));
    router.replace(`/lab?sim=${sid}`, { scroll: false });
  };

  const list = ALL_SIMS.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.id.includes(q.toLowerCase())).sort((a, b) => UNIT_OF(a.id) - UNIT_OF(b.id));

  const browser = (inSheet: boolean) => (
    <>
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search simulations…" className="w-full rounded-xl bg-slate-100 pl-9 pr-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-400" />
        </label>
        <div className={`mt-2 ${inSheet ? "max-h-[62vh]" : "max-h-[64vh]"} overflow-y-auto space-y-1 pr-0.5 no-scrollbar`}>
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                pick(s.id);
                if (inSheet) setSheet(false);
              }}
              className={`w-full flex items-start gap-2.5 text-left rounded-xl px-2.5 py-2 text-[13px] font-semibold leading-snug transition-colors ${s.id === id ? "bg-[#7C3AED] text-white shadow-[0_2px_0_#5B21B6]" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <span className={`readout shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${s.id === id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>U{UNIT_OF(s.id)}</span>
              <span className="min-w-0">{s.title}</span>
            </button>
          ))}
        </div>
        </>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8 grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5 lg:gap-6">
      <aside className="hidden lg:block order-2 lg:order-1 space-y-3 lg:sticky lg:top-24 self-start">
        <div className="hidden lg:block">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-[0_3px_0_#6D28D9]"><FlaskConical size={20} /></span> Sim Lab
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5">All {ALL_SIMS.length} simulations, free-play — no hearts, no objectives.</p>
        </div>
        <div className="card p-2.5">{browser(false)}</div>
      </aside>
      <section className="order-1 lg:order-2 card p-4 sm:p-6 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-violet-600">Sim Lab · Unit {UNIT_OF(def.id)}</div>
            <h2 className="text-[20px] sm:text-[24px] font-extrabold leading-tight tracking-tight text-slate-900 mt-0.5 text-balance">{def.title}</h2>
          </div>
          <button type="button" onClick={() => setVals(defaults(def))} className="btn-3d tone-ghost shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-[11px]">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        <Drawer.Root open={sheet} onOpenChange={setSheet}>
          <Drawer.Trigger asChild>
            <button type="button" className="lg:hidden mb-3 w-full flex items-center gap-2 rounded-xl hairline bg-surface-2 px-3 py-2.5 text-[13.5px] font-bold text-slate-700">
              <ListFilter size={16} className="text-violet-600" /> Browse all {ALL_SIMS.length} simulations
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] bg-surface p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[var(--shadow-pop)] focus:outline-none" aria-describedby={undefined}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" aria-hidden />
              <Drawer.Title className="px-1 pb-2 text-[16px] font-extrabold text-slate-900">Simulations</Drawer.Title>
              {browser(true)}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <SimView key={id} def={def} values={vals} onChange={setVals} objective={ch ? { text: ch.text, met, tag: challenges.length > 1 ? `Challenge ${ci + 1}/${challenges.length}` : "Challenge" } : undefined} />
        {ch && met && ci + 1 < challenges.length && (
          <button type="button" onClick={() => setCi(ci + 1)} className="btn-3d tone-safe w-full mt-3 py-3 text-[13px]">
            Next challenge
          </button>
        )}
      </section>
    </div>
  );
}
