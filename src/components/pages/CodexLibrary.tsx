"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
        <BookMarked /> Field Codex
      </h1>
      <p className="text-slate-400 text-sm mt-1">Swiss-style cheat sheets auto-filed when you finish a Field Theory briefing; verified formulas filed from the Equation Forge.</p>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: Atkinson, Graham, RQD, CMR, flameproof…" className="flex-1 bg-transparent outline-none text-sm" />
        </label>
        <div className="flex rounded-xl bg-slate-800 p-1">
          {(["sheets", "formulas", "statutes"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${tab === t ? "bg-white text-slate-900" : "text-slate-400"}`}>
              {t === "sheets" ? "Cheat sheets" : t === "formulas" ? "Formulas" : "Statutes"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        <button type="button" onClick={() => setUnit("all")} className={`px-2.5 py-1 rounded-md text-xs font-bold ${unit === "all" ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"}`}>
          All units
        </button>
        {UNITS.map((u) => (
          <button key={u.id} type="button" onClick={() => setUnit(u.id)} className={`px-2.5 py-1 rounded-md text-xs font-bold ${unit === u.id ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"}`}>
            U{u.n} {u.short}
          </button>
        ))}
      </div>

      {tab === "statutes" ? (
        <div className="mt-5 space-y-3">
          <p className="text-xs text-slate-400 max-w-3xl">
            Every statutory rule STRATA teaches, with its citation. <b className="text-emerald-400">Verified · text-checked</b> = wording checked against reproductions of the CMR 2017 text in the Phase 6 audit; <b className="text-emerald-400">Verified · project owner</b> = value and citation confirmed by the project owner (Phase 7); <b className="text-blue-300">Standard</b> = long-established citation not re-checked. Regulations are amended — keep the official Gazette and DGMS circulars as the final authority.
          </p>
          {STATUTES.filter((st) => !needle || [st.rule, st.citation, st.topic, st.note ?? ""].join(" ").toLowerCase().includes(needle)).map((st) => (
            <div key={st.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Scale size={14} className="text-slate-500" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{st.topic}</span>
                <span
                  className={`ml-auto text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5 ${
                    st.status === "verified" ? "bg-emerald-100 text-emerald-800" : st.status === "standard" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {statusLabel(st)}
                </span>
              </div>
              <p className="text-sm text-slate-900 leading-snug">{st.rule}</p>
              <p className="readout text-xs font-bold text-slate-700 mt-1">{st.citation}</p>
              {st.note && <p className="text-xs text-slate-500 mt-1">{st.note}</p>}
            </div>
          ))}
        </div>
      ) : tab === "sheets" ? (
        <>
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {unlockedSheets.map(({ entry, lesson, unit: u, sims }) => (
              <article key={entry.id} className="card p-5">
                <div className="flex items-baseline justify-between border-b-2 border-slate-900 pb-2 mb-3">
                  <h2 className="font-extrabold text-lg leading-tight">{entry.title}</h2>
                  <span className="readout text-xs text-slate-500 shrink-0 ml-2">U{u.n}</span>
                </div>
                <div className={`grid gap-2 mb-3 ${sims.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {sims.map((sid) => {
                    const def = getSim(sid);
                    return (
                      <Link key={sid} href={`/lab?sim=${sid}`} title={`Open “${def.title}” in the Sim Lab`} className="block hover:ring-2 ring-blue-500 rounded-xl">
                        <SimCanvas def={def} values={defaults(def)} />
                      </Link>
                    );
                  })}
                </div>
                <ul className="space-y-1.5">
                  {entry.bullets.map((b, i) => (
                    <li key={i} className="text-sm text-slate-800 leading-snug grid grid-cols-[14px_1fr]">
                      <span className="text-blue-500 font-bold">—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {entry.formulas && entry.formulas.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {entry.formulas.map((f, i) => (
                      <div key={i} className="rounded-lg bg-slate-900 text-white px-3 py-2">
                        <div className="readout text-sm font-bold text-amber-300">{f.expr}</div>
                        <div className="text-xs text-slate-300">{f.meaning}</div>
                        {f.vars && <div className="readout text-[10px] text-slate-400 mt-0.5">{f.vars}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(entry.tags ?? []).map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                  <Link href={`/lesson/${lesson.id}`} className="ml-auto text-[10px] uppercase tracking-wider font-bold text-blue-600">
                    Source: {lesson.title}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {unlockedSheets.length === 0 && <p className="mt-6 text-slate-400 text-sm">No cheat sheets unlocked{needle ? " match this search" : " yet — finish a Field Theory briefing to file your first"}.</p>}
          {lockedSheets.length > 0 && (
            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Locked ({lockedSheets.length})</div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {lockedSheets.map(({ entry, lesson, unit: u }) => (
                  <Link key={entry.id} href={`/unit/${u.id}`} className="rounded-xl border border-slate-800 p-3 flex items-center gap-2 text-slate-500 hover:border-slate-600">
                    <Lock size={14} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-400 truncate">{entry.title}</div>
                      <div className="text-[10px] uppercase tracking-wider truncate">
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
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-violet-600">
                  <Sigma size={12} /> U{f.unit.n} · {f.lesson.title}
                </div>
                <div className="readout text-lg font-bold mt-1">{f.formula.expr}</div>
                <div className="text-sm text-slate-700">{f.formula.meaning}</div>
                {f.formula.vars && <div className="readout text-[11px] text-slate-500 mt-1">{f.formula.vars}</div>}
              </div>
            ) : (
              <div key={f.id} className="rounded-xl border border-slate-800 p-4 text-slate-500 flex items-center gap-2">
                <Lock size={14} /> <span className="text-sm">Forge this equation in “{f.lesson.title}”</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
