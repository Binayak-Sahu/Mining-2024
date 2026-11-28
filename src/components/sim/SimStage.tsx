"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { motion } from "framer-motion";
import { Hand } from "lucide-react";
import type { SimDef, SimParam, Vals } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import { tactilePress, fadeQuick } from "@/lib/motion";
import { familyOf } from "@/lib/family";
import { num } from "./v3";

function snap(p: SimParam, v: number): number {
  const s = Math.round((v - p.min) / p.step) * p.step + p.min;
  return +Math.min(p.max, Math.max(p.min, s)).toFixed(6);
}

const HINT_KEY = "strata-grip-hint";

/**
 * DESIGN.md §5.6 sim stage for redrawn sims (`def.v3`): the §4 card (2 px edge, 6 px ledge, padding 12; success border
 * when the objective is met), the drawing in `0 0 400 viewH`, and §5.6 grips — a 28 px disc (`--surface` face, 3 px
 * unit-ink ring, 3 px ledge) that grows to 32 px while dragged, a ≥ 44 px hit area, and a value pill while dragging.
 * Grip sizes are CSS pixels whatever the stage width. Drag logic (axis, toValue, snapping, tick sound) is the same as the
 * legacy plate's, so behaviour is unchanged.
 */
export function SimStage({
  def,
  values,
  overlay,
  onChange,
  still = false,
  met = false,
  focus,
  corner,
  thumb = false,
  t = 0,
  after,
}: {
  def: SimDef;
  values: Vals;
  overlay?: ReactNode;
  onChange?: (v: Vals) => void;
  still?: boolean;
  met?: boolean;
  focus?: [number, number][];
  corner?: ReactNode;
  thumb?: boolean;
  t?: number;
  after?: ReactNode;
}) {
  const viewH = def.v3!.viewH;
  const maskId = `focus-${useId().replace(/:/g, "")}`;
  const out = useMemo(() => def.compute(values), [def, values]);
  const svg = useRef<SVGSVGElement>(null);
  const [upp, setUpp] = useState(400 / 314);
  const [drag, setDrag] = useState<number | null>(null);
  const [used, setUsed] = useState(false);
  const [hintSeen, setHintSeen] = useState(true);
  useEffect(() => {
    try {
      setHintSeen(localStorage.getItem(HINT_KEY) === "1");
    } catch {
      setHintSeen(false);
    }
  }, []);
  const handles = onChange && !still ? (def.handles ?? []) : [];

  useLayoutEffect(() => {
    const el = svg.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setUpp(400 / w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Chrome ignores touch-action on SVG children: a touch that starts on a grip claims the gesture (no page scroll mid-drag).
  useEffect(() => {
    const el = svg.current;
    if (!el || !handles.length) return;
    const claim = (e: TouchEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-grip]")) e.preventDefault();
    };
    el.addEventListener("touchstart", claim, { passive: false });
    return () => el.removeEventListener("touchstart", claim);
  }, [handles.length]);

  const move = (e: RPointerEvent) => {
    if (drag === null || !onChange) return;
    const h = handles[drag];
    const p = def.params.find((q) => q.key === h.key);
    const m = svg.current?.getScreenCTM();
    if (!p || !m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const raw = h.toValue(h.axis === "x" ? pt.x : pt.y, values);
    if (!Number.isFinite(raw)) return;
    const v = snap(p, raw);
    if (v !== values[h.key]) {
      sfx.tick();
      onChange({ ...values, [h.key]: v });
    }
  };
  const P = (n: number) => n * upp;

  return (
    <div>
      <div className="sim-stage relative" data-family={familyOf(def.id)} data-met={met} data-sim={def.id} {...(thumb ? { "data-thumb": "" } : {})}>
        {corner && <div className="absolute right-3 top-3 z-[2]">{corner}</div>}
        <svg
          ref={svg}
          viewBox={`0 0 400 ${viewH}`}
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
                <rect x={-12} y={-12} width={424} height={viewH + 24} fill="white" />
                {focus.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={56} fill={`url(#${maskId}-g)`} />
                ))}
              </mask>
              <motion.rect x={-12} y={-12} width={424} height={viewH + 24} fill="#141414" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ duration: 0.35 }} mask={`url(#${maskId})`} />
            </g>
          )}
          {overlay}
          {handles.map((h, i) => {
            const [x, y] = h.at(values, out);
            const on = drag === i;
            const p = def.params.find((q) => q.key === h.key);
            return (
              <g
                key={`${h.key}-${i}`}
                data-grip=""
                role="slider"
                aria-label={`Drag to change ${p?.label ?? h.key}`}
                aria-valuenow={values[h.key]}
                aria-valuemin={p?.min}
                aria-valuemax={p?.max}
                style={{ cursor: on ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(e) => {
                  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                  e.preventDefault();
                  setDrag(i);
                  setUsed(true);
                  try {
                    localStorage.setItem(HINT_KEY, "1");
                  } catch {
                    /* private mode */
                  }
                }}
              >
                <circle cx={x} cy={y} r={P(22)} fill="transparent" />
                <motion.g initial={false} animate={{ scale: on ? 32 / 28 : 1 }} transition={tactilePress} style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}>
                  <circle cx={x} cy={y + P(3)} r={P(14)} style={{ fill: "var(--u-ink)" }} />
                  <circle cx={x} cy={y} r={P(12.5)} style={{ fill: "var(--surface)", stroke: "var(--u-ink)" }} strokeWidth={P(3)} />
                </motion.g>
              </g>
            );
          })}
          {drag !== null &&
            (() => {
              const h = handles[drag];
              const p = def.params.find((q) => q.key === h.key);
              if (!p) return null;
              const [x, y] = h.at(values, out);
              const name = p.label.replace(/\s*\(.*\)$/, "").split(",")[0];
              const text = `${name.length > 22 ? name.slice(0, 21) + "…" : name}: ${num(values[h.key], p.step < 1 ? (p.step < 0.1 ? 2 : 1) : 0, p.unit)}`;
              const fs = P(14);
              const w = text.length * fs * 0.56 + P(24);
              const hh = P(28);
              const bx = Math.min(Math.max(x - w / 2, 0), 400 - w);
              const by = y - P(26) - hh < 0 ? y + P(26) : y - P(26) - hh;
              return (
                <g pointerEvents="none" data-pill="">
                  <rect x={bx} y={by} width={w} height={hh} rx={hh / 2} style={{ fill: "var(--text)" }} />
                  <text x={bx + w / 2} y={by + hh / 2 + fs * 0.36} fontSize={fs} fontWeight={700} textAnchor="middle" style={{ fill: "var(--bg)" }}>
                    {text}
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>
      {handles.length > 0 && !hintSeen && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: used ? 0 : 1 }} transition={fadeQuick} className="t-label text-fg-2 flex items-center gap-2 mt-2" style={{ fontWeight: 400 }} aria-hidden={used}>
          <Hand size={16} aria-hidden /> Drag the grips on the diagram
        </motion.p>
      )}
      {after}
    </div>
  );
}
