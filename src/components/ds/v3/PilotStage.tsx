"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { SimParam, Vals } from "@/lib/types";
import { ObjectiveLine, Readouts, Controls, defaults } from "@/components/sim/SimView";
import { tactilePress } from "@/lib/motion";
import { familyVars, num, type Theme } from "./tokens";
import { Tex } from "./Tex";
import type { PilotDef } from "./pilots";

function snap(p: SimParam, v: number): number {
  const s = Math.round((v - p.min) / p.step) * p.step + p.min;
  return +Math.min(p.max, Math.max(p.min, s)).toFixed(6);
}

/**
 * §5.6 sim stage for the v3 pilots (sandbox only). Same teaching loop as production SimView — objective line,
 * draggable grips, readouts (2 + "All readouts"), sliders for the other parameters — with the v3 stage card, handles and
 * KaTeX formulas. Grip sizes are set in CSS pixels (28 px disc, 32 px while dragging, 44 px hit area) whatever the scale.
 */
export function PilotStage({ def, theme }: { def: PilotDef; theme: Theme }) {
  const [values, setValues] = useState<Vals>(() => defaults(def, def.start));
  const out = useMemo(() => def.compute(values), [def, values]);
  const met = def.goal ? def.goal.test(values, out) : false;
  const svg = useRef<SVGSVGElement>(null);
  const [upp, setUpp] = useState(400 / 314); // viewBox units per CSS pixel
  const [drag, setDrag] = useState<number | null>(null);
  const handles = def.handles ?? [];

  useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setUpp(400 / w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // a touch that starts on a grip owns the gesture (Chrome ignores touch-action on SVG children)
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const claim = (e: TouchEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-grip]")) e.preventDefault();
    };
    el.addEventListener("touchstart", claim, { passive: false });
    return () => el.removeEventListener("touchstart", claim);
  }, []);

  const move = (e: RPointerEvent) => {
    if (drag === null) return;
    const h = handles[drag];
    const p = def.params.find((q) => q.key === h.key);
    const m = svg.current?.getScreenCTM();
    if (!p || !m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const raw = h.toValue(h.axis === "x" ? pt.x : pt.y, values);
    if (!Number.isFinite(raw)) return;
    const v = snap(p, raw);
    if (v !== values[h.key]) setValues({ ...values, [h.key]: v });
  };

  const gripKeys = [...new Set(handles.map((h) => h.key))];
  const nonGrip = def.params.map((p) => p.key).filter((k) => !gripKeys.includes(k));
  const open = nonGrip.slice(0, 2);
  const more = [...nonGrip.slice(2), ...gripKeys];
  const work = def.work?.(values, out);
  const note = def.note?.(values);
  const px = (n: number) => n * upp;

  return (
    <div className="space-y-4" style={{ ...familyVars(def.family, theme), "--action": familyVars(def.family, theme)["--u-ink"] } as CSSProperties} data-pilot={def.id}>
      {def.goal && <ObjectiveLine objective={{ text: def.goal.text, met }} />}
      <div className="v3-stage" data-met={met}>
        <svg
          ref={svg}
          viewBox={`0 0 400 ${def.viewH}`}
          className="block w-full h-auto select-none"
          style={{ touchAction: drag !== null ? "none" : undefined, overflow: "visible" }}
          role="img"
          aria-label={def.title}
          onPointerMove={move}
          onPointerUp={() => setDrag(null)}
          onPointerCancel={() => setDrag(null)}
        >
          {def.render(values, out, 0)}
          {handles.map((h, i) => {
            const [x, y] = h.at(values, out);
            const on = drag === i;
            const p = def.params.find((q) => q.key === h.key);
            return (
              <g
                key={h.key + i}
                data-grip=""
                role="slider"
                tabIndex={0}
                aria-label={`Drag to change ${p?.label ?? h.key}`}
                aria-valuenow={values[h.key]}
                aria-valuemin={p?.min}
                aria-valuemax={p?.max}
                style={{ cursor: on ? "grabbing" : "grab", touchAction: "none", outline: "none" }}
                onPointerDown={(e) => {
                  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                  e.preventDefault();
                  setDrag(i);
                }}
                onKeyDown={(e) => {
                  if (!p) return;
                  const d = ["ArrowUp", "ArrowRight"].includes(e.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(e.key) ? -1 : 0;
                  if (!d) return;
                  e.preventDefault();
                  setValues({ ...values, [h.key]: snap(p, values[h.key] + d * p.step) });
                }}
              >
                <circle cx={x} cy={y} r={px(22)} fill="transparent" />
                <motion.g initial={false} animate={{ scale: on ? 32 / 28 : 1 }} transition={tactilePress}>
                  <circle cx={x} cy={y + px(3)} r={px(14)} style={{ fill: "var(--u-ink)" }} />
                  <circle cx={x} cy={y} r={px(12.5)} style={{ fill: "var(--surface)", stroke: "var(--u-ink)" }} strokeWidth={px(3)} />
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
              const text = `${name}: ${num(values[h.key], p.step < 1 ? (p.step < 0.1 ? 2 : 1) : 0, p.unit)}`;
              const fs = px(14);
              const w = text.length * fs * 0.56 + px(24);
              const hh = px(28);
              const bx = Math.min(Math.max(x - w / 2, 0), 400 - w);
              const by = y - px(26) - hh < 0 ? y + px(26) : y - px(26) - hh;
              return (
                <g pointerEvents="none">
                  <rect x={bx} y={by} width={w} height={hh} rx={hh / 2} style={{ fill: "var(--text)" }} />
                  <text x={bx + w / 2} y={by + hh / 2 + fs * 0.36} fontSize={fs} fontWeight={700} textAnchor="middle" style={{ fill: "var(--bg)" }}>
                    {text}
                  </text>
                </g>
              );
            })()}
        </svg>
      </div>
      {note && <p className="v3-label" style={{ color: "var(--text-2)", fontWeight: 400 }}>{note}</p>}
      <div>
        <Readouts def={def} values={values} />
      </div>
      {open.length > 0 && <Controls def={def} values={values} onChange={setValues} only={open} />}
      {more.length > 0 && (
        <details className="group">
          <summary className="v3-btn tone-ghost list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden" style={{ height: 44, padding: "0 20px", fontSize: 16 }}>
            {nonGrip.length > 2 ? `More controls (${more.length})` : `Fine-tune ${gripKeys.length === 1 ? "the grip" : `the ${gripKeys.length} grips`} with sliders`}
            <ChevronDown size={18} aria-hidden className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="pt-4">
            <Controls def={def} values={values} onChange={setValues} only={more} />
          </div>
        </details>
      )}
      <div className="space-y-3 pt-2 overflow-x-auto" aria-label="Formulas">
        {def.formulas.map((f) => (
          <figure key={f.tex} className="text-center">
            <Tex tex={f.tex} display className="v3-math block" />
            <figcaption className="v3-label mt-1" style={{ color: "var(--text-2)", fontWeight: 400 }}>
              {f.caption}
            </figcaption>
          </figure>
        ))}
        {work && <Tex tex={work} className="v3-math block text-center" />}
      </div>
    </div>
  );
}
