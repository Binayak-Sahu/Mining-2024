import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Plot, sample, clamp, polyline } from "@/components/sim/svg";

/* ---------------- Coward's triangle ---------------- */

const TRI: [number, number][] = [
  [5, 19.9],
  [15, 17.9],
  [5.9, 12.2],
];

function inTri(x: number, y: number): boolean {
  const [a, b, c] = TRI;
  const s = (p1: [number, number], p2: [number, number], px: number, py: number) => (px - p2[0]) * (p1[1] - p2[1]) - (p1[0] - p2[0]) * (py - p2[1]);
  const d1 = s(a, b, x, y);
  const d2 = s(b, c, x, y);
  const d3 = s(c, a, x, y);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function segHitsTri(x0: number, y0: number, x1: number, y1: number): boolean {
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    if (inTri(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return true;
  }
  return false;
}

/** 0 not explosive (lean side / inert), 1 explosive, 2 becomes explosive on mixing with air, 3 impossible (above air line). */
export function cowardZone(ch4: number, o2: number): number {
  if (o2 > 20.93 - 0.2093 * ch4 + 0.05) return 3;
  if (inTri(ch4, o2)) return 1;
  if (ch4 > 5 && segHitsTri(ch4, o2, 0, 20.93)) return 2;
  return 0;
}

const ZONES = ["Not explosive", "EXPLOSIVE", "Fuel-rich: explosive if diluted with air", "Impossible (O₂ above air-dilution line)"];

export const cowardSim: SimDef = {
  id: "u7-coward",
  title: "Coward's explosibility triangle — methane in air",
  params: [
    { key: "ch4", label: "Methane CH₄", min: 0, max: 30, step: 0.1, unit: "%", default: 8 },
    { key: "o2", label: "Oxygen O₂", min: 5, max: 21, step: 0.1, unit: "%", default: 18.5 },
  ],
  compute: (p) => ({ zone: cowardZone(p.ch4, p.o2), def: 20.93 - 0.2093 * p.ch4 - p.o2 }),
  outputs: [
    { key: "zone", label: "Mixture", format: (v) => ZONES[v], tone: (v) => (v === 1 ? "crit" : v === 2 ? "warn" : v === 3 ? "info" : "ok") },
    { key: "def", label: "O₂ below air-dilution line (inert/consumed)", unit: "%", digits: 1 },
  ],
  caption: "LEL 5 %, UEL 15 %, nose ≈ 5.9 % CH₄ / 12.2 % O₂. Air-dilution line: O₂ = 20.93 − 0.2093·CH₄.",
  render: (p, o) => (
    <Plot x={40} y={14} w={340} h={190} xmin={0} xmax={30} ymin={0} ymax={22} xlabel="CH₄ %" ylabel="O₂ %">
      {(sx, sy) => (
        <g>
          <polygon points={polyline(TRI.map(([a, b]) => [sx(a), sy(b)]))} fill="#fecaca" stroke={C.crit} strokeWidth={2} />
          <polyline points={sample((x) => 20.93 - 0.2093 * x, 0, 30, 2, sx, sy)} fill="none" stroke={C.tech} strokeWidth={1.5} />
          <Txt x={sx(18)} y={sy(17.4)} size={8} fill={C.tech}>
            air-dilution line
          </Txt>
          <Txt x={sx(7)} y={sy(17.2)} size={9} weight={800} fill={C.crit}>
            EXPLOSIVE
          </Txt>
          {o.zone === 2 && <line x1={sx(p.ch4)} y1={sy(p.o2)} x2={sx(0)} y2={sy(20.93)} stroke={C.hazard} strokeWidth={2} strokeDasharray="5 3" />}
          <circle cx={sx(p.ch4)} cy={sy(p.o2)} r={6} fill={o.zone === 1 ? C.crit : o.zone === 2 ? C.hazard : o.zone === 3 ? C.slate : C.safe} stroke="white" strokeWidth={2} />
          <Txt x={sx(5)} y={sy(19.9) - 6} size={7} anchor="middle" mono fill={C.slate}>
            LEL
          </Txt>
          <Txt x={sx(15)} y={sy(17.9) - 6} size={7} anchor="middle" mono fill={C.slate}>
            UEL
          </Txt>
          <Txt x={sx(5.9) + 4} y={sy(12.2) + 10} size={7} mono fill={C.slate}>
            nose
          </Txt>
        </g>
      )}
    </Plot>
  ),
};

/* ---------------- Ventilation network: Atkinson, Kirchhoff, regulator ---------------- */

export function network(p: Record<string, number>) {
  const Rreg = 1.4161 / (p.A * p.A);
  const R2t = p.R2 + Rreg;
  const Rpar = 1 / Math.pow(1 / Math.sqrt(p.R1) + 1 / Math.sqrt(R2t), 2);
  const Q = Math.sqrt(p.Pf / (p.R0 + Rpar));
  const Pp = Rpar * Q * Q;
  const Q1 = Math.sqrt(Pp / p.R1);
  const Q2 = Math.sqrt(Pp / R2t);
  return { Rreg, Q, Q1, Q2, Pp, Preg: Rreg * Q2 * Q2, Aeq: (1.19 * Q) / Math.sqrt(p.Pf), power: (p.Pf * Q) / 1000 / 0.75 };
}

export const networkSim: SimDef = {
  id: "u7-network",
  title: "Ventilation network — Atkinson's law, splits and a regulator",
  params: [
    { key: "Pf", label: "Fan pressure", min: 500, max: 3000, step: 50, unit: "Pa", default: 1500 },
    { key: "R0", label: "Main intake/return R₀", min: 0.05, max: 0.5, step: 0.01, unit: "Ns²/m⁸", default: 0.1 },
    { key: "R1", label: "District 1 resistance R₁", min: 0.1, max: 2, step: 0.05, unit: "Ns²/m⁸", default: 0.4 },
    { key: "R2", label: "District 2 resistance R₂", min: 0.1, max: 2, step: 0.05, unit: "Ns²/m⁸", default: 0.2 },
    { key: "A", label: "Regulator opening (district 2)", min: 0.5, max: 20, step: 0.1, unit: "m²", default: 20 },
  ],
  compute: (p) => network(p),
  outputs: [
    { key: "Q", label: "Total airflow", unit: "m³/s", digits: 1 },
    { key: "Q1", label: "District 1 (needs ≥ 45)", unit: "m³/s", digits: 1, tone: (v) => (v >= 45 ? "ok" : "crit") },
    { key: "Q2", label: "District 2 (needs ≥ 30)", unit: "m³/s", digits: 1, tone: (v) => (v >= 30 ? "ok" : "crit") },
    { key: "Preg", label: "Pressure drop at regulator", unit: "Pa", digits: 0 },
    { key: "Aeq", label: "Mine equivalent orifice", unit: "m²", digits: 2 },
    { key: "power", label: "Fan shaft power (η 0.75)", unit: "kW", digits: 0 },
  ],
  caption: "P = RQ²; parallel: 1/√R = Σ 1/√Rᵢ; regulator modelled as an orifice R = 1.416/A²; equivalent orifice A = 1.19Q/√P.",
  render: (p, o) => {
    const w = (q: number) => clamp(q / 6, 1.5, 16);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        <circle cx={40} cy={120} r={20} fill={C.tech} />
        <Txt x={40} y={124} size={9} anchor="middle" fill="white" weight={800}>
          FAN
        </Txt>
        <line x1={60} y1={120} x2={120} y2={120} stroke={C.air} strokeWidth={w(o.Q)} />
        <line x1={120} y1={120} x2={160} y2={60} stroke={C.air} strokeWidth={w(o.Q1)} />
        <line x1={160} y1={60} x2={300} y2={60} stroke={C.air} strokeWidth={w(o.Q1)} />
        <line x1={300} y1={60} x2={340} y2={120} stroke={C.air} strokeWidth={w(o.Q1)} />
        <line x1={120} y1={120} x2={160} y2={180} stroke={C.air} strokeWidth={w(o.Q2)} />
        <line x1={160} y1={180} x2={300} y2={180} stroke={C.air} strokeWidth={w(o.Q2)} />
        <line x1={300} y1={180} x2={340} y2={120} stroke={C.air} strokeWidth={w(o.Q2)} />
        <line x1={340} y1={120} x2={385} y2={120} stroke={C.air} strokeWidth={w(o.Q)} />
        <rect x={262} y={162} width={10} height={36} fill={p.A < 19.9 ? C.hazard : C.line} />
        <rect x={262} y={180 - clamp(p.A, 0.5, 20) * 0.9} width={10} height={clamp(p.A, 0.5, 20) * 1.8} fill="#f8fafc" />
        <Txt x={267} y={212} size={8} anchor="middle" weight={700} fill={C.hazard}>
          regulator
        </Txt>
        <Txt x={230} y={50} size={9} anchor="middle" weight={800}>
          {`District 1 · ${o.Q1.toFixed(1)} m³/s`}
        </Txt>
        <Txt x={210} y={172} size={9} anchor="middle" weight={800}>
          {`District 2 · ${o.Q2.toFixed(1)} m³/s`}
        </Txt>
        <circle cx={120} cy={120} r={4} fill={C.ink} />
        <circle cx={340} cy={120} r={4} fill={C.ink} />
        <Txt x={120} y={140} size={8} anchor="middle" mono>
          ΣQ = 0
        </Txt>
        <Txt x={20} y={22} size={11} weight={800} mono>
          {`Q = ${o.Q.toFixed(1)} m³/s @ ${p.Pf} Pa`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Fan characteristic, stall, NVP ---------------- */

const QP = 80;
const PP = 2600;
const QW = 90;

export function fanP0(q: number): number {
  if (q >= QP) return PP * (1 - Math.pow((q - QP) / QW, 2));
  // left of peak: stall dip then recovery toward shut-off
  const u = q / QP;
  return PP * (0.78 + 0.22 * Math.pow(u, 6)) - 380 * Math.sin(Math.PI * u) * 0.6;
}

export function fanP(q: number, N: number): number {
  const r = N / 100;
  return r * r * fanP0(q / r);
}

export function fanOp(p: Record<string, number>) {
  const f = (q: number) => fanP(q, p.N) - (p.R * q * q - p.nvp);
  const lo = 1;
  const hi = 250;
  // find the right-most root (stable side first)
  let q = NaN;
  for (let x = hi; x > lo; x -= 0.5) {
    if (f(x) >= 0) {
      let a = x;
      let b = x + 0.5;
      for (let i = 0; i < 40; i++) {
        const m = (a + b) / 2;
        if (f(m) >= 0) a = m;
        else b = m;
      }
      q = a;
      break;
    }
  }
  const qPeak = (QP * p.N) / 100;
  const P = p.R * q * q - p.nvp;
  return { Q: q, P, stall: q < qPeak ? 1 : 0, power: (fanP(q, p.N) * q) / 1000 / 0.75, qPeak };
}

export const fanSim: SimDef = {
  id: "u7-fan",
  title: "Axial fan characteristic, mine curve, stall and NVP",
  params: [
    { key: "N", label: "Fan speed", min: 60, max: 110, step: 1, unit: "% rated", default: 100 },
    { key: "R", label: "Mine resistance R", min: 0.05, max: 0.6, step: 0.01, unit: "Ns²/m⁸", default: 0.2 },
    { key: "nvp", label: "Natural ventilation pressure (assisting +)", min: -300, max: 300, step: 10, unit: "Pa", default: 0 },
  ],
  compute: (p) => fanOp(p),
  outputs: [
    { key: "Q", label: "Operating airflow", unit: "m³/s", digits: 1 },
    { key: "P", label: "Fan pressure at duty", unit: "Pa", digits: 0 },
    { key: "stall", label: "Fan region", format: (v) => (v ? "STALL — unstable, left of peak" : "Stable (right of peak)"), tone: (v) => (v ? "crit" : "ok") },
    { key: "power", label: "Shaft power (η 0.75)", unit: "kW", digits: 0 },
  ],
  caption: "Fan laws: Q ∝ N, P ∝ N², power ∝ N³. NVP adds to (assists) or opposes the fan; it shifts the mine curve.",
  render: (p, o) => (
    <Plot x={44} y={14} w={336} h={190} xmin={0} xmax={160} ymin={0} ymax={3500} xlabel="Q (m³/s)" ylabel="P (Pa)">
      {(sx, sy) => (
        <g>
          <rect x={sx(0)} y={sy(3500)} width={sx(o.qPeak) - sx(0)} height={sy(0) - sy(3500)} fill="#fee2e2" opacity={0.7} />
          <Txt x={sx(4)} y={sy(3000)} size={8} fill={C.crit} weight={700}>
            stall zone
          </Txt>
          <polyline points={sample((q) => Math.max(0, fanP(q, p.N)), 0, 160, 120, sx, sy)} fill="none" stroke={C.tech} strokeWidth={2.5} />
          <polyline points={sample((q) => Math.max(0, p.R * q * q - p.nvp), 0, 160, 80, sx, sy)} fill="none" stroke={C.ink} strokeWidth={2} strokeDasharray="6 3" />
          {Number.isFinite(o.Q) && <circle cx={sx(o.Q)} cy={sy(Math.max(0, o.P))} r={6} fill={o.stall ? C.crit : C.safe} stroke="white" strokeWidth={2} />}
          <Txt x={sx(120)} y={sy(800)} size={8} fill={C.tech} weight={700}>
            fan @ {p.N}%
          </Txt>
          <Txt x={sx(118)} y={sy(Math.min(3400, p.R * 118 * 118 - p.nvp)) - 6} size={8} anchor="end" weight={700}>
            mine R·Q² − NVP
          </Txt>
        </g>
      )}
    </Plot>
  ),
};

/* ---------------- Psychrometry & heat stress ---------------- */

export function es(T: number): number {
  return 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
}

export const psychroSim: SimDef = {
  id: "u7-psychro",
  title: "Psychrometry & heat stress at the face",
  params: [
    { key: "Td", label: "Dry-bulb temperature", min: 20, max: 45, step: 0.5, unit: "°C", default: 34 },
    { key: "Tw", label: "Wet-bulb temperature", min: 15, max: 40, step: 0.5, unit: "°C", default: 32 },
    { key: "v", label: "Air velocity at face", min: 0.1, max: 4, step: 0.1, unit: "m/s", default: 0.5 },
  ],
  compute: (p) => {
    const tw = Math.min(p.Tw, p.Td);
    const e = es(tw) - 0.000662 * 101.3 * (p.Td - tw);
    const rh = clamp((e / es(p.Td)) * 100, 0, 100);
    const status = tw > 33.5 ? 2 : tw > 30.5 && p.v < 1 ? 1 : 0;
    return { rh, e, status, tw };
  },
  outputs: [
    { key: "rh", label: "Relative humidity", unit: "%", digits: 0 },
    { key: "e", label: "Vapour pressure", unit: "kPa", digits: 2 },
    { key: "status", label: "Statutory status (CMR)", format: (v) => ["Compliant", "Wet bulb > 30.5 °C: needs ≥ 1 m/s air", "Wet bulb > 33.5 °C: no work permitted"][v], tone: (v) => (["ok", "warn", "crit"] as const)[v] },
  ],
  caption: "Sweat evaporation (the body's main cooling) depends on wet-bulb temperature and air speed — dry-bulb alone misleads.",
  render: (p, o) => {
    const th = (t: number, x: number, label: string, col: string) => {
      const h = clamp(((t - 15) / 30) * 150, 5, 150);
      return (
        <g>
          <rect x={x} y={30} width={18} height={160} rx={9} fill="#e2e8f0" />
          <rect x={x + 4} y={186 - h} width={10} height={h} rx={5} fill={col} />
          <circle cx={x + 9} cy={196} r={12} fill={col} />
          <Txt x={x + 9} y={225} size={9} anchor="middle" weight={800}>
            {label}
          </Txt>
          <Txt x={x + 9} y={22} size={9} anchor="middle" mono>
            {`${t.toFixed(1)}°`}
          </Txt>
        </g>
      );
    };
    const y305 = 186 - ((30.5 - 15) / 30) * 150;
    const y335 = 186 - ((33.5 - 15) / 30) * 150;
    return (
      <g>
        {th(p.Td, 40, "DRY", C.crit)}
        {th(o.tw, 100, "WET", C.tech)}
        <line x1={90} x2={135} y1={y305} y2={y305} stroke={C.hazard} strokeWidth={2} />
        <line x1={90} x2={135} y1={y335} y2={y335} stroke={C.crit} strokeWidth={2} />
        <Txt x={140} y={y305 + 3} size={8} fill={C.hazard} weight={700}>
          30.5
        </Txt>
        <Txt x={140} y={y335 + 3} size={8} fill={C.crit} weight={700}>
          33.5
        </Txt>
        <Txt x={190} y={50} size={10} weight={800}>
          Air velocity
        </Txt>
        {[0, 1, 2].map((i) => (
          <Arrow key={i} x1={190} y1={70 + i * 16} x2={190 + clamp(p.v * 45, 10, 180)} y2={70 + i * 16} color={p.v >= 1 ? C.safe : C.slate} width={2} />
        ))}
        <Txt x={190} y={135} size={9} mono>
          {`v = ${p.v.toFixed(1)} m/s · RH ${o.rh.toFixed(0)}%`}
        </Txt>
        <Txt x={190} y={170} size={12} weight={900} fill={o.status === 0 ? C.safe : o.status === 1 ? C.hazard : C.crit}>
          {["COMPLIANT", "INCREASE AIR VELOCITY", "STOP WORK"][o.status]}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Spontaneous heating gas ratios ---------------- */

export function ratios(p: Record<string, number>) {
  const co = p.co / 1e4;
  const h2 = p.h2 / 1e4;
  const n2 = 100 - p.o2 - p.co2 - co - h2;
  const def = 0.265 * n2 - p.o2;
  const gr = def > 0.05 ? (100 * co) / def : NaN;
  const yr = def > 0.05 ? (100 * p.co2) / def : NaN;
  const jtr = def > 0.05 ? (p.co2 + 0.75 * co - 0.25 * h2) / def : NaN;
  const grc = !Number.isFinite(gr) ? -1 : gr < 0.5 ? 0 : gr < 1 ? 1 : gr < 2 ? 2 : 3;
  return { n2, def, gr, yr, jtr, grc };
}

export const sponcomSim: SimDef = {
  id: "u7-sponcom",
  title: "Spontaneous heating early-warning analyser",
  params: [
    { key: "o2", label: "O₂", min: 12, max: 20.9, step: 0.05, unit: "%", default: 20.2 },
    { key: "co2", label: "CO₂", min: 0, max: 4, step: 0.05, unit: "%", default: 0.3 },
    { key: "co", label: "CO", min: 0, max: 3000, step: 5, unit: "ppm", default: 50 },
    { key: "h2", label: "H₂", min: 0, max: 3000, step: 10, unit: "ppm", default: 0 },
  ],
  compute: (p) => ratios(p),
  outputs: [
    { key: "def", label: "O₂ deficiency 0.265N₂ − O₂", unit: "%", digits: 2 },
    { key: "gr", label: "Graham's ratio", unit: "%", digits: 2, tone: (_, o) => (["ok", "warn", "crit", "crit"] as const)[Math.max(0, o.grc)] ?? "info" },
    { key: "grc", label: "Interpretation (GR)", format: (v) => (v < 0 ? "No O₂ deficiency — ratio invalid" : ["Normal (< 0.5)", "Heating — investigate (0.5–1)", "Serious heating (1–2)", "Active fire likely (> 2)"][v]), tone: (v) => (v <= 0 ? "ok" : v === 1 ? "warn" : "crit") },
    { key: "yr", label: "Young's ratio CO₂/def", unit: "%", digits: 1 },
    { key: "jtr", label: "Jones–Trickett ratio", digits: 2, format: (v) => (!Number.isFinite(v) ? "—" : v < 0.4 ? `${v.toFixed(2)} (no fire / bad sample)` : v < 0.5 ? `${v.toFixed(2)} (methane burning)` : v < 1 ? `${v.toFixed(2)} (oil/belt/mixed)` : v <= 1.6 ? `${v.toFixed(2)} (coal/timber)` : `${v.toFixed(2)} (invalid > 1.6)`) },
  ],
  caption: "Ratios use oxygen deficiency so dilution by fresh air cancels out. Trend them over time — a rising Graham's ratio matters more than one value.",
  render: (p, o) => {
    const gx = (v: number) => 40 + (clamp(v, 0, 3) / 3) * 320;
    return (
      <g>
        <Txt x={40} y={24} size={9} weight={700} fill={C.slate}>
          GRAHAM&apos;S RATIO SCALE (%)
        </Txt>
        {[
          { a: 0, b: 0.5, c: C.safe, t: "normal" },
          { a: 0.5, b: 1, c: C.hazard, t: "heating" },
          { a: 1, b: 2, c: "#f97316", t: "serious" },
          { a: 2, b: 3, c: C.crit, t: "fire" },
        ].map((z) => (
          <g key={z.t}>
            <rect x={gx(z.a)} y={34} width={gx(z.b) - gx(z.a)} height={22} fill={z.c} />
            <Txt x={(gx(z.a) + gx(z.b)) / 2} y={49} size={8} anchor="middle" fill="white" weight={800}>
              {z.t}
            </Txt>
          </g>
        ))}
        {Number.isFinite(o.gr) && <polygon points={`${gx(o.gr)},60 ${gx(o.gr) - 7},72 ${gx(o.gr) + 7},72`} fill={C.ink} />}
        <Txt x={40} y={100} size={9} weight={700} fill={C.slate}>
          SAMPLE COMPOSITION
        </Txt>
        {[
          { k: "N₂", v: o.n2, c: "#94a3b8" },
          { k: "O₂", v: p.o2, c: C.tech },
          { k: "CO₂", v: p.co2 * 10, c: C.slate },
          { k: "CO×100", v: (p.co / 1e4) * 100, c: C.crit },
        ].map((g, i) => (
          <g key={g.k}>
            <rect x={40} y={110 + i * 24} width={clamp(g.v * 3.6, 1, 320)} height={16} fill={g.c} />
            <Txt x={44 + clamp(g.v * 3.6, 1, 320)} y={122 + i * 24} size={8} mono>
              {`${g.k} ${g.k === "CO×100" ? p.co + " ppm" : g.k === "CO₂" ? p.co2.toFixed(2) + "%" : g.v.toFixed(2) + "%"}`}
            </Txt>
          </g>
        ))}
        <Txt x={40} y={225} size={11} weight={900} mono fill={o.grc >= 2 ? C.crit : o.grc === 1 ? C.hazard : C.safe}>
          {Number.isFinite(o.gr) ? `GR ${o.gr.toFixed(2)} · JTR ${o.jtr.toFixed(2)}` : "No O₂ deficiency"}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Coal dust & stone dusting ---------------- */

export function dust(p: Record<string, number>) {
  const a = (p.ash + p.moist) / 100;
  const inc = ((p.Ms + p.Mc * a) / (p.Ms + p.Mc)) * 100;
  const req = p.gas ? 85 : 75;
  const I = req / 100;
  const MsReq = Math.max(0, (p.Mc * (I - a)) / (1 - I));
  const conc = ((p.Mc * (1 - a)) / 12) * 1000;
  return { inc, req, MsReq, conc };
}

export const dustSim: SimDef = {
  id: "u7-dust",
  title: "Roadway dust — incombustible content and stone dusting",
  params: [
    { key: "Mc", label: "Coal dust on roadway", min: 0.1, max: 5, step: 0.1, unit: "kg/m", default: 1 },
    { key: "ash", label: "Ash in coal dust", min: 10, max: 40, step: 1, unit: "%", default: 25 },
    { key: "moist", label: "Moisture in dust", min: 0, max: 15, step: 0.5, unit: "%", default: 3 },
    { key: "Ms", label: "Stone dust applied", min: 0, max: 25, step: 0.25, unit: "kg/m", default: 1 },
    { key: "gas", label: "Firedamp in general body", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Not present" }, { value: 1, label: "Present" }] },
  ],
  compute: (p) => dust(p),
  outputs: [
    { key: "inc", label: "Incombustible content", unit: "%", digits: 1, tone: (v, o) => (v >= o.req ? "ok" : "crit") },
    { key: "req", label: "Target used here", unit: "%", digits: 0 },
    { key: "MsReq", label: "Stone dust needed", unit: "kg/m", digits: 2 },
    { key: "conc", label: "If raised in 12 m² roadway", unit: "g/m³", digits: 0, tone: (v) => (v >= 50 ? "crit" : "ok") },
  ],
  caption: "Teaching targets: ≥ 75 % incombustible generally, higher (85 %) where firedamp is present. Coal dust clouds above roughly 50 g/m³ can propagate explosions.",
  render: (p, o) => {
    const frac = clamp(o.inc / 100, 0, 1);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#e7e5e4" />
        <path d="M 30 200 L 30 90 Q 200 20 370 90 L 370 200 Z" fill="#f8fafc" stroke={C.ink} />
        <rect x={30} y={190} width={340} height={10} fill={C.coal} />
        <rect x={30} y={190} width={340 * frac} height={10} fill="#f1f5f9" opacity={0.9} />
        {Array.from({ length: 40 }).map((_, i) => (
          <circle key={i} cx={40 + ((i * 37) % 320)} cy={120 + ((i * 23) % 60)} r={1.6} fill={i / 40 < frac ? "#cbd5e1" : C.coal} opacity={0.7} />
        ))}
        <Txt x={200} y={80} size={10} anchor="middle" weight={800}>
          ROADWAY DUST SAMPLE
        </Txt>
        <Txt x={200} y={225} size={14} anchor="middle" weight={900} mono fill={o.inc >= o.req ? C.safe : C.crit}>
          {`${o.inc.toFixed(1)}% incombustible (target ${o.req}%)`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Mine pump: head, power, NPSH ---------------- */

export function pump(p: Record<string, number>) {
  const d = p.d / 1000;
  const q = p.Q / 3600;
  const v = q / ((Math.PI / 4) * d * d);
  const L = p.H + 200;
  const hf = (0.02 * L * v * v) / (d * 2 * 9.81);
  const Ht = p.H + hf;
  const stages = Math.ceil(Ht / p.hs1);
  const power = (1000 * 9.81 * q * Ht) / 0.75 / 1000;
  const npsha = ((101.3 - es(p.T)) * 1000) / (1000 * 9.81) - p.lift - 0.5;
  return { v, hf, Ht, stages, power, npsha, margin: npsha - p.npshr };
}

export const pumpSim: SimDef = {
  id: "u7-pump",
  title: "Mine dewatering — multistage pump head, power and NPSH",
  params: [
    { key: "Q", label: "Flow", min: 50, max: 500, step: 10, unit: "m³/h", default: 200 },
    { key: "H", label: "Static head (sump to surface)", min: 50, max: 600, step: 10, unit: "m", default: 300 },
    { key: "d", label: "Rising main Ø", min: 100, max: 400, step: 10, unit: "mm", default: 200 },
    { key: "hs1", label: "Head per stage", min: 40, max: 100, step: 5, unit: "m", default: 60 },
    { key: "lift", label: "Suction lift", min: -2, max: 8, step: 0.1, unit: "m", default: 4 },
    { key: "T", label: "Water temperature", min: 20, max: 45, step: 1, unit: "°C", default: 30 },
    { key: "npshr", label: "NPSH required", min: 2, max: 8, step: 0.1, unit: "m", default: 4 },
  ],
  compute: (p) => pump(p),
  outputs: [
    { key: "v", label: "Velocity in main", unit: "m/s", digits: 2, tone: (v) => (v > 3 ? "warn" : "ok") },
    { key: "Ht", label: "Total head", unit: "m", digits: 0 },
    { key: "stages", label: "Stages needed", digits: 0 },
    { key: "power", label: "Motor power (η 0.75)", unit: "kW", digits: 0 },
    { key: "npsha", label: "NPSH available", unit: "m", digits: 2 },
    { key: "margin", label: "NPSH margin", unit: "m", digits: 2, tone: (v) => (v < 0 ? "crit" : v < 0.5 ? "warn" : "ok") },
  ],
  caption: "NPSHa = (Patm − Pv)/ρg − suction lift − suction losses (0.5 m). Atmospheric pressure taken as 101.3 kPa (conservative underground).",
  render: (p, o) => {
    const cav = o.margin < 0;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#e7e5e4" />
        <rect x={20} y={180} width={120} height={50} fill={C.water} />
        <Txt x={80} y={210} size={9} anchor="middle" weight={800}>
          SUMP
        </Txt>
        <line x1={150} y1={180 - clamp(p.lift * 8, -20, 70)} x2={150} y2={215} stroke={C.ink} strokeWidth={3} />
        <line x1={150} y1={215} x2={120} y2={215} stroke={C.ink} strokeWidth={3} />
        <rect x={140} y={150 - clamp(p.lift * 8, -20, 70)} width={60} height={28} rx={4} fill={cav ? C.crit : C.tech} />
        <Txt x={170} y={168 - clamp(p.lift * 8, -20, 70)} size={8} anchor="middle" fill="white" weight={800}>
          {`${o.stages}-STAGE`}
        </Txt>
        <line x1={200} y1={164 - clamp(p.lift * 8, -20, 70)} x2={240} y2={164 - clamp(p.lift * 8, -20, 70)} stroke={C.ink} strokeWidth={4} />
        <line x1={240} y1={164 - clamp(p.lift * 8, -20, 70)} x2={240} y2={20} stroke={C.ink} strokeWidth={4} />
        <Txt x={248} y={30} size={9} weight={700}>
          rising main to surface
        </Txt>
        {cav &&
          [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={150 + i * 10} cy={145 - clamp(p.lift * 8, -20, 70) - (i % 2) * 6} r={3} fill="white" stroke={C.crit} />)}
        <Txt x={250} y={80} size={10} weight={800}>
          {`Total head ${o.Ht.toFixed(0)} m`}
        </Txt>
        <Txt x={250} y={96} size={9} mono>
          {`friction ${o.hf.toFixed(1)} m`}
        </Txt>
        <Txt x={250} y={130} size={12} weight={900} mono fill={cav ? C.crit : o.margin < 0.5 ? C.hazard : C.safe}>
          {`NPSHa ${o.npsha.toFixed(2)} m`}
        </Txt>
        <Txt x={250} y={146} size={9} mono>
          {`NPSHr ${p.npshr.toFixed(1)} m`}
        </Txt>
        <Txt x={250} y={170} size={10} weight={800} fill={cav ? C.crit : C.safe}>
          {cav ? "CAVITATION" : "no cavitation"}
        </Txt>
      </g>
    );
  },
};

export const U7_SIMS = [cowardSim, networkSim, fanSim, psychroSim, sponcomSim, dustSim, pumpSim];
