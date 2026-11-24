"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SimDef, Vals } from "@/lib/types";
import { fmt } from "@/lib/calc";
import { toneColor } from "./svg";

export function defaults(def: SimDef, overrides?: Vals): Vals {
  const v: Vals = {};
  for (const p of def.params) v[p.key] = p.default;
  return { ...v, ...(overrides ?? {}) };
}

function useClock(active: boolean): number {
  const [t, setT] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = (now: number) => {
      if (start.current === null) start.current = now;
      setT((now - start.current) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return t;
}

export function SimCanvas({ def, values, overlay }: { def: SimDef; values: Vals; overlay?: ReactNode }) {
  const out = useMemo(() => def.compute(values), [def, values]);
  const t = useClock(!!def.animated);
  return (
    <svg viewBox="0 0 400 240" className="w-full h-auto rounded-xl bg-white border border-slate-200 select-none" role="img" aria-label={def.title}>
      {def.render(values, out, t)}
      {overlay}
    </svg>
  );
}

export function Readouts({ def, values }: { def: SimDef; values: Vals }) {
  const out = useMemo(() => def.compute(values), [def, values]);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {def.outputs.map((o, i) => {
        const v = out[o.key];
        const tone = o.tone ? o.tone(v, out, values) : "info";
        const text = o.format ? o.format(v, out, values) : fmt(v, o.digits ?? 2);
        return (
          <div key={`${o.key}-${i}`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 leading-tight">{o.label}</div>
            <div className="readout text-sm font-semibold flex items-center gap-1.5" style={{ color: tone === "info" ? "#0F172A" : toneColor(tone) }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: toneColor(tone) }} />
              {text}
              {o.unit && !o.format && <span className="text-slate-500 font-normal text-xs">{o.unit}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Controls({
  def,
  values,
  onChange,
  disabled,
}: {
  def: SimDef;
  values: Vals;
  onChange: (v: Vals) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {def.params.map((p) => (
        <div key={p.key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">{p.label}</span>
            <span className="readout font-semibold text-slate-900">
              {p.options ? p.options.find((o) => o.value === values[p.key])?.label : fmt(values[p.key], p.step < 1 ? (p.step < 0.1 ? 2 : 1) : 0)}
              {!p.options && p.unit ? ` ${p.unit}` : ""}
            </span>
          </div>
          {p.options ? (
            <div className="flex flex-wrap gap-1">
              {p.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...values, [p.key]: o.value })}
                  className={`btn-press text-xs px-2.5 py-1 rounded-md border ${
                    values[p.key] === o.value ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 text-slate-700 hover:border-slate-500"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="range"
              className="w-full"
              min={p.min}
              max={p.max}
              step={p.step}
              value={values[p.key]}
              disabled={disabled}
              aria-label={p.label}
              onChange={(e) => onChange({ ...values, [p.key]: Number(e.target.value) })}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** Full interactive sim: canvas + sliders + readouts. */
export function SimView({
  def,
  values,
  onChange,
  overlay,
  disabled,
}: {
  def: SimDef;
  values: Vals;
  onChange: (v: Vals) => void;
  overlay?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <SimCanvas def={def} values={values} overlay={overlay} />
      <Readouts def={def} values={values} />
      <Controls def={def} values={values} onChange={onChange} disabled={disabled} />
      {def.caption && <p className="text-[11px] text-slate-500">{def.caption}</p>}
    </div>
  );
}
