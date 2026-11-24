import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Plot, sample, clamp, Meter } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";

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
  handles: [{ key: "depth", axis: "y", at: (p) => [95, 40 + clamp(p.depth * 4.5, 10, 180)], toValue: (y) => (y - 40) / 4.5, color: "#F59E0B" }],
  render: (p, o, t) => {
    const bars = [
      { k: "Top-hammer", v: o.th, c: C.tech },
      { k: "DTH", v: o.dth, c: C.safe },
      { k: "Rotary", v: o.rot, c: C.hazard },
    ];
    const max = Math.max(...bars.map((b) => b.v), 0.5);
    const holeTop = 40;
    const holeBot = 40 + clamp(p.depth * 4.5, 10, 180);
    return (
      <g>
        <rect x={20} y={30} width={150} height={200} fill={MAT.rock} />
        <rect x={20} y={90} width={150} height={40} fill={MAT.shale} opacity={0.85} />
        <rect x={20} y={30} width={150} height={200} fill={MAT.rockShade} />
        <rect x={20} y={20} width={150} height={10} fill={MAT.soil} />
        <rect x={95 - (p.m === 2 ? 7 : 5)} y={holeTop - 10} width={p.m === 2 ? 14 : 10} height={holeBot - holeTop + 10} fill="#44403C" opacity={0.55} />
        <rect x={86} y={holeTop - 32} width={18} height={22} rx={3} fill={C.hazard} stroke="#B45309" filter="url(#f-shadow)" />
        <line x1={95} x2={95} y1={holeTop - 10} y2={holeBot} stroke="#334155" strokeWidth={p.m === 2 ? 8 : 4} />
        <line x1={95} x2={95} y1={holeTop - 10} y2={holeBot} stroke={MAT.metalH} strokeWidth={p.m === 2 ? 5 : 2} strokeDasharray="3 5" strokeDashoffset={-(t * 40) % 8} />
        {[0, 1, 2, 3].map((i) => {
          const a = t * 5 + i * 1.6;
          return <circle key={i} cx={95 + Math.cos(a) * (10 + i * 3)} cy={holeTop - 4 - ((t * 30 + i * 6) % 18)} r={1.4} fill="#A8A29E" />;
        })}
        {p.m === 0 &&
          Array.from({ length: o.rods }).map((_, i) => (
            <rect key={i} x={91} y={holeTop + i * 16.2 - 2} width={8} height={4} fill={C.crit} />
          ))}
        {p.m === 1 && <rect x={89} y={holeBot - 22} width={12} height={22} fill={C.safe} />}
        {p.m === 2 ? (
          <g transform={`rotate(${((t * 300) % 360).toFixed(0)} 95 ${holeBot})`}>
            <circle cx={95} cy={holeBot} r={9} fill={MAT.metal} stroke={C.ink} />
            {[0, 120, 240].map((a) => (
              <circle key={a} cx={95} cy={holeBot - 5} r={2.2} fill={C.ink} transform={`rotate(${a} 95 ${holeBot})`} />
            ))}
          </g>
        ) : (
          <polygon points={`88,${holeBot} 102,${holeBot} 95,${holeBot + 8}`} fill={MAT.metal} stroke={C.ink} strokeWidth={0.8} />
        )}
        <Txt x={112} y={holeBot + 3} size={8} mono weight={700}>
          {`${p.depth} m`}
        </Txt>
        <Txt x={22} y={226} size={7.5} fill={C.ink}>
          {p.m === 0 ? "couplings (red) absorb energy" : p.m === 1 ? "hammer sits behind the bit" : "thrust + rotation crush rock"}
        </Txt>
        <Txt x={195} y={30} size={9} weight={700} fill={C.slate}>
          PENETRATION RATE (m/min) at UCS {p.ucs}
        </Txt>
        {bars.map((b, i) => (
          <g key={b.k}>
            <rect x={195} y={45 + i * 40} width={(180 * b.v) / max} height={24} rx={5} fill={b.c} opacity={i === p.m ? 1 : 0.45} filter={i === p.m ? "url(#f-shadow)" : undefined} />
            <rect x={195} y={45 + i * 40} width={(180 * b.v) / max} height={9} rx={4} fill={MAT.glass} />
            <Txt x={(180 * b.v) / max > 110 ? 199 : 199 + (180 * b.v) / max} y={61 + i * 40} size={9} weight={800} fill={(180 * b.v) / max > 110 ? "white" : C.ink}>
              {`${b.k} ${b.v.toFixed(2)}`}
            </Txt>
          </g>
        ))}
        <Meter x={195} y={185} w={180} value={o.eta} max={1} color={o.eta < 0.6 ? C.hazard : C.safe} label="energy delivered to bit" />
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
  render: (p, o, t) => {
    const gx = (ob: number) => 30 + ((clamp(ob, -20, 20) + 20) / 40) * 340;
    const fumeCol = o.fume === 2 ? "#ea580c" : o.fume === 1 ? "#64748b" : "#e2e8f0";
    const front = o.vod > 0 ? 50 + ((t * 160) % 230) : 50;
    return (
      <g>
        <Txt x={30} y={20} size={9} weight={700} fill={C.slate}>
          OXYGEN BALANCE (%)
        </Txt>
        <defs>
          <linearGradient id="obg" x1="0" x2="1">
            <stop offset="0" stopColor="#64748b" />
            <stop offset="0.45" stopColor="#10b981" />
            <stop offset="0.55" stopColor="#10b981" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <rect x={30} y={28} width={340} height={14} rx={7} fill="url(#obg)" />
        <line x1={gx(0)} x2={gx(0)} y1={24} y2={46} stroke={C.ink} />
        <polygon points={`${gx(o.ob)},48 ${gx(o.ob) - 6},58 ${gx(o.ob) + 6},58`} fill={C.ink} />
        <Txt x={30} y={68} size={8} fill={C.slate}>
          −20 fuel-rich (CO)
        </Txt>
        <Txt x={370} y={68} size={8} anchor="end" fill={C.slate}>
          oxygen-rich (NOx) +20
        </Txt>
        <Txt x={30} y={92} size={9} weight={700} fill={C.slate}>
          BOREHOLE · Ø {p.d} mm
        </Txt>
        <rect x={40} y={94} width={240} height={clamp(p.d / 5, 6, 40) + 12} rx={3} fill={MAT.rock} />
        <rect x={50} y={100} width={220} height={clamp(p.d / 5, 6, 40)} fill="#fde68a" stroke={C.ink} />
        {o.vod > 0 && <rect x={50} y={100} width={Math.min(front - 50, 220)} height={clamp(p.d / 5, 6, 40)} fill={C.crit} opacity={0.75} />}
        {o.vod > 0 && front < 270 && (
          <g>
            <circle cx={front} cy={100 + clamp(p.d / 5, 6, 40) / 2} r={6 + clamp(p.d / 5, 6, 40) * 0.6} fill="#FDE68A" opacity={0.85} filter="url(#f-glow)" />
            {[1, 2].map((k) => (
              <path key={k} d={`M ${front - 4 - k * 9} ${94 - k * 3} Q ${front + 6 + k * 6} ${100 + clamp(p.d / 5, 6, 40) / 2} ${front - 4 - k * 9} ${106 + clamp(p.d / 5, 6, 40) + k * 3}`} fill="none" stroke="#F97316" strokeWidth={1.5} opacity={0.7 / k} />
            ))}
          </g>
        )}
        {[0, 1, 2].map((k) => {
          const ph = (t * 0.6 + k / 3) % 1;
          return <circle key={k} cx={320 + Math.sin(ph * 6 + k) * 8} cy={130 - ph * 30} r={10 + ph * 12} fill={fumeCol} opacity={0.35 * (1 - ph)} />;
        })}
        <ellipse cx={320} cy={115} rx={40} ry={22} fill={fumeCol} opacity={0.9} />
        <Txt x={320} y={118} size={8} anchor="middle" weight={700} fill={o.fume === 0 ? C.ink : "white"}>
          {o.fume === 2 ? "NOx" : o.fume === 1 ? "CO" : "clean"}
        </Txt>
        <Txt x={30} y={170} size={9} weight={700} fill={C.slate}>
          IMPEDANCE MATCH ρe·VOD vs ρr·Cp ({ROCKS[p.rock].name})
        </Txt>
        <rect x={30} y={178} width={clamp(o.ratio * 170, 0, 340)} height={12} rx={3} fill={C.tech} />
        <rect x={30} y={194} width={170} height={12} rx={3} fill={MAT.rock} />
        <rect x={30} y={194} width={170} height={12} rx={3} fill="#334155" opacity={0.55} />
        <Txt x={34} y={188} size={8} fill="white" weight={700}>
          explosive
        </Txt>
        <Txt x={34} y={204} size={8} fill="white" weight={700}>
          rock
        </Txt>
        <Txt x={30} y={226} size={10} weight={800} mono>
          {`transmitted ${o.tr.toFixed(0)}% · PD ${o.pd.toFixed(2)} GPa`}
        </Txt>
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
  handles: [{ key: "Hb", axis: "y", at: (p) => [34, 40 + p.Hb * 6], toValue: (y) => (y - 40) / 6, color: "#3B82F6" }],
  render: (p) => {
    const k = kuzRam(p);
    const sc = 120 / 20;
    const top = 40;
    const bot = top + p.Hb * sc;
    return (
      <g>
        <Txt x={15} y={20} size={9} weight={700} fill={C.slate}>
          BENCH SECTION
        </Txt>
        <polygon points={`15,${bot} 60,${top} 175,${top} 175,${bot + 30} 15,${bot + 30}`} fill={MAT.shale} />
        <polygon points={`15,${bot} 60,${top} 175,${top} 175,${bot + 30} 15,${bot + 30}`} fill={MAT.rockShade} />
        <line x1={60} y1={top} x2={175} y2={top} stroke="#57534E" strokeWidth={2} />
        {Array.from({ length: 7 }).map((_, i) => (
          <path key={i} d={`M ${10 + i * 7} ${bot + 2} l ${3 + (i % 3) * 2} -${3 + (i % 2) * 3} l ${3 + (i % 2) * 2} ${3 + (i % 3)} z`} fill="#A8A29E" stroke="#57534E" strokeWidth={0.6} />
        ))}
        {[0, 1, 2].map((r) => {
          const x = 60 + 18 + r * Math.min(p.B * sc * 1.4, 34);
          return (
            <g key={r}>
              <rect x={x - 2.5} y={top} width={5} height={k.T * sc} fill={MAT.sand} stroke="#78716C" strokeWidth={0.6} />
              <rect x={x - 2.5} y={top + k.T * sc} width={5} height={k.L * sc} fill={C.crit} filter="url(#f-glow)" />
            </g>
          );
        })}
        <Txt x={180} y={top + 6} size={7} fill={C.slate}>
          stemming
        </Txt>
        <Txt x={180} y={bot - 4} size={7} fill={C.crit}>
          charge
        </Txt>
        <Plot x={215} y={20} w={170} h={160} xmin={0} xmax={150} ymin={0} ymax={100} xlabel="size (cm)" ylabel="% passing">
          {(sx, sy) => (
            <g>
              <polyline points={sample((x) => 100 * k.pass(Math.max(x, 0.01)), 0, 150, 60, sx, sy)} fill="none" stroke={C.tech} strokeWidth={2.5} />
              <line x1={sx(100)} x2={sx(100)} y1={sy(0)} y2={sy(100)} stroke={C.crit} strokeDasharray="3 3" />
              <line x1={sx(clamp(k.x50, 0, 150))} x2={sx(clamp(k.x50, 0, 150))} y1={sy(0)} y2={sy(50)} stroke={C.ink} strokeDasharray="2 2" />
              <Txt x={sx(100) + 2} y={sy(10)} size={7} fill={C.crit}>
                1 m
              </Txt>
            </g>
          )}
        </Plot>
        <Txt x={15} y={225} size={10} weight={800} mono fill={k.over <= 3 ? C.safe : C.crit}>
          {`oversize ${k.over.toFixed(1)}% · X50 ${k.x50.toFixed(0)} cm`}
        </Txt>
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
  render: (p, o, t) => {
    const d = delayPlan(p);
    const T = d.total + 120;
    const ms = ((t % 4) / 4) * T;
    const x = (c: number) => 60 + c * 52;
    const y = (r: number) => 70 + r * 50;
    return (
      <g>
        <rect x={20} y={40} width={360} height={150} rx={4} fill={MAT.rock} />
        <rect x={20} y={40} width={360} height={150} rx={4} fill="#F5F5F4" opacity={0.45} />
        <Txt x={20} y={30} size={9} weight={700} fill={C.slate}>
          FREE FACE ↑ · initiation at front-left · t = {ms.toFixed(0)} ms
        </Txt>
        <rect x={20} y={40} width={360} height={4} fill={C.ink} />
        {Array.from({ length: ROWS }).map((_, r) => (
          <line key={r} x1={x(0)} x2={x(COLS - 1)} y1={y(r)} y2={y(r)} stroke={C.slate} strokeWidth={1.5} />
        ))}
        {Array.from({ length: ROWS - 1 }).map((_, r) => (
          <line key={r} x1={x(0)} x2={x(0)} y1={y(r)} y2={y(r + 1)} stroke={C.slate} strokeWidth={1.5} />
        ))}
        {d.holes.map((h) => {
          const signal = ms >= h.ts;
          const fired = ms >= h.td;
          const flash = fired && ms - h.td < 60;
          return (
            <g key={`${h.c}-${h.r}`}>
              {fired && ms - h.td < 400 && <circle cx={x(h.c)} cy={y(h.r)} r={10 + (ms - h.td) * 0.09} fill="none" stroke="#F97316" strokeWidth={2} opacity={1 - (ms - h.td) / 400} />}
              {h.risk && <circle cx={x(h.c)} cy={y(h.r)} r={13} fill="none" stroke={C.hazard} strokeWidth={2.5} strokeDasharray="4 2" />}
              <circle cx={x(h.c)} cy={y(h.r)} r={flash ? 11 : 8} fill={fired ? (flash ? C.crit : "#7f1d1d") : signal ? C.tech : "white"} stroke={C.ink} strokeWidth={1.5} />
              <Txt x={x(h.c)} y={y(h.r) + 22} size={7} anchor="middle" mono fill={C.slate}>
                {h.td}
              </Txt>
            </g>
          );
        })}
        <circle cx={30} cy={214} r={5} fill={C.tech} />
        <Txt x={40} y={217} size={8}>
          surface signal arrived
        </Txt>
        <circle cx={150} cy={214} r={5} fill={C.crit} />
        <Txt x={160} y={217} size={8}>
          detonated
        </Txt>
        <circle cx={240} cy={214} r={6} fill="none" stroke={C.hazard} strokeWidth={2} strokeDasharray="3 2" />
        <Txt x={250} y={217} size={8}>
          cut-off risk
        </Txt>
        <Txt x={20} y={234} size={8} fill={C.slate} mono>
          numbers = detonation time (ms)
        </Txt>
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
  handles: [{ key: "D", axis: "x", at: (p, o) => [40 + ((p.D - 50) / 1450) * 340, 198 - (Math.min(o.ppv, 40) / 40) * 180], toValue: (x) => 50 + ((x - 40) / 340) * 1450, color: "#3B82F6" }],
  render: (p, o) => (
    <Plot x={40} y={18} w={340} h={180} xmin={50} xmax={1500} ymin={0} ymax={40} xlabel="distance (m)" ylabel="PPV mm/s">
      {(sx, sy) => (
        <g>
          <polygon points={`${sx(50)},${sy(0)} ${sample((d) => Math.min(40, p.K * Math.pow(d / Math.sqrt(p.Q), -p.b)), 50, 1500, 80, sx, sy)} ${sx(1500)},${sy(0)}`} fill={C.tech} opacity={0.1} />
          <polyline points={sample((d) => Math.min(40, p.K * Math.pow(d / Math.sqrt(p.Q), -p.b)), 50, 1500, 80, sx, sy)} fill="none" stroke={C.tech} strokeWidth={2.5} strokeLinejoin="round" />
          <line x1={sx(50)} x2={sx(1500)} y1={sy(o.lim)} y2={sy(o.lim)} stroke={C.crit} strokeDasharray="6 4" strokeWidth={1.5} />
          <Txt x={sx(1500) - 4} y={sy(o.lim) - 4} size={8} anchor="end" fill={C.crit} weight={700}>
            {`limit ${o.lim} mm/s`}
          </Txt>
          <line x1={sx(500)} x2={sx(500)} y1={sy(0)} y2={sy(40)} stroke={C.hazard} strokeDasharray="2 3" />
          <Txt x={sx(500) + 3} y={sy(38)} size={7} fill={C.hazard}>
            500 m danger zone
          </Txt>
          <circle cx={sx(p.D)} cy={sy(Math.min(o.ppv, 40))} r={14} fill={o.ppv <= o.lim ? C.safe : C.crit} opacity={0.18} />
          <Arrow x1={sx(p.D)} y1={sy(0) - 2} x2={sx(p.D)} y2={sy(Math.min(o.ppv, 40)) + 8} color={C.slate} width={1} head={4} />
          <Txt x={sx(p.D) > 320 ? sx(p.D) - 14 : sx(p.D) + 14} anchor={sx(p.D) > 320 ? "end" : "start"} y={sy(Math.min(o.ppv, 40)) - 8} size={9} mono weight={800} fill={o.ppv <= o.lim ? C.safe : C.crit}>
            {`${o.ppv.toFixed(1)} mm/s`}
          </Txt>
        </g>
      )}
    </Plot>
  ),
};

export const U4_SIMS = [drillSim, explosiveSim, kuzRamSim, delaySim, vibeSim];
