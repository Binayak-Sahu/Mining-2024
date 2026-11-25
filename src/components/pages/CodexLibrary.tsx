"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Lock, BookMarked, Sigma, Scale } from "lucide-react";
import { STATUTES, statusLabel } from "@/content/statutes";
import { allCodex, allFormulas, getSim, UNITS } from "@/content";
import { SimCanvas, defaults } from "@/components/sim/SimView";
import { useStrata } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

export function CodexLibrary() {
  const hydrated = useHydrated();
  const codex = useStrata((s) => s.codex);
  const formulas = useStrata((s) => s.formulas);
  const [q, setQ] = useState("");
  const [unit, setUnit] = useState<string>("all");
  const [tab, setTab] = useState<"sheets" | "formulas" | "statutes">("sheets");

  const entries = useMemo(() => allCodex(), []);
  const forms = useMemo(() => allFormulas(), []);
  const needle = q.trim().toLowerCase();

  const matchSheet = (e: (typeof entries)[number]) => {
    if (unit !== "all" && e.unit.id !== unit) return false;
    if (!needle) return true;
    const hay = [e.entry.title, ...e.entry.bullets, ...(e.entry.tags ?? []), ...(e.entry.formulas ?? []).flatMap((f) => [f.expr, f.meaning])].join(" ").toLowerCase();
    return hay.includes(needle);
  };
  const matchForm = (f: (typeof forms)[number]) => {
    if (unit !== "all" && f.unit.id !== unit) return false;
    if (!needle) return true;
    return [f.formula.expr, f.formula.meaning, f.formula.vars ?? "", f.lesson.title].join(" ").toLowerCase().includes(needle);
  };

  const have = (id: string) => hydrated && !!codex[id];
  const haveF = (id: string) => hydrated && !!formulas[id];

  const sheets = entries.filter(matchSheet);
  const fl = forms.filter(matchForm);
  const unlockedSheets = sheets.filter((e) => have(e.entry.id));
  const lockedSheets = sheets.filter((e) => !have(e.entry.id));

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-[0_3px_0_#0369A1]">
              <BookMarked size={22} />
            </span>
            Field Codex
          </h1>
          <p className="text-slate-500 text-[14px] mt-2 max-w-2xl">Swiss-style cheat sheets auto-filed when you finish a Field Theory briefing; verified formulas filed from the Equation Forge.</p>
        </div>
        <div className="flex gap-2">
          {[
            { k: "Sheets", v: `${hydrated ? Object.keys(codex).length : 0}/${entries.length}`, c: "#0EA5E9" },
            { k: "Formulas", v: `${hydrated ? Object.keys(formulas).length : 0}/${forms.length}`, c: "#8B5CF6" },
            { k: "Statutes", v: STATUTES.length, c: "#EF4444" },
          ].map((x) => (
            <div key={x.k} className="card px-3.5 py-2.5 min-w-[84px]">
              <div className="readout text-[17px] font-extrabold" style={{ color: x.c }}>
                {x.v}
              </div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500">{x.k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <label className="flex-1 flex items-center gap-2.5 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-card)] focus-within:ring-2 focus-within:ring-sky-400">
          <Search size={18} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: Atkinson, Graham, RQD, CMR, flameproof…" className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-slate-900 placeholder:text-slate-400" />
        </label>
        <div className="flex rounded-2xl bg-slate-100 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]">
          {(["sheets", "formulas", "statutes"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`relative flex-1 md:flex-none px-4 py-2 rounded-xl text-[13px] font-extrabold ${tab === t ? "text-slate-900" : "text-slate-500"}`}>
              {tab === t && <motion.span layoutId="codex-tab" className="absolute inset-0 rounded-xl bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.1),0_2px_0_var(--n-200)]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              <span className="relative inline-flex items-center gap-1.5">
                {t === "sheets" ? <BookMarked size={14} /> : t === "formulas" ? <Sigma size={14} /> : <Scale size={14} />}
                {t === "sheets" ? "Sheets" : t === "formulas" ? "Formulas" : "Statutes"}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap pb-1">
        <button type="button" onClick={() => setUnit("all")} data-on={unit === "all"} className="tile-3d shrink-0 px-3 py-1.5 text-[12px] font-bold text-slate-600 data-[on=true]:text-blue-700">
          All units
        </button>
        {UNITS.map((u) => (
          <button key={u.id} type="button" onClick={() => setUnit(u.id)} data-on={unit === u.id} className="tile-3d shrink-0 px-3 py-1.5 text-[12px] font-bold text-slate-600 data-[on=true]:text-blue-700 whitespace-nowrap">
            <span className="readout">U{u.n}</span> {u.short}
          </button>
        ))}
      </div>

      {tab === "statutes" ? (
        <div className="mt-5 grid md:grid-cols-2 gap-3 items-start">
          <p className="text-[13px] text-slate-500 max-w-3xl leading-relaxed">
            Every statutory rule STRATA teaches, with its citation. <b className="text-emerald-600">Verified · text-checked</b> = wording checked against reproductions of the CMR 2017 text in the Phase 6 audit; <b className="text-emerald-600">Verified · project owner</b> = value and citation confirmed by the project owner (Phase 7); <b className="text-blue-600">Standard</b> = long-established citation not re-checked. Regulations are amended — keep the official Gazette and DGMS circulars as the final authority.
          </p>
          {STATUTES.filter((st) => !needle || [st.rule, st.citation, st.topic, st.note ?? ""].join(" ").toLowerCase().includes(needle)).map((st) => (
            <div key={st.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Scale size={14} className="text-slate-500" />
                <span className="text-[10.5px] uppercase tracking-[0.12em] font-extrabold text-slate-500">{st.topic}</span>
                <span
                  className={`ml-auto text-[10px] font-extrabold uppercase tracking-wider rounded-full px-2.5 py-1 ${
                    st.status === "verified" ? "bg-emerald-100 text-emerald-800" : st.status === "standard" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {statusLabel(st)}
                </span>
              </div>
              <p className="text-[14.5px] text-slate-800 leading-relaxed">{st.rule}</p>
              <p className="readout text-[12px] font-bold text-red-600 mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 inline-block">{st.citation}</p>
              {st.note && <p className="text-xs text-slate-500 mt-1">{st.note}</p>}
            </div>
          ))}
        </div>
      ) : tab === "sheets" ? (
        <>
          <div className="grid md:grid-cols-2 gap-4 mt-5 items-start">
            {unlockedSheets.map(({ entry, lesson, unit: u, sims }) => (
              <article key={entry.id} className="card p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-baseline justify-between border-b-2 border-slate-900 pb-2.5 mb-3">
                  <h2 className="font-extrabold text-[18px] leading-tight text-slate-900 tracking-tight">{entry.title}</h2>
                  <span className="readout text-[11px] font-extrabold text-sky-600 bg-sky-500/10 rounded-md px-1.5 py-0.5 shrink-0 ml-2">U{u.n}</span>
                </div>
                <div className={`grid gap-2 mb-3 ${sims.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {sims.map((sid) => {
                    const def = getSim(sid);
                    return (
                      <Link key={sid} href={`/lab?sim=${sid}`} title={`Open “${def.title}” in the Sim Lab`} className="block rounded-2xl transition hover:ring-2 ring-sky-400 hover:-translate-y-0.5">
                        <SimCanvas def={def} values={defaults(def)} />
                      </Link>
                    );
                  })}
                </div>
                <ul className="space-y-1.5">
                  {entry.bullets.map((b, i) => (
                    <li key={i} className="text-[14px] text-slate-700 leading-snug grid grid-cols-[16px_1fr]">
                      <span className="text-sky-500 font-extrabold">—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {entry.formulas && entry.formulas.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {entry.formulas.map((f, i) => (
                      <div key={i} className="rounded-xl bg-[#0E1424] px-3.5 py-2.5">
                        <div className="readout text-[14px] font-bold text-[#FCD34D]">{f.expr}</div>
                        <div className="text-[12.5px] text-[#CBD5E1] mt-0.5">{f.meaning}</div>
                        {f.vars && <div className="readout text-[10.5px] text-[#8B97AE] mt-1">{f.vars}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(entry.tags ?? []).map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 rounded-md px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                  <Link href={`/lesson/${lesson.id}`} className="ml-auto text-[11px] font-bold text-blue-600 hover:underline">
                    Source: {lesson.title}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {unlockedSheets.length === 0 && <p className="mt-6 text-slate-500 text-sm card p-5">No cheat sheets unlocked{needle ? " match this search" : " yet — finish a Field Theory briefing to file your first"}.</p>}
          {lockedSheets.length > 0 && (
            <div className="mt-8">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3">Locked ({lockedSheets.length})</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lockedSheets.map(({ entry, lesson, unit: u, sims }) => (
                  <Link key={entry.id} href={`/unit/${u.id}`} className="group rounded-2xl bg-slate-50 shadow-[inset_0_0_0_1.5px_var(--n-200)] p-2.5 flex flex-col gap-2 text-slate-400 hover:shadow-[inset_0_0_0_1.5px_var(--n-300)] min-w-0">
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="grayscale opacity-45 group-hover:opacity-70 transition-opacity pointer-events-none" aria-hidden>
                        <SimCanvas def={getSim(sims[0])} values={defaults(getSim(sims[0]))} still />
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-9 h-9 rounded-full bg-surface/90 shadow-[0_2px_8px_rgba(15,23,42,0.2)] flex items-center justify-center text-slate-500">
                          <Lock size={15} />
                        </span>
                      </span>
                    </div>
                    <div className="min-w-0 px-0.5">
                      <div className="text-[13.5px] font-bold text-slate-500 truncate">{entry.title}</div>
                      <div className="text-[10.5px] font-semibold truncate">
                        U{u.n} · {lesson.title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 grid md:grid-cols-2 gap-3">
          {fl.map((f) =>
            haveF(f.id) ? (
              <div key={f.id} className="card p-4">
                <div className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-violet-600">
                  <Sigma size={12} /> U{f.unit.n} · {f.lesson.title}
                </div>
                <div className="readout text-[18px] font-bold mt-2 text-slate-900 rounded-xl bg-violet-50 px-3 py-2">{f.formula.expr}</div>
                <div className="text-[14px] text-slate-600 mt-2">{f.formula.meaning}</div>
                {f.formula.vars && <div className="readout text-[11px] text-slate-500 mt-1">{f.formula.vars}</div>}
              </div>
            ) : (
              <div key={f.id} className="rounded-2xl bg-slate-50 shadow-[inset_0_0_0_1.5px_var(--n-200)] p-4 text-slate-400 flex items-center gap-2.5">
                <Lock size={14} /> <span className="text-sm">Forge this equation in “{f.lesson.title}”</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
