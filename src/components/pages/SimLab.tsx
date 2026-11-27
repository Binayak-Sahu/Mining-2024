"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const isSim = (s: string | null): s is string => !!s && ALL_SIMS.some((x) => x.id === s);

export function SimLab() {
  const params = useSearchParams();
  const fromUrl = params.get("sim");
  const [id, setId] = useState(isSim(fromUrl) ? fromUrl : ALL_SIMS[1].id);
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
    // Shallow URL update (no router navigation, no RSC fetch): the picker never depends on the network or
    // on a cached payload, so it keeps working offline and across deploys.
    window.history.replaceState(null, "", `${BASE}/lab/?sim=${sid}`);
  };

  // Follow the URL when it changes underneath us (e.g. a Codex thumbnail link while the lab is open).
  useEffect(() => {
    if (!isSim(fromUrl)) return;
    setId((cur) => {
      if (cur === fromUrl) return cur;
      setCi(0);
      setVals(defaults(ALL_SIMS.find((s) => s.id === fromUrl)!));
      return fromUrl;
    });
  }, [fromUrl]);

  const list = ALL_SIMS.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.id.includes(q.toLowerCase())).sort((a, b) => UNIT_OF(a.id) - UNIT_OF(b.id));

  const browser = (inSheet: boolean) => (
    <>
      <label className="field-input flex items-center gap-3 focus-within:border-action">
        <Search size={18} className="text-fg-3 shrink-0" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search simulations" placeholder="Search simulations…" className="flex-1 min-w-0 bg-transparent outline-none text-fg placeholder:text-fg-3" style={{ fontWeight: 400 }} />
      </label>
      <div className={`mt-2 ${inSheet ? "max-h-[62vh]" : "max-h-[64vh]"} overflow-y-auto space-y-1 pr-0.5 no-scrollbar`}>
        {list.map((s) => {
          const on = s.id === id;
          return (
            <button
              key={s.id}
              type="button"
              aria-current={on ? "true" : undefined}
              onClick={() => {
                pick(s.id);
                if (inSheet) setSheet(false);
              }}
              className={`w-full min-h-[44px] flex items-start gap-3 text-left rounded-[12px] px-3 py-2 t-label transition-colors ${on ? "bg-action-tint text-action-tint-text" : "text-fg hover:bg-surface-2"}`}
            >
              <span className={`readout shrink-0 rounded-[8px] px-1.5 ${on ? "bg-surface text-action-tint-text" : "bg-surface-2 text-fg-2"}`} style={{ fontWeight: 800 }}>U{UNIT_OF(s.id)}</span>
              <span className="min-w-0">{s.title}</span>
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8">
      <aside className="hidden lg:block order-2 lg:order-1 space-y-4 lg:sticky lg:top-24 self-start">
        <div className="flex items-center gap-3">
          <span className="unit-tile w-12 h-12 shrink-0" aria-hidden>
            <FlaskConical size={22} />
          </span>
          <h1 className="t-title text-fg">Sim Lab</h1>
        </div>
        <p className="t-label text-fg-2" style={{ fontWeight: 400 }}>All {ALL_SIMS.length} simulations, free-play — no hearts, no objectives.</p>
        <div className="card p-3">{browser(false)}</div>
      </aside>
      <section className="order-1 lg:order-2 min-w-0" style={{ ["--sim-top" as string]: "4rem" }}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <div className="t-eyebrow">Sim Lab · Unit {UNIT_OF(def.id)}</div>
            <h2 className="t-title text-fg mt-1 text-balance">{def.title}</h2>
          </div>
          <button type="button" onClick={() => setVals(defaults(def))} className="btn-3d btn-sm tone-ghost shrink-0">
            <RotateCcw size={16} aria-hidden /> Reset
          </button>
        </div>
        <Drawer.Root open={sheet} onOpenChange={setSheet}>
          <Drawer.Trigger asChild>
            <button type="button" className="lg:hidden mb-6 w-full btn-3d btn-sm tone-ghost !justify-start">
              <ListFilter size={18} aria-hidden /> Browse all {ALL_SIMS.length} simulations
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 sheet-face p-4 pb-[calc(16px+env(safe-area-inset-bottom))] focus:outline-none" aria-describedby={undefined}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line-strong" aria-hidden />
              <Drawer.Title className="px-1 pb-3 t-heading text-fg">Simulations</Drawer.Title>
              {browser(true)}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <SimView key={id} def={def} values={vals} onChange={setVals} objective={ch ? { text: ch.text, met, tag: challenges.length > 1 ? `Challenge ${ci + 1}/${challenges.length}` : "Challenge" } : undefined} />
        {ch && met && ci + 1 < challenges.length && (
          <button type="button" onClick={() => setCi(ci + 1)} className="btn-3d tone-safe w-full mt-4">
            Next challenge
          </button>
        )}
      </section>
    </div>
  );
}
