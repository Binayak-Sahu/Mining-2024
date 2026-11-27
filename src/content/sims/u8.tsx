import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Plot, clamp, polyline, Dim, Stream } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";

/* ---------------- Closed traverse & Bowditch ---------------- */

const V: [number, number][] = [
  [0, 0],
  [120, 10],
  [210, 80],
  [190, 190],
  [70, 210],
  [-20, 120],
];
const SIGNS = [1, 1, -1, 1, -1, -1];

export function traverse(p: Record<string, number>) {
  const n = V.length;
  const legs = V.map((a, i) => {
    const b = V[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return { L: Math.hypot(dx, dy), brg: Math.atan2(dx, dy) };
  });
  const e = p.ang / 206265;
  const meas = legs.map((l, i) => {
    const L = l.L + (SIGNS[i] * p.tape) / 1000;
    const b = l.brg + (i + 1) * e;
    return { L, dE: L * Math.sin(b), dN: L * Math.cos(b) };
  });
  const sumE = meas.reduce((s, m) => s + m.dE, 0);
  const sumN = meas.reduce((s, m) => s + m.dN, 0);
  const P = meas.reduce((s, m) => s + m.L, 0);
  const mis = Math.hypot(sumE, sumN);
  const pts: [number, number][] = [[0, 0]];
  const cor: [number, number][] = [[0, 0]];
  meas.forEach((m, i) => {
    const [x, y] = pts[i];
    pts.push([x + m.dE, y + m.dN]);
    const [cx, cy] = cor[i];
    cor.push([cx + m.dE - (sumE * m.L) / P, cy + m.dN - (sumN * m.L) / P]);
  });
  return { mis, P, prec: mis > 0 ? P / mis : Infinity, pts, cor, angMis: n * p.ang };
}

export const bowditchSim: SimDef = {
  id: "u8-bowditch",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["prec", "angMis"],
  title: "Closed traverse — misclosure and Bowditch adjustment",
  params: [
    { key: "ang", label: "Angular error per station", min: 0, max: 60, step: 1, unit: "″", default: 20 },
    { key: "tape", label: "Distance error per leg", min: 0, max: 50, step: 1, unit: "mm", default: 15 },
    { key: "show", label: "Display", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "As measured" }, { value: 1, label: "Bowditch-adjusted" }] },
  ],
  compute: (p) => {
    const t = traverse(p);
    return { mis: t.mis, P: t.P, prec: t.prec, angMis: t.angMis };
  },
  outputs: [
    { key: "angMis", label: "Accumulated angular error", unit: "″", digits: 0 },
    { key: "mis", label: "Linear misclosure", unit: "m", digits: 3 },
    { key: "prec", label: "Precision", format: (v) => (Number.isFinite(v) ? `1 in ${Math.round(v).toLocaleString("en-IN")}` : "perfect"), tone: (v) => (v >= 10000 ? "ok" : v >= 5000 ? "warn" : "crit") },
    { key: "P", label: "Perimeter", unit: "m", digits: 1 },
  ],
  caption: "Bowditch: each leg's latitude and departure are corrected in proportion to its length — distributing the misclosure along the traverse.",
  render: (p) => {
    const t = traverse(p);
    const k = 0.85;
    const X = (x: number) => 60 + x * k;
    const Y = (y: number) => 215 - y * k;
    const ex = 400; // exaggeration of error for visibility
    const exag = (arr: [number, number][]) => arr.map(([x, y], i): [number, number] => [X(V[i % V.length][0] + (x - V[i % V.length][0]) * ex), Y(V[i % V.length][1] + (y - V[i % V.length][1]) * ex)]);
    const meas = exag(t.pts);
    const cor = exag(t.cor);
    const truth = [...V, V[0]].map(([x, y]): [number, number] => [X(x), Y(y)]);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#F0FDF4" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M-10 ${40 + i * 38} C 90 ${20 + i * 38}, 200 ${70 + i * 34}, 410 ${30 + i * 40}`} fill="none" stroke="#86EFAC" strokeWidth={1} opacity={0.8} />
        ))}
        <polyline points={polyline(truth)} fill="none" stroke="#CBD5E1" strokeWidth={6} strokeLinejoin="round" />
        {p.show ? <polyline points={polyline(cor)} fill="none" stroke={C.safe} strokeWidth={2.5} /> : <polyline points={polyline(meas)} fill="none" stroke={C.crit} strokeWidth={2.5} />}
        {!p.show && <line x1={meas[meas.length - 1][0]} y1={meas[meas.length - 1][1]} x2={meas[0][0]} y2={meas[0][1]} stroke={C.hazard} strokeWidth={2} strokeDasharray="3 2" />}
        {V.map(([x, y], i) => (
          <g key={i}>
            <path d={`M${X(x)} ${Y(y) - 7} l5 9 h-10 z`} fill={C.hazard} stroke="#92400E" strokeWidth={0.8} />
            <circle cx={X(x)} cy={Y(y)} r={2} fill={C.ink} />
            <Txt x={X(x) + 6} y={Y(y) - 4} size={8} mono>
              {String.fromCharCode(65 + i)}
            </Txt>
          </g>
        ))}
        <Txt x={250} y={30} size={9} weight={700} fill={C.slate}>
          errors exaggerated ×400
        </Txt>
        <Txt x={250} y={50} size={9} weight={700} fill={p.show ? C.safe : C.crit}>
          {p.show ? "— adjusted (closes)" : "— as measured (open)"}
        </Txt>
        <Txt x={250} y={66} size={9} fill={C.slate}>
          ▬ true traverse
        </Txt>
        <Txt x={250} y={100} size={14} weight={900} mono fill={t.prec >= 10000 ? C.safe : t.prec >= 5000 ? C.hazard : C.crit}>
          {Number.isFinite(t.prec) ? `1 : ${Math.round(t.prec)}` : "closed"}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Weisbach triangle ---------------- */

