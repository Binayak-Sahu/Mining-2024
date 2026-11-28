"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
export { AnimatedNumber };
import { Hand, Target, ChevronDown } from "lucide-react";
import type { SimDef, SimParam, Vals } from "@/lib/types";
import { fmt } from "@/lib/calc";
import { sfx } from "@/lib/sfx";
import { Slider } from "@/components/ui/Slider";
import { toneText } from "@/components/ui/tone";
import { tactilePress, fadeQuick } from "@/lib/motion";
import { NNBSP, tx, withUnit } from "@/lib/typo";
import { SimStage } from "./SimStage";

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


const HINT_KEY = "strata-grip-hint";
function markHintSeen() {
  try {
    localStorage.setItem(HINT_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** A live objective: one line above the plate (§5.9); the line turns success-tint and the plate gets its met ring. */
export interface Objective {
  text: string;
  met: boolean;
  /** e.g. "Challenge 2/3" (Sim Lab only; lessons show the text alone) */
  tag?: string;
}

/** §5.9 objective line: lucide Target 18 px + `label` text, `success` tint text while met. */
export function ObjectiveLine({ objective }: { objective: Objective }) {
  return (
    <div className={`flex items-start gap-2 t-label transition-colors duration-300 ${objective.met ? "text-success-tint-text" : "text-fg"}`} role="status" aria-live="polite" data-met={objective.met}>
      <motion.span key={objective.met ? "met" : "open"} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={tactilePress} className="mt-[1px] shrink-0 inline-flex" aria-hidden>
        <Target size={18} strokeWidth={2.4} />
      </motion.span>
      <span className="min-w-0">
        {objective.tag && <span className="mr-1.5" style={{ fontWeight: 800 }}>{objective.tag}</span>}
        {objective.text}
        {objective.met && <span className="sr-only"> (met)</span>}
      </span>
    </div>
  );
}

/** Daylight "diorama plate" with the sim render, optional overlay and draggable direct-manipulation grips. */

type CanvasProps = { def: SimDef; values: Vals; overlay?: ReactNode; onChange?: (v: Vals) => void; still?: boolean; objective?: Objective; focus?: [number, number][]; corner?: ReactNode; noObjectiveLine?: boolean; /** Codex thumbnail: a §5.6 sim hides its labels (data-thumb). */ thumb?: boolean };

/** Sim drawing: redrawn sims (`def.v3`) use the §5.6 stage, the rest the legacy plate. */
export function SimCanvas(props: CanvasProps) {
  return props.def.v3 ? <V3Canvas {...props} /> : <LegacyCanvas {...props} />;
}

function V3Canvas({ def, values, overlay, onChange, still = false, objective, focus, corner, noObjectiveLine = false, thumb = false }: CanvasProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el || still || !def.animated || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [still, def.animated]);
  const t = useClock(!!def.animated && !still && onScreen);
  const stage = (
    <div ref={wrap}>
      <SimStage def={def} values={values} overlay={overlay} onChange={onChange} still={still} met={!!objective?.met} focus={focus} corner={corner} thumb={thumb} t={t} />
    </div>
  );
  if (!objective || noObjectiveLine) return stage;
  return (
    <div className="space-y-3">
      <ObjectiveLine objective={objective} />
      {stage}
    </div>
  );
}

function LegacyCanvas({ def, values, overlay, onChange, still = false, objective, focus, corner, noObjectiveLine = false }: CanvasProps) {
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

  const plate = (
    <div ref={wrap} className={`plate ${still ? "" : "max-sm:-mx-1.5"} ${objective?.met ? "plate-met" : ""}`}>
      <div className="relative">
      {corner && <div className="absolute right-1.5 top-1.5 z-[2]">{corner}</div>}

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
            <motion.rect x={-24} y={-24} width={448} height={288} fill="#141414" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ duration: 0.35 }} mask={`url(#${maskId})`} />
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
                <rect x={bx} y={by} width={w} height={20} rx={10} fill="#141414" opacity={0.92} />
                <text x={bx + w / 2} y={by + 13.5} fontSize={10} fontWeight={700} fill="#F5F5F5" textAnchor="middle" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace">
                  {text}
                </text>
              </g>
            );
          })()}
      </svg>
      </div>
    </div>
  );
  // One-time grip tutorial, under the plate so it never covers the diagram. It fades after the first drag but keeps its
  // line until the stage changes, so nothing below it moves mid-drag (§1.5).
  const hint =
    handles.length > 0 && !hintSeen ? (
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: used ? 0 : 1 }} transition={fadeQuick} className="t-label text-fg-2 flex items-center gap-2 mt-2" style={{ fontWeight: 400 }} aria-hidden={used}>
        <Hand size={16} aria-hidden /> Drag the grips on the diagram
      </motion.p>
    ) : null;
  // Same wrapper whether or not the hint shows: re-parenting the plate would remount the SVG and drop its grip listener.
  if (!objective || noObjectiveLine)
    return (
      <div>
        {plate}
        {hint}
      </div>
    );
  return (
    <div className="space-y-3">
      <ObjectiveLine objective={objective} />
      <div>
        {plate}
        {hint}
      </div>
    </div>
  );
}

