"use client";

import { useState } from "react";
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
  const f = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  // Thumb centre travels from 15px to (100% - 15px), matching the native thumb geometry.
  const pos = `calc(${f} * (100% - 30px) + 15px)`;
  const n = Math.round((max - min) / step);
  const ticks = n > 1 && n <= 12 ? Array.from({ length: n + 1 }, (_, i) => i / n) : [];

  return (
    <div className={`slider ${disabled ? "opacity-50" : ""}`} style={{ color }}>
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
