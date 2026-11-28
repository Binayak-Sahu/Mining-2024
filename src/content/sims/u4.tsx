import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Plot, sample, clamp, Meter } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";
import { OK_LIGHT, BAD_LIGHT, BAD_PALE, LBL, Dot, Axes, curve, scale, BAD, SURFACE } from "@/components/sim/v3";
import { SvgTex } from "@/components/sim/Tex";
import { T, INK, INK2, INK3, ON_LIGHT, GREYS, U, hue } from "@/components/sim/v3";

/* ---------------- Drilling methods ---------------- */

const RIGS = [
  { name: "Top-hammer", d: 0.089, P: 20000 },
  { name: "Down-the-hole", d: 0.115, P: 25000 },
  { name: "Rotary tricone", d: 0.25, P: 150000 },
];

export function penetration(m: number, ucs: number, depth: number): number {
  const r = RIGS[m];
  const A = (Math.PI / 4) * r.d * r.d;
  const eta = m === 0 ? Math.pow(0.9, depth / 3.6) : m === 1 ? 0.85 : 0.8;
  const se = (m === 2 ? 2 + 0.035 * ucs : 1.15) * ucs * 1e6;
  return ((r.P * eta) / (A * se)) * 60;
}

export const drillSim: SimDef = {
  id: "u4-drill",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["th", "pr"],
  title: "Rock drilling — percussive, DTH and rotary penetration",
  params: [
    { key: "m", label: "Drilling method", min: 0, max: 2, step: 1, default: 0, options: RIGS.map((r, i) => ({ value: i, label: `${r.name} ${Math.round(r.d * 1000)} mm` })) },
    { key: "ucs", label: "Rock UCS", min: 20, max: 250, step: 5, unit: "MPa", default: 150 },
    { key: "depth", label: "Hole depth", min: 3, max: 40, step: 0.5, unit: "m", default: 6 },
  ],
  compute: (p) => {
    const th = penetration(0, p.ucs, p.depth);
    const dth = penetration(1, p.ucs, p.depth);
    const rot = penetration(2, p.ucs, p.depth);
    const pr = [th, dth, rot][p.m];
    return { th, dth, rot, pr, time: p.depth / pr, eta: p.m === 0 ? Math.pow(0.9, p.depth / 3.6) : p.m === 1 ? 0.85 : 0.8, rods: Math.ceil(p.depth / 3.6) };
  },
  outputs: [
    { key: "pr", label: "Penetration rate", unit: "m/min", digits: 2 },
    { key: "time", label: "Time to drill hole", unit: "min", digits: 1 },
    { key: "eta", label: "Energy reaching bit", digits: 2, format: (v) => `${(v * 100).toFixed(0)} %`, tone: (v) => (v < 0.6 ? "warn" : "ok") },
    { key: "th", label: "Top-hammer / DTH", format: (v, o) => `${v.toFixed(2)} / ${o.dth.toFixed(2)} m/min`, tone: (v, o) => (v < o.dth ? "warn" : "ok") },
  ],
  caption: "PR = η·P / (A·SE): percussive SE ≈ 1.15·UCS; rotary crushing SE rises faster with strength. Top-hammer loses ~10 % of energy per rod coupling (3.6 m rods).",
  animated: true,
  v3: { viewH: 250 },
  handles: [{ key: "depth", axis: "y", at: (p) => [95, 56 + clamp(p.depth * 3.9, 10, 160)], toValue: (y) => (y - 56) / 3.9 }],
  render: (p, o, t) => {
    const bars = [
      { k: "Top-hammer", v: o.th },
      { k: "DTH", v: o.dth },
      { k: "Rotary", v: o.rot },
    ];
    const max = Math.max(...bars.map((b) => b.v), 0.5);
    const holeTop = 56;
    const holeBot = holeTop + clamp(p.depth * 3.9, 10, 160);
    const rodLen = 3.6 * 3.9;
    const ORG = hue("orange");
    const sw = p.m === 2 ? 5 : 3;
    return (
      <g>
        <clipPath id="u4drill-clip">
          <rect x={12} y={12} width={376} height={226} rx={12} />
        </clipPath>
        <g clipPath="url(#u4drill-clip)">
          <rect x={0} y={holeTop} width={184} height={200} fill={GREYS.light} />
        </g>
        <line x1={24} x2={184} y1={holeTop} y2={holeTop} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={28} y={220} fill={ON_LIGHT}>
          Rock
        </T>
        <rect x={95 - (p.m === 2 ? 8 : 6)} y={holeTop} width={p.m === 2 ? 16 : 12} height={holeBot - holeTop} fill={GREYS.deep} />
        <rect x={84} y={30} width={22} height={22} rx={4} style={{ fill: U.mid, stroke: INK3 }} strokeWidth={1.5} />
        <T x={78} y={46} anchor="end">
          Head
        </T>
        <line x1={95} x2={95} y1={52} y2={holeBot} style={{ stroke: INK }} strokeWidth={sw} strokeLinecap="round" />
        <line x1={95} x2={95} y1={52} y2={holeBot} stroke={GREYS.light} strokeWidth={sw - 1.5} strokeDasharray="3 5" strokeDashoffset={-(t * 40) % 8} />
        {p.m === 0 &&
          Array.from({ length: o.rods - 1 }).map((_, i) => (
            <rect key={i} x={90} y={holeTop + (i + 1) * rodLen - 3} width={10} height={6} rx={1.5} fill={ORG.mid} />
          ))}
        {p.m === 0 && (
          <T x={136} y={52}>
            Joints
          </T>
        )}
        {p.m === 1 && (
          <g>
            <rect x={89} y={holeBot - 26} width={12} height={26} rx={2} fill={ORG.mid} />
            <T x={84} y={holeBot - 6} anchor="end">
              Hammer
            </T>
          </g>
        )}
        {p.m === 2 ? (
          <g transform={`rotate(${((t * 300) % 360).toFixed(0)} 95 ${holeBot})`}>
            <circle cx={95} cy={holeBot} r={10} style={{ fill: GREYS.light, stroke: INK }} strokeWidth={2.5} />
            {[0, 120, 240].map((a) => (
              <circle key={a} cx={95} cy={holeBot - 5} r={2.5} style={{ fill: INK }} transform={`rotate(${a} 95 ${holeBot})`} />
            ))}
          </g>
        ) : (
          <polygon points={`88,${holeBot} 102,${holeBot} 95,${holeBot + 9}`} style={{ fill: GREYS.light, stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
        )}
        <T x={126} y={Math.min(holeBot + 6, 218)} fill={ON_LIGHT}>
          {`${p.depth} m`}
        </T>
        {bars.map((b, i) => {
          const y0 = 44 + i * 42;
          return (
            <g key={b.k}>
              <T x={196} y={y0 - 6} fill={i === p.m ? INK : INK2} weight={i === p.m ? 800 : 600}>
                {b.k}
              </T>
              <rect x={196} y={y0} width={Math.max(3, (180 * b.v) / max)} height={22} rx={4} style={{ fill: i === p.m ? U.deep : U.mid }} />
            </g>
          );
        })}
        <T x={376} y={42} anchor="end">
          m/min
        </T>
        <T x={196} y={176}>
          Energy at bit
        </T>
        <rect x={196} y={190} width={180} height={20} rx={4} style={{ fill: GREYS.light }} />
        <rect x={196} y={190} width={Math.max(3, 180 * o.eta)} height={20} rx={4} style={{ fill: U.deep }} />
      </g>
    );
  },
};

/* ---------------- Explosive oxygen balance & detonation ---------------- */

const ROCKS = [
  { name: "Coal", rho: 1400, cp: 2000 },
  { name: "Sandstone", rho: 2400, cp: 3500 },
  { name: "Granite", rho: 2700, cp: 5500 },
];

export const explosiveSim: SimDef = {
  id: "u4-explosive",
  title: "ANFO thermochemistry — oxygen balance, VOD, pressure, impedance",
  params: [
    { key: "fo", label: "Fuel oil in ANFO", min: 0, max: 12, step: 0.1, unit: "%", default: 3 },
    { key: "d", label: "Hole diameter", min: 25, max: 250, step: 1, unit: "mm", default: 100 },
    { key: "rock", label: "Rock", min: 0, max: 2, step: 1, default: 1, options: ROCKS.map((r, i) => ({ value: i, label: r.name })) },
  ],
  compute: (p) => {
    const ob = 0.2 * (100 - p.fo) - 3.42 * p.fo;
    const ideal = Math.max(1500, 4400 * (1 - 0.5 * Math.pow(ob / 15, 2)));
    const fd = p.d < 40 ? 0 : 1 - 0.6 * Math.pow(40 / p.d, 2);
    const vod = ideal * fd;
    const rho = 850;
    const pd = (rho * vod * vod) / 4 / 1e9;
    const pb = pd / 2;
    const r = ROCKS[p.rock];
    const ze = rho * vod;
    const zr = r.rho * r.cp;
    const tr = vod > 0 ? (4 * ze * zr) / Math.pow(ze + zr, 2) : 0;
    return { ob, vod, pd, pb, ratio: ze / zr, tr: tr * 100, fume: ob > 1 ? 2 : ob < -1 ? 1 : 0 };
  },
  outputs: [
    { key: "ob", label: "Oxygen balance", unit: "%", digits: 2, tone: (v) => (Math.abs(v) <= 1 ? "ok" : "warn") },
    { key: "fume", label: "Fume class", format: (v) => ["Clean: CO₂ + H₂O + N₂", "Fuel-rich → CO (toxic)", "Oxygen-rich → NOx (orange)"][v], tone: (v) => (v === 0 ? "ok" : "crit") },
    { key: "vod", label: "VOD", unit: "m/s", digits: 0, format: (v) => (v > 0 ? `${v.toFixed(0)} m/s` : "FAILS (< critical Ø)"), tone: (v) => (v > 0 ? "info" : "crit") },
    { key: "pd", label: "Detonation pressure", unit: "GPa", digits: 2 },
    { key: "pb", label: "Borehole pressure ≈ PD/2", unit: "GPa", digits: 2 },
    { key: "tr", label: "Energy transmission", unit: "%", digits: 0 },
  ],
  // §5.6 redraw (v3.2): OB bar, borehole, plume and impedance tracks keep the legacy hotspot places.
  v3: { viewH: 250 },
  primary: ["ob", "vod"],
  render: (p, o, t) => {
    const gx = (ob: number) => 36 + ((clamp(ob, -20, 20) + 20) / 40) * 328;
    const AC = hue("orange");
    const hh = clamp(p.d / 5, 6, 32);
    const HX0 = 52;
    const HW = 208;
    const front = o.vod > 0 ? HX0 + ((t * 160) % HW) : HX0;
    const fumeCol = o.fume === 2 ? AC.mid : o.fume === 1 ? GREYS.deep : GREYS.light;
    const mx = gx(o.ob);
    const rock = ROCKS[p.rock];
    return (
      <g>
        {/* oxygen-balance scale: fuel-rich | balanced | oxygen-rich */}
        <rect x={36} y={26} width={gx(-1) - 36} height={40} fill={GREYS.mid} />
        <rect x={gx(-1)} y={26} width={gx(1) - gx(-1)} height={40} style={{ fill: U.light }} />
        <rect x={gx(1)} y={26} width={364 - gx(1)} height={40} fill={AC.light} />
        <T x={44} y={52} fill={ON_LIGHT}>
          Fuel-rich
        </T>
        <T x={356} y={52} anchor="end" fill={ON_LIGHT}>
          Oxygen-rich
        </T>
        <line x1={mx} x2={mx} y1={26} y2={66} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        <polygon points={`${mx},68 ${mx - 7},80 ${mx + 7},80`} style={{ fill: INK }} />
        {/* borehole in host rock */}
        <rect x={40} y={90} width={232} height={40} rx={4} fill={GREYS.light} />
        <rect x={HX0} y={110 - hh / 2} width={HW} height={hh} style={{ fill: U.light, stroke: INK }} strokeWidth={2.5} />
        {o.vod > 0 && <rect x={HX0} y={110 - hh / 2} width={Math.max(front - HX0, 0)} height={hh} fill={AC.mid} />}
        {o.vod > 0 && <line x1={front} x2={front} y1={110 - hh / 2 - 4} y2={110 + hh / 2 + 4} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />}
        <T x={40} y={162}>
          Borehole
        </T>
        {/* post-blast plume */}
        {[0, 1, 2].map((k) => {
          const ph = (t * 0.6 + k / 3) % 1;
          return <circle key={k} cx={323 + Math.sin(ph * 6 + k) * 8} cy={122 - ph * 12} r={5 + ph * 8} fill={fumeCol} opacity={0.4 * (1 - ph)} />;
        })}
        <ellipse cx={323} cy={124} rx={34} ry={20} fill={fumeCol} />
        <T x={376} y={166} anchor="end">
          {`Fumes: ${o.fume === 2 ? "NOx" : o.fume === 1 ? "CO" : "clean"}`}
        </T>
        {/* impedance: explosive vs rock, rock = reference length */}
        <rect x={40} y={180} width={210} height={20} fill={GREYS.light} />
        <rect x={40} y={180} width={clamp(o.ratio * 105, 4, 210)} height={20} style={{ fill: U.mid }} />
        <rect x={40} y={206} width={210} height={20} fill={GREYS.light} />
        <rect x={40} y={206} width={105} height={20} fill={GREYS.deep} />
        <T x={258} y={196}>
          Explosive
        </T>
        <T x={258} y={222}>
          {rock.name}
        </T>
      </g>
    );
  },
  animated: true,
};

/* ---------------- Kuz-Ram fragmentation ---------------- */

const EXPL = [
  { name: "ANFO", rws: 100, rho: 850 },
  { name: "Heavy ANFO", rws: 110, rho: 1100 },
  { name: "Emulsion", rws: 90, rho: 1200 },
];

export function kuzRam(p: Record<string, number>) {
  const e = EXPL[p.ex];
  const J = 0.3 * p.B;
  const T = 0.8 * p.B;
  const L = Math.max(p.Hb + J - T, 0.5);
  const Q = e.rho * (Math.PI / 4) * Math.pow(p.d / 1000, 2) * L;
  const V = p.B * p.S * p.Hb;
  const K = Q / V;
  const x50 = p.A * Math.pow(K, -0.8) * Math.pow(Q, 1 / 6) * Math.pow(115 / e.rws, 19 / 20);
  const n = Math.max(0.5, (2.2 - (14 * p.B) / p.d) * Math.sqrt((1 + p.S / p.B) / 2) * (1 - 0.3 / p.B) * (L / p.Hb));
  const pass = (x: number) => 1 - Math.exp(-0.693 * Math.pow(x / x50, n));
  return { J, T, L, Q, V, K, x50, n, over: 100 * (1 - pass(100)), fines: 100 * pass(5), pass };
}

export const kuzRamSim: SimDef = {
  id: "u4-kuzram",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["K", "over"],
  title: "Kuz-Ram blast optimiser — bench round fragmentation",
  params: [
    { key: "B", label: "Burden B", min: 2, max: 8, step: 0.1, unit: "m", default: 4.5 },
    { key: "S", label: "Spacing S", min: 2, max: 10, step: 0.1, unit: "m", default: 5.5 },
    { key: "d", label: "Hole diameter", min: 76, max: 311, step: 1, unit: "mm", default: 150 },
    { key: "Hb", label: "Bench height", min: 5, max: 20, step: 0.5, unit: "m", default: 10 },
    { key: "A", label: "Rock factor A", min: 4, max: 13, step: 0.5, default: 8 },
    { key: "ex", label: "Explosive", min: 0, max: 2, step: 1, default: 0, options: EXPL.map((e, i) => ({ value: i, label: e.name })) },
  ],
  compute: (p) => {
    const k = kuzRam(p);
    return { K: k.K, Q: k.Q, x50: k.x50, n: k.n, over: k.over, fines: k.fines, SB: p.S / p.B };
  },
  outputs: [
    { key: "K", label: "Powder factor", unit: "kg/m³", digits: 2 },
    { key: "Q", label: "Charge / hole", unit: "kg", digits: 0 },
    { key: "x50", label: "Mean size X50", unit: "cm", digits: 1 },
    { key: "n", label: "Uniformity n", digits: 2, tone: (v) => (v >= 1.2 ? "ok" : "warn") },
    { key: "over", label: "Oversize > 1 m", unit: "%", digits: 1, tone: (v) => (v <= 3 ? "ok" : v <= 8 ? "warn" : "crit") },
    { key: "fines", label: "Fines < 5 cm", unit: "%", digits: 1 },
  ],
  caption: "Stemming 0.8B, sub-drill 0.3B, drilling deviation 0.3 m. X50 = A·K^−0.8·Q^(1/6)·(115/RWS)^(19/20); Rosin–Rammler distribution.",
  // §5.6d redraw: bench section left, size-distribution plot right; hotspot pins keep their legacy features.
  v3: { viewH: 250 },
  handles: [{ key: "Hb", axis: "y", at: (p) => [40, 40 + p.Hb * 6], toValue: (y) => (y - 40) / 6, color: "#3B82F6" }],
  render: (p) => {
    const k = kuzRam(p);
    const sc = 6;
    const top = 40;
    const bot = top + p.Hb * sc;
    const ORANGE = hue("orange");
    const H = 250;
    const sx = scale(0, 150, 236, 376);
    const sy = scale(0, 100, 190, 60);
    const gap = Math.min(p.B * sc * 1.4, 24);
    const holes = [0, 1, 2].map((r) => 78 + r * gap);
    const x50 = clamp(k.x50, 0, 150);
    const ok = k.over <= 3;
    const curveD = curve((x) => 100 * k.pass(Math.max(x, 0.01)), 0, 150, 60, sx, sy);
    const labelRight = sx(x50) < 290;
    return (
      <g>
        <clipPath id="u4kz-clip">
          <rect x={12} y={12} width={376} height={H - 24} rx={12} />
        </clipPath>
        {/* host rock: bench above the floor, base rock below; flat neutral bands */}
        <g clipPath="url(#u4kz-clip)">
          <rect x={0} y={bot} width={220} height={H - bot} fill={GREYS.mid} />
          <polygon points={`24,${bot} 60,${top} 220,${top} 220,${bot}`} fill={GREYS.light} />
        </g>
        <line x1={60} y1={top} x2={220} y2={top} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={24} y1={bot} x2={60} y2={top} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        {holes.map((x, i) => (
          <g key={i}>
            <rect x={x - 5} y={top} width={10} height={k.T * sc} fill={GREYS.deep} />
            <rect x={x - 5} y={top + k.T * sc} width={10} height={k.L * sc} fill={ORANGE.mid} />
            <rect x={x - 5} y={top} width={10} height={(k.T + k.L) * sc} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} />
          </g>
        ))}
        {/* part labels, with leaders to the third hole */}
        <line x1={holes[2] + 7} y1={top + (k.T * sc) / 2} x2={138} y2={top + 26} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={142} y={top + 30} fill={ON_LIGHT}>
          Stemming
        </T>
        <line x1={holes[2] + 7} y1={top + k.T * sc + (k.L * sc) / 2} x2={138} y2={top + 74} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={142} y={top + 78} fill={ON_LIGHT}>
          Charge
        </T>
        {/* size-distribution plot */}
        <T x={236} y={46}>
          % passing
        </T>
        <rect x={sx(100)} y={sy(100)} width={sx(150) - sx(100)} height={sy(0) - sy(100)} data-state={ok ? "met" : "unmet"} fill={ok ? OK_LIGHT : BAD_PALE} />
        <polygon points={`${sx(0)},${sy(0)} ${curveD} ${sx(150)},${sy(0)}`} fill={U.light} opacity={0.6} />
        <line x1={236} y1={190} x2={376} y2={190} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={236} y1={190} x2={236} y2={sy(100)} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={sx(v)} x2={sx(v)} y1={190} y2={195} style={{ stroke: INK3 }} strokeWidth={1.5} />
            <T x={sx(v)} y={216} anchor="middle">
              {String(v)}
            </T>
          </g>
        ))}
        <T x={376} y={216} anchor="end">
          cm
        </T>
        <line x1={sx(100)} x2={sx(100)} y1={sy(0)} y2={sy(100)} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="3 4" />
        <T x={sx(100) - 8} y={sy(12)} anchor="end">
          Oversize
        </T>
        <polyline points={curveD} fill="none" style={{ stroke: U.deep }} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={sx(x50)} x2={sx(x50)} y1={sy(0)} y2={sy(50)} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="3 4" />
        <line x1={236} x2={sx(x50)} y1={sy(50)} y2={sy(50)} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="3 4" />
        <Dot x={sx(x50)} y={sy(50)} ring />
        <SvgTex x={labelRight ? sx(x50) + 8 : sx(x50) - 8} y={labelRight ? sy(50) + 14 : sy(50) - 38} tex="X_{50}" size={LBL} anchor={labelRight ? "start" : "end"} color="var(--text-2)" />
      </g>
    );
  },
};

