"use client";

import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Brilliant-style track slider. A transparent native range input sits on top for keyboard, screen-reader
 * and touch handling; the chunky track, gradient fill, 3D thumb and floating value pill are drawn beneath.
 */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  display,
  color = "#3B82F6",
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  display: string;
  color?: string;
  disabled?: boolean;
}) {
  const [active, setActive] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const f = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  // Thumb centre travels from 15px to (100% - 15px), matching the native thumb geometry.
  const pos = `calc(${f} * (100% - 30px) + 15px)`;
  const n = Math.round((max - min) / step);
  const ticks = n > 1 && n <= 12 ? Array.from({ length: n + 1 }, (_, i) => i / n) : [];

  // Thumb grab zone (≥ 44 px, touch-action: none): a drag that starts on the thumb owns the gesture, so a
  // sloppy diagonal thumb drag never turns into a page scroll. The track keeps pan-y, so a vertical swipe
  // that lands on the track still scrolls the page.
  const fromPointer = (e: RPointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width <= 30) return;
    const t = Math.min(1, Math.max(0, (e.clientX - r.left - 15) / (r.width - 30)));
    const raw = min + t * (max - min);
    const snapped = Math.round((raw - min) / step) * step + min;
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
    <div ref={box} className={`slider ${disabled ? "opacity-50" : ""}`} style={{ color }}>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: pos, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
        {ticks.map((t) => (
          <span key={t} className="absolute top-1/2 -mt-[2px] w-1 h-1 rounded-full bg-slate-50/80" style={{ left: `calc(${t} * (100% - 30px) + 15px - 2px)` }} />
        ))}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerCancel={() => setActive(false)}
        onBlur={() => setActive(false)}
      />
      <motion.div className="slider-thumb" style={{ left: pos }} animate={{ scale: active ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 600, damping: 22 }} />
      <div className="slider-grab" style={{ left: pos }} aria-hidden {...grab} />
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
            className="pointer-events-none absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-bold text-white readout shadow-lg"
            style={{ left: pos, background: color }}
          >
            {display}
            <span className="absolute left-1/2 -bottom-1 -ml-1 w-2 h-2 rotate-45" style={{ background: color }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
