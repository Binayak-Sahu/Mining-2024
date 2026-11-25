"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { Hand } from "lucide-react";
import type { SimDef, SimParam, Vals } from "@/lib/types";
import { fmt } from "@/lib/calc";
import { toneColor } from "./svg";
import { Slider } from "@/components/ui/Slider";

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

function snap(p: SimParam, v: number): number {
  const s = Math.round((v - p.min) / p.step) * p.step + p.min;
  const c = Math.min(p.max, Math.max(p.min, s));
  return +c.toFixed(6);
}

const PARAM_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#0EA5E9"];
/** Text shades that keep each parameter colour legible (AA) on the control panel in both themes. */
const PARAM_TEXT = ["text-blue-700", "text-emerald-700", "text-amber-700", "text-violet-600", "text-red-700", "text-slate-700"];

/** Daylight "diorama plate" with the sim render, optional overlay and draggable direct-manipulation grips. */
export function SimCanvas({ def, values, overlay, onChange, still = false }: { def: SimDef; values: Vals; overlay?: ReactNode; onChange?: (v: Vals) => void; still?: boolean }) {
  const out = useMemo(() => def.compute(values), [def, values]);
  const wrap = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  // Animated dioramas pause while scrolled out of view (Codex pages hold dozens of them).
  useEffect(() => {
    const el = wrap.current;
    if (!el || still || !def.animated || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [still, def.animated]);
  const t = useClock(!!def.animated && !still && onScreen);
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [used, setUsed] = useState(false);
  const handles = onChange ? (def.handles ?? []) : [];

  const toView = (e: RPointerEvent) => {
    const el = svg.current;
    const m = el?.getScreenCTM();
    if (!el || !m) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return pt;
  };

  const move = (e: RPointerEvent) => {
    if (drag === null || !onChange) return;
    const h = handles[drag];
    const p = def.params.find((q) => q.key === h.key);
    const pt = toView(e);
    if (!p || !pt) return;
    const raw = h.toValue(h.axis === "x" ? pt.x : pt.y, values);
    if (!Number.isFinite(raw)) return;
    const v = snap(p, raw);
    if (v !== values[h.key]) onChange({ ...values, [h.key]: v });
  };

  return (
    <div ref={wrap} className={`plate ${still ? "" : "max-sm:-mx-1.5"}`}>
      <svg
        ref={svg}
        viewBox="-24 -24 448 288"
        className={`w-full h-auto select-none ${drag !== null ? "cursor-grabbing" : ""}`}
        role="img"
        aria-label={def.title}
        style={{ touchAction: drag !== null ? "none" : undefined }}
        onPointerMove={move}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        {def.render(values, out, t)}
        {overlay}
        {handles.map((h, i) => {
          const [x, y] = h.at(values, out);
          const c = h.color ?? "#3B82F6";
          const on = drag === i;
          return (
            <g
              key={`${h.key}-${i}`}
              role="slider"
              aria-label={`Drag to change ${def.params.find((q) => q.key === h.key)?.label ?? h.key}`}
              aria-valuenow={values[h.key]}
              style={{ cursor: on ? "grabbing" : "grab", touchAction: "none" }}
              onPointerDown={(e) => {
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                e.preventDefault();
                setDrag(i);
                setUsed(true);
              }}
            >
              <circle cx={x} cy={y} r={22} fill="transparent" />
              {!used && <circle cx={x} cy={y} r={9} fill="none" stroke={c} strokeWidth={2} className="hotspot-ring" />}
              <circle cx={x} cy={y} r={on ? 10 : 8.5} fill="white" stroke={c} strokeWidth={3} filter="url(#f-shadow)" />
              {h.axis === "x" ? (
                <path d={`M${x - 3.5} ${y} l2.5 -2.5 v5z M${x + 3.5} ${y} l-2.5 -2.5 v5z`} fill={c} />
              ) : (
                <path d={`M${x} ${y - 3.5} l-2.5 2.5 h5z M${x} ${y + 3.5} l-2.5 -2.5 h5z`} fill={c} />
              )}
            </g>
          );
        })}
      </svg>
      {handles.length > 0 && !used && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-none absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-[#0E1424]/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          <Hand size={11} /> Drag the grips on the diagram
        </motion.div>
      )}
      {def.animated && !still && (
        <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#0E1424]/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
        </span>
      )}
    </div>
  );
}

/** A live physics number that springs from its previous value to the new one (exact value at rest). */
export function AnimatedNumber({ value, digits }: { value: number; digits: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    const el = ref.current;
    if (!el) return;
    if (reduce || !Number.isFinite(value) || !Number.isFinite(from) || from === value) {
      el.textContent = fmt(value, digits);
      return;
    }
    const c = animate(from, value, { type: "spring", stiffness: 260, damping: 30, onUpdate: (v) => (el.textContent = fmt(v, digits)), onComplete: () => (el.textContent = fmt(value, digits)) });
    return () => c.stop();
  }, [value, digits, reduce]);
  return <span ref={ref}>{fmt(value, digits)}</span>;
}

/** Instrument-cluster telemetry strip (always a dark display, in both themes). */
export function Readouts({ def, values }: { def: SimDef; values: Vals }) {
  const out = useMemo(() => def.compute(values), [def, values]);
  return (
    <div className="rounded-2xl bg-[#0E1424] p-1.5 flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] max-sm:-mx-1.5">
      {def.outputs.map((o, i) => {
        const v = out[o.key];
        const tone = o.tone ? o.tone(v, out, values) : "info";
        const text = o.format ? o.format(v, out, values) : fmt(v, o.digits ?? 2);
        const col = tone === "info" ? "#93C5FD" : toneColor(tone);
        return (
          <div key={`${o.key}-${i}`} className="rounded-xl bg-white/[0.04] px-2.5 py-2 min-w-[132px] sm:min-w-0 shrink-0 sm:shrink">
            <div className="text-[11px] text-[#8B97AE] font-semibold leading-tight truncate" title={o.label}>
              {o.label}
            </div>
            <div className="readout text-[14px] font-bold flex items-center gap-1.5 mt-0.5 text-[#F1F5F9] min-w-0">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
              <span className="truncate" style={{ color: tone === "info" ? "#F1F5F9" : col }}>
                {o.format ? text : <AnimatedNumber value={v} digits={o.digits ?? 2} />}
              </span>
              {o.unit && !o.format && <span className="text-[#8B97AE] font-medium text-[11px] shrink-0">{o.unit}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Controls({ def, values, onChange, disabled }: { def: SimDef; values: Vals; onChange: (v: Vals) => void; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      {def.params.map((p, k) => {
        const color = PARAM_COLORS[k % PARAM_COLORS.length];
        const display = p.options
          ? (p.options.find((o) => o.value === values[p.key])?.label ?? "")
          : `${fmt(values[p.key], p.step < 1 ? (p.step < 0.1 ? 2 : 1) : 0)}${p.unit ? ` ${p.unit}` : ""}`;
        return (
          <div key={p.key}>
            <div className="flex items-baseline justify-between gap-3 text-[13px] mb-0.5">
              <span className="text-slate-600 font-semibold">{p.label}</span>
              <span className={`readout font-bold shrink-0 ${PARAM_TEXT[k % PARAM_TEXT.length]}`}>
                {display}
              </span>
            </div>
            {p.options ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.options.map((o) => {
                  const on = values[p.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={disabled}
                      data-on={on}
                      onClick={() => onChange({ ...values, [p.key]: o.value })}
                      className="tile-3d px-3 py-2 text-[13px] font-bold text-slate-700 data-[on=true]:text-blue-700"
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Slider value={values[p.key]} min={p.min} max={p.max} step={p.step} label={p.label} display={display} color={color} disabled={disabled} onChange={(v) => onChange({ ...values, [p.key]: v })} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Full interactive sim: diorama + telemetry + controls. */
export function SimView({ def, values, onChange, overlay, disabled }: { def: SimDef; values: Vals; onChange: (v: Vals) => void; overlay?: ReactNode; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <SimCanvas def={def} values={values} overlay={overlay} onChange={disabled ? undefined : onChange} />
      <Readouts def={def} values={values} />
      <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 shadow-[inset_0_0_0_1px_var(--n-200)] max-sm:-mx-1.5">
        <Controls def={def} values={values} onChange={onChange} disabled={disabled} />
      </div>
      {def.caption && <p className="text-[12px] text-slate-500 leading-relaxed">{def.caption}</p>}
    </div>
  );
}
