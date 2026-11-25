import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Plot, sample, clamp, rad, deg, polyline, heatColor, Cracks, SANS } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";

/** Abramowitz & Stegun 7.1.26 error function. */
export function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return s * y;
}

/* ---------------- Kirsch: stress around a circular opening ---------------- */

export const kirschSim: SimDef = {
  id: "u3-kirsch",
  title: "Kirsch solution — boundary stress around an opening",
  params: [
    { key: "H", label: "Depth", min: 50, max: 1500, step: 10, unit: "m", default: 400 },
    { key: "K", label: "Horizontal/vertical stress ratio K", min: 0.2, max: 3, step: 0.05, default: 0.5 },
    { key: "ucs", label: "Rock UCS", min: 20, max: 150, step: 5, unit: "MPa", default: 50 },
    { key: "T", label: "Rock tensile strength", min: 1, max: 10, step: 0.5, unit: "MPa", default: 4 },
  ],
  compute: (p) => {
    const sv = 0.025 * p.H;
    const side = sv * (3 - p.K);
    const roof = sv * (3 * p.K - 1);
    const sideFail = side >= p.ucs ? 2 : side >= 0.5 * p.ucs ? 1 : 0;
    const roofFail = roof >= p.ucs || roof <= -p.T ? 2 : roof >= 0.5 * p.ucs || roof < 0 ? 1 : 0;
    return { p: sv, side, roof, scf: Math.max(side, roof) / sv, sideFail, roofFail };
  },
  outputs: [
    { key: "p", label: "Vertical stress p", unit: "MPa", digits: 1 },
    { key: "side", label: "Sidewall σθ = p(3−K)", unit: "MPa", digits: 1, tone: (_, o) => (["ok", "warn", "crit"] as const)[o.sideFail] },
    { key: "roof", label: "Roof σθ = p(3K−1)", unit: "MPa", digits: 1, tone: (_, o) => (["ok", "warn", "crit"] as const)[o.roofFail] },
    { key: "sideFail", label: "Sidewalls", format: (v) => ["Stable", "Spalling onset", "Crushing / slabbing"][v], tone: (v) => (["ok", "warn", "crit"] as const)[v] },
    { key: "roofFail", label: "Roof", format: (v, o) => (v === 0 ? "Stable" : o.roof < 0 ? (v === 2 ? "Tensile failure" : "In tension") : v === 2 ? "Shear / guttering" : "High compression"), tone: (v) => (["ok", "warn", "crit"] as const)[v] },
  ],
  render: (p, o) => {
    const cx = 130;
    const cy = 122;
    const R = 52;
    const segs = [];
    for (let i = 0; i < 72; i++) {
      const a1 = (i / 72) * 2 * Math.PI;
      const a2 = ((i + 1) / 72) * 2 * Math.PI;
      const th = (a1 + a2) / 2;
      const s = o.p * (1 + p.K + 2 * (1 - p.K) * Math.cos(2 * th));
      const col = s < 0 ? (s <= -p.T ? "#1d4ed8" : "#60a5fa") : s >= p.ucs ? C.crit : s >= 0.5 * p.ucs ? C.hazard : C.safe;
      segs.push(
        <line key={i} x1={+(cx + R * Math.cos(a1)).toFixed(2)} y1={+(cy + R * Math.sin(a1)).toFixed(2)} x2={+(cx + R * Math.cos(a2)).toFixed(2)} y2={+(cy + R * Math.sin(a2)).toFixed(2)} stroke={col} strokeWidth={9} />,
      );
    }
    const vl = clamp(10 + o.p * 1.2, 10, 40);
    const hl = clamp(10 + o.p * p.K * 1.2, 6, 40);
    // Full Kirsch field σθ(r, θ) sampled on a grid → stress heatmap around the opening
    const cells = [];
    const G = 11;
    for (let gx = 20; gx < 240; gx += G)
      for (let gy = 12; gy < 232; gy += G) {
        const dx = gx + G / 2 - cx;
        const dy = gy + G / 2 - cy;
        const r = Math.hypot(dx, dy);
        if (r < R) continue;
        const th = Math.atan2(dy, dx);
        const a2 = (R * R) / (r * r);
        const s = (o.p / 2) * ((1 + p.K) * (1 + a2) + (1 - p.K) * (1 + 3 * a2 * a2) * Math.cos(2 * th));
        const col = s < 0 ? (s <= -p.T ? "#1d4ed8" : "#60a5fa") : heatColor(0.35 + 0.65 * clamp(s / p.ucs, 0, 1));
        cells.push(<rect key={`${gx}-${gy}`} x={gx} y={gy} width={G} height={G} fill={col} opacity={0.5} />);
      }
    const cracks = [];
    if (o.sideFail === 2) cracks.push({ x: cx - R, y: cy - 6, len: 30, angle: 200, seed: 3 }, { x: cx - R, y: cy + 8, len: 26, angle: 160, seed: 5 }, { x: cx + R, y: cy - 6, len: 30, angle: -20, seed: 7 }, { x: cx + R, y: cy + 8, len: 26, angle: 20, seed: 9 });
    if (o.roofFail === 2) cracks.push({ x: cx - 6, y: cy - R, len: 28, angle: -100, seed: 11 }, { x: cx + 8, y: cy - R, len: 24, angle: -70, seed: 13 }, { x: cx, y: cy + R, len: 24, angle: 90, seed: 15 });
    return (
      <g>
        <rect x={20} y={12} width={220} height={220} fill={MAT.rock} />
        <g clipPath="url(#kirsch-clip)">{cells}</g>
        <clipPath id="kirsch-clip">
          <rect x={20} y={12} width={220} height={220} rx={6} />
        </clipPath>
        {segs}
        <circle cx={cx} cy={cy} r={R - 4.5} fill="#0F172A" />
        <circle cx={cx} cy={cy + 6} r={R - 10} fill="url(#grad-lamp)" opacity={0.35} />
        <Txt x={cx} y={cy + 3} size={9} anchor="middle" weight={800} fill="#F8FAFC">
          OPENING
        </Txt>
        {cracks.length > 0 && <Cracks key={`${o.sideFail}${o.roofFail}`} cracks={cracks} color="#7F1D1D" width={2} />}
        <Arrow x1={cx} y1={14} x2={cx} y2={14 + vl} color={C.ink} width={3} />
        <Arrow x1={cx} y1={230} x2={cx} y2={230 - vl} color={C.ink} width={3} />
        <Txt x={cx + 6} y={26} size={9} weight={700} mono>
          p
        </Txt>
        <Arrow x1={22} y1={cy} x2={22 + hl} y2={cy} color={C.tech} width={3} />
        <Arrow x1={238} y1={cy} x2={238 - hl} y2={cy} color={C.tech} width={3} />
        <Txt x={26} y={cy - 8} size={9} weight={700} mono fill={C.tech}>
          Kp
        </Txt>
        <Txt x={250} y={30} size={9} weight={700} fill={C.slate}>
          BOUNDARY σθ
        </Txt>
        {[
          { c: "#1d4ed8", t: "tension ≥ T (fails)" },
          { c: "#60a5fa", t: "tension" },
          { c: C.safe, t: "< 0.5 UCS" },
          { c: C.hazard, t: "0.5–1.0 UCS" },
          { c: C.crit, t: "≥ UCS" },
        ].map((l, i) => (
          <g key={l.t}>
            <rect x={250} y={40 + i * 15} width={10} height={10} fill={l.c} />
            <Txt x={265} y={49 + i * 15} size={8}>
              {l.t}
            </Txt>
          </g>
        ))}
        <Txt x={250} y={140} size={9} mono>
          roof  = {o.roof.toFixed(1)} MPa
        </Txt>
        <Txt x={250} y={156} size={9} mono>
          side  = {o.side.toFixed(1)} MPa
        </Txt>
        <Txt x={250} y={172} size={9} mono>
          K = {p.K.toFixed(2)}
        </Txt>
        <Txt x={250} y={200} size={8} fill={C.slate}>
          K = 1 ⇒ uniform 2p
        </Txt>
        <Txt x={250} y={213} size={8} fill={C.slate}>
          K &lt; ⅓ ⇒ roof in tension
        </Txt>
      </g>
    );
  },
};

