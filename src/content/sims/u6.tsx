import type { SimDef } from "@/lib/types";
import { T, INK, INK3, ON_LIGHT, ON_DEEP, GREYS, U, BAD, OK_TEXT, BAD_TEXT, OK_LIGHT, BAD_LIGHT, BAD_PALE, Arrow, pts, num, clamp } from "@/components/sim/v3";

/* ---------------- Depillaring goaf & main fall ---------------- */

export function goaf(p: Record<string, number>) {
  const g = 25;
  const Lm = Math.sqrt((2 * p.t * p.st * 1000) / g);
  const Lp = Math.sqrt((p.t * p.st * 1000) / (3 * g));
  const hc = p.m / (1.3 - 1);
  const ratio = p.x / Lm;
  return { Lm, Lp, hc, ratio, state: ratio >= 1 ? 2 : ratio >= 0.6 ? 1 : 0 };
}

export const goafSim: SimDef = {
  id: "u6-goaf",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["state", "Lm"],
  title: "Depillaring goaf — immediate caving, main fall and air blast",
  params: [
    { key: "t", label: "Main roof (sandstone) thickness", min: 5, max: 30, step: 1, unit: "m", default: 10 },
    { key: "st", label: "Main roof tensile strength", min: 1, max: 8, step: 0.5, unit: "MPa", default: 3 },
    { key: "m", label: "Extracted height", min: 2, max: 6, step: 0.5, unit: "m", default: 3 },
    { key: "x", label: "Goaf span (since last fall)", min: 0, max: 100, step: 1, unit: "m", default: 15 },
  ],
  compute: (p) => goaf(p),
  outputs: [
    { key: "Lm", label: "Main-fall span √(2tσt/γ)", unit: "m", digits: 1 },
    { key: "Lp", label: "Periodic weighting √(tσt/3γ)", unit: "m", digits: 1 },
    { key: "hc", label: "Immediate caving height m/(k−1)", unit: "m", digits: 1 },
    { key: "state", label: "Roof state", format: (v) => ["Immediate roof caving normally", "Main roof HANGING — energy building", "MAIN FALL — air blast risk"][v], tone: (v) => (["ok", "warn", "crit"] as const)[v] },
  ],
  caption: "Fixed-end beam (main fall) and cantilever (periodic) spans from beam theory; bulking factor k = 1.3; γ = 25 kN/m³.",
  // §5.6 redraw (v3e): goaf edge x 330 and seam y 175 are the legacy ones (lesson hotspots).
  v3: { viewH: 240 },
  handles: [{ key: "x", axis: "x", at: (p) => [330 - p.x * 2.4, 168], toValue: (x) => (330 - x) / 2.4 }],
  render: (p, o) => {
    const k = 2.4;
    const edge = 330;
    const seamY = 175;
    const sh = p.m * 5;
    const gx = edge - p.x * k;
    const imm = clamp(o.hc * 4, 6, 50);
    const roofY = seamY - sh - imm - 6;
    const sag = o.state === 2 ? 30 : o.ratio * 14;
    const tt = clamp(p.t * 2.2, 10, 60);
    const rubbleTop = seamY - imm;
    const roofFill = o.state === 2 ? BAD_LIGHT : o.state === 1 ? U.mid : U.light;
    return (
      <g>
        <T x={8} y={22}>
          Overlying strata
        </T>
        {/* floor */}
        <rect x={0} y={seamY} width={400} height={65} fill={GREYS.light} />
        {/* old goaf: rubble with fallen main-roof blocks */}
        {Array.from({ length: Math.max(0, Math.ceil(gx / 12)) }).map((_, i) => (
          <polygon key={`o${i}`} points={`${i * 12},${seamY} ${i * 12 + 6},${rubbleTop} ${i * 12 + 12},${seamY}`} fill={GREYS.mid} />
        ))}
        {gx > 20 &&
          [0, 1, 2].map((i) => {
            const bw = Math.min(gx / 3, 60);
            const x = gx - (i + 1) * bw;
            return x > -bw ? <rect key={`b${i}`} x={x} y={rubbleTop - tt} width={bw - 4} height={tt} rx={3} style={{ fill: U.light }} transform={`rotate(${i % 2 ? 6 : -5} ${x + bw / 2} ${rubbleTop - tt / 2})`} /> : null;
          })}
        {/* the current span: immediate roof caved onto the floor */}
        {Array.from({ length: Math.ceil((edge - gx) / 12) }).map((_, i) => (
          <polygon key={i} points={`${gx + i * 12},${seamY} ${gx + i * 12 + 6},${rubbleTop} ${Math.min(gx + i * 12 + 12, edge)},${seamY}`} fill={GREYS.deep} />
        ))}
        {/* solid side: seam, immediate roof, main roof */}
        <rect x={edge} y={seamY - sh} width={400 - edge} height={sh} fill={GREYS.deep} />
        <rect x={edge} y={roofY} width={400 - edge} height={seamY - sh - roofY} fill={GREYS.light} />
        <rect x={edge} y={roofY - tt} width={400 - edge} height={tt} style={{ fill: U.light }} />
        {/* main roof hanging over the span (cantilever), or falling */}
        <path
          className={o.state === 2 ? "shake" : undefined}
          d={`M ${edge} ${roofY} Q ${(edge + gx) / 2} ${roofY + sag} ${gx} ${roofY + sag * 0.5} L ${gx} ${roofY - tt + sag * 0.5} L ${edge} ${roofY - tt} Z`}
          style={{ fill: roofFill, stroke: INK }}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <T x={8} y={Math.max(roofY - tt - 10, 44)} fill={INK} weight={700}>
          {`Main roof ${num(p.t, 0, "m")}`}
        </T>
        {/* goaf-edge supports */}
        <line x1={edge - 3} x2={edge - 3} y1={seamY - sh} y2={seamY} style={{ stroke: INK }} strokeWidth={5} strokeLinecap="round" />
        <T x={365} y={seamY + 24} anchor="middle" fill={ON_LIGHT} weight={700}>
          Solid
        </T>
        {o.state === 2 &&
          [0, 1].map((i) => <Arrow key={i} x1={edge - 30} y1={seamY - 6 - i * 12} x2={edge + 56} y2={seamY - 6 - i * 12} color={BAD} />)}
        {o.state === 2 && (
          <T x={edge - 14} y={seamY + 24} anchor="end" fill={ON_LIGHT} weight={800}>
            Air blast into workings
          </T>
        )}
        <T x={8} y={230} fill={ON_LIGHT} weight={700}>
          {`Span ${num(p.x, 0, "m")} · main fall at ${num(o.Lm, 0, "m")}`}
        </T>
      </g>
    );
  },
};

