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

export const SANS = "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, sans-serif";
export const MONO = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, monospace";

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
      fontFamily={mono ? MONO : SANS}
      style={mono ? { fontVariantNumeric: "tabular-nums" } : undefined}
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
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />
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
      <rect x={x} y={y} width={w} height={8} rx={4} fill={C.faint} stroke="rgba(15,23,42,0.08)" />
      <rect x={x} y={y} width={Math.max(w * f, f > 0 ? 8 : 0)} height={8} rx={4} fill={color ?? (over ? C.crit : C.safe)} />
      <rect x={x + 2} y={y + 1.5} width={Math.max(w * f - 4, 0)} height={2} rx={1} fill="white" opacity={0.35} />
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
  side = "right",
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  color?: string;
  offset?: number;
  /** For vertical dimensions: which side of the line the callout sits on (keep it in a margin gutter). */
  side?: "left" | "right";
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  // Callout on a paper pill so it stays legible over any texture.
  const w = label.length * 5.5 + 6;
  const tx = vertical ? (side === "left" ? mx - 5 - offset : mx + 5 + offset) : mx;
  const ty = vertical ? my + 3 : my - 4 + offset;
  const anchor = vertical ? (side === "left" ? "end" : "start") : "middle";
  const bx = anchor === "start" ? tx - 3 : anchor === "end" ? tx - w + 3 : tx - w / 2;
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
      <rect x={bx} y={ty - 9} width={w} height={12} rx={3} fill="#FDFCF9" opacity={0.92} />
      <Txt x={tx} y={ty} size={9} fill={color} anchor={anchor} mono weight={700}>
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
  grips,
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
  /** Axes that carry a draggable grip: their tick values and titles move clear of the grip's track. */
  grips?: "x" | "y" | "xy";
  children: (sx: (v: number) => number, sy: (v: number) => number) => ReactNode;
}) {
  const sx = (v: number) => x + ((v - xmin) / (xmax - xmin)) * w;
  const sy = (v: number) => y + h - ((v - ymin) / (ymax - ymin)) * h;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="white" stroke={C.line} filter="url(#f-shadow)" />
      {[0.25, 0.5, 0.75].map((f) => (
        <g key={f}>
          <line x1={x + w * f} x2={x + w * f} y1={y} y2={y + h} stroke={C.faint} />
          <line x1={x} x2={x + w} y1={y + h * f} y2={y + h * f} stroke={C.faint} />
        </g>
      ))}
      {children(sx, sy)}
      {(() => {
        const gx = grips === "x" || grips === "xy";
        const gy = grips === "y" || grips === "xy";
        const tx = gx ? y + h + 22 : y + h + 10; // x-axis text row (below a grip riding the axis)
        const ty = gy ? x - 13 : x - 3; // y-axis tick column (left of a grip riding the axis)
        return (
          <>
            <Txt x={x} y={tx} size={8} fill={C.slate} mono>
              {xmin}
            </Txt>
            <Txt x={x + w} y={tx} size={8} fill={C.slate} anchor="end" mono>
              {xmax}
            </Txt>
            <Txt x={ty} y={y + h} size={8} fill={C.slate} anchor="end" mono>
              {ymin}
            </Txt>
            <Txt x={ty} y={y + 7} size={8} fill={C.slate} anchor="end" mono>
              {ymax}
            </Txt>
            {xlabel && (
              <Txt x={x + w / 2} y={gx ? tx : y + h + 11} size={8} fill={C.slate} anchor="middle">
                {xlabel}
              </Txt>
            )}
            {ylabel && (
              <Txt x={gy ? x + 14 : x + 3} y={y + 10} size={8} fill={C.slate}>
                {ylabel}
              </Txt>
            )}
          </>
        );
      })()}
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

/** Blue → green → amber → red ramp for stress / temperature heatmaps (f in 0..1). */
export function heatColor(f: number): string {
  const stops: [number, [number, number, number]][] = [
    [0, [59, 130, 246]],
    [0.35, [16, 185, 129]],
    [0.65, [245, 158, 11]],
    [1, [239, 68, 68]],
  ];
  const v = clamp(f, 0, 1);
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [a, ca] = stops[i - 1];
      const [b, cb] = stops[i];
      const t = (v - a) / (b - a);
      const c = ca.map((k, j) => Math.round(lerp(k, cb[j], t)));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return "rgb(239,68,68)";
}

/** Deterministic jagged fracture path from (x, y) heading at `angle` degrees. */
export function crackPath(x: number, y: number, len: number, angle: number, seed = 1): string {
  let px = x;
  let py = y;
  const pts = [`M${px.toFixed(1)} ${py.toFixed(1)}`];
  const n = 6;
  for (let i = 1; i <= n; i++) {
    const jitter = Math.sin(seed * 12.9898 + i * 78.233) * 22;
    const a = rad(angle + jitter);
    px += (len / n) * Math.cos(a);
    py += (len / n) * Math.sin(a);
    pts.push(`L${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Animated fracture network (drawn on mount via CSS stroke-dash animation). */
export function Cracks({ cracks, color = C.crit, width = 1.6 }: { cracks: { x: number; y: number; len: number; angle: number; seed?: number }[]; color?: string; width?: number }) {
  return (
    <g pointerEvents="none">
      {cracks.map((k, i) => (
        <path key={i} d={crackPath(k.x, k.y, k.len, k.angle, k.seed ?? i + 1)} className="crack" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </g>
  );
}

/** Animated dashed streamline (airflow, water, conveyors). `speed` in 0..1 scales the dash speed. */
export function Stream({ d, color = C.air, width = 2, speed = 0.5, opacity = 0.9 }: { d: string; color?: string; width?: number; speed?: number; opacity?: number }) {
  const dur = speed <= 0 ? 0 : 2.4 - 2 * clamp(speed, 0, 1);
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
      className={dur ? "flow" : undefined}
      style={dur ? { animationDuration: `${dur.toFixed(2)}s` } : { strokeDasharray: "6 6" }}
      pointerEvents="none"
    />
  );
}

/** Crisp in-canvas telemetry badge (rounded pill with status dot). */
export function HudBadge({ x, y, label, value, tone = "info", anchor = "start" }: { x: number; y: number; label: string; value: string; tone?: "ok" | "warn" | "crit" | "info"; anchor?: "start" | "end" }) {
  const w = Math.max(54, 6.2 * (label.length + value.length) + 22);
  const bx = anchor === "end" ? x - w : x;
  const col = toneColor(tone);
  return (
    <g pointerEvents="none">
      <rect x={bx} y={y} width={w} height={18} rx={9} fill="#141414" opacity={0.9} />
      <circle cx={bx + 9} cy={y + 9} r={3} fill={col} />
      <text x={bx + 16} y={y + 12.5} fontSize={8} fill="#BDBDBD" fontFamily={SANS} fontWeight={700} letterSpacing={0.4}>
        {label.toUpperCase()}
      </text>
      <text x={bx + w - 8} y={y + 12.5} fontSize={9} fill="#F5F5F5" fontFamily={MONO} fontWeight={700} textAnchor="end">
        {value}
      </text>
    </g>
  );
}