/* ---------------- Mohr–Coulomb vs Hoek–Brown ---------------- */

export function hb(gsi: number, mi: number, D = 0) {
  const mb = mi * Math.exp((gsi - 100) / (28 - 14 * D));
  const s = Math.exp((gsi - 100) / (9 - 3 * D));
  const a = 0.5 + (Math.exp(-gsi / 15) - Math.exp(-20 / 3)) / 6;
  return { mb, s, a };
}

export const failureSim: SimDef = {
  id: "u3-failure",
  title: "Failure envelopes — Mohr–Coulomb vs Hoek–Brown (σ1–σ3 space)",
  params: [
    { key: "c", label: "MC cohesion c", min: 0.5, max: 20, step: 0.5, unit: "MPa", default: 3 },
    { key: "phi", label: "MC friction angle φ", min: 20, max: 55, step: 1, unit: "°", default: 35 },
    { key: "sci", label: "HB intact UCS σci", min: 20, max: 200, step: 5, unit: "MPa", default: 60 },
    { key: "mi", label: "HB constant mi", min: 5, max: 30, step: 1, default: 10 },
    { key: "gsi", label: "GSI", min: 10, max: 100, step: 1, default: 60 },
    { key: "s3", label: "Confinement σ3", min: 0, max: 30, step: 0.5, unit: "MPa", default: 5 },
  ],
  compute: (p) => {
    const sp = Math.sin(rad(p.phi));
    const Nphi = (1 + sp) / (1 - sp);
    const scMC = (2 * p.c * Math.cos(rad(p.phi))) / (1 - sp);
    const mc = scMC + p.s3 * Nphi;
    const h = hb(p.gsi, p.mi);
    const hbv = p.s3 + p.sci * Math.pow((h.mb * p.s3) / p.sci + h.s, h.a);
    const scm = p.sci * Math.pow(h.s, h.a);
    return { Nphi, scMC, mc, hb: hbv, scm, mb: h.mb, s: h.s, a: h.a, diff: (100 * (mc - hbv)) / hbv };
  },
  outputs: [
    { key: "mc", label: "σ1 at failure (MC)", unit: "MPa", digits: 1 },
    { key: "hb", label: "σ1 at failure (HB)", unit: "MPa", digits: 1 },
    { key: "diff", label: "MC − HB", unit: "%", digits: 1, tone: (v) => (Math.abs(v) <= 3 ? "ok" : "warn") },
    { key: "scMC", label: "MC σc = 2c·cosφ/(1−sinφ)", unit: "MPa", digits: 1 },
    { key: "scm", label: "HB rock-mass σcm = σci·s^a", unit: "MPa", digits: 2 },
    { key: "mb", label: "mb / s", format: (v, o) => `${v.toFixed(2)} / ${o.s.toExponential(1)}` },
  ],
  handles: [{ key: "s3", axis: "x", at: (p) => [40 + (p.s3 / 30) * 340, 202], toValue: (x) => ((x - 40) / 340) * 30, color: "#64748B" }],
  render: (p, o) => {
    const ymax = Math.max(60, Math.ceil(((o.scMC + 30 * o.Nphi) * 1.05) / 20) * 20, Math.ceil((30 + p.sci * Math.pow((hb(p.gsi, p.mi).mb * 30) / p.sci + hb(p.gsi, p.mi).s, hb(p.gsi, p.mi).a)) / 20) * 20);
    const h = hb(p.gsi, p.mi);
    return (
      <Plot x={40} y={15} w={340} h={195} xmin={0} xmax={30} ymin={0} ymax={ymax} xlabel="σ3 (MPa)" ylabel="σ1 (MPa)">
        {(sx, sy) => (
          <g>
            <polygon points={`${sx(0)},${sy(0)} ${sample((s3) => Math.min(ymax, s3 + p.sci * Math.pow((h.mb * s3) / p.sci + h.s, h.a)), 0, 30, 60, sx, sy)} ${sx(30)},${sy(0)}`} fill={C.safe} opacity={0.1} />
            <polygon points={`${sx(0)},${sy(ymax)} ${sample((s3) => Math.min(ymax, s3 + p.sci * Math.pow((h.mb * s3) / p.sci + h.s, h.a)), 0, 30, 60, sx, sy)} ${sx(30)},${sy(ymax)}`} fill={C.crit} opacity={0.07} />
            <polyline points={sample((s3) => s3 + p.sci * Math.pow((h.mb * s3) / p.sci + h.s, h.a), 0, 30, 60, sx, sy)} fill="none" stroke={C.crit} strokeWidth={2.5} strokeLinejoin="round" />
            <polyline points={sample((s3) => o.scMC + s3 * o.Nphi, 0, 30, 2, sx, sy)} fill="none" stroke={C.tech} strokeWidth={2.5} strokeDasharray="6 4" />
            <line x1={sx(p.s3)} x2={sx(p.s3)} y1={sy(0)} y2={sy(ymax)} stroke={C.slate} strokeDasharray="2 3" />
            <circle cx={sx(p.s3)} cy={sy(o.hb)} r={9} fill={C.crit} opacity={0.15} />
            <circle cx={sx(p.s3)} cy={sy(o.hb)} r={4.5} fill={C.crit} stroke="white" strokeWidth={1.5} />
            <circle cx={sx(p.s3)} cy={sy(o.mc)} r={4.5} fill={C.tech} stroke="white" strokeWidth={1.5} />
            <Txt x={sx(2)} y={sy(0) - 8} size={8} weight={700} fill="#047857">
              stable (below envelope)
            </Txt>
            <Txt x={sx(12)} y={sy(ymax) + 14} size={9} weight={800} fill={C.crit}>
              — Hoek–Brown (curved)
            </Txt>
            <Txt x={sx(12)} y={sy(ymax) + 28} size={9} weight={800} fill={C.tech}>
              - - Mohr–Coulomb (linear)
            </Txt>
          </g>
        )}
      </Plot>
    );
  },
};