/* ---------------- Longwall powered support ---------------- */

const RATINGS = [400, 600, 800, 1000, 1200];

export function shield(p: Record<string, number>) {
  const hc = p.m / (p.k - 1);
  const q = 25 * hc;
  const load = q * p.cl * p.sw * p.wf;
  const req = (load * 1.2) / 9.81;
  return { hc, q, load, req, util: req / p.rating };
}

export const longwallSim: SimDef = {
  id: "u6-longwall",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["util", "req"],
  title: "Longwall face — abutment pressure and shield capacity",
  params: [
    { key: "m", label: "Extraction height", min: 1.5, max: 5, step: 0.1, unit: "m", default: 3.5 },
    { key: "k", label: "Goaf bulking factor", min: 1.2, max: 1.5, step: 0.05, default: 1.3 },
    { key: "wf", label: "Periodic weighting factor", min: 1, max: 3, step: 0.1, default: 2 },
    { key: "cl", label: "Canopy + tip-to-face length", min: 3, max: 6, step: 0.1, unit: "m", default: 4.5 },
    { key: "sw", label: "Shield width", min: 1.5, max: 2.05, step: 0.25, default: 1.75, options: [{ value: 1.5, label: "1.50 m" }, { value: 1.75, label: "1.75 m" }, { value: 2.05, label: "2.05 m" }] },
    { key: "rating", label: "Shield yield rating", min: 400, max: 1200, step: 200, default: 600, options: RATINGS.map((r) => ({ value: r, label: `${r} t` })) },
  ],
  compute: (p) => shield(p),
  outputs: [
    { key: "hc", label: "Caving height m/(k−1)", unit: "m", digits: 1 },
    { key: "load", label: "Detached-block load (weighted)", unit: "kN", digits: 0 },
    { key: "req", label: "Required capacity (FOS 1.2)", unit: "t", digits: 0 },
    { key: "util", label: "Rating utilisation", digits: 2, format: (v) => `${(v * 100).toFixed(0)} %`, tone: (v) => (v > 1 ? "crit" : v > 0.9 ? "warn" : "ok") },
  ],
  animated: true,
  // §5.6 redraw (v3e): face x 250 and seam y 150 are the legacy ones (lesson hotspots).
  v3: { viewH: 240 },
  render: (p, o, t) => {
    const seamY = 150;
    const sh = p.m * 12;
    const faceX = 250;
    const curve: [number, number][] = [];
    for (let x = 0; x <= 400; x += 5) {
      const d = x - faceX;
      const val = d > 0 ? 1 + 1.8 * Math.exp(-Math.pow((d - 8) / 22, 2)) : 0.2 + 0.6 * Math.exp(d / 40) + 1.2 * Math.exp(-Math.pow((d + 60) / 25, 2)) * 0.6;
      curve.push([x, 70 - val * 22]);
    }
    const over = o.util > 1;
    const dr = Math.min(sh / 2 - 2, 18);
    const x = faceX - 70;
    return (
      <g>
        <T x={8} y={22}>
          Vertical stress
        </T>
        <line x1={0} x2={400} y1={48} y2={48} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="4 5" />
        <T x={396} y={42} anchor="end">
          Virgin σv
        </T>
        <polygon points={pts([[0, 70], ...curve, [400, 70]])} style={{ fill: U.light }} />
        <polyline points={pts(curve)} fill="none" style={{ stroke: U.deep }} strokeWidth={2.5} strokeLinejoin="round" />
        {/* strata: immediate roof, seam ahead of the face, caved goaf behind, floor */}
        <rect x={0} y={seamY - sh - 34} width={400} height={34} fill={GREYS.light} />
        <rect x={faceX} y={seamY - sh} width={150} height={sh} fill={GREYS.deep} />
        <rect x={0} y={seamY} width={400} height={50} fill={GREYS.light} />
        {Array.from({ length: 15 }).map((_, i) => (
          <polygon key={i} points={`${i * 12},${seamY} ${i * 12 + 6},${seamY - sh * 0.8} ${i * 12 + 12},${seamY}`} fill={GREYS.mid} />
        ))}
        {/* powered shield */}
        <rect x={x} y={seamY - sh} width={62} height={8} rx={2} style={{ fill: over ? BAD : U.mid }} />
        <line x1={x + 16} y1={seamY - sh + 8} x2={x + 22} y2={seamY - 7} style={{ stroke: INK }} strokeWidth={4} strokeLinecap="round" />
        <line x1={x + 44} y1={seamY - sh + 8} x2={x + 38} y2={seamY - 7} style={{ stroke: INK }} strokeWidth={4} strokeLinecap="round" />
        <line x1={x} y1={seamY - sh + 4} x2={x - 18} y2={seamY - 10} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        <rect x={x + 4} y={seamY - 7} width={56} height={7} rx={2} fill={GREYS.deep} />
        {/* AFC and shearer drum */}
        <rect x={faceX - 8} y={seamY - 8} width={14} height={8} rx={2} fill={GREYS.deep} />
        <g transform={`rotate(${((t * 220) % 360).toFixed(0)} ${faceX - 4} ${seamY - sh / 2})`}>
          <circle cx={faceX - 4} cy={seamY - sh / 2} r={dr} fill={GREYS.mid} style={{ stroke: INK }} strokeWidth={2} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d={`M${faceX - 4} ${seamY - sh / 2 - dr - 4} l3 5 h-6 z`} style={{ fill: INK }} transform={`rotate(${a} ${faceX - 4} ${seamY - sh / 2})`} />
          ))}
        </g>
        <T x={262} y={seamY + 22} fill={ON_LIGHT} weight={700}>
          Shearer · AFC
        </T>
        <T x={8} y={230} fill={over ? BAD_TEXT : INK} weight={800}>
          {`Needs ${num(o.req, 0, "t")} · shield ${num(p.rating, 0, "t")} · ${num(o.util * 100, 0, "%")}`}
        </T>
      </g>
    );
  },
};