/* ---------------- Delay sequencing (NONEL) ---------------- */

const ROWS = 3;
const COLS = 6;

export function delayPlan(p: Record<string, number>) {
  const holes: { c: number; r: number; ts: number; td: number; risk: boolean }[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const ts = c * p.th + r * p.tr;
      holes.push({ c, r, ts, td: p.inh + ts, risk: ts > p.inh });
    }
  const tds = holes.map((h) => h.td).sort((a, b) => a - b);
  let maxWin = 1;
  for (let i = 0; i < tds.length; i++) {
    let j = i;
    while (j + 1 < tds.length && tds[j + 1] - tds[i] < 8) j++;
    maxWin = Math.max(maxWin, j - i + 1);
  }
  return { holes, risk: holes.filter((h) => h.risk).length, maxWin, total: tds[tds.length - 1] };
}

export const delaySim: SimDef = {
  id: "u4-delay",
  title: "NONEL firing-wave visualiser — spot the cut-offs",
  animated: true,
  params: [
    { key: "inh", label: "In-hole delay", min: 25, max: 500, step: 1, default: 25, options: [25, 100, 200, 400, 500].map((v) => ({ value: v, label: `${v} ms` })) },
    { key: "th", label: "Surface inter-hole delay", min: 9, max: 67, step: 1, default: 17, options: [9, 17, 25, 42, 67].map((v) => ({ value: v, label: `${v} ms` })) },
    { key: "tr", label: "Surface inter-row delay", min: 17, max: 176, step: 1, default: 42, options: [17, 25, 42, 67, 109, 176].map((v) => ({ value: v, label: `${v} ms` })) },
  ],
  compute: (p) => {
    const d = delayPlan(p);
    return { risk: d.risk, maxWin: d.maxWin, total: d.total };
  },
  outputs: [
    { key: "risk", label: "Holes exposed to cut-off", digits: 0, tone: (v) => (v === 0 ? "ok" : "crit") },
    { key: "maxWin", label: "Max holes within 8 ms", digits: 0, tone: (v) => (v <= 1 ? "ok" : "warn") },
    { key: "total", label: "Total firing time", unit: "ms", digits: 0 },
  ],
  caption: "A hole is exposed to cut-off if its surface signal arrives after the first hole has already detonated (surface time > in-hole delay) — ground movement can sever its tube.",
  v3: { viewH: 290 },
  render: (p, o, t) => {
    const d = delayPlan(p);
    const Tt = d.total + 120;
    const ms = ((t % 4) / 4) * Tt;
    const x = (c: number) => 60 + c * 52;
    const y = (r: number) => 70 + r * 50;
    const H = 290;
    return (
      <g>
        <clipPath id="u4dl-clip">
          <rect x={12} y={12} width={376} height={H - 24} rx={12} />
        </clipPath>
        {/* host rock: the bench top, neutral band */}
        <g clipPath="url(#u4dl-clip)">
          <rect x={12} y={48} width={376} height={152} fill={GREYS.light} />
        </g>
        <T x={24} y={38} fill={INK2}>
          Free face
        </T>
        <line x1={20} y1={48} x2={380} y2={48} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        {/* surface connectors: along each row, and down the first column */}
        {Array.from({ length: ROWS }).map((_, r) => (
          <line key={r} x1={x(0)} x2={x(COLS - 1)} y1={y(r)} y2={y(r)} style={{ stroke: INK3 }} strokeWidth={1.5} />
        ))}
        {Array.from({ length: ROWS - 1 }).map((_, r) => (
          <line key={r} x1={x(0)} x2={x(0)} y1={y(r)} y2={y(r + 1)} style={{ stroke: INK3 }} strokeWidth={1.5} />
        ))}
        {d.holes.map((h) => {
          const signal = ms >= h.ts;
          const fired = ms >= h.td;
          return (
            <g key={`${h.c}-${h.r}`}>
              {fired && ms - h.td < 400 && <circle cx={x(h.c)} cy={y(h.r)} r={10 + (ms - h.td) * 0.09} fill="none" style={{ stroke: U.ink }} strokeWidth={2} opacity={1 - (ms - h.td) / 400} />}
              {h.risk && <circle cx={x(h.c)} cy={y(h.r)} r={14} fill="none" data-state="unmet" style={{ stroke: BAD }} strokeWidth={2} strokeDasharray="4 3" />}
              <circle cx={x(h.c)} cy={y(h.r)} r={6} style={{ fill: fired ? U.deep : signal ? U.mid : SURFACE, stroke: INK }} strokeWidth={2} />
              <T x={x(h.c)} y={y(h.r) + 20} anchor="middle" fill={ON_LIGHT}>
                {String(h.td)}
              </T>
            </g>
          );
        })}
        {/* legend */}
        <circle cx={32} cy={236} r={7} style={{ fill: SURFACE, stroke: INK }} strokeWidth={2} />
        <T x={46} y={242}>
          Waiting
        </T>
        <circle cx={140} cy={236} r={7} style={{ fill: U.mid, stroke: INK }} strokeWidth={2} />
        <T x={154} y={242}>
          Signal in
        </T>
        <circle cx={262} cy={236} r={7} style={{ fill: U.deep, stroke: INK }} strokeWidth={2} />
        <T x={276} y={242}>
          Fired
        </T>
        <circle cx={32} cy={262} r={9} fill="none" data-state="unmet" style={{ stroke: BAD }} strokeWidth={2} strokeDasharray="4 3" />
        <T x={50} y={268}>
          Cut-off risk
        </T>
        <T x={196} y={268}>
          Numbers: ms
        </T>
      </g>
    );
  },
};