/* ---------------- RMR / Q / GSI scorer ---------------- */

export function ucsRating(u: number): number {
  return u > 250 ? 15 : u > 100 ? 12 : u > 50 ? 7 : u > 25 ? 4 : u > 5 ? 2 : u >= 1 ? 1 : 0;
}
export function rqdRating(r: number): number {
  return r >= 90 ? 20 : r >= 75 ? 17 : r >= 50 ? 13 : r >= 25 ? 8 : 3;
}
export function spacingRating(s: number): number {
  return s > 2 ? 20 : s > 0.6 ? 15 : s > 0.2 ? 10 : s > 0.06 ? 8 : 5;
}

const RMR_CLASS = [
  { min: 81, name: "I · Very good", support: "Generally no support except spot bolting." },
  { min: 61, name: "II · Good", support: "Local bolts in crown, 3 m long at 2.5 m spacing, occasional mesh." },
  { min: 41, name: "III · Fair", support: "Systematic bolts 4 m long at 1.5–2 m spacing in crown and walls; mesh in crown; 50–100 mm shotcrete." },
  { min: 21, name: "IV · Poor", support: "Systematic bolts 4–5 m at 1–1.5 m; mesh; 100–150 mm shotcrete; light ribs where required." },
  { min: -99, name: "V · Very poor", support: "Bolts 5–6 m at 1–1.5 m; 150–200 mm shotcrete; medium–heavy steel ribs; close invert." },
];

export function rmrClass(r: number) {
  return RMR_CLASS.findIndex((c) => r >= c.min);
}