export const weisbachSim: SimDef = {
  id: "u8-weisbach",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["err", "beta"],
  title: "Shaft plumbing — Weisbach triangle error control",
  params: [
    { key: "c", label: "Wire separation W₁W₂", min: 1, max: 6, step: 0.1, unit: "m", default: 3 },
    { key: "b", label: "Instrument to near wire", min: 0.5, max: 10, step: 0.1, unit: "m", default: 4 },
    { key: "al", label: "Measured Weisbach angle α", min: 10, max: 3600, step: 10, unit: "″", default: 300 },
    { key: "d", label: "Angle measuring error", min: 0.5, max: 10, step: 0.5, unit: "″", default: 2 },
  ],
  compute: (p) => {
    const beta = (p.b / p.c) * p.al;
    const err = (p.b / p.c) * p.d;
    return { beta, err, ratio: p.b / p.c, ok: p.al <= 3600 && err <= 1 ? 1 : 0 };
  },
  outputs: [
    { key: "beta", label: "Angle at far wire β = (b/c)·α", unit: "″", digits: 0 },
    { key: "ratio", label: "b / c", digits: 2, tone: (v) => (v <= 0.5 ? "ok" : "warn") },
    { key: "err", label: "Orientation error carried underground", unit: "″", digits: 2, tone: (v) => (v <= 1 ? "ok" : v <= 3 ? "warn" : "crit") },
  ],
  caption: "Sine rule with small angles: β ≈ (b/c)·α, so any error in α is multiplied by b/c. Keep the instrument close to the near wire, wires far apart, and α under ~1°.",
  handles: [{ key: "b", axis: "x", at: (p) => [360 - p.c * 22 - p.b * 22, 132], toValue: (x, p) => (360 - p.c * 22 - x) / 22, color: "#F59E0B" }],
  render: (p) => {
    const k = 22;
    const y = 120;
    const xW2 = 360;
    const xW1 = xW2 - p.c * k;
    const xC = xW1 - p.b * k;
    const off = clamp(p.al / 60, 2, 50);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.rock} />
        <rect x={0} y={0} width={400} height={240} fill="#F8FAFC" opacity={0.6} />
        <circle cx={(xW1 + xW2) / 2} cy={y} r={Math.max(60, (p.c * k) / 2 + 20) + 6} fill="#9CA3AF" />
        <circle cx={(xW1 + xW2) / 2} cy={y} r={Math.max(60, (p.c * k) / 2 + 20) + 6} fill={MAT.hatch} />
        <circle cx={(xW1 + xW2) / 2} cy={y} r={Math.max(60, (p.c * k) / 2 + 20)} fill="#1E293B" />
        <Txt x={(xW1 + xW2) / 2} y={y - Math.max(60, (p.c * k) / 2 + 20) + 14} size={8} anchor="middle" fill="#CBD5E1" weight={700}>
          SHAFT
        </Txt>
        <Stream d={`M${xC} ${y} L${xW2} ${y - off}`} color="#38BDF8" width={1.5} speed={0.7} />
        <Stream d={`M${xC} ${y} L${xW1} ${y}`} color="#38BDF8" width={1.5} speed={0.7} />
        <line x1={xW1} y1={y} x2={xW2} y2={y - off} stroke="#F8FAFC" strokeWidth={2} />
        <circle cx={xW1} cy={y} r={5} fill={C.crit} stroke="#FECACA" strokeWidth={1.5} filter="url(#f-glow)" />
        <circle cx={xW2} cy={y - off} r={5} fill={C.crit} stroke="#FECACA" strokeWidth={1.5} filter="url(#f-glow)" />
        <Txt x={xW1} y={y + 18} size={9} anchor="middle" weight={800} fill="#F8FAFC">
          W₁
        </Txt>
        <Txt x={xW2} y={y - off - 10} size={9} anchor="middle" weight={800} fill="#F8FAFC">
          W₂
        </Txt>
        <polygon points={`${xC - 7},${y + 12} ${xC + 7},${y + 12} ${xC},${y - 2}`} fill={C.hazard} stroke={C.ink} />
        <Txt x={xC} y={y + 26} size={9} anchor="middle" weight={800}>
          C (theodolite)
        </Txt>
        <Dim x1={xC} y1={y + 40} x2={xW1} y2={y + 40} label={`b ${p.b} m`} />
        <Dim x1={xW1} y1={y + 56} x2={xW2} y2={y + 56} label={`c ${p.c} m`} />
        <Txt x={20} y={30} size={10} weight={800}>
          α = {p.al}″ (exaggerated)
        </Txt>
      </g>
    );
  },
};

