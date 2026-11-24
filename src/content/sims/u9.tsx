import type { SimDef } from "@/lib/types";
import { C, Txt, Plot, sample, clamp, polyline } from "@/components/sim/svg";
import { erf } from "./u3";

/* ---------------- DCF: NPV, IRR, payback with Indian levies ---------------- */

export function dcf(p: Record<string, number>) {
  const royalty = (p.rev * p.roy) / 100;
  const dmf = royalty * (p.lease ? 0.1 : 0.3);
  const nmet = royalty * 0.02;
  const opex = (p.rev * p.opex) / 100;
  const cf = p.rev - opex - royalty - dmf - nmet;
  const npvAt = (r: number) => {
    let s = -p.capex;
    for (let t = 1; t <= p.life; t++) s += cf / Math.pow(1 + r, t);
    return s;
  };
  const npv = npvAt(p.r / 100);
  let irr = NaN;
  if (npvAt(-0.9) > 0 && npvAt(5) < 0) {
    let lo = -0.9;
    let hi = 5;
    for (let i = 0; i < 80; i++) {
      const m = (lo + hi) / 2;
      if (npvAt(m) > 0) lo = m;
      else hi = m;
    }
    irr = lo * 100;
  }
  let cum = -p.capex;
  let dpb = NaN;
  for (let t = 1; t <= p.life; t++) {
    const d = cf / Math.pow(1 + p.r / 100, t);
    if (cum < 0 && cum + d >= 0) dpb = t - 1 + -cum / d;
    cum += d;
  }
  return { royalty, dmf, nmet, opex, cf, npv, irr, payback: cf > 0 ? p.capex / cf : Infinity, dpb };
}