export const rmrSim: SimDef = {
  id: "u3-rmr",
  title: "RMR (Bieniawski 1989) scorer with Q and GSI",
  params: [
    { key: "ucs", label: "Intact UCS", min: 1, max: 250, step: 1, unit: "MPa", default: 60 },
    { key: "rqd", label: "RQD", min: 0, max: 100, step: 1, unit: "%", default: 65 },
    { key: "sp", label: "Discontinuity spacing", min: 0.02, max: 3, step: 0.01, unit: "m", default: 0.3 },
    { key: "cond", label: "Condition of discontinuities (0–30)", min: 0, max: 30, step: 1, default: 12 },
    { key: "gw", label: "Groundwater", min: 0, max: 15, step: 1, default: 7, options: [{ value: 15, label: "Dry" }, { value: 10, label: "Damp" }, { value: 7, label: "Wet" }, { value: 4, label: "Dripping" }, { value: 0, label: "Flowing" }] },
    { key: "ori", label: "Joint orientation (tunnel)", min: -12, max: 0, step: 1, default: -5, options: [{ value: 0, label: "V.fav" }, { value: -2, label: "Fav" }, { value: -5, label: "Fair" }, { value: -10, label: "Unfav" }, { value: -12, label: "V.unfav" }] },
  ],
  compute: (p) => {
    const r1 = ucsRating(p.ucs);
    const r2 = rqdRating(p.rqd);
    const r3 = spacingRating(p.sp);
    const basic = r1 + r2 + r3 + p.cond + p.gw;
    const rmr = basic + p.ori;
    const q = Math.exp((rmr - 44) / 9);
    const gsi = basic - p.gw + 15 - 5; // RMR89 with dry groundwater rating, no orientation, minus 5
    return { r1, r2, r3, basic, rmr, q, gsi: clamp(gsi, 0, 100), cls: rmrClass(rmr) };
  },
  outputs: [
    { key: "rmr", label: "RMR (adjusted)", digits: 0, tone: (v) => (v > 60 ? "ok" : v > 40 ? "warn" : "crit") },
    { key: "cls", label: "Class", format: (v) => RMR_CLASS[v].name, tone: (v) => (v <= 1 ? "ok" : v === 2 ? "warn" : "crit") },
    { key: "q", label: "Q ≈ e^((RMR−44)/9)", digits: 2 },
    { key: "gsi", label: "GSI ≈ RMR89(dry) − 5", digits: 0 },
  ],
  caption: "Support guidance is Bieniawski's for a 10 m horseshoe tunnel; coal roadways in India are designed with the CMRI-ISM RMR and Systematic Support Rules.",
  render: (p, o) => {
    const parts = [
      { k: "UCS", v: o.r1, max: 15, c: "#6366f1" },
      { k: "RQD", v: o.r2, max: 20, c: "#0ea5e9" },
      { k: "Spac.", v: o.r3, max: 20, c: "#14b8a6" },
      { k: "Cond.", v: p.cond, max: 30, c: "#f59e0b" },
      { k: "Water", v: p.gw, max: 15, c: "#3b82f6" },
    ];
    let x = 30;
    const k = 3.4;
    return (
      <g>
        <Txt x={30} y={22} size={9} weight={700} fill={C.slate}>
          RATING STACK (max 100)
        </Txt>
        {parts.map((pt) => {
          const el = (
            <g key={pt.k}>
              <rect x={x} y={30} width={pt.v * k} height={28} fill={pt.c} />
              <rect x={x} y={30} width={pt.v * k} height={10} fill={MAT.glass} />
              {pt.v * k > 24 && (
                <Txt x={x + 3} y={48} size={8} fill="white" weight={800}>
                  {pt.v}
                </Txt>
              )}
            </g>
          );
          x += pt.v * k;
          return el;
        })}
        {p.ori < 0 && <rect x={x + p.ori * k} y={30} width={-p.ori * k} height={28} fill="url(#hatch)" />}
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#fecaca" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={C.crit} strokeWidth="3" />
          </pattern>
        </defs>
        <rect x={30} y={30} width={340} height={28} rx={2} fill="none" stroke={C.ink} />
        {parts.map((pt, i) => (
          <g key={pt.k}>
            <rect x={30 + i * 70} y={66} width={9} height={9} fill={pt.c} />
            <Txt x={42 + i * 70} y={74} size={7.5}>
              {`${pt.k} ${pt.v}/${pt.max}`}
            </Txt>
          </g>
        ))}
        <Txt x={30} y={100} size={9} weight={700} fill={C.slate}>
          CLASS SCALE
        </Txt>
        {[0, 20, 40, 60, 80].map((v, i) => (
          <g key={v}>
            <rect x={30 + v * 3.4} y={108} width={68} height={18} fill={["#991b1b", "#ef4444", "#f59e0b", "#10b981", "#047857"][i]} opacity={o.cls === 4 - i ? 1 : 0.35} filter={o.cls === 4 - i ? "url(#f-shadow)" : undefined} />
            <Txt x={64 + v * 3.4} y={121} size={8} anchor="middle" fill="white" weight={800}>
              {["V", "IV", "III", "II", "I"][i]}
            </Txt>
          </g>
        ))}
        <polygon points={`${30 + clamp(o.rmr, 0, 100) * 3.4},106 ${26 + clamp(o.rmr, 0, 100) * 3.4},98 ${34 + clamp(o.rmr, 0, 100) * 3.4},98`} fill={C.ink} />
        <Txt x={30} y={150} size={18} weight={900} mono>
          RMR {o.rmr.toFixed(0)}
        </Txt>
        <Txt x={150} y={150} size={11} weight={700}>
          {RMR_CLASS[o.cls].name}
        </Txt>
        <foreignObject x={30} y={160} width={345} height={70}>
          <div style={{ fontSize: 9, lineHeight: 1.3, color: "#334155", fontFamily: SANS }}>Support (10 m tunnel): {RMR_CLASS[o.cls].support}</div>
        </foreignObject>
      </g>
    );
  },
};

/* ---------------- Roof bolting: suspension & beam building ---------------- */

