import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, clamp, polyline } from "@/components/sim/svg";

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
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#d6d3d1" />
        <Txt x={10} y={16} size={8} weight={700} fill={C.slate}>
          OVERLYING STRATA
        </Txt>
        {/* old goaf (left of current span): fallen main-roof blocks on rubble */}
        <rect x={0} y={roofY - tt} width={Math.max(gx, 0)} height={seamY - (roofY - tt)} fill="#e7e5e4" />
        {Array.from({ length: Math.max(0, Math.ceil(gx / 10)) }).map((_, i) => (
          <polygon key={`o${i}`} points={`${i * 10},${seamY} ${i * 10 + 5},${rubbleTop} ${i * 10 + 10},${seamY}`} fill="#a8a29e" stroke="#78716c" />
        ))}
        {gx > 20 &&
          [0, 1, 2].map((i) => {
            const bw = Math.min(gx / 3, 60);
            const x = gx - (i + 1) * bw;
            return x > -bw ? <rect key={`b${i}`} x={x} y={rubbleTop - tt} width={bw - 4} height={tt} fill="#a8a29e" stroke={C.ink} transform={`rotate(${i % 2 ? 6 : -5} ${x + bw / 2} ${rubbleTop - tt / 2})`} /> : null;
          })}
        {/* current goaf void beneath the hanging main roof */}
        <rect x={gx} y={roofY} width={edge - gx} height={seamY - roofY} fill="#f8fafc" />
        {Array.from({ length: Math.ceil((edge - gx) / 10) }).map((_, i) => (
          <polygon key={i} points={`${gx + i * 10},${seamY} ${gx + i * 10 + 5},${rubbleTop} ${gx + i * 10 + 10},${seamY}`} fill="#78716c" stroke="#57534e" />
        ))}
        {/* immediate roof and seam over the solid side */}
        <rect x={edge} y={roofY} width={400 - edge} height={seamY - sh - roofY} fill="#cbd5e1" />
        <rect x={edge} y={seamY - sh} width={400 - edge} height={sh} fill={C.coal} />
        <Txt x={edge + 35} y={seamY - sh - 4} size={8} anchor="middle" weight={700}>
          SOLID / PILLARS
        </Txt>
        <Txt x={edge + 35} y={roofY + 12} size={7} anchor="middle" fill={C.slate}>
          immediate roof
        </Txt>
        <rect x={edge} y={roofY - tt} width={400 - edge} height={tt} fill="#a8a29e" stroke={C.ink} />
        {o.state < 2 ? (
          <path d={`M ${edge} ${roofY} Q ${(edge + gx) / 2} ${roofY + sag} ${gx} ${roofY + sag * 0.5} L ${gx} ${roofY - tt + sag * 0.5} L ${edge} ${roofY - tt} Z`} fill={o.state === 1 ? "#fcd34d" : "#a8a29e"} stroke={C.ink} />
        ) : (
          <g>
            <polygon points={polyline([[edge, roofY], [gx, roofY + sag], [gx, roofY + sag - tt], [edge, roofY - tt]])} fill={C.crit} opacity={0.6} stroke={C.ink} />
            {[0, 1, 2].map((i) => (
              <Arrow key={i} x1={edge - 20} y1={seamY - 8 - i * 8} x2={edge + 50} y2={seamY - 8 - i * 8} color={C.crit} width={2.5} />
            ))}
            <Txt x={edge - 10} y={seamY + 22} size={9} weight={800} fill={C.crit} anchor="end">
              AIR BLAST into workings
            </Txt>
          </g>
        )}
        <line x1={edge - 2} x2={edge - 2} y1={seamY - sh} y2={seamY} stroke={C.hazard} strokeWidth={4} />
        <Txt x={edge - 6} y={seamY - sh - 6} size={7} anchor="end" fill={C.hazard} weight={700}>
          goaf-edge supports
        </Txt>
        <rect x={0} y={seamY} width={400} height={65} fill="#a8a29e" />
        <Txt x={edge + 4} y={roofY - tt + 12} size={8} weight={800}>
          {`MAIN ROOF ${p.t} m`}
        </Txt>
        <Txt x={10} y={228} size={9} mono>
          {`span ${p.x} m / main fall at ${o.Lm.toFixed(0)} m`}
        </Txt>
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
  render: (p, o) => {
    const seamY = 150;
    const sh = p.m * 12;
    const faceX = 250;
    const n = 4;
    const curve: [number, number][] = [];
    for (let x = 0; x <= 400; x += 5) {
      const d = x - faceX;
      const val = d > 0 ? 1 + 1.8 * Math.exp(-Math.pow((d - 8) / 22, 2)) + (d > 8 ? 0 : 0) : 0.2 + 0.6 * Math.exp(d / 40) + 1.2 * Math.exp(-Math.pow((d + 60) / 25, 2)) * 0.6;
      curve.push([x, 70 - val * 22]);
    }
    const col = o.util > 1 ? C.crit : o.util > 0.9 ? C.hazard : C.safe;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f1f5f9" />
        <Txt x={10} y={16} size={9} weight={700} fill={C.slate}>
          VERTICAL STRESS ABOVE SEAM (× σv)
        </Txt>
        <line x1={0} x2={400} y1={48} y2={48} stroke={C.line} strokeDasharray="3 3" />
        <Txt x={396} y={45} size={7} anchor="end" fill={C.slate}>
          virgin σv
        </Txt>
        <polyline points={polyline(curve)} fill="none" stroke={C.crit} strokeWidth={2.5} />
        <Txt x={faceX + 18} y={22} size={8} fill={C.crit} weight={700}>
          front abutment
        </Txt>
        <Txt x={120} y={64} size={8} fill={C.slate}>
          goaf (de-stressed, recompacting)
        </Txt>
        <rect x={0} y={seamY - sh - 40} width={400} height={40} fill="#a8a29e" />
        <rect x={faceX} y={seamY - sh} width={150} height={sh} fill={C.coal} />
        <rect x={0} y={seamY} width={400} height={90} fill="#a8a29e" />
        {Array.from({ length: 14 }).map((_, i) => (
          <polygon key={i} points={`${i * 12},${seamY} ${i * 12 + 6},${seamY - sh * 0.8} ${i * 12 + 12},${seamY}`} fill="#78716c" />
        ))}
        {Array.from({ length: n }).map((_, i) => {
          const x = faceX - 70 + i * 2;
          return (
            <g key={i} opacity={i === n - 1 ? 1 : 0.15}>
              <rect x={x} y={seamY - sh} width={62} height={7} fill={col} stroke={C.ink} />
              <line x1={x + 16} y1={seamY - sh + 7} x2={x + 22} y2={seamY - 6} stroke={C.ink} strokeWidth={4} />
              <line x1={x + 40} y1={seamY - sh + 7} x2={x + 34} y2={seamY - 6} stroke={C.ink} strokeWidth={4} />
              <rect x={x + 4} y={seamY - 6} width={56} height={6} fill={C.slate} />
              <line x1={x} y1={seamY - sh + 3} x2={x - 18} y2={seamY - 10} stroke={C.ink} strokeWidth={3} />
            </g>
          );
        })}
        <circle cx={faceX - 4} cy={seamY - sh / 2} r={Math.min(sh / 2 - 2, 18)} fill={C.tech} stroke={C.ink} />
        <rect x={faceX - 12} y={seamY - 10} width={10} height={10} fill={C.hazard} />
        <Txt x={faceX + 4} y={seamY + 14} size={8} weight={700}>
          AFC · shearer drum
        </Txt>
        <rect x={5} y={214} width={300} height={20} rx={4} fill="white" opacity={0.9} />
        <Txt x={10} y={228} size={11} weight={900} mono fill={o.util > 1 ? C.crit : C.ink}>
          {`needs ${o.req.toFixed(0)} t · shield ${p.rating} t · ${(o.util * 100).toFixed(0)}%`}
        </Txt>
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
  render: (p, o) => {
    const k = 9;
    const cx = 200;
    const dip = 0.55; // slope of vein (dx per dy)
    const top = 25;
    const bot = 215;
    const half = (p.W * k) / 2;
    const ov = p.elos * k;
    const xAt = (y: number) => cx + (y - 120) * dip;
    const vein = polyline([[xAt(top) - half, top], [xAt(top) + half, top], [xAt(bot) + half, bot], [xAt(bot) - half, bot]]);
    const slough = polyline([[xAt(top) - half - ov * 0.7, top + 20], [xAt(top) - half, top + 20], [xAt(bot) - half, bot - 20], [xAt(bot) - half - ov * 0.7, bot - 20]]);
    const fw = polyline([[xAt(top) + half, top + 20], [xAt(top) + half + ov * 0.3, top + 20], [xAt(bot) + half + ov * 0.3, bot - 20], [xAt(bot) + half, bot - 20]]);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#d6d3d1" />
        <polygon points={vein} fill={C.ore} />
        <polygon points={slough} fill={C.crit} opacity={0.55} />
        <polygon points={fw} fill={C.crit} opacity={0.35} />
        {p.meth >= 3 &&
          [0, 1, 2, 3].map((i) => <line key={i} x1={xAt(top + 30 + i * 45) - half} y1={top + 30 + i * 45} x2={xAt(top + 30 + i * 45) + half} y2={top + 30 + i * 45} stroke="white" strokeWidth={2} strokeDasharray={p.meth === 4 ? "2 2" : undefined} />)}
        <Txt x={20} y={30} size={9} weight={800} fill={C.crit}>
          hanging-wall slough
        </Txt>
        <Txt x={300} y={225} size={9} weight={800} fill={C.ore}>
          {`ore ${p.W} m`}
        </Txt>
        <Txt x={20} y={210} size={11} weight={900} mono fill={o.ok ? C.safe : C.crit}>
          {`dilution ${o.D.toFixed(0)}% → ${o.gd.toFixed(2)} g/t`}
        </Txt>
        <Txt x={20} y={226} size={8} fill={C.slate}>
          {METHODS[p.meth]}
        </Txt>
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
  render: (p, o) => {
    const base = 210;
    const kh = 170 / 300;
    const kx = 4;
    const n = Math.max(2, Math.min(9, Math.floor(360 / (p.s * kx)) ));
    const start = 200 - ((n - 1) * p.s * kx) / 2;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#fde68a" />
        <rect x={0} y={base} width={400} height={30} fill="#78716c" />
        <Txt x={10} y={16} size={9} weight={700} fill={C.slate}>
          CAVED ORE COLUMN · extraction level below
        </Txt>
        <rect x={0} y={20} width={400} height={14} fill="#a8a29e" opacity={0.7} />
        <Txt x={10} y={31} size={8} fill={C.ink}>
          overlying waste (dilution source)
        </Txt>
        {Array.from({ length: n }).map((_, i) => {
          const x = start + i * p.s * kx;
          return (
            <g key={i}>
              <ellipse cx={x} cy={base - (p.h * kh) / 2} rx={(o.b * kx) / 2} ry={(p.h * kh) / 2} fill={o.interact ? "#10b98155" : "#3b82f655"} stroke={o.interact ? C.safe : C.tech} strokeWidth={1.5} />
              <rect x={x - 5} y={base} width={10} height={14} fill={C.ink} />
            </g>
          );
        })}
        <Txt x={200} y={234} size={9} anchor="middle" weight={800} fill="white">
          {`drawpoints @ ${p.s} m · IDZ width ${o.b.toFixed(1)} m`}
        </Txt>
      </g>
    );
  },
};

export const U6_SIMS = [goafSim, longwallSim, stopeSim, caveSim];
