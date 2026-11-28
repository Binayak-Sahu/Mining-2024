"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Lock, BookMarked, Sigma, Scale } from "lucide-react";
import { STATUTES, statusLabel } from "@/content/statutes";
import { allCodex, allFormulas, getSim, UNITS } from "@/content";
import { REFS } from "@/content/references";
import { SimCanvas, defaults } from "@/components/sim/SimView";
import { useStrata } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs } from "@/lib/prefs";
import { Formula } from "@/components/ui/Formula";

export function CodexLibrary() {
  const hydrated = useHydrated();
  const codex = useStrata((s) => s.codex);
  const formulas = useStrata((s) => s.formulas);
  const master = usePrefs((p) => p.masterUnlock);
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

  // Inspector Mode shows every sheet and formula in full (view only — nothing is unlocked in progress).
  const have = (id: string) => hydrated && (!!codex[id] || master);
  const haveF = (id: string) => hydrated && (!!formulas[id] || master);

  const sheets = entries.filter(matchSheet);
  const fl = forms.filter(matchForm);
  const unlockedSheets = sheets.filter((e) => have(e.entry.id));
  const lockedSheets = sheets.filter((e) => !have(e.entry.id));

  const tabs = [
    { t: "sheets" as const, label: "Sheets", Icon: BookMarked },
    { t: "formulas" as const, label: "Formulas", Icon: Sigma },
    { t: "statutes" as const, label: "Statutes", Icon: Scale },
  ];
  const chip = "tile-3d shrink-0 min-h-[44px] px-4 t-label text-fg data-[on=true]:text-unit-ink inline-flex items-center gap-2 whitespace-nowrap";

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          <span className="unit-tile w-14 h-14 shrink-0 mt-1" aria-hidden>
            <BookMarked size={26} />
          </span>
          <div className="min-w-0">
            <h1 className="t-display text-fg">Field Codex</h1>
            <p className="t-secondary mt-1 max-w-2xl">Swiss-style cheat sheets auto-filed when you finish a Field Theory briefing; verified formulas filed from the Equation Forge.</p>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { k: "Sheets", v: `${hydrated ? Object.keys(codex).length : 0}/${entries.length}` },
            { k: "Formulas", v: `${hydrated ? Object.keys(formulas).length : 0}/${forms.length}` },
            { k: "Statutes", v: STATUTES.length },
          ].map((x) => (
            <div key={x.k} className="card px-4 py-3 min-w-[92px]">
              <div className="t-readout text-fg" style={{ fontWeight: 800 }}>{x.v}</div>
              <div className="t-label text-fg-2" style={{ fontWeight: 400 }}>{x.k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-3">
        <label className="field-input flex-1 flex items-center gap-3 focus-within:border-action">
          <Search size={18} className="text-fg-3 shrink-0" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the Codex" placeholder="Search: Atkinson, Graham, RQD, CMR, flameproof…" className="flex-1 min-w-0 bg-transparent outline-none text-fg placeholder:text-fg-3" style={{ fontWeight: 400 }} />
        </label>
        <div className="flex gap-2" aria-label="Codex sections" role="group">
          {tabs.map(({ t, label, Icon }) => (
            <button key={t} type="button" onClick={() => setTab(t)} data-on={tab === t} aria-pressed={tab === t} className={`${chip} flex-1 md:flex-none justify-center`}>
              <Icon size={16} aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap pb-1.5" aria-label="Filter by unit" role="group">
        <button type="button" onClick={() => setUnit("all")} data-on={unit === "all"} aria-pressed={unit === "all"} className={chip}>
          All units
        </button>
        {UNITS.map((u) => (
          <button key={u.id} type="button" onClick={() => setUnit(u.id)} data-on={unit === u.id} aria-pressed={unit === u.id} className={chip}>
            <span className="readout">U{u.n}</span> {u.short}
          </button>
        ))}
      </div>

      {tab === "statutes" ? (
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-6 items-start">
          <p className="t-label text-fg-2 max-w-3xl" style={{ fontWeight: 400 }}>
            Every statutory rule STRATA teaches, with its citation. <b className="text-success-tint-text">Verified · text-checked</b> = wording checked against reproductions of the CMR 2017 text in the Phase 6 audit; <b className="text-success-tint-text">Verified · project owner</b> = value and citation confirmed by the project owner (Phase 7); <b className="text-action-tint-text">Standard</b> = long-established citation not re-checked. Regulations are amended — keep the official Gazette and DGMS circulars as the final authority.
          </p>
          {STATUTES.filter((st) => !needle || [st.rule, st.citation, st.topic, st.note ?? ""].join(" ").toLowerCase().includes(needle)).map((st) => (
            <div key={st.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Scale size={16} className="text-fg-3" aria-hidden />
                <span className="t-eyebrow">{st.topic}</span>
                <span className={`ml-auto t-label rounded-full px-3 py-0.5 ${st.status === "verified" ? "bg-success-tint text-success-tint-text" : st.status === "standard" ? "bg-action-tint text-action-tint-text" : "bg-energy-tint text-energy-tint-text"}`} style={{ fontWeight: 700 }}>
                  {statusLabel(st)}
                </span>
              </div>
              <p className="t-secondary !text-fg">{st.rule}</p>
              <p className="readout t-label text-fg mt-3 rounded-[8px] bg-surface-2 px-3 py-1 inline-block">{st.citation}</p>
              {st.note && <p className="t-label text-fg-2 mt-2" style={{ fontWeight: 400 }}>{st.note}</p>}
            </div>
          ))}
        </div>
      ) : tab === "sheets" ? (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-6 mt-8 items-start">
            {unlockedSheets.map(({ entry, lesson, unit: u, sims, refs }) => (
              <article key={entry.id} className="card p-5">
                <div className="flex items-baseline justify-between border-b-2 border-line pb-3 mb-4">
                  <h2 className="t-heading text-fg">{entry.title}</h2>
                  <span className="readout t-label text-fg-2 bg-surface-2 rounded-[8px] px-2 shrink-0 ml-2" style={{ fontWeight: 700 }}>U{u.n}</span>
                </div>
                <div className={`grid gap-2 mb-4 ${sims.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {sims.map((sid) => {
                    const def = getSim(sid);
                    return (
                      <Link key={sid} href={`/lab?sim=${sid}`} title={`Open “${def.title}” in the Sim Lab`} aria-label={`Open ${def.title} in the Sim Lab`} className="block rounded-[16px] hover:ring-2 ring-action">
                        <SimCanvas def={def} values={defaults(def)} />
                      </Link>
                    );
                  })}
                </div>
                <ul className="space-y-2">
                  {entry.bullets.map((b, i) => (
                    <li key={i} className="t-label text-fg grid grid-cols-[16px_1fr]" style={{ fontWeight: 400, fontSize: 15, lineHeight: "22px" }}>
                      <span className="text-fg-3" aria-hidden>—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {entry.formulas && entry.formulas.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {entry.formulas.map((f, i) => (
                      <div key={i} className="rounded-[12px] bg-surface-2 px-4 py-3">
                        <div className="t-readout text-fg"><Formula expr={f.expr} /></div>
                        <div className="t-label text-fg-2 mt-1" style={{ fontWeight: 400 }}>{f.meaning}</div>
                        {f.vars && <div className="readout t-label text-fg-2 mt-1" style={{ fontWeight: 400 }}>{f.vars}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {refs.length > 0 && (
                  <div className="mt-4">
                    <div className="t-label text-fg mb-1" style={{ fontWeight: 700 }}>Sources</div>
                    <ul className="space-y-1">
                      {refs.map((id) => {
                        const r = REFS[id];
                        if (!r) return null;
                        return (
                          <li key={id} className="t-label text-fg" style={{ fontWeight: 400 }}>
                            <a href={r.url} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2 hover:decoration-current">
                              {r.title}
                            </a>{" "}
                            <span className="text-fg-2">— {r.publisher}{r.where ? `, ${r.where}` : ""}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(entry.tags ?? []).map((t) => (
                    <span key={t} className="t-label text-fg-2 bg-surface-2 rounded-[8px] px-2" style={{ fontWeight: 400 }}>
                      {t}
                    </span>
                  ))}
                  <Link href={`/lesson/${lesson.id}`} className="ml-auto inline-flex items-center min-h-[44px] t-label text-action-tint-text hover:underline" style={{ fontWeight: 700 }}>
                    Source: {lesson.title}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {unlockedSheets.length === 0 && <p className="mt-8 t-secondary card p-5">No cheat sheets unlocked{needle ? " match this search" : " yet — finish a Field Theory briefing to file your first"}.</p>}
          {lockedSheets.length > 0 && (
            <div className="mt-10">
              <div className="t-eyebrow mb-4">Locked ({lockedSheets.length})</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {lockedSheets.map(({ entry, lesson, unit: u, sims }) => (
                  <Link key={entry.id} href={`/unit/${u.id}`} className="card course-card group p-3 flex flex-col gap-2 min-w-0">
                    <div className="relative rounded-[12px] overflow-hidden">
                      <div className="grayscale opacity-45 group-hover:opacity-70 transition-opacity pointer-events-none" aria-hidden>
                        <SimCanvas def={getSim(sims[0])} values={defaults(getSim(sims[0]))} still />
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-10 h-10 rounded-full bg-surface border-2 border-line-strong flex items-center justify-center text-fg-3">
                          <Lock size={18} aria-label="Locked" />
                        </span>
                      </span>
                    </div>
                    <div className="min-w-0 px-0.5">
                      <div className="t-label text-fg-2 truncate" style={{ fontWeight: 700 }}>{entry.title}</div>
                      <div className="t-label text-fg-3 truncate" style={{ fontWeight: 400 }}>
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
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 gap-6">
          {fl.map((f) =>
            haveF(f.id) ? (
              <div key={f.id} className="card p-5">
                <div className="t-eyebrow flex items-center gap-2">
                  <Sigma size={16} aria-hidden /> U{f.unit.n} · {f.lesson.title}
                </div>
                <div className="t-readout text-fg mt-3 rounded-[12px] bg-surface-2 px-4 py-2 break-words"><Formula expr={f.formula.expr} /></div>
                <div className="t-label text-fg-2 mt-2" style={{ fontWeight: 400 }}>{f.formula.meaning}</div>
                {f.formula.vars && <div className="readout t-label text-fg-2 mt-1" style={{ fontWeight: 400 }}>{f.formula.vars}</div>}
              </div>
            ) : (
              <div key={f.id} className="card p-5 text-fg-3 flex items-center gap-3">
                <Lock size={18} aria-hidden className="shrink-0" /> <span className="t-label" style={{ fontWeight: 400 }}>Forge this equation in “{f.lesson.title}”</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