/* ---------------- Ground vibration & airblast ---------------- */

const LIMITS = [
  { name: "Domestic / kuccha houses", v: [5, 10, 15] },
  { name: "Industrial buildings", v: [10, 20, 25] },
  { name: "Historical / sensitive", v: [2, 5, 10] },
];

export const vibeSim: SimDef = {
  id: "u4-vibe",
  title: "Scaled distance — PPV, DGMS limits and airblast",
  params: [
    { key: "D", label: "Distance to structure", min: 50, max: 1500, step: 10, unit: "m", default: 300 },
    { key: "Q", label: "Max charge per delay", min: 10, max: 1000, step: 5, unit: "kg", default: 200 },
    { key: "K", label: "Site constant K", min: 200, max: 2000, step: 10, default: 1140 },
    { key: "b", label: "Site exponent b", min: 1.2, max: 2, step: 0.05, default: 1.6 },
    { key: "st", label: "Structure", min: 0, max: 2, step: 1, default: 0, options: LIMITS.map((l, i) => ({ value: i, label: l.name.split(" /")[0].split(" ")[0] })) },
    { key: "f", label: "Dominant frequency", min: 0, max: 2, step: 1, default: 0, options: [{ value: 0, label: "< 8 Hz" }, { value: 1, label: "8–25 Hz" }, { value: 2, label: "> 25 Hz" }] },
  ],
  compute: (p) => {
    const sd = p.D / Math.sqrt(p.Q);
    const ppv = p.K * Math.pow(sd, -p.b);
    const lim = LIMITS[p.st].v[p.f];
    const qmax = Math.pow(p.D / Math.pow(p.K / lim, 1 / p.b), 2);
    const air = 165 - 24 * Math.log10(p.D / Math.cbrt(p.Q));
    return { sd, ppv, lim, qmax, air };
  },
  outputs: [
    { key: "sd", label: "Scaled distance D/√Q", unit: "m/√kg", digits: 1 },
    { key: "ppv", label: "Predicted PPV", unit: "mm/s", digits: 2, tone: (v, o) => (v <= o.lim ? "ok" : "crit") },
    { key: "lim", label: "DGMS permissible", unit: "mm/s", digits: 0 },
    { key: "qmax", label: "Max permissible charge/delay", unit: "kg", digits: 0 },
    { key: "air", label: "Airblast (indicative)", unit: "dB(L)", digits: 0, tone: (v) => (v > 134 ? "warn" : "ok") },
  ],
  caption: "Limits per DGMS Technical Circular 7 of 1997 for structures not belonging to the mine owner. Airblast compared with USBM 134 dB(L) guidance.",
  // §5.6d redraw: same plot frame (x 40–380, y 198 = 0 mm/s, 4.5 units per mm/s) so the lesson pins stay on their features.
  v3: { viewH: 250 },
  handles: [{ key: "D", axis: "x", at: (p, o) => [40 + ((p.D - 50) / 1450) * 340, 198 - (Math.min(o.ppv, 33) / 40) * 180], toValue: (x) => 50 + ((x - 40) / 340) * 1450, color: "#3B82F6" }],
  render: (p, o) => {
    const sx = scale(50, 1500, 40, 380);
    const sy = scale(0, 40, 198, 18);
    const f = (d: number) => p.K * Math.pow(d / Math.sqrt(p.Q), -p.b);
    const d = curve(f, 50, 1500, 80, sx, sy);
    const ok = o.ppv <= o.lim;
    const hx = sx(p.D);
    const hy = Math.max(sy(o.ppv), 46);
    return (
      <g>
        <clipPath id="u4vb-clip">
          <rect x={40} y={46} width={340} height={152} />
        </clipPath>
        {/* host ground under the axis */}
        <rect x={40} y={198} width={340} height={8} fill={GREYS.light} />
        <g clipPath="url(#u4vb-clip)">
          <polygon points={`${sx(50)},${sy(0)} ${d} ${sx(1500)},${sy(0)}`} fill={U.light} opacity={0.6} />
          <polyline points={d} fill="none" style={{ stroke: U.deep }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <Axes x={40} y={18} w={340} h={180} />
        <T x={48} y={38}>
          PPV
        </T>
        {[500, 1000].map((v) => (
          <T key={v} x={sx(v)} y={220} anchor="middle">
            {String(v)}
          </T>
        ))}
        <T x={376} y={220} anchor="end">
          1500 m
        </T>
        {/* 500 m danger zone */}
        <line x1={sx(500)} x2={sx(500)} y1={30} y2={198} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="3 4" />
        <T x={sx(500) + 8} y={70}>
          Danger zone
        </T>
        {/* DGMS permissible limit */}
        <line x1={40} x2={380} y1={sy(o.lim)} y2={sy(o.lim)} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="6 4" />
        <T x={376} y={sy(o.lim) - 8} anchor="end">
          Limit
        </T>
        {/* the structure, at distance D, with its predicted PPV on the curve */}
        <line x1={hx} x2={hx} y1={hy} y2={186} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="3 4" />
        <polygon points={`${hx - 14},186 ${hx},174 ${hx + 14},186`} data-state={ok ? "met" : "unmet"} fill={ok ? OK_LIGHT : BAD_LIGHT} style={{ stroke: INK }} strokeWidth={1.5} strokeLinejoin="round" />
        <rect x={hx - 10} y={186} width={20} height={12} data-state={ok ? "met" : "unmet"} fill={ok ? OK_LIGHT : BAD_LIGHT} style={{ stroke: INK }} strokeWidth={1.5} />
        <Dot x={hx} y={hy} ring />
      </g>
    );
  },
};

export const U4_SIMS = [drillSim, explosiveSim, kuzRamSim, delaySim, vibeSim];
