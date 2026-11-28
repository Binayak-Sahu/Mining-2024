import type { SimDef } from "@/lib/types";
import { T, INK, INK2, INK3, ON_LIGHT, ON_DEEP, GREYS, U, OK, BAD, OK_TEXT, BAD_TEXT, OK_LIGHT, BAD_LIGHT, BAD_PALE, LBL, Arrow, Axes, Dot, curve, pts, num, clamp, px, textW, scale, hue } from "@/components/sim/v3";
import { SvgTex } from "@/components/sim/Tex";

/** §5.6 frames (v3e) = the legacy plot frames, so lesson hotspots and grips keep their coordinates. */
const CW = { x0: 40, x1: 380, y0: 14, y1: 204, sx: scale(0, 30, 40, 380), sy: scale(22, 10, 14, 204) };
const FN = { x0: 44, x1: 380, y0: 14, y1: 204, sx: scale(0, 160, 44, 380), sy: scale(0, 3500, 204, 14) };
const PS = { base: 186, ax: 190, ty: (t: number) => 186 - clamp(((t - 15) / 30) * 150, 5, 150) };
/** Second hue family of the gas-ratio scale (heating classes). */
const ORANGE = hue("orange");

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

/** Bottom of the cropped O₂ axis. */
const O2_MIN = 10;

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
  // §5.6 redraw (v3e): the legacy plot frame (x 40–380, y 14–204) is kept, so the hotspots and grips stay put.
  v3: { viewH: 244 },
  handles: [
    { key: "ch4", axis: "x", at: (p) => [CW.sx(p.ch4), CW.y1], toValue: (x) => ((x - CW.x0) / (CW.x1 - CW.x0)) * 30 },
    // O₂ axis is cropped to 10–22 % (where the triangle lives); readings below 10 % pin to the bottom edge.
    { key: "o2", axis: "y", at: (p) => [CW.x0, CW.sy(Math.max(p.o2, O2_MIN))], toValue: (y) => O2_MIN + ((CW.y1 - y) / (CW.y1 - CW.y0)) * (22 - O2_MIN) },
  ],
  render: (p, o) => {
    const { sx, sy } = CW;
    const tri = pts(TRI.map(([a, b]) => [sx(a), sy(b)]));
    const px0 = sx(p.ch4);
    const py0 = sy(Math.max(p.o2, O2_MIN));
    const dot = o.zone === 1 ? BAD : o.zone === 0 ? OK : o.zone === 3 ? INK3 : INK;
    return (
      <g>
        <Axes x={CW.x0} y={CW.y0} w={CW.x1 - CW.x0} h={CW.y1 - CW.y0} />
        <T x={CW.x0} y={236} anchor="middle">0</T>
        <T x={CW.x1} y={236} anchor="end">30</T>
        <SvgTex x={(CW.x0 + CW.x1) / 2} y={236} tex="\mathrm{CH_4}\ \%" size={LBL} anchor="middle" color="var(--text-2)" />
        <T x={20} y={CW.y0 + 8} anchor="end">22</T>
        <T x={20} y={CW.y1} anchor="end">10</T>
        <SvgTex x={20} y={(CW.y0 + CW.y1) / 2} tex="\mathrm{O_2}" size={LBL} anchor="end" color="var(--text-2)" />
        <polygon points={tri} fill={o.zone === 1 ? BAD_LIGHT : BAD_PALE} style={{ stroke: BAD }} strokeWidth={2.5} strokeLinejoin="round" />
        <T x={sx(6.2)} y={sy(17.2) + 4} fill={ON_LIGHT} weight={800}>
          Explosive
        </T>
        <T x={sx(5) - 8} y={sy(19.9) + 42} anchor="end">
          LEL
        </T>
        <T x={sx(15) + 6} y={sy(17.9) + 24}>
          UEL
        </T>
        <T x={sx(5.9) + 12} y={sy(12.2) + 18}>
          Nose
        </T>
        {/* air-dilution line O₂ = 20.93 − 0.2093·CH₄ */}
        <polyline points={curve((x) => Math.max(O2_MIN, 20.93 - 0.2093 * x), 0, 30, 2, sx, sy)} fill="none" style={{ stroke: U.deep }} strokeWidth={2.5} strokeLinecap="round" />
        <T x={CW.x1} y={sy(14.65) + 24} anchor="end">
          Air-dilution line
        </T>
        <line x1={px0} x2={px0} y1={CW.y1} y2={py0} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="3 4" />
        <line x1={CW.x0} x2={px0} y1={py0} y2={py0} style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="3 4" />
        {o.zone === 2 && <line x1={px0} y1={py0} x2={sx(0)} y2={sy(20.93)} style={{ stroke: BAD }} strokeWidth={2.5} strokeDasharray="7 5" strokeLinecap="round" />}
        {p.o2 < O2_MIN && (
          <T x={Math.max(px0 + 12, 176)} y={CW.y1 - 10} fill={INK}>
            {`O₂ ${num(p.o2, 1, "%")} ↓`}
          </T>
        )}
        <Dot x={px0} y={py0} ring fill={dot} />
      </g>
    );
  },
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
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["Q1", "Q2"],
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
  animated: true,
  // §5.6 redraw (v3e): fan, junctions, districts and regulator keep their legacy places (lesson hotspots).
  v3: { viewH: 244 },
  render: (p, o, t) => {
    const w = (q: number) => clamp(q / 6, 3, 16);
    const ways: [string, number][] = [
      ["M60 120 L120 120", o.Q],
      ["M120 120 L160 60 L300 60 L340 120", o.Q1],
      ["M120 120 L160 180 L300 180 L340 120", o.Q2],
      ["M340 120 L380 120", o.Q],
    ];
    const rot = (t * clamp(o.Q, 0, 200) * 6) % 360;
    const gap = clamp(p.A, 0.5, 20) * 0.6; // regulator opening, drawn
    return (
      <g>
        {ways.map(([d, q], i) => (
          <path key={`wall${i}`} d={d} fill="none" stroke={GREYS.light} strokeWidth={w(q) + 10} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {ways.map(([d, q], i) => (
          <path key={`air${i}`} d={d} fill="none" style={{ stroke: U.mid }} strokeWidth={w(q)} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* moving air: dashes travel at a speed set by each branch's flow */}
        {ways.map(([d, q], i) => (
          <path key={`fl${i}`} d={d} fill="none" stroke={ON_DEEP} strokeWidth={2} strokeDasharray="4 14" strokeDashoffset={-((t * clamp(q, 2, 120)) % 18)} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <Arrow x1={372} y1={120} x2={396} y2={120} color={INK} />
        {/* main fan */}
        <circle cx={40} cy={120} r={22} style={{ fill: U.deep }} />
        <g transform={`rotate(${rot.toFixed(1)} 40 120)`}>
          {[0, 120, 240].map((a) => (
            <path key={a} d="M40 120 C 34 110, 36 103, 40 101 C 45 104, 46 111, 40 120 Z" fill={ON_DEEP} transform={`rotate(${a} 40 120)`} />
          ))}
        </g>
        <T x={40} y={166} anchor="middle" fill={INK} weight={700}>
          Fan
        </T>
        {/* regulator in district 2: two shutters leave an opening ∝ A */}
        <rect x={261} y={162} width={12} height={18 - gap / 2} rx={2} fill={GREYS.deep} />
        <rect x={261} y={180 + gap / 2} width={12} height={18 - gap / 2} rx={2} fill={GREYS.deep} />
        <T x={267} y={236} anchor="middle">
          Regulator
        </T>
        <T x={230} y={42} anchor="middle" fill={INK} weight={700}>
          {`District 1 · ${num(o.Q1, 1, "m³/s")}`}
        </T>
        <T x={188} y={214} anchor="middle" fill={INK} weight={700}>
          {`District 2 · ${num(o.Q2, 1, "m³/s")}`}
        </T>
        <Dot x={120} y={120} />
        <Dot x={340} y={120} />
        <SvgTex x={112} y={150} tex="\sum Q = 0" size={LBL} anchor="end" color="var(--text-2)" />
        <T x={8} y={20} fill={INK} weight={800}>
          {`Q = ${num(o.Q, 1, "m³/s")} at ${num(p.Pf, 0, "Pa")}`}
        </T>
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
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["Q", "stall"],
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
  animated: true,
  // §5.6 redraw (v3e): the legacy plot frame (x 44–380, y 14–204) is kept, so the lesson hotspots stay put.
  v3: { viewH: 252 },
  render: (p, o) => {
    const { sx, sy } = FN;
    const ok = Number.isFinite(o.Q);
    return (
      <g>
        {/* stall zone: a danger wash (theme-relative, so the ink curves stay visible on it in both themes) */}
        <rect x={FN.x0} y={FN.y0} width={sx(o.qPeak) - FN.x0} height={FN.y1 - FN.y0} style={{ fill: BAD }} fillOpacity={0.16} />
        <clipPath id="u7-fan-plot">
          <rect x={FN.x0} y={FN.y0 - 4} width={FN.x1 - FN.x0 + 4} height={FN.y1 - FN.y0 + 6} />
        </clipPath>
        <T x={sx(4)} y={FN.y1 - 10} fill={BAD_TEXT} weight={700}>
          Stall zone
        </T>
        <Axes x={FN.x0} y={FN.y0} w={FN.x1 - FN.x0} h={FN.y1 - FN.y0} />
        <T x={FN.x0} y={226} anchor="middle">0</T>
        <T x={FN.x1} y={226} anchor="end">160</T>
        <T x={(FN.x0 + FN.x1) / 2} y={226} anchor="middle">Q, m³/s</T>
        <T x={38} y={FN.y1} anchor="end">0</T>
        <T x={FN.x0 + 8} y={FN.y0 + 18}>P, 3500 Pa</T>
        <polyline clipPath="url(#u7-fan-plot)" points={curve((q) => Math.max(0, fanP(q, p.N)), 0, 160, 120, sx, sy)} fill="none" style={{ stroke: U.deep }} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <polyline clipPath="url(#u7-fan-plot)" points={curve((q) => Math.max(0, p.R * q * q - p.nvp), 0, 160, 80, sx, sy)} fill="none" style={{ stroke: INK }} strokeWidth={2.5} strokeDasharray="8 6" strokeLinecap="round" />
        {ok && <Dot x={sx(o.Q)} y={sy(Math.max(0, o.P))} ring fill={o.stall ? BAD : OK} />}
        {/* legend */}
        <line x1={FN.x0} x2={FN.x0 + 22} y1={242} y2={242} style={{ stroke: U.deep }} strokeWidth={2.5} strokeLinecap="round" />
        <T x={FN.x0 + 30} y={248}>{`Fan at ${num(p.N, 0, "%")}`}</T>
        <line x1={214} x2={236} y1={242} y2={242} style={{ stroke: INK }} strokeWidth={2.5} strokeDasharray="8 6" strokeLinecap="round" />
        <T x={244} y={248}>Mine curve</T>
      </g>
    );
  },
};

/* ---------------- Psychrometry & heat stress ---------------- */

export function es(T: number): number {
  return 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
}

export const psychroSim: SimDef = {
  id: "u7-psychro",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["status", "rh"],
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
  // §5.6 redraw (v3e): thermometers (x 40 and 100) and the air panel keep their legacy places (lesson hotspots).
  v3: { viewH: 240 },
  handles: [
    { key: "Td", axis: "y", at: (p) => [72, PS.ty(p.Td)], toValue: (y) => 15 + ((PS.base - y) / 150) * 30 },
    { key: "v", axis: "x", at: (p) => [PS.ax + clamp(p.v * 45, 10, 180), 126], toValue: (x) => (x - PS.ax) / 45 },
  ],
  render: (p, o) => {
    const th = (t: number, x: number, label: string, col: string) => {
      const y = PS.ty(t);
      return (
        <g>
          <rect x={x} y={30} width={18} height={162} rx={9} fill={GREYS.light} />
          <rect x={x + 4} y={y} width={10} height={PS.base - y + 6} rx={5} style={{ fill: col }} />
          <circle cx={x + 9} cy={200} r={13} style={{ fill: col }} />
          <T x={x + 9} y={234} anchor="middle" fill={INK} weight={700}>
            {label}
          </T>
          <T x={x + 9} y={20} anchor="middle" fill={INK} weight={700}>
            {`${num(t, 1)}°`}
          </T>
        </g>
      );
    };
    const y305 = PS.ty(30.5);
    const y335 = PS.ty(33.5);
    const len = clamp(p.v * 45, 10, 180);
    const status = ["Compliant", "Increase air velocity", "Stop work"][o.status];
    return (
      <g>
        {/* statutory wet-bulb lines */}
        <line x1={92} x2={134} y1={y305} y2={y305} style={{ stroke: INK }} strokeWidth={2} strokeDasharray="5 4" />
        <line x1={92} x2={134} y1={y335} y2={y335} style={{ stroke: BAD }} strokeWidth={2} />
        <T x={138} y={y305 + 16}>30.5</T>
        <T x={138} y={y335 + 13} fill={BAD_TEXT}>33.5</T>
        {th(p.Td, 40, "Dry", U.deep)}
        {th(o.tw, 100, "Wet", U.mid)}
        <T x={PS.ax} y={46} fill={INK} weight={700}>
          Air velocity
        </T>
        {[0, 1, 2].map((i) => (
          <Arrow key={i} x1={PS.ax} y1={66 + i * 16} x2={PS.ax + len} y2={66 + i * 16} color={p.v >= 1 ? OK : INK3} width={2} head={10} />
        ))}
        <T x={PS.ax} y={170}>{`v ${num(p.v, 1, "m/s")} · RH ${num(o.rh, 0, "%")}`}</T>
        <T x={PS.ax} y={204} fill={o.status === 0 ? OK_TEXT : o.status === 2 ? BAD_TEXT : INK} weight={800} size={20}>
          {status}
        </T>
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
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["gr", "jtr"],
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
  animated: true,
  // §5.6 redraw (v3e): Graham's scale on top, composition bars below, ratio line at the bottom (lesson hotspots).
  v3: { viewH: 240 },
  render: (p, o) => {
    // equal bands for the 4 classes; the value sits linearly inside its band
    const B = [0, 0.5, 1, 2, 3];
    const bw = 80;
    const gx = (v: number) => {
      const c = clamp(v, 0, 3);
      const i = Math.min(3, B.findIndex((b, j) => c < B[j + 1]) === -1 ? 3 : B.findIndex((b, j) => c < B[j + 1]));
      return 40 + i * bw + ((c - B[i]) / (B[i + 1] - B[i])) * bw;
    };
    const zones = [
      { t: "Normal", c: OK_LIGHT },
      { t: "Heating", c: ORANGE.light },
      { t: "Serious", c: ORANGE.mid },
      { t: "Fire", c: BAD_LIGHT },
    ];
    const bars = [
      { k: "N₂", v: o.n2, txt: num(o.n2, 2, "%"), c: GREYS.light },
      { k: "O₂", v: p.o2, txt: num(p.o2, 2, "%"), c: U.light },
      { k: "CO₂ ×10", v: p.co2 * 10, txt: num(p.co2, 2, "%"), c: GREYS.mid },
      { k: "CO ×100", v: (p.co / 1e4) * 100, txt: num(p.co, 0, "ppm"), c: BAD_LIGHT },
    ];
    return (
      <g>
        <T x={40} y={22} fill={INK} weight={700}>
          Graham’s ratio
        </T>
        {zones.map((z, i) => (
          <g key={z.t}>
            <rect x={40 + i * bw + 1} y={32} width={bw - 2} height={28} rx={6} fill={z.c} />
            <T x={40 + i * bw + bw / 2} y={52} anchor="middle" fill={ON_LIGHT} weight={700}>
              {z.t}
            </T>
          </g>
        ))}
        {[0.5, 1, 2].map((v, i) => (
          <T key={v} x={40 + (i + 1) * bw} y={82} anchor="middle">
            {String(v)}
          </T>
        ))}
        {Number.isFinite(o.gr) && (
          <g>
            <line x1={gx(o.gr)} x2={gx(o.gr)} y1={26} y2={66} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
            <circle cx={gx(o.gr)} cy={26} r={px(4)} style={{ fill: INK }} />
          </g>
        )}
        <T x={40} y={106} fill={INK} weight={700}>
          Sample composition
        </T>
        {bars.map((g, i) => {
          const w = clamp(g.v * 3.6, 2, 320);
          const label = `${g.k} ${g.txt}`;
          const inside = w > textW(label) + 16;
          const y = 116 + i * 26;
          return (
            <g key={g.k}>
              <rect x={40} y={y} width={w} height={22} rx={5} fill={g.c} />
              <T x={inside ? 48 : 48 + w} y={y + 17} fill={inside ? ON_LIGHT : INK2} weight={600}>
                {label}
              </T>
            </g>
          );
        })}
        <T x={40} y={232} fill={o.grc >= 2 ? BAD_TEXT : INK} weight={800}>
          {Number.isFinite(o.gr) ? `GR ${num(o.gr, 2)} · JTR ${num(o.jtr, 2)}` : "No O₂ deficiency"}
        </T>
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
  animated: true,
  // §5.6 redraw (v3e): the roadway arch, floor dust band and cloud keep their legacy places (lesson hotspots).
  v3: { viewH: 240 },
  render: (p, o, t) => {
    const frac = clamp(o.inc / 100, 0, 1);
    const ok = o.inc >= o.req;
    return (
      <g>
        <path d="M 30 200 L 30 90 Q 200 20 370 90 L 370 200 Z" style={{ fill: U.light, stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
        <T x={200} y={86} anchor="middle" fill={ON_LIGHT} weight={700}>
          Roadway dust sample
        </T>
        {/* settled dust on the floor: stone dust share (white) vs coal dust */}
        <rect x={30} y={188} width={340} height={12} fill={GREYS.deep} />
        <rect x={30} y={188} width={340 * frac} height={12} fill="#FFFFFF" stroke={GREYS.deep} strokeWidth={1.5} />
        {/* raised cloud */}
        {Array.from({ length: 36 }).map((_, i) => (
          <circle key={i} cx={44 + ((i * 37 + t * (8 + (i % 5) * 3)) % 312)} cy={118 + ((i * 23) % 56) + Math.sin(t + i) * 3} r={3} fill={i / 36 < frac ? "#FFFFFF" : GREYS.deep} stroke={i / 36 < frac ? GREYS.mid : "none"} strokeWidth={1} />
        ))}
        <T x={200} y={230} anchor="middle" fill={ok ? OK_TEXT : BAD_TEXT} weight={800}>
          {`${num(o.inc, 1, "%")} incombustible (target ${num(o.req, 0, "%")})`}
        </T>
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
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["margin", "npsha"],
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
  animated: true,
  // §5.6 redraw (v3e): sump, pump, rising main and the NPSH column keep their legacy places (lesson hotspots).
  v3: { viewH: 240 },
  handles: [{ key: "lift", axis: "y", at: (p) => [214, 164 - clamp(p.lift * 8, -20, 70)], toValue: (y) => (164 - y) / 8 }],
  render: (p, o, t) => {
    const cav = o.margin < 0;
    const off = clamp(p.lift * 8, -20, 70);
    return (
      <g>
        <rect x={20} y={180} width={120} height={50} rx={8} style={{ fill: U.light }} />
        <T x={80} y={212} anchor="middle" fill={ON_LIGHT} weight={700}>
          Sump
        </T>
        <path d={`M120 215 L150 215 L150 ${180 - off}`} fill="none" stroke={GREYS.deep} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M212 ${164 - off} L240 ${164 - off} L240 20`} fill="none" stroke={GREYS.deep} strokeWidth={8} strokeLinejoin="round" />
        <path d={`M212 ${164 - off} L240 ${164 - off} L240 20`} fill="none" style={{ stroke: U.light }} strokeWidth={2.5} strokeDasharray="6 10" strokeDashoffset={-((t * (cav ? 6 : 30)) % 16)} strokeLinejoin="round" />
        <rect x={132} y={146 - off} width={80} height={34} rx={8} style={{ fill: cav ? BAD : U.deep }} />
        <T x={172} y={169 - off} anchor="middle" fill={cav ? ON_LIGHT : ON_DEEP} weight={700}>
          {`${o.stages}-stage`}
        </T>
        {cav && [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={148 + i * 12} cy={138 - off - (i % 2) * 6 - ((t * 20 + i * 4) % 12)} r={3} fill="#FFFFFF" style={{ stroke: BAD }} strokeWidth={1.5} />)}
        <T x={250} y={30} weight={700}>
          Rising main
        </T>
        <T x={250} y={72} fill={INK} weight={700}>
          {`Total head ${num(o.Ht, 0, "m")}`}
        </T>
        <T x={250} y={96}>{`Friction ${num(o.hf, 1, "m")}`}</T>
        <T x={250} y={152} fill={cav ? BAD_TEXT : o.margin < 0.5 ? INK : OK_TEXT} weight={800}>
          {`NPSHa ${num(o.npsha, 2, "m")}`}
        </T>
        <T x={250} y={176}>{`NPSHr ${num(p.npshr, 1, "m")}`}</T>
        <T x={250} y={204} fill={cav ? BAD_TEXT : OK_TEXT} weight={700}>
          {cav ? "Cavitation" : "No cavitation"}
        </T>
      </g>
    );
  },
};

export const U7_SIMS = [cowardSim, networkSim, fanSim, psychroSim, sponcomSim, dustSim, pumpSim];
