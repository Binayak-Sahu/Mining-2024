"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
export { AnimatedNumber };
import { Hand, Check, ChevronDown } from "lucide-react";
import type { SimDef, SimParam, Vals } from "@/lib/types";
import { fmt } from "@/lib/calc";
import { sfx } from "@/lib/sfx";
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

const HINT_KEY = "strata-grip-hint";
function markHintSeen() {
  try {
    localStorage.setItem(HINT_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** Daylight "diorama plate" with the sim render, optional overlay and draggable direct-manipulation grips. */
/** A live objective shown in the diagram's own frame; the frame lights up emerald while it is met. */
export interface Objective {
  text: string;
  met: boolean;
  /** e.g. "Challenge 2 of 3" */
  tag?: string;
}

export function SimCanvas({ def, values, overlay, onChange, still = false, objective, focus, corner }: { def: SimDef; values: Vals; overlay?: ReactNode; onChange?: (v: Vals) => void; still?: boolean; objective?: Objective; focus?: [number, number][]; corner?: ReactNode }) {
  const maskId = `focus-${useId().replace(/:/g, "")}`;
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
  // The grip hint is a one-time tutorial: once you've dragged any grip it never shows again.
  const [hintSeen, setHintSeen] = useState(true);
  useEffect(() => {
    try {
      setHintSeen(localStorage.getItem(HINT_KEY) === "1");
    } catch {
      setHintSeen(false);
    }
  }, []);
  const handles = onChange ? (def.handles ?? []) : [];
  // Chrome ignores touch-action on SVG children, so a touch that starts on a grip claims the gesture with
  // a non-passive touchstart (no page scroll mid-drag). Elsewhere on the diagram the page scrolls normally.
  useEffect(() => {
    const el = svg.current;
    if (!el || !handles.length) return;
    const claim = (e: TouchEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-grip]")) e.preventDefault();
    };
    el.addEventListener("touchstart", claim, { passive: false });
    return () => el.removeEventListener("touchstart", claim);
  }, [handles.length]);

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
    if (v !== values[h.key]) {
      sfx.tick();
      onChange({ ...values, [h.key]: v });
    }
  };

  return (
    <div ref={wrap} className={`plate ${still ? "" : "max-sm:-mx-1.5"} transition-shadow duration-300 ${objective?.met ? "plate-met" : ""}`}>
      {objective && (
        <div className={`relative z-[1] flex items-start gap-2 px-3 py-2 text-[13px] font-bold leading-snug transition-colors duration-300 ${objective.met ? "bg-[#047857] text-white" : "bg-[#0E1424] text-[#F1F5F9]"}`} role="status" aria-live="polite">
          <motion.span key={objective.met ? "met" : "open"} initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 16 }} className={`mt-[1px] inline-flex w-[18px] h-[18px] shrink-0 items-center justify-center rounded-full ${objective.met ? "bg-white text-[#047857]" : "border-2 border-[#93C5FD]"}`}>
            {objective.met ? <Check size={12} strokeWidth={3.5} /> : <span className="w-1.5 h-1.5 rounded-full bg-[#93C5FD]" />}
          </motion.span>
          <span className="min-w-0">
            {objective.tag && <span className={`mr-1.5 font-extrabold ${objective.met ? "text-[#D1FAE5]" : "text-[#93C5FD]"}`}>{objective.tag}</span>}
            {objective.text}
          </span>
        </div>
      )}
      <div className="relative">
      {corner && <div className="absolute right-1.5 top-1.5 z-[2]">{corner}</div>}
      <AnimatePresence>
        {handles.length > 0 && !used && !hintSeen && (
          <motion.div key="hint" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.6 } }} className="pointer-events-none absolute z-[3] left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#0E1424]/85 px-2 py-1 text-[11px] font-bold text-white">
            <Hand size={12} /> Drag the grips on the diagram
          </motion.div>
        )}
      </AnimatePresence>
      {def.animated && !still && (
        <span className="pointer-events-none absolute z-[3] right-14 top-2 inline-flex items-center gap-1 rounded-full bg-[#0E1424]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
        </span>
      )}

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
        {focus && focus.length > 0 && (
          <g aria-hidden>
            <radialGradient id={`${maskId}-g`}>
              <stop offset="0.55" stopColor="black" />
              <stop offset="1" stopColor="white" />
            </radialGradient>
            <mask id={maskId}>
              <rect x={-24} y={-24} width={448} height={288} fill="white" />
              {focus.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={56} fill={`url(#${maskId}-g)`} />
              ))}
            </mask>
            <motion.rect x={-24} y={-24} width={448} height={288} fill="#0B0F19" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ duration: 0.35 }} mask={`url(#${maskId})`} />
          </g>
        )}
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
              data-grip=""
              style={{ cursor: on ? "grabbing" : "grab", touchAction: "none" }}
              onPointerDown={(e) => {
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                e.preventDefault();
                setDrag(i);
                setUsed(true);
                markHintSeen();
              }}
            >
              <circle cx={x} cy={y} r={28} fill="transparent" />
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
        {drag !== null &&
          (() => {
            const h = handles[drag];
            const p = def.params.find((q) => q.key === h.key);
            if (!p) return null;
            const [x, y] = h.at(values, out);
            const val = `${fmt(values[h.key], p.step < 1 ? (p.step < 0.1 ? 2 : 1) : 0)}${p.unit ? ` ${p.unit}` : ""}`;
            const name = p.label.replace(/\s*\(.*\)$/, "").split(",")[0];
            const text = `${name.length > 22 ? name.slice(0, 21) + "…" : name}: ${val}`;
            const w = text.length * 5.6 + 16;
            const bx = Math.min(Math.max(x - w / 2, -20), 420 - w);
            const by = y - 38 < -20 ? y + 18 : y - 38;
            return (
              <g pointerEvents="none">
                <rect x={bx} y={by} width={w} height={20} rx={10} fill="#0E1424" opacity={0.92} />
                <text x={bx + w / 2} y={by + 13.5} fontSize={10} fontWeight={700} fill="#F1F5F9" textAnchor="middle" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace">
                  {text}
                </text>
              </g>
            );
          })()}
      </svg>
      </div>
    </div>
  );
}