/* ---------------- Stope dilution ---------------- */

const METHODS = ["Sublevel open stoping", "VCR", "Shrinkage", "Cut-and-fill", "Square-set"];

export function stope(p: Record<string, number>) {
  const D = p.elos / (p.W + p.elos);
  const gd = p.g * (1 - D) + 0.2 * D;
  return { D: D * 100, gd };
}

export const stopeSim: SimDef = {
  id: "u6-stope",
  title: "Metalliferous stope — overbreak (ELOS) and dilution",
  params: [
    { key: "meth", label: "Mining method", min: 0, max: 4, step: 1, default: 0, options: METHODS.map((m, i) => ({ value: i, label: m })) },
    { key: "W", label: "Ore width (true thickness)", min: 1, max: 20, step: 0.1, unit: "m", default: 3 },
    { key: "elos", label: "Overbreak / slough (ELOS)", min: 0, max: 3, step: 0.05, unit: "m", default: 1 },
    { key: "g", label: "In-situ ore grade", min: 2, max: 15, step: 0.5, unit: "g/t", default: 6 },
    { key: "cut", label: "Cut-off grade", min: 1, max: 6, step: 0.1, unit: "g/t", default: 4 },
  ],
  compute: (p) => {
    const r = stope(p);
    return { D: r.D, gd: r.gd, ok: r.gd >= p.cut ? 1 : 0 };
  },
  outputs: [
    { key: "D", label: "Dilution (waste / total)", unit: "%", digits: 1, tone: (v) => (v <= 15 ? "ok" : v <= 30 ? "warn" : "crit") },
    { key: "gd", label: "Diluted head grade (waste 0.2 g/t)", unit: "g/t", digits: 2, tone: (v, o) => (o.ok ? "ok" : "crit") },
    { key: "ok", label: "Above cut-off?", format: (v) => (v ? "Yes — payable" : "No — stope uneconomic"), tone: (v) => (v ? "ok" : "crit") },
  ],
  caption: "Typical ELOS: open stoping/VCR 0.5–2 m in poor hanging walls; filled methods well under 0.5 m.",
  // §5.6 redraw (v3e): the vein's centre line through (200, 120) is the legacy one (lesson hotspots).
  v3: { viewH: 240 },
  handles: [{ key: "W", axis: "x", at: (p) => [200 + (p.W * 9) / 2, 120], toValue: (x) => (2 * (x - 200)) / 9 }],
  render: (p, o) => {
    const k = 9;
    const cx = 200;
    const dip = 0.55; // slope of vein (dx per dy)
    const top = 44;
    const bot = 200;
    const half = (p.W * k) / 2;
    const ov = p.elos * k;
    const xAt = (y: number) => cx + (y - 120) * dip;
    const vein = pts([[xAt(top) - half, top], [xAt(top) + half, top], [xAt(bot) + half, bot], [xAt(bot) - half, bot]]);
    const slough = pts([[xAt(top) - half - ov * 0.7, top + 16], [xAt(top) - half, top + 16], [xAt(bot) - half, bot - 16], [xAt(bot) - half - ov * 0.7, bot - 16]]);
    const fw = pts([[xAt(top) + half, top + 16], [xAt(top) + half + ov * 0.3, top + 16], [xAt(bot) + half + ov * 0.3, bot - 16], [xAt(bot) + half, bot - 16]]);
    return (
      <g>
        <polygon points={vein} style={{ fill: U.mid }} strokeLinejoin="round" />
        <polygon points={slough} fill={BAD_LIGHT} />
        <polygon points={fw} fill={BAD_PALE} />
        {p.meth >= 3 &&
          [0, 1, 2].map((i) => {
            const y = top + 36 + i * 42;
            return <line key={i} x1={xAt(y) - half} y1={y} x2={xAt(y) + half} y2={y} stroke={ON_DEEP} strokeWidth={2} strokeDasharray={p.meth === 4 ? "3 3" : undefined} />;
          })}
        <T x={8} y={24} weight={700}>
          Hanging-wall slough
        </T>
        <T x={392} y={24} anchor="end">
          {METHODS[p.meth]}
        </T>
        <T x={xAt(top) + half + 12} y={top + 14} fill={INK}>
          {`Ore ${num(p.W, 1, "m")}`}
        </T>
        <T x={392} y={232} anchor="end" fill={o.ok ? OK_TEXT : BAD_TEXT} weight={800}>
          {`Dilution ${num(o.D, 0, "%")} → ${num(o.gd, 2, "g/t")}`}
        </T>
      </g>
    );
  },
};

