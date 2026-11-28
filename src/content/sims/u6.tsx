import type { SimDef } from "@/lib/types";
import { T, textW, OK, INK, INK3, ON_LIGHT, ON_DEEP, GREYS, U, BAD, OK_TEXT, BAD_TEXT, OK_LIGHT, BAD_LIGHT, BAD_PALE, Arrow, pts, num, clamp, LBL } from "@/components/sim/v3";
import { SvgTex } from "@/components/sim/Tex";

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
  // §5.6d redraw (v3.2): goaf edge x 330 and seam y 175 are the legacy ones (lesson hotspots).
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
    // main-roof thickness drawn 14 + 1.6 t, capped so the label above it stays inside the 24-unit inset
    const tt = clamp(14 + p.t * 1.6, 14, 42);
    const rubbleTop = seamY - imm;
    const roofFill = o.state === 2 ? BAD_LIGHT : o.state === 1 ? U.mid : U.light;
    return (
      <g>
        <defs>
          <clipPath id="u6-goaf-clip">
            <rect x={0} y={0} width={400} height={240} rx={12} />
          </clipPath>
        </defs>
        <g clipPath="url(#u6-goaf-clip)">
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
            data-state={o.state === 2 ? "unsafe" : "safe"}
            d={`M ${edge} ${roofY} Q ${(edge + gx) / 2} ${roofY + sag} ${gx} ${roofY + sag * 0.5} L ${gx} ${roofY - tt + sag * 0.5} L ${edge} ${roofY - tt} Z`}
            style={{ fill: roofFill, stroke: INK }}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {/* goaf-edge supports */}
          <rect x={edge - 6} y={seamY - sh} width={6} height={sh} rx={2} style={{ fill: INK }} />
          {o.state === 2 && (
            <g data-state="unsafe">
              {[0, 1].map((i) => (
                <Arrow key={i} x1={edge - 44} y1={seamY - 6 - i * 12} x2={edge + 38} y2={seamY - 6 - i * 12} color={BAD} />
              ))}
            </g>
          )}
        </g>
        <T x={376} y={Math.max(roofY - tt - 12, 40)} anchor="end">
          Main roof
        </T>
        <T x={24} y={208} fill={ON_LIGHT} weight={700}>
          {o.state === 2 ? "Goaf: air blast" : "Goaf"}
        </T>
        <T x={322} y={208} anchor="end" fill={ON_LIGHT} weight={700}>
          Props
        </T>
        <T x={376} y={208} anchor="end" fill={ON_LIGHT} weight={700}>
          Solid
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
  // §5.6d v3.2 redraw: face x 250 and seam y 150 are the legacy ones (lesson hotspots).
  v3: { viewH: 240 },
  render: (p, o, t) => {
    const seamY = 150;
    const sh = p.m * 12;
    const faceX = 250;
    // stress profile kept inside the 24-unit inset (peak y ≈ 27)
    const base = 66;
    const curve: [number, number][] = [];
    for (let x = 24; x <= 376; x += 4) {
      const d = x - faceX;
      const val = d > 0 ? 1 + 1.8 * Math.exp(-Math.pow((d - 8) / 22, 2)) : 0.2 + 0.6 * Math.exp(d / 40) + 1.2 * Math.exp(-Math.pow((d + 60) / 25, 2)) * 0.6;
      curve.push([x, base - val * 14]);
    }
    const over = o.util > 1;
    const dr = Math.min(sh / 2 - 2, 18);
    const x = faceX - 70;
    const cy = seamY - sh / 2;
    return (
      <g>
        <defs>
          <clipPath id="u6lw-clip">
            <rect x={0} y={0} width={400} height={240} rx={12} />
          </clipPath>
        </defs>
        {/* strata context: host rock (immediate roof), seam ahead of the face, caved goaf behind, floor */}
        <g clipPath="url(#u6lw-clip)">
          <rect x={0} y={base} width={400} height={seamY - sh - base} fill={GREYS.light} />
          <rect x={0} y={seamY - sh} width={faceX} height={sh} fill={GREYS.light} />
          <rect x={faceX} y={seamY - sh} width={150} height={sh} fill={GREYS.deep} />
          <rect x={0} y={seamY} width={400} height={90} fill={GREYS.light} />
          {Array.from({ length: 15 }).map((_, i) => (
            <polygon key={i} points={`${i * 12},${seamY} ${i * 12 + 6},${seamY - sh * 0.8} ${i * 12 + 12},${seamY}`} fill={GREYS.mid} />
          ))}
        </g>
        {/* vertical stress profile */}
        <polygon points={pts([[24, base], ...curve, [376, base]])} style={{ fill: U.light }} />
        <polyline points={pts(curve)} fill="none" style={{ stroke: U.deep }} strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={24} x2={376} y1={base - 14} y2={base - 14} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="4 5" />
        <SvgTex x={376} y={base - 24} tex="\sigma_v\ \text{virgin}" size={LBL} anchor="end" color="var(--text-2)" />
        <T x={faceX - 12} y={44} anchor="end">
          Front abutment
        </T>
        {/* powered shield (canopy turns red when the rating is exceeded) */}
        <g data-state={over ? "unsafe" : "safe"}>
          <rect x={x} y={seamY - sh} width={62} height={8} rx={2} style={{ fill: over ? BAD : U.mid, stroke: INK }} strokeWidth={2.5} />
        </g>
        <line x1={x + 16} y1={seamY - sh + 8} x2={x + 22} y2={seamY - 7} style={{ stroke: ON_LIGHT }} strokeWidth={4} strokeLinecap="round" />
        <line x1={x + 44} y1={seamY - sh + 8} x2={x + 38} y2={seamY - 7} style={{ stroke: ON_LIGHT }} strokeWidth={4} strokeLinecap="round" />
        <line x1={x} y1={seamY - sh + 4} x2={x - 18} y2={seamY - 10} style={{ stroke: ON_LIGHT }} strokeWidth={3} strokeLinecap="round" />
        <rect x={x + 4} y={seamY - 7} width={56} height={7} rx={2} fill={GREYS.deep} />
        {/* AFC and shearer drum */}
        <rect x={faceX - 8} y={seamY - 8} width={14} height={8} rx={2} fill={GREYS.deep} />
        <g transform={`rotate(${((t * 220) % 360).toFixed(0)} ${faceX - 4} ${cy})`}>
          <circle cx={faceX - 4} cy={cy} r={dr} fill={GREYS.mid} style={{ stroke: INK3 }} strokeWidth={1.5} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d={`M${faceX - 4} ${cy - dr - 4} l3 5 h-6 z`} style={{ fill: INK }} transform={`rotate(${a} ${faceX - 4} ${cy})`} />
          ))}
        </g>
        {/* part labels in the floor band (66 units tall) */}
        <T x={36} y={184} fill={ON_LIGHT} weight={700}>
          Goaf
        </T>
        <T x={x + 31} y={184} anchor="middle" fill={ON_LIGHT} weight={700}>
          Shield
        </T>
        <T x={faceX + 12} y={184} fill={ON_LIGHT} weight={700}>
          Shearer
        </T>
        <T x={faceX + 12} y={206} fill={ON_LIGHT} weight={700}>
          and AFC
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
  // §5.6 redraw (v3.2): the vein's centre line through (200, 120) is the legacy one (lesson hotspots); the mill-feed bar sits on the (307, 208) pin.
  primary: ["D", "gd"],
  v3: { viewH: 250 },
  handles: [{ key: "W", axis: "x", at: (p) => [200 + (p.W * 9) / 2, 120], toValue: (x) => (2 * (x - 200)) / 9 }],
  render: (p, o) => {
    const k = 9;
    const cx = 200;
    const dip = 0.55; // slope of vein (dx per dy)
    const top = 36;
    const bot = 190;
    const half = (p.W * k) / 2;
    const ov = p.elos * k;
    const xAt = (y: number) => cx + (y - 120) * dip;
    const vein = pts([[xAt(top) - half, top], [xAt(top) + half, top], [xAt(bot) + half, bot], [xAt(bot) - half, bot]]);
    const slough = pts([[xAt(top) - half - ov * 0.7, top + 16], [xAt(top) - half, top + 16], [xAt(bot) - half, bot - 16], [xAt(bot) - half - ov * 0.7, bot - 16]]);
    const fw = pts([[xAt(top) + half, top + 16], [xAt(top) + half + ov * 0.3, top + 16], [xAt(bot) + half + ov * 0.3, bot - 16], [xAt(bot) + half, bot - 16]]);
    const hwFits = xAt(top) - half - ov * 0.7 - 12 - textW("Hanging wall") > 28;
    const yL = 146;
    const slL = xAt(yL) - half - ov * 0.7;
    const barX = 262;
    const barW = 90;
    const oreW = barW * (1 - o.D / 100);
    const st = o.ok ? "met" : "unmet";
    return (
      <g>
        <clipPath id="u6-stope-clip">
          <rect x={0} y={0} width={400} height={250} rx={12} />
        </clipPath>
        <g clipPath="url(#u6-stope-clip)">
          <rect x={0} y={0} width={400} height={250} fill={GREYS.light} />
        </g>
        <polygon points={slough} fill={GREYS.mid} />
        <polygon points={fw} fill={GREYS.mid} />
        <polygon points={vein} style={{ fill: U.mid, stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" />
        <T x={28} y={hwFits ? 50 : 222} fill={ON_LIGHT}>
          Hanging wall
        </T>
        <T x={266} y={50} fill={ON_LIGHT}>
          Footwall
        </T>
        <line x1={slL - 12} y1={yL - 6} x2={slL + Math.min(4, ov * 0.35)} y2={yL - 6} style={{ stroke: GREYS.deep }} strokeWidth={1.5} strokeLinecap="round" />
        <T x={slL - 16} y={yL} anchor="end" fill={ON_LIGHT}>
          ELOS
        </T>
        <T x={barX - 8} y={217} anchor="end" fill={ON_LIGHT}>
          Mill feed
        </T>
        <g data-state={st}>
          <rect x={barX} y={202} width={barW} height={16} rx={3} fill={GREYS.mid} />
          <rect x={barX} y={202} width={oreW} height={16} rx={3} style={{ fill: U.mid }} />
          <rect x={barX} y={202} width={barW} height={16} rx={3} fill="none" style={{ stroke: o.ok ? OK : BAD }} strokeWidth={2.5} />
        </g>
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
