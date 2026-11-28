/**
 * DESIGN.md §5.6 drawing primitives for redrawn sims (Phase 15.5-v3e). Pure presentational, no hooks.
 *
 * Frame: a redrawn sim draws in `0 0 400 viewH` (viewH ≥ 240, `SimDef.v3.viewH`). The origin and the 400 × 240 box are
 * the legacy frame, so lesson hotspot pins (content, not to be moved) still land on what they explain.
 * Scale: the stage's drawing is 314 px wide on a 390 px phone, so 1 px = 400 / 314 ≈ 1.27 viewBox units and a 14 px
 * label is 18 units (`LBL`). Labels never go below that (`npm run audit:sim` checks).
 */
import type { ReactNode } from "react";
import { FAMILIES, type Family } from "@/components/ds/v3/tokens";

/** viewBox units per CSS px at 390 px wide. */
export const UPP = 400 / 314;
export const px = (n: number) => n * UPP;
/** §5.6 label size (14 px rendered). */
export const LBL = 18;
/** Hero value inside a diagram. */
export const BIG = 26;

export const INK = "var(--text)";
export const INK2 = "var(--text-2)";
export const INK3 = "var(--text-3)";
export const SURFACE = "var(--surface)";
/** Text and lines ON a light fill: fixed in both themes (§5.6). */
export const ON_LIGHT = "#141414";
/** Text and lines ON a deep fill: fixed in both themes. */
export const ON_DEEP = "#FFFFFF";
/** §5.5 neutral greys (rock, metal). */
export const GREYS = { deep: "#5E5E5E", mid: "#9A9A9A", light: "#D9D9D9" } as const;
/** The sim's own unit family (set by the stage's data-family). Fills keep these in dark mode. */
export const U = { light: "var(--u-light)", mid: "var(--u-mid)", deep: "var(--u-deep)", ink: "var(--u-ink)" } as const;
export const OK = "var(--success)";
export const BAD = "var(--danger)";
export const BAD_TEXT = "var(--danger-tint-text)";
export const OK_TEXT = "var(--success-tint-text)";
/** State fills (fixed light values, both themes): success / danger at light and pale strength. Text on them: ON_LIGHT. */
export const OK_LIGHT = "#86EFAC";
export const BAD_LIGHT = "#FCA5A5";
export const BAD_PALE = "#FEE2E2";
/** Rough label width in viewBox units (UI font, ~0.56 em per character). */
export const textW = (s: string, size = LBL) => s.length * size * 0.56;

/** A second hue family's fill tones (fixed hex: fills keep their light values in both themes). Never use for text. */
export function hue(f: Family) {
  const t = FAMILIES[f];
  return { light: t.light, mid: t.mid, deep: t.deep } as const;
}

/** Thin no-break space between number and unit, real minus sign (§3). */
export const NNBSP = " ";
export const num = (v: number, digits: number, unit?: string) => {
  const s = v.toFixed(digits).replace(/^-(?=\d)/, "−");
  return unit ? `${s}${NNBSP}${unit}` : s;
};

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const rad = (d: number) => (d * Math.PI) / 180;

/** §5.6 label: UI font, ≥ 14 px, `--text-2` by default. */
export function T({ x, y, children, fill = INK2, anchor = "start", size = LBL, weight = 600 }: { x: number; y: number; children: ReactNode; fill?: string; anchor?: "start" | "middle" | "end"; size?: number; weight?: number }) {
  return (
    <text x={x} y={y} fontSize={Math.max(size, LBL)} fontWeight={weight} textAnchor={anchor} style={{ fill }}>
      {children}
    </text>
  );
}