/** Longest text a formatted output can show (probed at its own value range is overkill: label + sample). */
function maxLen(def: SimDef, o: SimDef["outputs"][number]): number {
  try {
    const v = def.compute(Object.fromEntries(def.params.map((p) => [p.key, p.default])));
    return String(o.format?.(v[o.key], v, {}) ?? "").length;
  } catch {
    return 0;
  }
}

/** Compact status chips (outputs that carry a tone) shown under the pinned diagram on phones. */
function KeyReadouts({ def, values }: { def: SimDef; values: Vals }) {
  const out = useMemo(() => def.compute(values), [def, values]);
  const keyed = def.outputs.filter((o) => o.tone).slice(0, 2);
  if (!keyed.length) return null;
  return (
    <div className="sm:hidden mt-1.5 flex flex-wrap gap-1.5" aria-hidden>
      {keyed.map((o, i) => {
        const v = out[o.key];
        const tone = o.tone!(v, out, values);
        const txt = tone === "crit" ? "#F87171" : tone === "warn" ? "#FBBF24" : tone === "ok" ? "#34D399" : "#F1F5F9";
        const text = o.format ? o.format(v, out, values) : `${fmt(v, o.digits ?? 2)}${o.unit ? ` ${o.unit}` : ""}`;
        return (
          <span key={`${o.key}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#0E1424] px-2.5 py-1 text-[12px] font-bold readout max-w-full">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: txt }} />
            <span className="text-[#8B97AE] font-semibold truncate">{o.label.replace(/\s*\(.*\)$/, "")}</span>
            <span style={{ color: txt }} className="shrink-0">{text}</span>
          </span>
        );
      })}
    </div>
  );
}

/** Instrument-cluster telemetry strip (always a dark display, in both themes). */
export function Readouts({ def, values }: { def: SimDef; values: Vals }) {
  const out = useMemo(() => def.compute(values), [def, values]);
  return (
    <div className="rounded-2xl bg-[#0E1424] p-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] max-sm:-mx-1.5">
      {def.outputs.map((o, i) => {
        const v = out[o.key];
        const tone = o.tone ? o.tone(v, out, values) : "info";
        const text = o.format ? o.format(v, out, values) : fmt(v, o.digits ?? 2);
        const col = tone === "info" ? "#93C5FD" : toneColor(tone);
        // Text on the dark strip uses lighter tints so warning/critical words stay ≥ AA.
        const txt = tone === "info" ? "#F1F5F9" : tone === "crit" ? "#F87171" : tone === "warn" ? "#FBBF24" : col;
        return (
          <div key={`${o.key}-${i}`} className={`rounded-xl bg-white/[0.04] px-2.5 py-2 min-w-0 ${(def.outputs.length % 2 === 1 && i === def.outputs.length - 1) || (o.format && maxLen(def, o) > 16) ? "max-sm:col-span-2" : ""}`}>
            <div className="text-[11px] text-[#8B97AE] font-semibold leading-tight break-words" title={o.label}>
              {o.label}
            </div>
            <div className="readout text-[14px] font-bold flex items-center gap-1.5 mt-0.5 text-[#F1F5F9] min-w-0">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
              <span className="break-words leading-tight min-w-0" style={{ color: txt }}>
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

export function Controls({ def, values, onChange, disabled, only }: { def: SimDef; values: Vals; onChange: (v: Vals) => void; disabled?: boolean; only?: string[] }) {
  return (
    <div className="space-y-3">
      {def.params.map((p, k) => {
        if (only && !only.includes(p.key)) return null;
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

/**
 * Full interactive sim: diorama + telemetry + controls. On phones the diagram stays pinned under the
 * header while the controls scroll beneath it, so the effect of every change stays in view. Parameters
 * with an on-canvas grip are driven by the grip; their sliders live in a collapsed "Fine-tune" row.
 */
export function SimView({ def, values, onChange, overlay, disabled, objective, corner }: { def: SimDef; values: Vals; onChange: (v: Vals) => void; overlay?: ReactNode; disabled?: boolean; objective?: Objective; corner?: ReactNode }) {
  const gripKeys = disabled ? [] : [...new Set((def.handles ?? []).map((h) => h.key))];
  const nonGrip = def.params.map((p) => p.key).filter((k) => !gripKeys.includes(k));
  // One visual, one control: at most two sliders open; the rest (and grip fine-tuning) sit in one row.
  const open = nonGrip.slice(0, 2);
  const more = [...nonGrip.slice(2), ...gripKeys];
  const moreLabel = nonGrip.length > 2 ? `More controls (${more.length})` : `Fine-tune ${gripKeys.length === 1 ? "the grip" : `the ${gripKeys.length} grips`} with sliders`;
  return (
    <div className="space-y-3">
      <div className="max-sm:sticky max-sm:top-[calc(env(safe-area-inset-top)+var(--sim-top,3.5rem))] max-sm:z-10 max-sm:bg-surface max-sm:rounded-b-2xl max-sm:-mx-1 max-sm:px-1 max-sm:pb-1.5 max-sm:shadow-[0_8px_12px_-10px_rgba(15,23,42,0.35)]">
        <SimCanvas def={def} values={values} overlay={overlay} onChange={disabled ? undefined : onChange} objective={objective} corner={corner} />
        {/* Status-bearing readouts ride along with the pinned diagram so the answer never scrolls away. */}
        <KeyReadouts def={def} values={values} />
      </div>
      <Readouts def={def} values={values} />
      {open.length > 0 && (
        <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 shadow-[inset_0_0_0_1px_var(--n-200)] max-sm:-mx-1.5">
          <Controls def={def} values={values} onChange={onChange} disabled={disabled} only={open} />
        </div>
      )}
      {more.length > 0 && (
        <details className="group rounded-2xl bg-slate-50 shadow-[inset_0_0_0_1px_var(--n-200)] max-sm:-mx-1.5">
          <summary className="list-none cursor-pointer select-none min-h-[48px] px-3 sm:px-4 flex items-center justify-between text-[14px] font-semibold text-slate-700">
            <span>{moreLabel}</span>
            <ChevronDown size={18} className="text-slate-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
            <Controls def={def} values={values} onChange={onChange} disabled={disabled} only={more} />
            {def.caption && <p className="sm:hidden text-[13px] text-slate-500 leading-relaxed">{def.caption}</p>}
          </div>
        </details>
      )}
      {def.caption && <p className={`text-[12px] text-slate-500 leading-relaxed ${more.length > 0 ? "max-sm:hidden" : ""}`}>{def.caption}</p>}
    </div>
  );
}
