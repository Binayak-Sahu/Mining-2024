/**
 * Shared SVG primitives for simulation renderers. All sims draw inside a 400 x 240 viewBox.
 * Pure presentational helpers — no hooks — so content modules can use them anywhere.
 */
import type { ReactNode } from "react";

export const C = {
  ink: "#0F172A",
  paper: "#F8FAFC",
  safe: "#10B981",
  hazard: "#F59E0B",
  crit: "#EF4444",
  tech: "#3B82F6",
  slate: "#64748B",
  line: "#CBD5E1",
  faint: "#E2E8F0",
  coal: "#1E293B",
  sand: "#E7D7B1",
  shale: "#A8A29E",
  rock: "#94A3B8",
  water: "#7DD3FC",
  soil: "#B45309",
  ore: "#D97706",
  air: "#38BDF8",
};

export const W = 400;
export const H = 240;

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const rad = (deg: number) => (deg * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

export function Txt({
  x,
  y,
  children,
  size = 10,
  fill = C.ink,
  anchor = "start",
  weight = 500,
  mono = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  mono?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      textAnchor={anchor}
      fontWeight={weight}
      fontFamily={mono ? "ui-monospace, Menlo, monospace" : "Inter, Helvetica, Arial, sans-serif"}
    >
      {children}
    </text>
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = C.tech,
  width = 2,
  head = 6,
  dash,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
  head?: number;
  dash?: string;
}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx1 = x2 - head * Math.cos(a - 0.45);
  const hy1 = y2 - head * Math.sin(a - 0.45);
  const hx2 = x2 - head * Math.cos(a + 0.45);
  const hy2 = y2 - head * Math.sin(a + 0.45);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeDasharray={dash} />
      <polygon points={`${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} />
    </g>
  );
}

/** Horizontal meter bar with a limit marker. */
export function Meter({
  x,
  y,
  w,
  value,
  max,
  limit,
  label,
  color,
}: {
  x: number;
  y: number;
  w: number;
  value: number;
  max: number;
  limit?: number;
  label?: string;
  color?: string;
}) {
  const f = clamp(value / max, 0, 1);
  const over = limit !== undefined && value > limit;
  return (
    <g>
      <rect x={x} y={y} width={w} height={8} rx={4} fill={C.faint} />
      <rect x={x} y={y} width={w * f} height={8} rx={4} fill={color ?? (over ? C.crit : C.safe)} />
      {limit !== undefined && (
        <line x1={x + w * clamp(limit / max, 0, 1)} x2={x + w * clamp(limit / max, 0, 1)} y1={y - 3} y2={y + 11} stroke={C.ink} strokeWidth={1.5} />
      )}
      {label && (
        <Txt x={x} y={y - 4} size={8} fill={C.slate}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** Dimension line with end ticks and centred label. */
export function Dim({
  x1,
  y1,
  x2,
  y2,
  label,
  color = C.slate,
  offset = 0,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  color?: string;
  offset?: number;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} />
      {vertical ? (
        <>
          <line x1={x1 - 3} x2={x1 + 3} y1={y1} y2={y1} stroke={color} />
          <line x1={x2 - 3} x2={x2 + 3} y1={y2} y2={y2} stroke={color} />
        </>
      ) : (
        <>
          <line x1={x1} x2={x1} y1={y1 - 3} y2={y1 + 3} stroke={color} />
          <line x1={x2} x2={x2} y1={y2 - 3} y2={y2 + 3} stroke={color} />
        </>
      )}
      <Txt x={vertical ? mx + 5 + offset : mx} y={vertical ? my + 3 : my - 4 + offset} size={9} fill={color} anchor={vertical ? "start" : "middle"} mono>
        {label}
      </Txt>
    </g>
  );
}

/** Simple x-y plot frame. Returns mapping helpers via render-prop. */
export function Plot({
  x,
  y,
  w,
  h,
  xmin,
  xmax,
  ymin,
  ymax,
  xlabel,
  ylabel,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  xlabel?: string;
  ylabel?: string;
  children: (sx: (v: number) => number, sy: (v: number) => number) => ReactNode;
}) {
  const sx = (v: number) => x + ((v - xmin) / (xmax - xmin)) * w;
  const sy = (v: number) => y + h - ((v - ymin) / (ymax - ymin)) * h;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="white" stroke={C.line} />
      {[0.25, 0.5, 0.75].map((f) => (
        <g key={f}>
          <line x1={x + w * f} x2={x + w * f} y1={y} y2={y + h} stroke={C.faint} />
          <line x1={x} x2={x + w} y1={y + h * f} y2={y + h * f} stroke={C.faint} />
        </g>
      ))}
      {children(sx, sy)}
      <Txt x={x} y={y + h + 10} size={8} fill={C.slate} mono>
        {xmin}
      </Txt>
      <Txt x={x + w} y={y + h + 10} size={8} fill={C.slate} anchor="end" mono>
        {xmax}
      </Txt>
      <Txt x={x - 3} y={y + h} size={8} fill={C.slate} anchor="end" mono>
        {ymin}
      </Txt>
      <Txt x={x - 3} y={y + 7} size={8} fill={C.slate} anchor="end" mono>
        {ymax}
      </Txt>
      {xlabel && (
        <Txt x={x + w / 2} y={y + h + 11} size={8} fill={C.slate} anchor="middle">
          {xlabel}
        </Txt>
      )}
      {ylabel && (
        <Txt x={x + 3} y={y + 10} size={8} fill={C.slate}>
          {ylabel}
        </Txt>
      )}
    </g>
  );
}

export function polyline(points: [number, number][]): string {
  return points.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
}

/** Sample a function into [x, y] screen points. */
export function sample(
  f: (v: number) => number,
  from: number,
  to: number,
  n: number,
  sx: (v: number) => number,
  sy: (v: number) => number,
): string {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const v = from + ((to - from) * i) / n;
    const yv = f(v);
    if (Number.isFinite(yv)) pts.push([sx(v), sy(yv)]);
  }
  return polyline(pts);
}

export function toneColor(t: "ok" | "warn" | "crit" | "info"): string {
  return t === "ok" ? C.safe : t === "warn" ? C.hazard : t === "crit" ? C.crit : C.tech;
}