/** Output indexes in display order: the sim's optional `primary` keys first (§5.9), then the rest in their own order. */
function readoutOrder(def: SimDef): number[] {
  const first: number[] = [];
  for (const k of def.primary ?? []) {
    const i = def.outputs.findIndex((o, j) => o.key === k && !first.includes(j));
    if (i >= 0) first.push(i);
  }
  return [...first, ...def.outputs.map((_, i) => i).filter((i) => !first.includes(i))];
}

/**
 * Longest text each output can show (formatted word, or number + unit), probed at every parameter's min, default and max one at a
 * time. Used to reserve the value's height so a class name that changes mid-drag never makes the row (and the pinned
 * block on phones) grow: nothing jumps (§1.5).
 */
function longestFormat(def: SimDef): Record<number, string> {
  const base = Object.fromEntries(def.params.map((p) => [p.key, p.default]));
  const probes: Vals[] = [base];
  for (const p of def.params) {
    const vals = p.options ? p.options.map((o) => o.value) : [p.min, p.max];
    for (const x of vals) probes.push({ ...base, [p.key]: x });
  }
  const longest: Record<number, string> = {};
  def.outputs.forEach((o, i) => {
    for (const v of probes) {
      try {
        const out = def.compute(v);
        const t = o.format ? String(o.format(out[o.key], out, v)) : `${fmt(out[o.key], o.digits ?? 2)}${o.unit ? ` ${o.unit}` : ""}`;
        if (t.length > (longest[i]?.length ?? 0)) longest[i] = t;
      } catch {
        /* a probe outside the sim's domain */
      }
    }
  });
  return longest;
}

function ReadoutRow({ o, out, values, ghost }: { o: SimDef["outputs"][number]; out: Vals; values: Vals; ghost?: string }) {
  const v = out[o.key];
  const tone = o.tone ? o.tone(v, out, values) : "info";
  // Word-valued outputs (classes, verdicts) use the UI font: mono is for numbers only (§3). A value that can run past
  // ~18 characters sits on its own line under the label instead of squeezing into the right-hand column.
  const words = !!o.format && /[A-Za-z]{3,}/.test(ghost ?? "");
  const stacked = words && (ghost?.length ?? 0) > 18;
  const valueCls = `${words ? "t-readout !font-sans" : "t-readout"} ${toneText(tone)}`;
  const formatted = o.format ? o.format(v, out, values) : null;
  const value = o.format ? (
    typeof formatted === "string" ? tx(formatted) : formatted
  ) : (
    <span className="whitespace-nowrap">
      <AnimatedNumber value={v} digits={o.digits ?? 2} />
      {o.unit && <span className="text-fg-2" style={{ fontWeight: 400 }}>{NNBSP}{o.unit}</span>}
    </span>
  );
  // An invisible copy of the longest value shares the value's grid cell, so the row is always as tall as its tallest
  // state: a class name that changes mid-drag never makes the page jump (§1.5).
  const cell = (cls: string) => (
    <span className={`grid min-w-0 break-words ${cls} ${valueCls}`}>
      {ghost && (
        <span className={`invisible [grid-area:1/1] ${words ? "" : "whitespace-nowrap"}`} aria-hidden>
          {ghost}
        </span>
      )}
      <span className="[grid-area:1/1]">{value}</span>
    </span>
  );
  if (stacked)
    return (
      <div className="ds-readout-row !flex-col !items-stretch !gap-1">
        <span className="t-label text-fg-2">{o.label}</span>
        {cell("text-left")}
      </div>
    );
  return (
    <div className="ds-readout-row" style={{ alignItems: "baseline" }}>
      <span className="t-label text-fg-2 min-w-0 break-words">{o.label}</span>
      {cell("text-right shrink-0 max-w-[60%]")}
    </div>
  );
}

