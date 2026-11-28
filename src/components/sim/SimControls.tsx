"use client";

import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { tactilePress, feedbackSheet } from "@/lib/motion";

/**
 * DESIGN.md §5.6 v3.2 sim slider: an 8 px pill track (`--surface-2`) filled in the unit face, tick dots only for ≤ 6 steps,
 * a 28 px #F5F5F5 thumb with a 3 px unit-face ring and a 3 px ledge, a 44 px+ hit area and a value bubble above the thumb
 * while dragging. A transparent native range input sits on top for keyboard / screen-reader / touch handling (the only
 * <input type=range> a sim may use). Colours come from the nearest `data-family` (`--u-face`).
 */
export function SimSlider({ value, min, max, step, onChange, label, display, disabled }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string; display: string; disabled?: boolean }) {
  const [active, setActive] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const f = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const pos = `calc(${f} * (100% - 30px) + 15px)`;
  const n = Math.round((max - min) / step);
  const ticks = n > 1 && n <= 6 ? Array.from({ length: n + 1 }, (_, i) => i / n) : [];
  const fromPointer = (e: RPointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width <= 30) return;
    const t = Math.min(1, Math.max(0, (e.clientX - r.left - 15) / (r.width - 30)));
    const snapped = Math.round((min + t * (max - min) - min) / step) * step + min;
    const v = Math.min(max, Math.max(min, +snapped.toFixed(6)));
    if (v !== value) onChange(v);
  };
  const grab = {
    onPointerDown: (e: RPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.preventDefault();
      dragging.current = true;
      setActive(true);
    },
    onPointerMove: (e: RPointerEvent<HTMLDivElement>) => {
      if (dragging.current) fromPointer(e);
    },
    onPointerUp: () => {
      dragging.current = false;
      setActive(false);
    },
    onPointerCancel: () => {
      dragging.current = false;
      setActive(false);
    },
  };
  return (
    <div ref={box} className={`sim-slider ${disabled ? "opacity-50" : ""}`} data-sim-slider="">
      <div className="sim-slider-track">
        <div className="sim-slider-fill" style={{ width: pos }} />
        {ticks.map((t) => (
          <span key={t} className="sim-slider-tick" style={{ left: `calc(${t} * (100% - 30px) + 15px - 2px)` }} />
        ))}
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-label={label} aria-valuetext={display} onChange={(e) => onChange(Number(e.target.value))} onPointerDown={() => setActive(true)} onPointerUp={() => setActive(false)} onPointerCancel={() => setActive(false)} onBlur={() => setActive(false)} />
      <motion.div className="sim-slider-thumb" style={{ left: pos }} animate={{ scale: active ? 1.1 : 1 }} transition={tactilePress} />
      <div className="sim-slider-grab" style={{ left: pos }} aria-hidden {...grab} />
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.9 }} transition={feedbackSheet} className="sim-slider-bubble pointer-events-none absolute -top-9 -translate-x-1/2 whitespace-nowrap" style={{ left: pos }}>
            {display}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * §5.6 v3.2 sim chips: unselected = 2 px `--edge` border; selected = the unit's tab tint with a 2 px unit-face border.
 * No action-blue. The only chip a sim may use.
 */
export function SimChips({ options, value, onChange, disabled, label }: { options: { value: number; label: string }[]; value: number; onChange: (v: number) => void; disabled?: boolean; label: string }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label={label} data-sim-chips="">
      {options.map((o) => (
        <button key={o.value} type="button" disabled={disabled} aria-pressed={value === o.value} data-on={value === o.value} onClick={() => onChange(o.value)} className="sim-chip t-label">
          {o.label}
        </button>
      ))}
    </div>
  );
}