/* ---------------- Comminution: Bond / Rittinger / Kick ---------------- */

export function bond(p: Record<string, number>) {
  const F = p.F * 1000;
  const W = 10 * p.Wi * (1 / Math.sqrt(p.P) - 1 / Math.sqrt(F));
  return { W, power: W * p.tph, rr: F / p.P };
}

export const bondSim: SimDef = {
  id: "u8-bond",
  title: "Comminution energy — Bond's third theory",
  params: [
    { key: "F", label: "Feed size F80", min: 2, max: 200, step: 1, unit: "mm", default: 100 },
    { key: "P", label: "Product size P80", min: 50, max: 5000, step: 5, unit: "µm", default: 150 },
    { key: "Wi", label: "Bond work index", min: 5, max: 25, step: 0.5, unit: "kWh/t", default: 14 },
    { key: "tph", label: "Throughput", min: 50, max: 2000, step: 10, unit: "t/h", default: 500 },
  ],
  compute: (p) => bond(p),
  outputs: [
    { key: "W", label: "Specific energy", unit: "kWh/t", digits: 2 },
    { key: "power", label: "Mill power", unit: "kW", digits: 0, tone: (v) => (v > 8000 ? "warn" : "ok") },
    { key: "rr", label: "Reduction ratio F80/P80", digits: 0 },
  ],
  caption: "Rittinger (E ∝ new surface, 1/x) suits fine grinding; Kick (E ∝ log ratio) suits coarse crushing; Bond (E ∝ 1/√x) sits between and is the industry design standard.",
  animated: true,
  handles: [
    { key: "F", axis: "x", at: (p) => [30 + ((Math.log10(p.F * 1000) - 1) / (Math.log10(300000) - 1)) * 340, 40], toValue: (x) => Math.pow(10, 1 + ((x - 30) / 340) * (Math.log10(300000) - 1)) / 1000, color: "#0F172A" },
    { key: "P", axis: "x", at: (p) => [30 + ((Math.log10(p.P) - 1) / (Math.log10(300000) - 1)) * 340, 40], toValue: (x) => Math.pow(10, 1 + ((x - 30) / 340) * (Math.log10(300000) - 1)), color: "#3B82F6" },
  ],
  render: (p, o, t) => {
    const lx = (um: number) => 30 + ((Math.log10(um) - 1) / (Math.log10(300000) - 1)) * 340;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        <Txt x={30} y={24} size={9} weight={700} fill={C.slate}>
          PARTICLE SIZE (log scale)
        </Txt>
        <rect x={30} y={32} width={340} height={16} fill="url(#sizeg)" rx={8} />
        <defs>
          <linearGradient id="sizeg" x1="0" x2="1">
            <stop offset="0" stopColor="#e0e7ff" />
            <stop offset="1" stopColor="#57534e" />
          </linearGradient>
        </defs>
        {[10, 100, 1000, 10000, 100000].map((u) => (
          <Txt key={u} x={lx(u)} y={62} size={7} anchor="middle" mono fill={C.slate}>
            {u >= 1000 ? `${u / 1000} mm` : `${u} µm`}
          </Txt>
        ))}
        <Arrow x1={lx(p.F * 1000)} y1={80} x2={lx(p.P) + 6} y2={80} color={C.crit} width={3} />
        <circle cx={lx(p.F * 1000)} cy={40} r={6} fill={C.ink} />
        <circle cx={lx(p.P)} cy={40} r={6} fill={C.tech} />
        <Txt x={lx(p.F * 1000)} y={96} size={8} anchor="middle" weight={700}>
          F80
        </Txt>
        <Txt x={lx(p.P)} y={96} size={8} anchor="middle" weight={700} fill={C.tech}>
          P80
        </Txt>
        <circle cx={90} cy={165} r={47} fill={MAT.metalH} stroke={C.ink} strokeWidth={2} filter="url(#f-shadow)" />
        <circle cx={90} cy={165} r={41} fill="#E2E8F0" />
        <g transform={`rotate(${((t * 60) % 360).toFixed(0)} 90 165)`}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x={88} y={124} width={4} height={6} fill="#64748B" transform={`rotate(${a} 90 165)`} />
          ))}
        </g>
        {Array.from({ length: 9 }).map((_, i) => {
          // charge cascades up the rising side and tumbles back
          const a = ((t * 1.3 + i / 9) % 1) * Math.PI * 1.1 + Math.PI * 0.35;
          const rr = 18 + (i % 3) * 7;
          return <circle key={i} cx={90 + Math.cos(a) * rr} cy={170 + Math.sin(a) * rr * 0.8} r={5.5} fill="#475569" stroke="#1E293B" strokeWidth={0.6} />;
        })}
        <Txt x={90} y={226} size={8} anchor="middle" weight={700}>
          ball mill
        </Txt>
        <Txt x={170} y={140} size={10} weight={800}>
          W = 10·Wi(1/√P − 1/√F)
        </Txt>
        <Txt x={170} y={164} size={14} weight={900} mono>
          {`${o.W.toFixed(2)} kWh/t`}
        </Txt>
        <Txt x={170} y={186} size={14} weight={900} mono fill={o.power > 8000 ? C.hazard : C.ink}>
          {`${(o.power / 1000).toFixed(2)} MW`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Coal washability ---------------- */

const FRACS = [
  { lo: 1.3, hi: 1.4, m: 10, a: 8 },
  { lo: 1.4, hi: 1.45, m: 12, a: 13 },
  { lo: 1.45, hi: 1.5, m: 14, a: 17 },
  { lo: 1.5, hi: 1.55, m: 13, a: 21 },
  { lo: 1.55, hi: 1.6, m: 11, a: 26 },
  { lo: 1.6, hi: 1.7, m: 12, a: 32 },
  { lo: 1.7, hi: 1.8, m: 8, a: 40 },
  { lo: 1.8, hi: 1.9, m: 6, a: 50 },
  { lo: 1.9, hi: 2.4, m: 14, a: 70 },
];

export function wash(p: Record<string, number>) {
  let y = 0;
  let ya = 0;
  for (const f of FRACS) {
    // fraction of this density band reporting to floats (ideal partition = density below cut-point)
    const mid = (f.lo + f.hi) / 2;
    let part: number;
    if (p.Ep <= 0.001) part = Math.max(0, Math.min(1, (p.rho - f.lo) / (f.hi - f.lo)));
    else part = 1 / (1 + Math.exp((1.0986 * (mid - p.rho)) / p.Ep));
    y += f.m * part;
    ya += f.m * f.a * part;
  }
  const headA = FRACS.reduce((s, f) => s + f.m * f.a, 0) / 100;
  let ngm = 0;
  for (const f of FRACS) {
    const lo = Math.max(f.lo, p.rho - 0.1);
    const hi = Math.min(f.hi, p.rho + 0.1);
    if (hi > lo) ngm += (f.m * (hi - lo)) / (f.hi - f.lo);
  }
  const cleanAsh = y > 0 ? ya / y : 0;
  const rejAsh = 100 - y > 0 ? (headA * 100 - ya) / (100 - y) : 0;
  const cls = ngm < 7 ? 0 : ngm < 10 ? 1 : ngm < 15 ? 2 : ngm < 20 ? 3 : ngm < 25 ? 4 : 5;
  return { y, cleanAsh, rejAsh, ngm, cls, headA };
}

const DIFF = ["Simple", "Moderately difficult", "Difficult", "Very difficult", "Exceedingly difficult", "Formidable"];

export const washSim: SimDef = {
  id: "u8-wash",
  title: "Coal washability — cut-point, yield, ash and near-gravity material",
  params: [
    { key: "rho", label: "Separation density (cut-point)", min: 1.4, max: 1.9, step: 0.01, unit: "g/cc", default: 1.7 },
    { key: "Ep", label: "Separator probable error Ep", min: 0, max: 0.15, step: 0.01, default: 0 },
  ],
  compute: (p) => wash(p),
  outputs: [
    { key: "y", label: "Clean coal yield", unit: "%", digits: 1 },
    { key: "cleanAsh", label: "Clean coal ash", unit: "%", digits: 1, tone: (v) => (v <= 17 ? "ok" : "warn") },
    { key: "rejAsh", label: "Rejects ash", unit: "%", digits: 1 },
    { key: "ngm", label: "Near-gravity material ±0.1", unit: "%", digits: 1 },
    { key: "cls", label: "Ease of washing (Bird)", format: (v) => DIFF[v], tone: (v) => (v <= 1 ? "ok" : v <= 3 ? "warn" : "crit") },
  ],
  caption: "Float–sink data of a high-ash Indian coking coal (head ash ≈ 30 %). Ep = 0 is an ideal separator; real dense-medium cyclones achieve Ep ≈ 0.02–0.05.",
  render: (p, o) => {
    const cum: [number, number][] = [[0, 0]];
    let m = 0;
    let ma = 0;
    for (const f of FRACS) {
      m += f.m;
      ma += f.m * f.a;
      cum.push([ma / m, m]);
    }
    return (
      <Plot x={40} y={14} w={340} h={190} xmin={0} xmax={35} ymin={0} ymax={100} xlabel="cumulative ash of floats (%)" ylabel="yield %">
        {(sx, sy) => (
          <g>
            <rect x={sx(0)} y={sy(100)} width={sx(17) - sx(0)} height={sy(0) - sy(100)} fill={C.safe} opacity={0.06} />
            <polygon points={polyline([[sx(0), sy(0)], ...cum.slice(1).map(([a, yv]): [number, number] => [sx(a), sy(yv)]), [sx(cum[cum.length - 1][0]), sy(0)]])} fill={C.tech} opacity={0.08} />
            <polyline points={polyline(cum.slice(1).map(([a, yv]) => [sx(a), sy(yv)]))} fill="none" stroke={C.tech} strokeWidth={2.5} strokeLinejoin="round" />
            {cum.slice(1).map(([a, yv], i) => (
              <circle key={i} cx={sx(a)} cy={sy(yv)} r={2.5} fill={C.tech} />
            ))}
            <line x1={sx(17)} x2={sx(17)} y1={sy(0)} y2={sy(100)} stroke={C.hazard} strokeDasharray="4 3" />
            <Txt x={sx(17) + 3} y={sy(95)} size={8} fill={C.hazard} weight={700}>
              17 % ash target
            </Txt>
            <circle cx={sx(clamp(o.cleanAsh, 0, 35))} cy={sy(o.y)} r={13} fill={o.cleanAsh <= 17 ? C.safe : C.crit} opacity={0.15} />
            <circle cx={sx(clamp(o.cleanAsh, 0, 35))} cy={sy(o.y)} r={7} fill={o.cleanAsh <= 17 ? C.safe : C.crit} stroke="white" strokeWidth={2} />
            <Txt x={sx(clamp(o.cleanAsh, 0, 35)) + 10} y={sy(o.y) + 4} size={9} weight={800} mono>
              {`${p.rho.toFixed(2)} g/cc`}
            </Txt>
          </g>
        )}
      </Plot>
    );
  },
};

/* ---------------- Earth leakage & restricted neutral ---------------- */

export function earth(p: Record<string, number>) {
  const vph = p.V / Math.sqrt(3);
  const If = vph / (p.Rn + p.Rf + p.Re);
  const Vt = If * p.Re;
  const tripped = If * 1000 >= p.trip ? 1 : 0;
  return { vph, If, Vt, tripped, Rreq: vph / 0.75 - p.Rf - p.Re };
}

export const earthSim: SimDef = {
  id: "u8-earth",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["If", "tripped"],
  title: "Earth fault on a UG feeder — restricted neutral & earth-leakage relay",
  params: [
    { key: "V", label: "System voltage", min: 550, max: 3300, step: 1, default: 550, options: [550, 1100, 3300].map((v) => ({ value: v, label: `${v} V` })) },
    { key: "Rn", label: "Neutral earthing resistor", min: 0, max: 3000, step: 1, unit: "Ω", default: 0 },
    { key: "Rf", label: "Fault resistance", min: 0.5, max: 50, step: 0.5, unit: "Ω", default: 2 },
    { key: "Re", label: "Frame-to-earth conductor resistance", min: 0.1, max: 5, step: 0.1, unit: "Ω", default: 1 },
    { key: "trip", label: "Earth-leakage relay setting", min: 50, max: 1000, step: 25, unit: "mA", default: 300 },
  ],
  compute: (p) => earth(p),
  outputs: [
    { key: "If", label: "Earth-fault current", unit: "A", digits: 3, tone: (v) => (v <= 0.75 ? "ok" : "crit") },
    { key: "Vt", label: "Touch voltage on frame", unit: "V", digits: 2, tone: (v) => (v > 50 ? "crit" : v > 25 ? "warn" : "ok") },
    { key: "tripped", label: "Relay", format: (v) => (v ? "TRIPS — supply isolated" : "Does not trip!"), tone: (v) => (v ? "ok" : "crit") },
    { key: "Rreq", label: "Resistor for 750 mA limit", unit: "Ω", digits: 0 },
  ],
  caption: "Underground coal mine systems commonly restrict earth-fault current to 750 mA via a neutral earthing resistor, with earth-leakage protection tripping well below that.",
  render: (p, o) => (
    <g>
      <rect x={0} y={0} width={400} height={240} fill="#F8FAFC" />
      <rect x={0} y={190} width={400} height={50} fill={MAT.soil} opacity={0.45} />
      {!o.tripped && <Stream d="M86 70 L318 70 L326 100 L335 110 L335 190 L60 190 L60 96" color={C.crit} width={2} speed={clamp(o.If / 20, 0.08, 1)} opacity={0.75} />}
      <circle cx={60} cy={70} r={26} fill={MAT.metalH} stroke={C.ink} strokeWidth={2} />
      <circle cx={52} cy={70} r={11} fill="none" stroke="#B45309" strokeWidth={2} />
      <circle cx={68} cy={70} r={11} fill="none" stroke="#B45309" strokeWidth={2} />
      <Txt x={60} y={74} size={9} anchor="middle" weight={800}>
        TX
      </Txt>
      <line x1={86} y1={70} x2={300} y2={70} stroke={C.ink} strokeWidth={2.5} />
      <Txt x={190} y={62} size={8} anchor="middle" mono>
        {`phase ${o.vph.toFixed(0)} V`}
      </Txt>
      <rect x={300} y={50} width={70} height={60} rx={8} fill={C.hazard} stroke={C.ink} filter="url(#f-shadow)" />
      <rect x={302} y={52} width={66} height={14} rx={6} fill={MAT.glass} />
      <Txt x={335} y={84} size={8} anchor="middle" weight={800}>
        MOTOR FRAME
      </Txt>
      <line x1={318} y1={70} x2={326} y2={100} stroke={C.crit} strokeWidth={3} />
      <Txt x={318} y={128} size={8} fill={C.crit} weight={700}>
        {`fault ${p.Rf} Ω`}
      </Txt>
      <line x1={335} y1={110} x2={335} y2={190} stroke={C.safe} strokeWidth={2.5} />
      <Txt x={330} y={160} size={8} anchor="end" fill={C.safe} weight={700}>
        {`earth conductor ${p.Re} Ω`}
      </Txt>
      <line x1={20} y1={190} x2={380} y2={190} stroke={C.safe} strokeWidth={3} />
      <Txt x={200} y={205} size={8} anchor="middle" fill={C.safe} weight={700}>
        EARTH
      </Txt>
      <line x1={60} y1={96} x2={60} y2={120} stroke={C.ink} strokeWidth={2} />
      <rect x={50} y={120} width={20} height={44} fill={p.Rn > 0 ? C.tech : "#e2e8f0"} stroke={C.ink} />
      <Txt x={78} y={146} size={8} weight={700} fill={C.tech}>
        {p.Rn > 0 ? `NER ${p.Rn} Ω` : "solidly earthed"}
      </Txt>
      <line x1={60} y1={164} x2={60} y2={190} stroke={C.ink} strokeWidth={2} />
      <rect x={110} y={100} width={64} height={30} rx={6} fill={o.tripped ? C.safe : C.crit} filter="url(#f-shadow)" />
      <Txt x={142} y={119} size={8} anchor="middle" fill="white" weight={800}>
        {o.tripped ? "ELR TRIP" : "ELR —"}
      </Txt>
      <Txt x={20} y={30} size={13} weight={900} mono fill={o.If <= 0.75 ? C.safe : C.crit}>
        {`If = ${o.If < 1 ? (o.If * 1000).toFixed(0) + " mA" : o.If.toFixed(1) + " A"}`}
      </Txt>
      <Txt x={20} y={230} size={9} mono fill={o.Vt > 50 ? C.crit : C.ink}>
        {`frame touch voltage ${o.Vt.toFixed(2)} V`}
      </Txt>
    </g>
  ),
};

/* ---------------- Koepe friction winder ---------------- */

export function koepe(p: Record<string, number>) {
  const g = 9.81;
  const M1 = p.skip + p.Q + p.rope;
  const M2 = p.skip + p.rope;
  const T1 = M1 * (g + p.a);
  const T2 = M2 * (g - p.a);
  const lim = Math.exp(p.mu * (p.wrap * Math.PI) / 180);
  const ratio = T1 / T2;
  const amax = (g * (lim * M2 - M1)) / (M1 + lim * M2);
  return { T1, T2, ratio, lim, margin: lim / ratio, amax };
}

export const koepeSim: SimDef = {
  id: "u8-koepe",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["margin", "ratio"],
  title: "Koepe friction winder — rope slip check",
  params: [
    { key: "Q", label: "Payload", min: 5, max: 40, step: 1, unit: "t", default: 20 },
    { key: "skip", label: "Skip (conveyance) mass", min: 10, max: 40, step: 1, unit: "t", default: 20 },
    { key: "rope", label: "Rope mass per side (balanced)", min: 5, max: 20, step: 1, unit: "t", default: 10 },
    { key: "a", label: "Acceleration / braking", min: 0, max: 1.5, step: 0.05, unit: "m/s²", default: 0.8 },
    { key: "mu", label: "Tread friction μ", min: 0.15, max: 0.35, step: 0.01, default: 0.25 },
    { key: "wrap", label: "Angle of wrap", min: 180, max: 200, step: 20, default: 180, options: [{ value: 180, label: "180°" }, { value: 200, label: "200° (deflection sheave)" }] },
  ],
  compute: (p) => koepe(p),
  outputs: [
    { key: "ratio", label: "T₁ / T₂", digits: 3 },
    { key: "lim", label: "Limit e^(μθ)", digits: 3 },
    { key: "margin", label: "Slip margin e^(μθ) / (T₁/T₂)", digits: 2, tone: (v) => (v >= 1.1 ? "ok" : v >= 1 ? "warn" : "crit") },
    { key: "amax", label: "Max a before slip", unit: "m/s²", digits: 2 },
  ],
  caption: "Euler–Eytelwein: no slip while T₁/T₂ ≤ e^(μθ). Worst cases: accelerating a loaded skip up, or emergency braking a loaded skip descending.",
  animated: true,
  render: (p, o, t) => {
    const cx = 200;
    const cy = 50;
    const r = 30;
    const slip = o.margin < 1;
    const travel = Math.sin(t * 0.6) * 12;
    const col = o.margin >= 1.1 ? C.safe : o.margin >= 1 ? C.hazard : C.crit;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
        <path d={`M ${cx - 60} 120 L ${cx - 44} 10 L ${cx + 44} 10 L ${cx + 60} 120`} fill="none" stroke="#475569" strokeWidth={3} />
        <path d={`M ${cx - 52} 65 L ${cx + 52} 65 M ${cx - 48} 38 L ${cx + 48} 38`} stroke="#94A3B8" strokeWidth={1.5} />
        <rect x={150} y={10} width={100} height={8} rx={2} fill={MAT.steel} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={6} filter={slip ? "url(#f-glow)" : undefined} />
        <g transform={`rotate(${((t * (slip ? 160 : 60)) % 360).toFixed(0)} ${cx} ${cy})`}>
          {[0, 60, 120].map((a) => (
            <line key={a} x1={cx - r + 4} y1={cy} x2={cx + r - 4} y2={cy} stroke="#334155" strokeWidth={2.5} transform={`rotate(${a} ${cx} ${cy})`} />
          ))}
        </g>
        <circle cx={cx} cy={cy} r={5} fill={MAT.metal} stroke={C.ink} />
        <line x1={cx - r} y1={cy} x2={cx - r} y2={170 + travel} stroke="#334155" strokeWidth={3} />
        <line x1={cx + r} y1={cy} x2={cx + r} y2={150 - travel} stroke="#334155" strokeWidth={3} />
        <rect x={cx - r - 16} y={170 + travel} width={32} height={40} rx={2} fill={MAT.coal} stroke="#0F172A" />
        <Txt x={cx - r} y={194 + travel} size={8} anchor="middle" fill="white" weight={800}>
          {`${p.Q} t`}
        </Txt>
        <rect x={cx + r - 16} y={150 - travel} width={32} height={34} rx={2} fill={MAT.metal} stroke="#475569" />
        <path d={`M ${cx - r} ${210 + travel} Q ${cx} 238 ${cx + r} ${184 - travel}`} fill="none" stroke={C.slate} strokeWidth={2} strokeDasharray="5 3" />
        <Txt x={cx} y={234} size={7} anchor="middle" fill={C.slate}>
          tail rope
        </Txt>
        <Arrow x1={cx - r - 30} y1={120} x2={cx - r - 30} y2={150} color={C.crit} width={2.5} />
        <Txt x={cx - r - 36} y={116} size={9} anchor="end" weight={800} mono fill={C.crit}>
          {`T₁ ${o.T1.toFixed(0)} kN`}
        </Txt>
        <Txt x={cx + r + 26} y={116} size={9} weight={800} mono fill={C.tech}>
          {`T₂ ${o.T2.toFixed(0)} kN`}
        </Txt>
        <Txt x={20} y={30} size={12} weight={900} mono fill={col}>
          {`T₁/T₂ ${o.ratio.toFixed(2)} vs e^μθ ${o.lim.toFixed(2)}`}
        </Txt>
        <Txt x={280} y={180} size={10} weight={800} fill={col}>
          {o.margin >= 1 ? "NO SLIP" : "ROPE SLIPS"}
        </Txt>
      </g>
    );
  },
};

export const U8_SIMS = [bowditchSim, weisbachSim, bondSim, washSim, earthSim, koepeSim];

/** Stokes terminal velocity (m/s) for diameter d (m), densities kg/m³, viscosity Pa·s. */
export function stokes(d: number, rs: number, rf: number, mu: number): number {
  return (9.81 * d * d * (rs - rf)) / (18 * mu);
}