/**
 * §5.9 readouts: plain rows (label left, mono value right, 1 px dividers). `part="primary"` renders the first 2,
 * `part="rest"` the "All readouts (n)" disclosure with the others; the default renders both.
 */
export function Readouts({ def, values, part }: { def: SimDef; values: Vals; part?: "primary" | "rest" }) {
  const out = useMemo(() => def.compute(values), [def, values]);
  const ghosts = useMemo(() => longestFormat(def), [def]);
  const order = readoutOrder(def);
  const head = order.slice(0, 2);
  const tail = order.slice(2);
  const rows = (ix: number[]) => ix.map((i) => <ReadoutRow key={`${def.outputs[i].key}-${i}`} o={def.outputs[i]} out={out} values={values} ghost={ghosts[i]} />);
  return (
    <>
      {part !== "rest" && <div aria-label="Readouts">{rows(head)}</div>}
      {part !== "primary" && tail.length > 0 && (
        <details className="group">
          <summary className="btn-3d btn-sm tone-ghost list-none cursor-pointer select-none mt-3 [&::-webkit-details-marker]:hidden">
            All readouts ({def.outputs.length})
            <ChevronDown size={18} aria-hidden className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2">{rows(tail)}</div>
        </details>
      )}
    </>
  );
}

export function Controls({ def, values, onChange, disabled, only }: { def: SimDef; values: Vals; onChange: (v: Vals) => void; disabled?: boolean; only?: string[] }) {
  return (
    <div className="space-y-4">
      {def.params.map((p) => {
        if (only && !only.includes(p.key)) return null;
        const display = p.options
          ? (p.options.find((o) => o.value === values[p.key])?.label ?? "")
          : withUnit(fmt(values[p.key], p.step < 1 ? (p.step < 0.1 ? 2 : 1) : 0), p.unit);
        return (
          <div key={p.key}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="t-label text-fg-2 min-w-0">{p.label}</span>
              <span className="t-readout text-fg shrink-0">{display}</span>
            </div>
            {p.options ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {p.options.map((o) => {
                  const on = values[p.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={disabled}
                      data-on={on}
                      onClick={() => onChange({ ...values, [p.key]: o.value })}
                      className="tile-3d min-h-[44px] px-4 py-2 t-label text-fg data-[on=true]:text-action-tint-text"
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Slider value={values[p.key]} min={p.min} max={p.max} step={p.step} label={p.label} display={display} disabled={disabled} onChange={(v) => onChange({ ...values, [p.key]: v })} />
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
    <div className="space-y-4">
      {objective && <ObjectiveLine objective={objective} />}
      {/* Phones: the plate stays pinned under the header while the readouts and controls scroll beneath it. Pinning the
          2 readout rows too left only 200–345 px for the controls on a 390×844 phone. */}
      <div className="max-sm:sticky max-sm:top-[calc(env(safe-area-inset-top)+var(--sim-top,3.5rem))] max-sm:z-10 bg-canvas max-sm:-mx-1 max-sm:px-1 max-sm:py-1">
        <SimCanvas def={def} values={values} overlay={overlay} onChange={disabled ? undefined : onChange} objective={objective} corner={corner} noObjectiveLine />
      </div>
      <div>
        <Readouts def={def} values={values} />
      </div>
      {open.length > 0 && <Controls def={def} values={values} onChange={onChange} disabled={disabled} only={open} />}
      {more.length > 0 && (
        <details className="group">
          <summary className="btn-3d btn-sm tone-ghost list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden">
            {moreLabel}
            <ChevronDown size={18} aria-hidden className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-4 space-y-4">
            <Controls def={def} values={values} onChange={onChange} disabled={disabled} only={more} />
          </div>
        </details>
      )}
      {def.caption && <p className="t-label text-fg-2" style={{ fontWeight: 400 }}>{def.caption}</p>}
    </div>
  );
}