export const npvSim: SimDef = {
  id: "u9-npv",
  title: "Project DCF — NPV, IRR and payback with royalty, DMF and NMET",
  params: [
    { key: "capex", label: "Initial capital", min: 100, max: 5000, step: 50, unit: "₹ cr", default: 1500 },
    { key: "rev", label: "Annual sales value", min: 100, max: 2000, step: 10, unit: "₹ cr/yr", default: 600 },
    { key: "opex", label: "Operating cost", min: 30, max: 90, step: 1, unit: "% of sales", default: 55 },
    { key: "life", label: "Mine life", min: 5, max: 40, step: 1, unit: "yr", default: 20 },
    { key: "r", label: "Discount rate", min: 6, max: 20, step: 0.5, unit: "%", default: 12 },
    { key: "roy", label: "Royalty (ad valorem)", min: 0, max: 20, step: 0.5, unit: "%", default: 14 },
    { key: "lease", label: "Lease type (DMF)", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Pre-2015 lease: DMF 30 %" }, { value: 1, label: "Auctioned: DMF 10 %" }] },
  ],
  compute: (p) => dcf(p),
  outputs: [
    { key: "cf", label: "Annual cash flow (pre-tax)", unit: "₹ cr", digits: 1 },
    { key: "npv", label: "NPV", unit: "₹ cr", digits: 0, tone: (v) => (v >= 0 ? "ok" : "crit") },
    { key: "irr", label: "IRR", unit: "%", digits: 1, format: (v) => (Number.isFinite(v) ? `${v.toFixed(1)} %` : "—"), tone: (v, _, p) => (v >= p.r ? "ok" : "crit") },
    { key: "payback", label: "Simple payback", unit: "yr", digits: 1 },
    { key: "royalty", label: "Royalty + DMF + NMET", format: (v, o) => `₹${(v + o.dmf + o.nmet).toFixed(1)} cr/yr` },
  ],
  caption: "Pre-tax illustration. DMF = 30 % of royalty for leases granted before 12 Jan 2015 and 10 % for auctioned leases; NMET = 2 % of royalty.",
  render: (p, o) => {
    const years = Math.min(p.life, 40);
    const bw = 340 / (years + 1);
    const zero = 120;
    const k = 90 / Math.max(Math.abs(o.cf) * 1.2, p.capex * 0.25, 1);
    let cum = -p.capex;
    const pts: [number, number][] = [[30 + bw / 2, zero - cum * k * 0.25]];
    for (let t = 1; t <= years; t++) {
      cum += o.cf / Math.pow(1 + p.r / 100, t);
      pts.push([30 + t * bw + bw / 2, zero - cum * k * 0.25]);
    }
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        <line x1={30} x2={370} y1={zero} y2={zero} stroke={C.ink} />
        <rect x={30 + 1} y={zero} width={bw - 2} height={Math.min(p.capex * k, 86)} fill={C.crit} />
        {p.capex * k > 86 && <line x1={28} x2={30 + bw} y1={zero + 80} y2={zero + 74} stroke="white" strokeWidth={3} />}
        {Array.from({ length: years }).map((_, i) => {
          const t = i + 1;
          const h = o.cf * k;
          const hd = (o.cf / Math.pow(1 + p.r / 100, t)) * k;
          return (
            <g key={t}>
              <rect x={30 + t * bw + 1} y={zero - Math.max(h, 0)} width={bw - 2} height={Math.abs(h)} fill="#bfdbfe" />
              <rect x={30 + t * bw + 1} y={zero - Math.max(hd, 0)} width={bw - 2} height={Math.abs(hd)} fill={C.tech} />
            </g>
          );
        })}
        <polyline points={polyline(pts.map(([x, y]) => [x, clamp(y, 5, 235)]))} fill="none" stroke={C.hazard} strokeWidth={2.5} />
        <Txt x={34} y={20} size={9} weight={700} fill={C.slate}>
          light = nominal CF · dark = discounted · amber = cumulative discounted (¼ scale)
        </Txt>
        <Txt x={34} y={228} size={12} weight={900} mono fill={o.npv >= 0 ? C.safe : C.crit}>
          {`NPV ₹${o.npv.toFixed(0)} cr · IRR ${Number.isFinite(o.irr) ? o.irr.toFixed(1) + "%" : "—"}`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Grade–tonnage & cut-off ---------------- */

const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

export function gradeTonnage(mean: number, cv: number, c: number) {
  const s2 = Math.log(1 + cv * cv);
  const s = Math.sqrt(s2);
  const mu = Math.log(mean) - s2 / 2;
  if (c <= 0) return { frac: 1, g: mean };
  const frac = 1 - Phi((Math.log(c) - mu) / s);
  const metalFrac = 1 - Phi((Math.log(c) - mu - s2) / s);
  return { frac, g: frac > 1e-9 ? (mean * metalFrac) / frac : 0 };
}

export function cutoff(p: Record<string, number>) {
  const T = 10; // Mt
  const gt = gradeTonnage(p.mean, p.cv, p.c);
  const tonnes = T * gt.frac;
  const gbe = p.cost / (p.price * p.rec);
  const profit = tonnes * 1e6 * (gt.g * p.price * p.rec - p.cost) / 1e7; // ₹ crore
  return { tonnes, g: gt.g, metal: tonnes * gt.g, gbe, profit };
}

export const cutoffSim: SimDef = {
  id: "u9-cutoff",
  title: "Grade–tonnage curve and break-even cut-off grade",
  params: [
    { key: "mean", label: "Deposit mean grade", min: 0.5, max: 5, step: 0.1, unit: "g/t", default: 1.5 },
    { key: "cv", label: "Grade variability (CV)", min: 0.3, max: 1.5, step: 0.05, default: 0.8 },
    { key: "c", label: "Cut-off grade", min: 0, max: 5, step: 0.05, unit: "g/t", default: 1.5 },
    { key: "price", label: "Metal price", min: 3000, max: 10000, step: 100, unit: "₹/g", default: 6000 },
    { key: "rec", label: "Recovery", min: 0.7, max: 0.98, step: 0.01, default: 0.9 },
    { key: "cost", label: "Mining + processing cost", min: 500, max: 5000, step: 50, unit: "₹/t ore", default: 2500 },
  ],
  compute: (p) => cutoff(p),
  outputs: [
    { key: "tonnes", label: "Ore above cut-off (of 10 Mt)", unit: "Mt", digits: 2 },
    { key: "g", label: "Mean grade above cut-off", unit: "g/t", digits: 2 },
    { key: "metal", label: "Contained metal", unit: "t", digits: 2 },
    { key: "gbe", label: "Break-even cut-off", unit: "g/t", digits: 2 },
    { key: "profit", label: "Undiscounted profit", unit: "₹ cr", digits: 0, tone: (v) => (v >= 0 ? "ok" : "crit") },
  ],
  caption: "Lognormal grade distribution; each tonne above cut-off is mined and processed. Lane's theory raises the cut-off above break-even when the mill (or mine/market) is the bottleneck and time value matters.",
  render: (p, o) => (
    <Plot x={40} y={14} w={320} h={190} xmin={0} xmax={5} ymin={0} ymax={10} xlabel="cut-off grade (g/t)" ylabel="Mt above">
      {(sx, sy) => (
        <g>
          <polyline points={sample((c) => 10 * gradeTonnage(p.mean, p.cv, c).frac, 0, 5, 80, sx, sy)} fill="none" stroke={C.tech} strokeWidth={2.5} />
          <polyline points={sample((c) => Math.min(10, gradeTonnage(p.mean, p.cv, c).g), 0.01, 5, 80, sx, sy)} fill="none" stroke={C.hazard} strokeWidth={2.5} strokeDasharray="6 3" />
          <line x1={sx(o.gbe)} x2={sx(o.gbe)} y1={sy(0)} y2={sy(10)} stroke={C.crit} strokeDasharray="4 3" />
          <Txt x={sx(o.gbe) + 3} y={sy(9.5)} size={8} fill={C.crit} weight={700}>
            break-even
          </Txt>
          <line x1={sx(p.c)} x2={sx(p.c)} y1={sy(0)} y2={sy(10)} stroke={C.ink} strokeWidth={2} />
          <circle cx={sx(p.c)} cy={sy(o.tonnes)} r={5} fill={C.tech} />
          <Txt x={sx(3.2)} y={sy(9.3)} size={8} fill={C.tech} weight={700}>
            — tonnes (Mt)
          </Txt>
          <Txt x={sx(3.2)} y={sy(8.5)} size={8} fill={C.hazard} weight={700}>
            - - grade above c/o (g/t)
          </Txt>
        </g>
      )}
    </Plot>
  ),
};

/* ---------------- Lerchs–Grossmann 2-D ultimate pit ---------------- */

const COLS = 20;
const ROWS = 10;

function blockGrade(r: number, c: number): number {
  // dipping lens + deep rich pod
  const axis = 4 + r * 0.9;
  let g = Math.max(0, 1.6 - Math.abs(c - axis) * 0.45);
  const dr = r - 8.5;
  const dc = c - 13.5;
  g += Math.max(0, 3.2 - Math.sqrt(dr * dr * 1.5 + dc * dc) * 1.1);
  return g;
}

export function lgPit(p: Record<string, number>) {
  const value: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    value.push([]);
    for (let c = 0; c < COLS; c++) {
      const g = blockGrade(r, c);
      const ore = g > 0.3;
      const v = ore ? g * 10 * p.price - 4 - p.mc : -p.mc;
      value[r].push(v);
    }
  }
  // M[d][c] = value of top d blocks in column c
  const M: number[][] = [];
  for (let d = 0; d <= ROWS; d++) {
    M.push([]);
    for (let c = 0; c < COLS; c++) {
      let s = 0;
      for (let r = 0; r < d; r++) s += value[r][c];
      M[d].push(s);
    }
  }
  const NEG = -1e12;
  const P: number[][] = [];
  const from: number[][] = [];
  for (let d = 0; d <= ROWS; d++) {
    P.push(new Array(COLS).fill(NEG));
    from.push(new Array(COLS).fill(-1));
  }
  for (let d = 0; d <= 1; d++) P[d][0] = M[d][0];
  for (let c = 1; c < COLS; c++)
    for (let d = 0; d <= ROWS; d++) {
      for (const dd of [d - 1, d, d + 1]) {
        if (dd < 0 || dd > ROWS || P[dd][c - 1] <= NEG / 2) continue;
        const cand = M[d][c] + P[dd][c - 1];
        if (cand > P[d][c]) {
          P[d][c] = cand;
          from[d][c] = dd;
        }
      }
    }
  const bd = P[1][COLS - 1] > P[0][COLS - 1] ? 1 : 0;
  const best = P[bd][COLS - 1];
  const depth = new Array(COLS).fill(0);
  let d = bd;
  for (let c = COLS - 1; c >= 0; c--) {
    depth[c] = d;
    d = c > 0 ? from[d][c] : 0;
    if (d < 0) d = 0;
  }
  let ore = 0;
  let waste = 0;
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < depth[c]; r++) {
      if (blockGrade(r, c) > 0.3) ore++;
      else waste++;
    }
  return { value: Math.max(best, 0), depth, ore, waste, maxDepth: Math.max(...depth), sr: ore ? waste / ore : 0 };
}

export const pitOptSim: SimDef = {
  id: "u9-pit",
  title: "Lerchs–Grossmann 2-D ultimate pit (45° slopes)",
  params: [
    { key: "price", label: "Metal price factor", min: 0.3, max: 2.5, step: 0.05, default: 1 },
    { key: "mc", label: "Mining cost per block", min: 0.5, max: 3, step: 0.1, default: 1 },
  ],
  compute: (p) => {
    const r = lgPit(p);
    return { value: r.value, ore: r.ore, waste: r.waste, maxDepth: r.maxDepth, sr: r.sr };
  },
  outputs: [
    { key: "value", label: "Pit value (undiscounted)", digits: 1, tone: (v) => (v > 0 ? "ok" : "warn") },
    { key: "ore", label: "Ore blocks", digits: 0 },
    { key: "waste", label: "Waste blocks", digits: 0 },
    { key: "sr", label: "Strip ratio (blocks)", digits: 2 },
    { key: "maxDepth", label: "Pit depth (benches)", digits: 0 },
  ],
  caption: "Exact 2-D dynamic-programming solution: maximises total block value subject to 45° slope precedence. Re-run at each price to get nested pits for pushback design.",
  render: (p) => {
    const r = lgPit(p);
    const cw = 18;
    const x0 = 20;
    const y0 = 30;
    const cells = [];
    for (let row = 0; row < ROWS; row++)
      for (let c = 0; c < COLS; c++) {
        const g = blockGrade(row, c);
        const ore = g > 0.3;
        cells.push(<rect key={`${row}-${c}`} x={x0 + c * cw} y={y0 + row * cw} width={cw - 1} height={cw - 1} fill={ore ? `rgba(217,119,6,${clamp(0.25 + g / 4, 0.25, 1)})` : "#e2e8f0"} />);
      }
    const pts: [number, number][] = [[x0, y0]];
    r.depth.forEach((d, c) => {
      pts.push([x0 + c * cw, y0 + d * cw]);
      pts.push([x0 + (c + 1) * cw, y0 + d * cw]);
    });
    pts.push([x0 + COLS * cw, y0]);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        <Txt x={20} y={20} size={9} weight={700} fill={C.slate}>
          BLOCK MODEL SECTION · amber = ore (darker richer)
        </Txt>
        {cells}
        <polyline points={polyline(pts)} fill="none" stroke={C.crit} strokeWidth={3} />
        <Txt x={20} y={228} size={11} weight={900} mono fill={C.crit}>
          {`optimal pit · ${r.ore} ore / ${r.waste} waste blocks`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Slope radar: inverse velocity ---------------- */

export function inverseVelocity(p: Record<string, number>) {
  const A = 200;
  const tnow = Math.min(p.tnow, p.tf - 1);
  const pts: [number, number][] = [];
  for (let t = 0, i = 0; t <= tnow; t += 2, i++) {
    const v = A / (p.tf - t);
    const noise = 1 + (p.noise / 100) * Math.sin(i * 1.7 + 0.3) * Math.cos(i * 0.9);
    pts.push([t, 1 / (v * noise)]);
  }
  const n = pts.length;
  const mx = pts.reduce((s, q) => s + q[0], 0) / n;
  const my = pts.reduce((s, q) => s + q[1], 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const [x, y] of pts) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) * (x - mx);
  }
  const b = sxx > 0 ? sxy / sxx : 0;
  const a = my - b * mx;
  const tfp = b < 0 ? -a / b : Infinity;
  return { pts, a, b, tfp, err: tfp - p.tf, lead: p.tf - tnow, errPct: (100 * Math.abs(tfp - p.tf)) / p.tf, tnow };
}

export const radarSim: SimDef = {
  id: "u9-radar",
  title: "Slope stability radar — Fukuzono inverse-velocity forecast",
  params: [
    { key: "tf", label: "Actual (unknown) failure time", min: 30, max: 120, step: 1, unit: "h", default: 72 },
    { key: "tnow", label: "Hours of monitoring so far", min: 6, max: 119, step: 1, unit: "h", default: 12 },
    { key: "noise", label: "Measurement noise", min: 0, max: 40, step: 1, unit: "%", default: 25 },
  ],
  compute: (p) => {
    const r = inverseVelocity(p);
    return { tfp: r.tfp, err: r.err, errPct: r.errPct, lead: r.lead };
  },
  outputs: [
    { key: "tfp", label: "Forecast failure time", unit: "h", digits: 1 },
    { key: "errPct", label: "Forecast error", unit: "%", digits: 1, tone: (v) => (v <= 5 ? "ok" : v <= 15 ? "warn" : "crit") },
    { key: "lead", label: "Lead time remaining", unit: "h", digits: 0, tone: (v) => (v >= 12 ? "ok" : "crit") },
  ],
  caption: "For accelerating creep, 1/velocity falls roughly linearly to zero at failure (Fukuzono). Later forecasts are more accurate but leave less time to evacuate — set alarm thresholds, don't wait for certainty.",
  render: (p) => {
    const r = inverseVelocity(p);
    const ymax = Math.max(...r.pts.map((q) => q[1]), 0.4) * 1.1;
    return (
      <Plot x={40} y={14} w={340} h={190} xmin={0} xmax={130} ymin={0} ymax={Math.ceil(ymax * 10) / 10} xlabel="time (h)" ylabel="1/v (h/mm)">
        {(sx, sy) => (
          <g>
            {r.pts.map(([t, y], i) => (
              <circle key={i} cx={sx(t)} cy={sy(y)} r={3} fill={C.tech} />
            ))}
            {Number.isFinite(r.tfp) && <line x1={sx(0)} y1={sy(r.a)} x2={sx(Math.min(r.tfp, 130))} y2={sy(Math.max(0, r.a + r.b * Math.min(r.tfp, 130)))} stroke={C.hazard} strokeWidth={2} strokeDasharray="6 3" />}
            <line x1={sx(p.tf)} x2={sx(p.tf)} y1={sy(0)} y2={sy(ymax)} stroke={C.crit} strokeWidth={1.5} />
            <Txt x={sx(p.tf) + 3} y={sy(ymax) + 12} size={8} fill={C.crit} weight={700}>
              actual failure
            </Txt>
            <line x1={sx(r.tnow)} x2={sx(r.tnow)} y1={sy(0)} y2={sy(ymax)} stroke={C.ink} strokeDasharray="2 2" />
            <Txt x={sx(r.tnow) - 3} y={sy(ymax) + 24} size={8} anchor="end" weight={700}>
              now
            </Txt>
          </g>
        )}
      </Plot>
    );
  },
};

export const U9_SIMS = [npvSim, cutoffSim, pitOptSim, radarSim];
