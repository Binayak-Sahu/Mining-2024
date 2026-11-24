"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, RotateCcw } from "lucide-react";
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
    <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
      <aside className="space-y-2">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <FlaskConical /> Sim Lab
        </h1>
        <p className="text-xs text-slate-400">Every simulation in STRATA, free-play — no hearts, no objectives.</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter simulations…" className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none" />
        <div className="max-h-[60vh] lg:max-h-[75vh] overflow-y-auto space-y-1 pr-1">
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              className={`w-full text-left rounded-lg px-3 py-2 text-xs ${s.id === id ? "bg-blue-500 text-white" : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"}`}
            >
              <span className="readout text-[10px] opacity-70">U{UNIT_OF(s.id)} · </span>
              {s.title}
            </button>
          ))}
        </div>
      </aside>
      <section className="card p-4 sm:p-6 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-lg font-extrabold leading-tight">{def.title}</h2>
          <button type="button" onClick={() => setVals(defaults(def))} className="btn-press shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        <SimView key={id} def={def} values={vals} onChange={setVals} />
      </section>
    </div>
  );
}
