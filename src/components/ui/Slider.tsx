"use client";

import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { tactilePress, feedbackSheet } from "@/lib/motion";

/**
 * Track slider (DESIGN.md 15.5e): a transparent native range input sits on top for keyboard, screen-reader and touch
 * handling; the flat --surface-2 track, `action` fill, ledged --surface thumb and floating value pill are drawn beneath.
 * The thumb is drawn at 28 px but every position and hit-area calculation still uses the 30 px native thumb geometry.
 */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  display,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  display: string;
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
    <div ref={box} className={`slider ${disabled ? "opacity-50" : ""}`}>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: pos }} />
        {ticks.map((t) => (
          <span key={t} className="slider-tick" style={{ left: `calc(${t} * (100% - 30px) + 15px - 2px)` }} />
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
      <motion.div className="slider-thumb" style={{ left: pos }} animate={{ scale: active ? 1.1 : 1 }} transition={tactilePress} />
      <div className="slider-grab" style={{ left: pos }} aria-hidden {...grab} />
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={feedbackSheet}
            className="slider-pill pointer-events-none absolute -top-9 -translate-x-1/2 whitespace-nowrap readout"
            style={{ left: pos }}
          >
            {display}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