/* ---------------- Block caving draw ellipsoids ---------------- */

export function draw(p: Record<string, number>) {
  const b = p.h * Math.sqrt(1 - p.e * p.e);
  const interact = p.s <= b ? 1 : 0;
  const left = interact ? 0 : (1 - b / p.s) * 100;
  return { b, interact, left, vol: (Math.PI * p.h * b * b) / 6 };
}

export const caveSim: SimDef = {
  id: "u6-cave",
  title: "Block caving — draw ellipsoids and drawpoint spacing",
  params: [
    { key: "h", label: "Height of draw", min: 20, max: 300, step: 5, unit: "m", default: 100 },
    { key: "e", label: "Ellipsoid eccentricity", min: 0.9, max: 0.99, step: 0.01, default: 0.95 },
    { key: "s", label: "Drawpoint spacing", min: 5, max: 40, step: 1, unit: "m", default: 15 },
  ],
  compute: (p) => draw(p),
  outputs: [
    { key: "b", label: "Isolated draw-zone width b = h√(1−e²)", unit: "m", digits: 1 },
    { key: "interact", label: "Draw behaviour", format: (v) => (v ? "Interactive — uniform lowering" : "Isolated — ore left between"), tone: (v) => (v ? "ok" : "crit") },
    { key: "left", label: "Ore stranded between zones (approx.)", unit: "%", digits: 0, tone: (v) => (v > 0 ? "crit" : "ok") },
    { key: "vol", label: "Ellipsoid volume / drawpoint", unit: "m³", digits: 0 },
  ],
  animated: true,
  // §5.6 redraw (v3e): extraction level y 210 and the waste band at the top are the legacy ones (lesson hotspots).
  v3: { viewH: 240 },
  handles: [{ key: "h", axis: "y", at: (p) => [200, 210 - p.h * (170 / 300)], toValue: (y) => (210 - y) / (170 / 300) }],
  render: (p, o, t) => {
    const base = 210;
    const kh = 170 / 300;
    const kx = 4;
    const n = Math.max(2, Math.min(9, Math.floor(360 / (p.s * kx))));
    const start = 200 - ((n - 1) * p.s * kx) / 2;
    return (
      <g>
        <T x={8} y={15} fill={INK} weight={700}>
          {`Drawpoints at ${num(p.s, 0, "m")} · IDZ ${num(o.b, 1, "m")}`}
        </T>
        {/* caved ore column, overlying waste, extraction level */}
        <rect x={0} y={40} width={400} height={base - 40} style={{ fill: U.light }} />
        <rect x={0} y={20} width={400} height={20} fill={GREYS.mid} />
        <T x={8} y={36} fill={ON_LIGHT} weight={600}>
          Overlying waste
        </T>
        <rect x={0} y={base} width={400} height={30} fill={GREYS.deep} />
        <clipPath id="u6-cave-col">
          <rect x={0} y={40} width={400} height={base - 40 + 12} />
        </clipPath>
        {Array.from({ length: n }).map((_, i) => {
          const x = start + i * p.s * kx;
          return (
            <g key={i} clipPath="url(#u6-cave-col)">
              <ellipse cx={x} cy={base - (p.h * kh) / 2} rx={(o.b * kx) / 2} ry={(p.h * kh) / 2} style={{ fill: o.interact ? OK_LIGHT : U.mid, stroke: o.interact ? ON_LIGHT : U.deep }} fillOpacity={0.55} strokeWidth={2} />
              {[0, 1, 2].map((j) => {
                const u = (t * 0.35 + j / 3 + i * 0.13) % 1;
                return <circle key={j} cx={x + Math.sin(j * 2 + i) * (o.b * kx) * 0.2 * (1 - u)} cy={base - p.h * kh * (1 - u)} r={2.5} fill={GREYS.deep} />;
              })}
              <rect x={x - 6} y={base} width={12} height={12} rx={2} fill="#FFFFFF" />
            </g>
          );
        })}
      </g>
    );
  },
};

export const U6_SIMS = [goafSim, longwallSim, stopeSim, caveSim];
