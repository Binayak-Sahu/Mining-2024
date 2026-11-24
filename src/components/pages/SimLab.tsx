"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, RotateCcw, Search } from "lucide-react";
import { ALL_SIMS } from "@/content/sims";
import { SimView, defaults } from "@/components/sim/SimView";
import type { Vals } from "@/lib/types";

const UNIT_OF = (id: string) => {
  const m = /^u(\d+)-/.exec(id);
  return m ? Number(m[1]) : -1;
};

export function SimLab() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("sim") ?? ALL_SIMS[1].id;
  const [id, setId] = useState(ALL_SIMS.some((s) => s.id === initial) ? initial : ALL_SIMS[1].id);
  const def = useMemo(() => ALL_SIMS.find((s) => s.id === id)!, [id]);
  const [vals, setVals] = useState<Vals>(() => defaults(def));
  const [q, setQ] = useState("");

  const pick = (sid: string) => {
    const d = ALL_SIMS.find((s) => s.id === sid)!;
    setId(sid);
    setVals(defaults(d));
    router.replace(`/lab?sim=${sid}`, { scroll: false });
  };

  const list = ALL_SIMS.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.id.includes(q.toLowerCase())).sort((a, b) => UNIT_OF(a.id) - UNIT_OF(b.id));

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8 grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5 lg:gap-6">
      <aside className="order-2 lg:order-1 space-y-3 lg:sticky lg:top-24 self-start">
        <div className="hidden lg:block">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-[0_3px_0_#6D28D9]"><FlaskConical size={20} /></span> Sim Lab
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5">All {ALL_SIMS.length} simulations, free-play — no hearts, no objectives.</p>
        </div>
        <div className="card p-2.5">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search simulations…" className="w-full rounded-xl bg-slate-100 pl-9 pr-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-400" />
        </label>
        <div className="mt-2 max-h-[46vh] lg:max-h-[64vh] overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              className={`w-full flex items-start gap-2.5 text-left rounded-xl px-2.5 py-2 text-[13px] font-semibold leading-snug transition-colors ${s.id === id ? "bg-violet-500 text-white shadow-[0_2px_0_#6D28D9]" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <span className={`readout shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${s.id === id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>U{UNIT_OF(s.id)}</span>
              <span className="min-w-0">{s.title}</span>
            </button>
          ))}
        </div>
        </div>
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
        <SimView key={id} def={def} values={vals} onChange={setVals} />
      </section>
    </div>
  );
}
