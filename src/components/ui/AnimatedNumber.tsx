"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { fmt } from "@/lib/calc";
import { stageSlide } from "@/lib/motion";

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
    const c = animate(from, value, { ...stageSlide, onUpdate: (v) => (el.textContent = fmt(v, digits)), onComplete: () => (el.textContent = fmt(value, digits)) });
    return () => c.stop();
  }, [value, digits, reduce]);
  return <span ref={ref}>{fmt(value, digits)}</span>;
}