/** Straight arrow: 2.5 px shaft, filled head. Kept as <g><line/><polygon/></g> so audit:svg recognises the head. */
export function Arrow({ x1, y1, x2, y2, color = INK, width = 2.5, head = 12, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; head?: number; dash?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - head * 0.8 * Math.cos(a);
  const by = y2 - head * 0.8 * Math.sin(a);
  const h1 = [x2 - head * Math.cos(a - 0.5), y2 - head * Math.sin(a - 0.5)];
  const h2 = [x2 - head * Math.cos(a + 0.5), y2 - head * Math.sin(a + 0.5)];
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} style={{ stroke: color }} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
      <polygon points={`${x2},${y2} ${h1[0]},${h1[1]} ${h2[0]},${h2[1]}`} style={{ fill: color, stroke: color }} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
}

/** Thin axes (1.5 px, `--text-3`) with small arrowheads; no grid. Labels sit outside the plot. */
export function Axes({ x, y, w, h, xlabel, ylabel, xlabelDy = 26 }: { x: number; y: number; w: number; h: number; xlabel?: ReactNode; ylabel?: ReactNode; xlabelDy?: number }) {
  const b = y + h;
  return (
    <g>
      <line x1={x} y1={b} x2={x + w} y2={b} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
      <path d={`M${x + w + 7} ${b} l-9 -4.5 v9 z`} style={{ fill: INK3 }} />
      <line x1={x} y1={b} x2={x} y2={y} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
      <path d={`M${x} ${y - 7} l-4.5 9 h9 z`} style={{ fill: INK3 }} />
      {xlabel && (
        <T x={x + w} y={b + xlabelDy} anchor="end">
          {xlabel}
        </T>
      )}
      {ylabel && (
        <T x={x + 10} y={y - 4}>
          {ylabel}
        </T>
      )}
    </g>
  );
}

/** 8 px point in `--text`; `ring` adds the unit-ink highlight ring. */
export function Dot({ x, y, ring = false, fill = INK }: { x: number; y: number; ring?: boolean; fill?: string }) {
  return (
    <g>
      {ring && <circle cx={x} cy={y} r={px(8)} fill="none" style={{ stroke: U.ink }} strokeWidth={2.5} />}
      <circle cx={x} cy={y} r={px(4)} style={{ fill }} />
    </g>
  );
}

/** Dimension line (1.5 px `--text-3`) with end ticks. The label is placed by the caller. */
export function DimLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const v = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: INK3 }} strokeWidth={1.5} />
      {v ? (
        <>
          <line x1={x1 - 6} x2={x1 + 6} y1={y1} y2={y1} style={{ stroke: INK3 }} strokeWidth={1.5} />
          <line x1={x2 - 6} x2={x2 + 6} y1={y2} y2={y2} style={{ stroke: INK3 }} strokeWidth={1.5} />
        </>
      ) : (
        <>
          <line x1={x1} x2={x1} y1={y1 - 6} y2={y1 + 6} style={{ stroke: INK3 }} strokeWidth={1.5} />
          <line x1={x2} x2={x2} y1={y2 - 6} y2={y2 + 6} style={{ stroke: INK3 }} strokeWidth={1.5} />
        </>
      )}
    </g>
  );
}

export function pts(p: [number, number][]): string {
  return p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
}

/** Sample f over [from, to] into screen points. */
export function curve(f: (v: number) => number, from: number, to: number, n: number, sx: (v: number) => number, sy: (v: number) => number): string {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const v = from + ((to - from) * i) / n;
    const y = f(v);
    if (Number.isFinite(y)) out.push([sx(v), sy(y)]);
  }
  return pts(out);
}

/** Linear scale helper. */
export function scale(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

/** The only gradient a redrawn sim may use: a heat ramp where temperature IS the data (§5.6). Marked data-heat. */
export function HeatRamp({ id, vertical = true, stops }: { id: string; vertical?: boolean; stops: [number, string][] }) {
  return (
    <linearGradient id={id} data-heat="" x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
      {stops.map(([o, c]) => (
        <stop key={o} offset={o} stopColor={c} />
      ))}
    </linearGradient>
  );
}