export const boltSim: SimDef = {
  id: "u3-bolt",
  title: "Roof bolting — suspension and beam-building",
  params: [
    { key: "mode", label: "Roof condition", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Unbolted laminations" }, { value: 1, label: "Fully bolted" }] },
    { key: "L", label: "Gallery width (span)", min: 3, max: 6, step: 0.1, unit: "m", default: 4.8 },
    { key: "t", label: "Weak immediate roof thickness", min: 0.3, max: 2.5, step: 0.1, unit: "m", default: 1.2 },
    { key: "n", label: "Number of laminations", min: 1, max: 6, step: 1, default: 5 },
    { key: "s", label: "Bolt spacing (square)", min: 0.8, max: 2, step: 0.1, unit: "m", default: 1.2 },
    { key: "cap", label: "Bolt anchorage capacity", min: 50, max: 200, step: 5, unit: "kN", default: 100 },
  ],
  compute: (p) => {
    const g = 25;
    const load = g * p.t * p.s * p.s;
    const fos = p.cap / load;
    const tl = p.mode ? p.t : p.t / p.n;
    const sigma = (g * p.L * p.L) / (2 * tl) / 1000; // MPa
    const sigT = 1.5;
    return { load, fos, sigma, ratio: sigma / sigT, len: p.t + 0.3, tl };
  },
  outputs: [
    { key: "load", label: "Dead load per bolt γ·t·s²", unit: "kN", digits: 1 },
    { key: "fos", label: "Suspension FOS", digits: 2, format: (v, _, p) => (p.mode ? v.toFixed(2) : "no bolts"), tone: (v, _, p) => (!p.mode ? "crit" : v >= 2 ? "ok" : v >= 1.5 ? "warn" : "crit") },
    { key: "sigma", label: "Max beam tension γL²/(2t)", unit: "MPa", digits: 2, tone: (_, o) => (o.ratio >= 1 ? "crit" : o.ratio > 0.6 ? "warn" : "ok") },
    { key: "len", label: "Min bolt length (t + 0.3 m anchor)", unit: "m", digits: 1 },
  ],
  caption: "Shale tensile strength taken as 1.5 MPa; γ = 25 kN/m³. Beam stress for a clamped beam under self-weight.",
  handles: [{ key: "L", axis: "x", at: (p) => [200 + (p.L * 55) / 2, 132], toValue: (x) => ((x - 200) * 2) / 55, color: "#F59E0B" }],
  render: (p, o) => {
    const k = 330 / 6;
    const x0 = 200 - (p.L * k) / 2;
    const x1 = 200 + (p.L * k) / 2;
    const yRoof = 120;
    const th = p.t * 28;
    const sag = clamp(o.ratio * 10, 0, 22);
    const layers = [];
    for (let i = 0; i < p.n; i++) {
      const lt = th / p.n;
      const y = yRoof - (i + 1) * lt;
      const gap = p.mode ? 0 : 2.2 * (p.n - i) * clamp(o.ratio, 0.2, 1.5);
      layers.push(<path key={i} d={`M 20 ${y} L ${x0} ${y} Q 200 ${y + lt + sag + gap} ${x1} ${y} L 380 ${y} L 380 ${y + lt} L ${x1} ${y + lt} Q 200 ${y + 2 * lt + sag + gap} ${x0} ${y + lt} L 20 ${y + lt} Z`} fill={i % 2 ? MAT.shale : MAT.sand} stroke="#78716c" strokeWidth={0.6} />);
    }
    const bolts = [];
    if (p.mode) {
      for (let x = x0 + (p.s * k) / 2; x < x1; x += p.s * k) bolts.push(<line key={x} x1={x} x2={x} y1={yRoof + sag * 0.3} y2={yRoof - th - 0.3 * 28} stroke={C.tech} strokeWidth={3} />);
    }
    return (
      <g>
        <rect x={20} y={20} width={360} height={yRoof - th - 20} fill={MAT.rock} />
        <rect x={20} y={20} width={360} height={yRoof - th - 20} fill="#57534E" opacity={0.45} />
        <Txt x={30} y={34} size={8} fill="white" weight={700}>
          COMPETENT STRATA (anchorage horizon)
        </Txt>
        {layers}
        <rect x={x0} y={yRoof} width={x1 - x0} height={70} fill="white" />
        <rect x={20} y={yRoof} width={x0 - 20} height={90} fill={C.coal} />
        <rect x={x1} y={yRoof} width={380 - x1} height={90} fill={C.coal} />
        <rect x={20} y={yRoof + 70} width={360} height={20} fill="#57534e" />
        {bolts}
        {o.ratio >= 1 && <Cracks key={`b${p.mode}${Math.round(o.ratio * 4)}`} cracks={[{ x: 200, y: yRoof + sag * 0.6, len: Math.min(th, 40), angle: -95, seed: 2 }, { x: x0 + 6, y: yRoof - 2, len: 22, angle: -60, seed: 6 }, { x: x1 - 6, y: yRoof - 2, len: 22, angle: -120, seed: 10 }]} color="#7F1D1D" width={2} />}
        <Txt x={200} y={yRoof + 40} size={10} anchor="middle" weight={800}>
          {`span ${p.L.toFixed(1)} m`}
        </Txt>
        <Txt x={200} y={yRoof + 56} size={9} anchor="middle" fill={o.ratio >= 1 ? C.crit : C.slate} mono>
          {p.mode ? "clamped into one thick beam" : `${p.n} free laminae × ${o.tl.toFixed(2)} m`}
        </Txt>
        <Txt x={30} y={232} size={8} fill={C.slate}>
          {p.mode ? "Bolts: suspend weak roof from strong strata AND clamp laminae into a composite beam." : "Laminae sag independently: each carries its own weight with its own small thickness."}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Pillar design ---------------- */

export const pillarSim: SimDef = {
  id: "u3-pillar",
  title: "Bord & pillar — tributary-area stress vs pillar strength",
  params: [
    { key: "f", label: "Strength formula", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Salamon–Munro" }, { value: 1, label: "CMRI (Sheorey)" }] },
    { key: "H", label: "Depth of cover", min: 50, max: 800, step: 10, unit: "m", default: 300 },
    { key: "w", label: "Pillar width (square, solid)", min: 8, max: 50, step: 1, unit: "m", default: 22 },
    { key: "B", label: "Gallery width", min: 3, max: 6, step: 0.1, unit: "m", default: 4.8 },
    { key: "h", label: "Working height", min: 1.5, max: 6, step: 0.1, unit: "m", default: 3 },
    { key: "sc", label: "Coal cube strength σc (CMRI)", min: 10, max: 50, step: 1, unit: "MPa", default: 30 },
  ],
  compute: (p) => {
    const sv = 0.025 * p.H;
    const sp = (sv * (p.w + p.B) ** 2) / (p.w * p.w);
    const sm = 7.176 * Math.pow(p.h, -0.66) * Math.pow(p.w, 0.46);
    const cmri = 0.27 * p.sc * Math.pow(p.h, -0.36) + (p.H / 250 + 1) * (p.w / p.h - 1);
    const S = p.f ? cmri : sm;
    const e = 1 - (p.w * p.w) / (p.w + p.B) ** 2;
    return { sv, sp, S, fos: S / sp, e: e * 100, wh: p.w / p.h };
  },
  outputs: [
    { key: "sp", label: "Pillar stress σp", unit: "MPa", digits: 2 },
    { key: "S", label: "Pillar strength S", unit: "MPa", digits: 2 },
    { key: "fos", label: "Factor of safety", digits: 2, tone: (v) => (v >= 1.5 ? "ok" : v >= 1.2 ? "warn" : "crit") },
    { key: "e", label: "Extraction (development)", unit: "%", digits: 1 },
    { key: "wh", label: "w/h ratio", digits: 1, tone: (v) => (v >= 4 ? "ok" : "warn") },
  ],
  handles: [{ key: "w", axis: "x", at: (p) => [115 + (30 * p.w) / (p.w + p.B), 115], toValue: (x, p) => { const pw = clamp(2 * (x - 115), 2, 58); return (pw * p.B) / (60 - pw); }, color: "#F59E0B" }],
  render: (p, o) => {
    const pitch = 60;
    const pw = (pitch * p.w) / (p.w + p.B);
    const col = o.fos >= 1.5 ? C.safe : o.fos >= 1.2 ? C.hazard : C.crit;
    const cells = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        cells.push(<rect key={`${i}${j}`} x={25 + i * pitch + (pitch - pw) / 2} y={25 + j * pitch + (pitch - pw) / 2} width={pw} height={pw} rx={2} fill={MAT.coal} stroke={col} strokeWidth={3} className={o.fos < 1 && i === 1 && j === 1 ? "shake" : undefined} />);
    return (
      <g>
        <rect x={25} y={25} width={180} height={180} rx={4} fill="#E9E5DA" />
        <rect x={25} y={25} width={180} height={180} rx={4} fill={MAT.hatch} opacity={0.25} />
        {cells}
        {o.fos < 1 && (
          <Cracks
            key={`f${Math.round(o.fos * 10)}`}
            cracks={[0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => ({ x: 25 + i * pitch + pitch / 2 - pw / 4, y: 25 + j * pitch + (pitch - pw) / 2 + 2, len: pw * 0.8, angle: 70 + ((i + j) % 2) * 30, seed: i * 3 + j + 1 })))}
            color="#FCA5A5"
            width={1.4}
          />
        )}
        <rect x={25 + pitch + (pitch - pw) / 2} y={25 + pitch + (pitch - pw) / 2} width={pw} height={pw} fill="none" stroke={C.tech} strokeWidth={1.5} strokeDasharray="4 3" />
        <rect x={25 + pitch} y={25 + pitch} width={pitch} height={pitch} fill={C.tech} opacity={0.12} />
        <Txt x={115} y={222} size={8} anchor="middle" fill={C.slate}>
          shaded = tributary area (w + B)² carried by one pillar
        </Txt>
        <Txt x={225} y={40} size={10} weight={800}>
          Tributary area
        </Txt>
        <Txt x={225} y={54} size={8} mono>
          σp = γH (w+B)² / w²
        </Txt>
        <Txt x={225} y={78} size={10} weight={800}>
          {p.f ? "CMRI (Sheorey)" : "Salamon–Munro"}
        </Txt>
        <Txt x={225} y={92} size={7.5} mono>
          {p.f ? "S = 0.27σc·h^-0.36 + (H/250+1)(w/h−1)" : "S = 7.176·h^-0.66·w^0.46"}
        </Txt>
        <Txt x={225} y={130} size={22} weight={900} mono fill={col}>
          FOS {o.fos.toFixed(2)}
        </Txt>
        <Txt x={225} y={150} size={8} fill={C.slate}>
          {o.fos >= 1.5 ? "meets common development target" : o.fos >= 1.2 ? "marginal — creep & spalling" : "pillar failure likely"}
        </Txt>
        <Txt x={225} y={176} size={9} mono>
          {`σp ${o.sp.toFixed(1)} vs S ${o.S.toFixed(1)} MPa`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Opencast slope: plane failure ---------------- */

export const slopeSim: SimDef = {
  id: "u3-slope",
  title: "Plane failure — limit equilibrium of a sliding block",
  params: [
    { key: "H", label: "Slope height", min: 10, max: 60, step: 1, unit: "m", default: 30 },
    { key: "pf", label: "Face angle ψf", min: 30, max: 80, step: 1, unit: "°", default: 60 },
    { key: "pp", label: "Failure plane dip ψp", min: 15, max: 60, step: 1, unit: "°", default: 35 },
    { key: "c", label: "Cohesion on plane", min: 0, max: 150, step: 5, unit: "kPa", default: 50 },
    { key: "phi", label: "Friction angle φ", min: 15, max: 45, step: 1, unit: "°", default: 30 },
    { key: "ru", label: "Pore-pressure ratio ru", min: 0, max: 0.5, step: 0.05, default: 0 },
  ],
  compute: (p) => {
    const g = 25;
    const daylight = p.pp < p.pf;
    const W = daylight ? 0.5 * g * p.H * p.H * (1 / Math.tan(rad(p.pp)) - 1 / Math.tan(rad(p.pf))) : 0;
    const A = p.H / Math.sin(rad(p.pp));
    const N = W * Math.cos(rad(p.pp)) * (1 - p.ru);
    const res = p.c * A + N * Math.tan(rad(p.phi));
    const drv = W * Math.sin(rad(p.pp));
    const fos = daylight ? res / drv : Infinity;
    return { W, A, fos, daylight: daylight ? 1 : 0 };
  },
  outputs: [
    { key: "W", label: "Block weight W", unit: "kN/m", digits: 0 },
    { key: "A", label: "Plane length A", unit: "m", digits: 1 },
    { key: "fos", label: "FOS", format: (v) => (Number.isFinite(v) ? v.toFixed(2) : "∞ (no daylight)"), tone: (v) => (v >= 1.3 ? "ok" : v >= 1.0 ? "warn" : "crit") },
    { key: "daylight", label: "Kinematics", format: (v) => (v ? "Plane daylights (ψp < ψf)" : "Plane does not daylight"), tone: (v) => (v ? "warn" : "ok") },
  ],
  caption: "FOS = [cA + W cosψp (1 − ru) tanφ] / (W sinψp), γ = 25 kN/m³, no tension crack.",
  handles: [{ key: "pf", axis: "x", at: (p) => [120 + (p.H * 2.4) / Math.tan(rad(p.pf)), 205 - p.H * 2.4], toValue: (x, p) => deg(Math.atan((p.H * 2.4) / Math.max(1, x - 120))), color: "#8B5CF6" }],
  render: (p, o) => {
    const k = 2.4;
    const toeX = 120;
    const toeY = 205;
    const Hp = p.H * k;
    const crestX = toeX + Hp / Math.tan(rad(p.pf));
    const topY = toeY - Hp;
    const planeX = toeX + Hp / Math.tan(rad(p.pp));
    const col = !o.daylight ? C.safe : o.fos >= 1.3 ? C.safe : o.fos >= 1 ? C.hazard : C.crit;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
        <polygon points={polyline([[0, toeY], [toeX, toeY], [crestX, topY], [400, topY], [400, 240], [0, 240]])} fill={MAT.shale} />
        <polygon points={polyline([[0, toeY], [toeX, toeY], [crestX, topY], [400, topY], [400, 240], [0, 240]])} fill={MAT.rockShade} />
        <polyline points={polyline([[0, toeY], [toeX, toeY], [crestX, topY], [400, topY]])} fill="none" stroke="#57534E" strokeWidth={2} strokeLinejoin="round" />
        {o.daylight ? (
          <polygon
            points={polyline(
              planeX <= 400
                ? [[toeX, toeY], [crestX, topY], [planeX, topY]]
                : [[toeX, toeY], [crestX, topY], [400, topY], [400, toeY - (400 - toeX) * Math.tan(rad(p.pp))]],
            )}
            fill={col}
            opacity={0.55}
            className={o.fos < 1 ? "shake" : undefined}
          />
        ) : null}
        {o.daylight && o.fos < 1 && (
          <Cracks key={`s${Math.round(o.fos * 20)}`} cracks={[{ x: Math.min(planeX, 396) - 4, y: topY, len: 26, angle: 100, seed: 4 }, { x: toeX + 30, y: toeY - 30 * Math.tan(rad(p.pp)), len: 40, angle: -p.pp, seed: 8 }]} color="#7F1D1D" width={2} />
        )}
        <line x1={toeX} y1={toeY} x2={Math.min(planeX, 400)} y2={planeX <= 400 ? topY : toeY - (400 - toeX) * Math.tan(rad(p.pp))} stroke={C.ink} strokeWidth={1.5} strokeDasharray="6 4" />
        {p.ru > 0 && <line x1={toeX} y1={toeY - 4} x2={400} y2={topY + (1 - p.ru * 2) * Hp * 0.8} stroke={C.tech} strokeWidth={2} strokeDasharray="8 4" />}
        <Txt x={toeX + 70} y={toeY - 70 * Math.tan(rad(p.pp)) + 14} size={8} fill={C.ink}>
          {`plane ψp ${p.pp}°`}
        </Txt>
        <Txt x={10} y={toeY - 6} size={8} weight={700} fill={C.slate}>
          PIT FLOOR
        </Txt>
        <Txt x={crestX + 6} y={topY - 6} size={8} weight={700} fill={C.slate}>
          {`CREST · face ${p.pf}°`}
        </Txt>
        <Txt x={20} y={30} size={20} weight={900} mono fill={col}>
          {Number.isFinite(o.fos) ? `FOS ${o.fos.toFixed(2)}` : "NO DAYLIGHT"}
        </Txt>
        {p.ru > 0 && (
          <Txt x={20} y={48} size={9} fill={C.tech} weight={700}>
            {`water: ru = ${p.ru.toFixed(2)}`}
          </Txt>
        )}
      </g>
    );
  },
};

/* ---------------- Subsidence trough (Knothe-type) ---------------- */

export const subsidenceSim: SimDef = {
  id: "u3-subsidence",
  title: "Subsidence trough — sub-critical, critical, super-critical",
  params: [
    { key: "H", label: "Depth of panel", min: 50, max: 600, step: 10, unit: "m", default: 200 },
    { key: "W", label: "Panel width", min: 20, max: 400, step: 5, unit: "m", default: 120 },
    { key: "m", label: "Extracted height", min: 1, max: 8, step: 0.5, unit: "m", default: 3 },
    { key: "d", label: "Angle of draw δ", min: 15, max: 40, step: 1, unit: "°", default: 30 },
    { key: "meth", label: "Goaf treatment", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Caving (a≈0.8)" }, { value: 1, label: "Hydraulic sand stowing (a≈0.15)" }] },
  ],
  compute: (p) => {
    const a = p.meth ? 0.15 : 0.8;
    const r = p.H * Math.tan(rad(p.d));
    const Wc = 2 * r;
    const S0 = a * p.m * erf((Math.sqrt(Math.PI) * p.W) / (2 * r));
    const ratio = p.W / Wc;
    return { a, r, Wc, S0, ratio, cls: ratio < 0.9 ? 0 : ratio <= 1.1 ? 1 : 2 };
  },
  outputs: [
    { key: "S0", label: "Max subsidence", unit: "m", digits: 2, tone: (v) => (v > 1 ? "crit" : v > 0.3 ? "warn" : "ok") },
    { key: "Wc", label: "Critical width 2H·tanδ", unit: "m", digits: 0 },
    { key: "ratio", label: "W / Wc", digits: 2 },
    { key: "cls", label: "Panel", format: (v) => ["Sub-critical", "Critical", "Super-critical"][v], tone: (v) => (v === 0 ? "ok" : v === 1 ? "warn" : "crit") },
  ],
  handles: [
    {
      key: "W",
      axis: "x",
      at: (p, o) => [200 + ((p.W / 2) * 185) / (p.W / 2 + 1.4 * o.r), 209],
      toValue: (x, p) => {
        const r = subsidenceSim.compute(p).r;
        const d = clamp(x - 200, 1, 184);
        return (2 * 1.4 * r * d) / (185 - d);
      },
      color: "#F59E0B",
    },
  ],
  render: (p, o) => {
    const span = p.W / 2 + 1.4 * o.r;
    const kx = 185 / span;
    const sx = (x: number) => 200 + x * kx;
    const surfY = 60;
    const ky = 12;
    const S = (x: number) => ((o.a * p.m) / 2) * (erf((Math.sqrt(Math.PI) * (x + p.W / 2)) / o.r) - erf((Math.sqrt(Math.PI) * (x - p.W / 2)) / o.r));
    const pts: [number, number][] = [];
    for (let i = 0; i <= 120; i++) {
      const x = -span + (2 * span * i) / 120;
      pts.push([sx(x), surfY + S(x) * ky]);
    }
    const panelY = 205;
    return (
      <g>
        <rect x={0} y={0} width={400} height={surfY} fill={MAT.sky} />
        <polygon points={polyline([[0, surfY], ...pts, [400, surfY], [400, 240], [0, 240]])} fill={MAT.sand} />
        <rect x={0} y={surfY + 60} width={400} height={40} fill={MAT.shale} opacity={0.8} />
        <rect x={0} y={surfY + 110} width={400} height={30} fill={MAT.sand} opacity={0.7} />
        <polyline points={polyline(pts)} fill="none" stroke="#65A30D" strokeWidth={4} />
        {[-0.9, -0.45, 0, 0.45, 0.9].map((f) => {
          const x = f * span * 0.9;
          const y = surfY + S(x) * ky;
          const slope = ((S(x + 1) - S(x - 1)) / 2) * ky * kx === 0 ? 0 : (Math.atan2((S(x + 1) - S(x - 1)) * ky, 2 * kx) * 180) / Math.PI;
          return (
            <g key={f} transform={`translate(${sx(x).toFixed(1)} ${y.toFixed(1)}) rotate(${(slope * 4).toFixed(1)})`}>
              <rect x={-6} y={-10} width={12} height={10} fill="#F8FAFC" stroke="#475569" strokeWidth={0.8} />
              <path d="M-8 -10 L0 -16 L8 -10 Z" fill="#B91C1C" />
            </g>
          );
        })}
        <line x1={0} x2={400} y1={surfY} y2={surfY} stroke={C.slate} strokeDasharray="3 3" />
        <polyline points={polyline(pts)} fill="none" stroke={C.crit} strokeWidth={2.5} />
        <rect x={sx(-p.W / 2)} y={panelY} width={p.W * kx} height={8} fill={p.meth ? C.sand : MAT.goaf} stroke={C.ink} />
        <rect x={0} y={panelY} width={sx(-p.W / 2)} height={8} fill={MAT.coal} />
        <rect x={sx(p.W / 2)} y={panelY} width={400 - sx(p.W / 2)} height={8} fill={MAT.coal} />
        <line x1={sx(-p.W / 2)} y1={panelY} x2={sx(-p.W / 2 - o.r)} y2={surfY} stroke={C.tech} strokeDasharray="4 3" />
        <line x1={sx(p.W / 2)} y1={panelY} x2={sx(p.W / 2 + o.r)} y2={surfY} stroke={C.tech} strokeDasharray="4 3" />
        <Txt x={Math.min(sx(p.W / 2 + o.r) + 4, 396)} y={surfY - 6} size={8} fill={C.tech} anchor={sx(p.W / 2 + o.r) + 54 > 396 ? "end" : "start"}>
          limit of draw
        </Txt>
        <Txt x={200} y={panelY + 22} size={8} anchor="middle" weight={700}>
          {`PANEL W = ${p.W} m at ${p.H} m (depth schematic)`}
        </Txt>
        <Txt x={10} y={20} size={11} weight={900} mono fill={C.crit}>
          {`Smax = ${o.S0.toFixed(2)} m`}
        </Txt>
        <Txt x={10} y={36} size={9} mono>
          {`a·m = ${(o.a * p.m).toFixed(2)} m`}
        </Txt>
      </g>
    );
  },
};

export const U3_SIMS = [kirschSim, failureSim, rmrSim, boltSim, pillarSim, slopeSim, subsidenceSim];
