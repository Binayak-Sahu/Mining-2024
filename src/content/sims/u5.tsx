import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, clamp, rad, deg, polyline, Cracks, Stream } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";
import { T, INK, INK3, ON_LIGHT, GREYS, U, OK_TEXT, BAD_TEXT, OK_LIGHT, BAD_LIGHT, DimLine, pts, num } from "@/components/sim/v3";
import { SvgTex } from "@/components/sim/Tex";

/* ---------------- Pit section: stripping ratio vs BESR ---------------- */

export function pitSection(p: Record<string, number>) {
  const cot = 1 / Math.tan(rad(p.beta));
  const Wc = p.Wf + 2 * p.t * cot;
  const Ws = Wc + 2 * p.H * cot;
  const coalA = ((p.Wf + Wc) / 2) * p.t;
  const wasteA = ((Wc + Ws) / 2) * p.H;
  const tonnes = coalA * 1.5;
  const sr = wasteA / tonnes;
  const besr = p.margin / p.sc;
  return { Wc, Ws, coalA, wasteA, tonnes, sr, besr, profit: p.margin - sr * p.sc };
}

export const pitSim: SimDef = {
  id: "u5-pit",
  title: "Pit cross-section — stripping ratio vs break-even stripping ratio",
  params: [
    { key: "H", label: "Overburden thickness", min: 20, max: 300, step: 1, unit: "m", default: 60 },
    { key: "t", label: "Coal thickness", min: 2, max: 30, step: 0.5, unit: "m", default: 10 },
    { key: "Wf", label: "Pit floor width", min: 50, max: 500, step: 10, unit: "m", default: 200 },
    { key: "beta", label: "Overall pit slope", min: 25, max: 60, step: 1, unit: "°", default: 45 },
    { key: "margin", label: "Coal margin before stripping", min: 300, max: 3000, step: 50, unit: "₹/t", default: 1200 },
    { key: "sc", label: "Stripping cost", min: 80, max: 300, step: 5, unit: "₹/m³", default: 150 },
  ],
  compute: (p) => {
    const r = pitSection(p);
    return { sr: r.sr, besr: r.besr, profit: r.profit, tonnes: r.tonnes, wasteA: r.wasteA };
  },
  outputs: [
    { key: "sr", label: "Stripping ratio", unit: "m³/t", digits: 2, tone: (v, o) => (v <= o.besr ? "ok" : "crit") },
    { key: "besr", label: "BESR = margin / stripping cost", unit: "m³/t", digits: 2 },
    { key: "profit", label: "Profit after stripping", unit: "₹/t", digits: 0, tone: (v) => (v >= 0 ? "ok" : "crit") },
    { key: "tonnes", label: "Coal per m of strike", unit: "t", digits: 0 },
  ],
  animated: true,
  // §5.6d redraw (v3.2): same origin and default scale as the legacy section (surface y 40, centre x 200), so hotspots stay put.
  primary: ["sr", "besr"],
  v3: { viewH: 250 },
  render: (p, _o, t) => {
    const r = pitSection(p);
    const k = Math.min(340 / r.Ws, 150 / (p.H + p.t));
    const cx = 200;
    const top = 40;
    const yC = top + p.H * k;
    const yF = yC + p.t * k;
    const ok = r.sr <= r.besr;
    const u = (t * 0.12) % 1;
    const xa = cx - (p.Wf * k) / 2;
    const xb = cx - (r.Ws * k) / 2;
    const tx = xa + (xb - xa) * u;
    const ty = yF + (top - yF) * u;
    const wedgeH = yC - top;
    const wx = cx + (r.Ws * k) / 2 - ((r.Ws - r.Wc) * k) / 4; // right wall at mid-depth
    const ly = 218;
    return (
      <g>
        <clipPath id="u5-pit-clip">
          <rect x={0} y={0} width={400} height={250} rx={12} />
        </clipPath>
        <g clipPath="url(#u5-pit-clip)">
          {/* host rock: overburden, coal seam, floor rock, full width */}
          <rect x={0} y={top} width={400} height={wedgeH} style={{ fill: U.light }} />
          <rect x={0} y={yC} width={400} height={yF - yC} fill={GREYS.mid} />
          <rect x={0} y={yF} width={400} height={250 - yF} fill={GREYS.light} />
        </g>
        {/* waste to strip (state) and coal to win */}
        <polygon data-state={ok ? "met" : "unmet"} points={pts([[cx - (r.Ws * k) / 2, top], [cx + (r.Ws * k) / 2, top], [cx + (r.Wc * k) / 2, yC], [cx - (r.Wc * k) / 2, yC]])} style={{ fill: ok ? OK_LIGHT : BAD_LIGHT, stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" />
        <polygon points={pts([[cx - (r.Wc * k) / 2, yC], [cx + (r.Wc * k) / 2, yC], [cx + (p.Wf * k) / 2, yF], [cx - (p.Wf * k) / 2, yF]])} fill={GREYS.deep} style={{ stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={0} x2={400} y1={top} y2={top} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />
        {/* haul truck climbing the left wall */}
        <g transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)})`}>
          <rect x={-9} y={-10} width={18} height={9} rx={2} style={{ fill: U.deep }} />
          <circle cx={-5} cy={0} r={2.5} fill={ON_LIGHT} />
          <circle cx={5} cy={0} r={2.5} fill={ON_LIGHT} />
        </g>
        {wedgeH >= 44 && (
          <T x={cx} y={top + wedgeH / 2 + 6} anchor="middle" fill={ON_LIGHT} weight={700}>
            Waste
          </T>
        )}
        {wedgeH >= 44 && wx - 36 > cx + 40 && (
          <SvgTex x={wx - 10} y={top + wedgeH / 2 + 6} tex={"\\beta"} size={18} anchor="end" color={ON_LIGHT} />
        )}
        {/* legend: what the two fills are, and whether the pit pays */}
        <rect x={24} y={ly - 14} width={16} height={16} rx={3} fill={ok ? OK_LIGHT : BAD_LIGHT} data-state={ok ? "met" : "unmet"} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={46} y={ly} fill={ON_LIGHT}>Waste</T>
        <rect x={116} y={ly - 14} width={16} height={16} rx={3} fill={GREYS.deep} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />
        <T x={138} y={ly} fill={ON_LIGHT}>Coal</T>
        <g data-state={ok ? "met" : "unmet"}>
          <SvgTex x={376} y={ly} tex={ok ? "\\mathrm{SR}\\le\\mathrm{BESR}" : "\\mathrm{SR}>\\mathrm{BESR}"} size={18} anchor="end" color={ok ? OK_TEXT : BAD_TEXT} />
        </g>
      </g>
    );
  },
};

/* ---------------- Dragline cut & cast ---------------- */

export function dragline(p: Record<string, number>) {
  const e = 12;
  const c = 5;
  const As = p.s * p.H * p.W;
  const ta = Math.tan(rad(p.a));
  const h = Math.sqrt(As * ta);
  const b = (2 * h) / ta;
  const hb = b / 2;
  const Rreq = p.W + e + c + hb;
  const d = Math.max(0, Rreq - p.R);
  let frac = 0;
  if (d > 0) frac = d <= hb ? (d * d) / (2 * hb * hb) : 1 - Math.pow(2 * hb - d, 2) / (2 * hb * hb);
  return { e, c, As, h, b, Rreq, d, reh: clamp(frac, 0, 1) * 100 };
}

export const draglineSim: SimDef = {
  id: "u5-dragline",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["reh", "Rreq"],
  title: "Dragline side-casting — spoil geometry and rehandle",
  params: [
    { key: "H", label: "Overburden thickness", min: 10, max: 60, step: 1, unit: "m", default: 30 },
    { key: "W", label: "Cut width", min: 20, max: 80, step: 1, unit: "m", default: 40 },
    { key: "s", label: "Swell factor", min: 1.1, max: 1.5, step: 0.05, default: 1.3 },
    { key: "a", label: "Spoil angle of repose", min: 30, max: 40, step: 1, unit: "°", default: 37 },
    { key: "R", label: "Dragline operating radius", min: 40, max: 120, step: 1, unit: "m", default: 70 },
  ],
  compute: (p) => {
    const d = dragline(p);
    return { h: d.h, b: d.b, Rreq: d.Rreq, reh: d.reh };
  },
  outputs: [
    { key: "h", label: "Spoil pile height", unit: "m", digits: 1 },
    { key: "b", label: "Spoil base width", unit: "m", digits: 1 },
    { key: "Rreq", label: "Reach needed to spoil peak", unit: "m", digits: 1, tone: (v, _, p) => (v <= p.R ? "ok" : "crit") },
    { key: "reh", label: "Spoil needing rehandle", unit: "%", digits: 1, tone: (v) => (v === 0 ? "ok" : v < 15 ? "warn" : "crit") },
  ],
  caption: "Dragline sits 12 m back from the highwall crest; 5 m clearance from the exposed coal edge to the spoil toe.",
  animated: true,
  // §5.6 redraw (v3e): same scale and frame as the legacy section (x = 200 + 1.5·m, surface y 70), so hotspots stay put.
  v3: { viewH: 240 },
  render: (p, _o, t) => {
    const d = dragline(p);
    const k = 1.5;
    const X = (x: number) => 200 + x * k;
    const surf = 70;
    const coalTop = surf + p.H * k;
    const coalBot = coalTop + 6;
    const tip = Math.max(10, coalBot - d.h * k - 18);
    const peakX = X(p.W + d.e - Math.min(p.R, d.Rreq));
    const sp = -d.c - d.b / 2 + d.d;
    const hp = d.h * k;
    const mx = X(p.W + d.e);
    const uu = (Math.sin(t * 1.1) + 1) / 2;
    const bx = X(p.W / 2) + (X(sp) - X(p.W / 2)) * uu;
    const by = Math.min(coalTop - 8, coalBot - hp - 10) * uu + (coalTop - 8) * (1 - uu) - 18 * Math.sin(uu * Math.PI);
    return (
      <g>
        {/* bench: overburden and seam beyond the cut, floor under everything */}
        <rect x={X(p.W)} y={surf} width={400 - X(p.W)} height={coalTop - surf} style={{ fill: U.light }} />
        <rect x={0} y={coalTop} width={400} height={6} fill={GREYS.deep} />
        <rect x={0} y={coalBot} width={400} height={240 - coalBot} fill={GREYS.light} />
        {/* ground surface (a path: the lesson's dragline pin sits on it by design) */}
        <path d={`M${X(p.W)} ${surf} H400`} style={{ stroke: INK }} strokeWidth={2.5} />
        {/* the cut (removed) */}
        <rect x={X(0)} y={surf} width={X(p.W) - X(0)} height={coalTop - surf} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="5 5" />
        {/* spoil pile */}
        <polygon points={pts([[X(sp - d.b / 2), coalBot], [X(sp), coalBot - hp], [X(sp + d.b / 2), coalBot]])} fill={d.reh > 0 ? BAD_LIGHT : GREYS.mid} stroke={ON_LIGHT} strokeWidth={2} strokeLinejoin="round" />
        <T x={X(sp)} y={coalBot + 22} anchor="middle" fill={ON_LIGHT} weight={700}>
          Spoil
        </T>
        <T x={(X(0) + X(p.W)) / 2} y={surf + 20} anchor="middle">
          Cut
        </T>
        {/* dragline: house, tub, boom, rope and bucket */}
        <rect x={mx - 13} y={surf - 17} width={26} height={14} rx={3} style={{ fill: U.deep }} />
        <rect x={mx - 15} y={surf - 4} width={30} height={4} rx={2} fill={GREYS.deep} />
        <path d={`M${mx} ${surf - 10} L${peakX} ${tip}`} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        <line x1={peakX} y1={tip} x2={bx} y2={by} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <path d={`M${bx - 7} ${by} h14 l-2 7 h-10 z`} fill={GREYS.deep} />
        <DimLine x1={mx} y1={surf - 34} x2={peakX} y2={surf - 34} />
        <T x={(mx + peakX) / 2} y={surf - 42} anchor="middle" fill={INK} weight={700}>
          {`R ${num(p.R, 0, "m")}`}
        </T>
        {d.reh > 0 && (
          <T x={8} y={232} fill={ON_LIGHT} weight={800}>
            Spoil on coal → rehandle
          </T>
        )}
      </g>
    );
  },
};

/* ---------------- Truck–shovel match factor ---------------- */

export function truckShovel(p: Record<string, number>) {
  const passT = p.bucket * 0.9 * 1.8;
  const passes = Math.ceil(p.cap / passT);
  const tLoad = (passes * p.cyc) / 60;
  const tHaul = (p.L / 20) * 60;
  const tRet = (p.L / 35) * 60;
  const tCycle = tLoad + tHaul + tRet + 1.5;
  const mf = (p.N * tLoad) / tCycle;
  const truckProd = (p.N * p.cap * 60) / tCycle;
  const shovelProd = (p.cap * 60) / tLoad;
  return { passes, tLoad, tCycle, mf, prod: Math.min(truckProd, shovelProd), idle: mf < 1 ? (1 - mf) * 100 : 0, queue: mf > 1 ? (1 - 1 / mf) * 100 : 0 };
}

export const matchSim: SimDef = {
  id: "u5-match",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["mf", "prod"],
  title: "Truck–shovel match factor and queueing",
  animated: true,
  params: [
    { key: "N", label: "Trucks in fleet", min: 2, max: 20, step: 1, unit: "", default: 8 },
    { key: "cap", label: "Truck payload", min: 35, max: 240, step: 5, unit: "t", default: 100 },
    { key: "bucket", label: "Shovel bucket", min: 5, max: 40, step: 1, unit: "m³", default: 15 },
    { key: "cyc", label: "Shovel swing cycle", min: 25, max: 45, step: 1, unit: "s", default: 30 },
    { key: "L", label: "One-way haul distance", min: 0.5, max: 6, step: 0.1, unit: "km", default: 2.5 },
  ],
  compute: (p) => {
    const r = truckShovel(p);
    return { passes: r.passes, tCycle: r.tCycle, mf: r.mf, prod: r.prod, idle: r.idle, queue: r.queue };
  },
  outputs: [
    { key: "passes", label: "Passes to fill truck", digits: 0, tone: (v) => (v >= 3 && v <= 6 ? "ok" : "warn") },
    { key: "tCycle", label: "Truck cycle", unit: "min", digits: 1 },
    { key: "mf", label: "Match factor", digits: 2, tone: (v) => (Math.abs(v - 1) <= 0.05 ? "ok" : "warn") },
    { key: "prod", label: "Production", unit: "t/h", digits: 0 },
    { key: "idle", label: "Shovel idle / truck queue", format: (v, o) => `${v.toFixed(0)}% / ${o.queue.toFixed(0)}%`, tone: (v, o) => (v > 10 || o.queue > 10 ? "warn" : "ok") },
  ],
  caption: "Loaded 20 km/h, empty 35 km/h, dump + spot 1.5 min; bucket fill 0.9, loose density 1.8 t/m³. MF = N·t_load / t_cycle (one shovel).",
  render: (p, o, t) => {
    const r = truckShovel(p);
    const loop = (u: number): [number, number] => {
      // rounded rectangle loop: shovel left (60,120), dump right (340,120)
      const per = u % 1;
      if (per < 0.5) return [60 + per * 2 * 280, 90];
      return [340 - (per - 0.5) * 2 * 280, 150];
    };
    const trucks = [];
    const speed = 1 / (r.tCycle * 0.6);
    const waiting = Math.max(0, Math.round(p.N - r.tCycle / r.tLoad));
    for (let i = 0; i < p.N; i++) {
      if (i < waiting) {
        trucks.push(<rect key={i} x={20 - i * 4} y={112 + (i % 3) * 3} width={14} height={9} rx={2} fill={C.hazard} stroke={C.ink} />);
        continue;
      }
      const [x, y] = loop(t * speed + i / Math.max(p.N - waiting, 1));
      trucks.push(<rect key={i} x={x - 7} y={y - 5} width={14} height={9} rx={2} fill={y < 120 ? C.coal : C.hazard} stroke={C.ink} />);
    }
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.sand} />
        <rect x={0} y={0} width={400} height={240} fill="#F8FAFC" opacity={0.5} />
        <rect x={50} y={80} width={300} height={80} rx={40} fill="none" stroke="#78716C" strokeWidth={20} />
        <rect x={50} y={80} width={300} height={80} rx={40} fill="none" stroke="#F8FAFC" strokeWidth={1} strokeDasharray="6 6" opacity={0.7} />
        <circle cx={55} cy={120} r={17} fill={MAT.steel} stroke="#0F172A" />
        <circle cx={55} cy={120} r={13} fill={C.tech} />
        <Txt x={55} y={124} size={8} anchor="middle" fill="white" weight={800}>
          SHOVEL
        </Txt>
        <path d="M331 138 L345 102 L361 102 L375 138 Z" fill={MAT.goaf} stroke="#57534E" />
        <Txt x={353} y={124} size={7} anchor="middle" fill="white" weight={800}>
          DUMP
        </Txt>
        {trucks}
        <Txt x={200} y={76} size={8} anchor="middle" fill={C.slate}>
          loaded →
        </Txt>
        <Txt x={200} y={176} size={8} anchor="middle" fill={C.slate}>
          ← empty return
        </Txt>
        <Txt x={20} y={30} size={18} weight={900} mono fill={Math.abs(r.mf - 1) <= 0.05 ? C.safe : C.hazard}>
          {`MF ${r.mf.toFixed(2)}`}
        </Txt>
        <Txt x={20} y={210} size={9} fill={C.ink}>
          {r.mf < 0.95 ? "Under-trucked: shovel waits for trucks" : r.mf > 1.05 ? "Over-trucked: trucks queue at shovel" : "Balanced fleet"}
        </Txt>
        <Txt x={20} y={226} size={9} mono fill={C.slate}>
          {`${p.N} trucks · ${r.passes} passes · cycle ${r.tCycle.toFixed(1)} min`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Haul road physics ---------------- */

export function haul(p: Record<string, number>) {
  const tr = p.rr + p.gr;
  const F = (p.gvw * 9.81 * tr) / 100;
  let v: number;
  let retard = 0;
  if (tr > 0) v = Math.min(50, ((p.P * 0.85) / F) * 3.6);
  else {
    v = 40;
    retard = (Math.abs(F) * v) / 3.6;
  }
  const e = Math.max(0, (v * v) / (127 * p.Rc) - 0.15) * 100;
  return { tr, F, v, retard, e };
}

export const haulSim: SimDef = {
  id: "u5-haul",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["v", "gr"],
  title: "Haul road physics — resistance, rimpull, speed and super-elevation",
  params: [
    { key: "gvw", label: "Gross vehicle weight", min: 100, max: 450, step: 10, unit: "t", default: 300 },
    { key: "P", label: "Engine power at wheels", min: 500, max: 2500, step: 50, unit: "kW", default: 1500 },
    { key: "rr", label: "Rolling resistance", min: 1.5, max: 8, step: 0.5, unit: "%", default: 4 },
    { key: "gr", label: "Grade (+ up / − down)", min: -10, max: 12, step: 0.25, unit: "%", default: 10 },
    { key: "Rc", label: "Curve radius", min: 30, max: 300, step: 5, unit: "m", default: 80 },
  ],
  compute: (p) => ({ ...haul(p), gr: p.gr }),
  outputs: [
    { key: "tr", label: "Total resistance (RR + GR)", unit: "%", digits: 2 },
    { key: "F", label: "Rimpull required", unit: "kN", digits: 0 },
    { key: "v", label: "Attainable speed", unit: "km/h", digits: 1, tone: (v) => (v >= 15 ? "ok" : "warn") },
    { key: "retard", label: "Retarding power needed", unit: "kW", digits: 0, tone: (v, _, p) => (v > p.P ? "crit" : v > 0 ? "warn" : "ok") },
    { key: "e", label: "Super-elevation needed", unit: "%", digits: 1 },
    { key: "gr", label: "Ramp gradient", format: (v) => (Math.abs(v) > 6.25 ? `${Math.abs(v)}% > 1 in 16` : `${Math.abs(v)}% ≤ 1 in 16`), tone: (v) => (Math.abs(v) > 6.25 ? "crit" : "ok") },
  ],
  caption: "Speed from P·η / F (η = 0.85), capped at 50 km/h; downgrade speed held at 40 km/h by retarder. e = v²/(127R) − f with side friction f = 0.15.",
  animated: true,
  handles: [{ key: "gr", axis: "y", at: (p) => { const a = Math.atan(p.gr / 100); return [30 + 220 * Math.cos(a), 160 - 220 * Math.sin(a) * 3]; }, toValue: (y) => 100 * Math.tan(Math.asin(clamp((160 - y) / 660, -0.99, 0.99))), color: "#F59E0B" }],
  render: (p, o, t) => {
    const ang = Math.atan(p.gr / 100);
    const x0 = 30;
    const y0 = 160;
    const L = 220;
    const x1 = x0 + L * Math.cos(ang);
    const y1 = y0 - L * Math.sin(ang) * 3;
    const tx = (x0 + x1) / 2;
    const ty = (y0 + y1) / 2;
    const a3 = deg(Math.atan2(y1 - y0, x1 - x0));
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
        <polygon points={polyline([[x0, y0], [x1, y1], [x1, 230], [x0, 230]])} fill={MAT.sand} />
        <polygon points={polyline([[x0, y0], [x1, y1], [x1, 230], [x0, 230]])} fill={MAT.rockShade} />
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#57534E" strokeWidth={5} />
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#E7E5E4" strokeWidth={1} strokeDasharray="5 6" strokeDashoffset={-(t * o.v * 0.8) % 11} />
        <g transform={`translate(${tx},${ty}) rotate(${a3})`}>
          <rect x={-22} y={-22} width={44} height={18} rx={3} fill={C.hazard} stroke="#92400E" />
          <rect x={-20} y={-21} width={40} height={6} rx={2} fill={MAT.glass} />
          <rect x={10} y={-30} width={12} height={9} rx={2} fill="#FBBF24" stroke="#92400E" />
          {[-12, 12].map((wx) => (
            <g key={wx} transform={`rotate(${((t * o.v * 25) % 360).toFixed(0)} ${wx} -2)`}>
              <circle cx={wx} cy={-2} r={6} fill={C.ink} />
              <line x1={wx - 4} y1={-2} x2={wx + 4} y2={-2} stroke="#94A3B8" strokeWidth={1.4} />
              <line x1={wx} y1={-6} x2={wx} y2={2} stroke="#94A3B8" strokeWidth={1.4} />
            </g>
          ))}
          {o.tr > 0 ? <Arrow x1={0} y1={-30} x2={36} y2={-30} color={C.safe} width={3} /> : <Arrow x1={0} y1={-30} x2={-36} y2={-30} color={C.crit} width={3} />}
        </g>
        <Txt x={20} y={24} size={11} weight={800}>
          {`TR = ${p.rr}% + ${p.gr}% = ${o.tr.toFixed(2)}%`}
        </Txt>
        <Txt x={20} y={40} size={9} mono>
          {`F = GVW·g·TR = ${o.F.toFixed(0)} kN`}
        </Txt>
        <Txt x={20} y={56} size={14} weight={900} mono fill={o.v >= 15 ? C.safe : C.hazard}>
          {`${o.v.toFixed(1)} km/h`}
        </Txt>
        <Txt x={285} y={60} size={9} weight={700} fill={C.slate}>
          CURVE (plan)
        </Txt>
        <path d={`M 290 200 A ${clamp(p.Rc / 3, 15, 90)} ${clamp(p.Rc / 3, 15, 90)} 0 0 1 ${290 + clamp(p.Rc / 3, 15, 90)} ${200 - clamp(p.Rc / 3, 15, 90)}`} fill="none" stroke="#57534E" strokeWidth={10} strokeLinecap="round" />
        <path d={`M 290 200 A ${clamp(p.Rc / 3, 15, 90)} ${clamp(p.Rc / 3, 15, 90)} 0 0 1 ${290 + clamp(p.Rc / 3, 15, 90)} ${200 - clamp(p.Rc / 3, 15, 90)}`} fill="none" stroke="#E7E5E4" strokeWidth={1} strokeDasharray="4 5" />
        <Txt x={285} y={222} size={9} mono>
          {`R ${p.Rc} m · e ${o.e.toFixed(1)}%`}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Waste dump stability ---------------- */

export function dump(p: Record<string, number>) {
  const Ht = p.n * p.h;
  const horiz = (p.n * p.h) / Math.tan(rad(p.a)) + (p.n - 1) * p.b;
  const bo = deg(Math.atan(Ht / horiz));
  const z = Ht / 2;
  const cos2 = Math.pow(Math.cos(rad(bo)), 2);
  const fos = ((1 - p.ru) * Math.tan(rad(p.phi)) + p.c / (18 * z * cos2)) / Math.tan(rad(bo));
  return { Ht, horiz, bo, fos };
}

export const dumpSim: SimDef = {
  id: "u5-dump",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["Ht", "fos"],
  title: "Multi-deck waste dump — overall slope and stability",
  params: [
    { key: "n", label: "Number of decks", min: 1, max: 5, step: 1, default: 3 },
    { key: "h", label: "Deck height", min: 10, max: 40, step: 1, unit: "m", default: 30 },
    { key: "b", label: "Berm width", min: 0, max: 40, step: 1, unit: "m", default: 10 },
    { key: "a", label: "Deck face (angle of repose)", min: 34, max: 38, step: 0.5, unit: "°", default: 37 },
    { key: "phi", label: "Spoil friction angle φ′", min: 26, max: 38, step: 1, unit: "°", default: 32 },
    { key: "c", label: "Spoil cohesion c′", min: 0, max: 40, step: 1, unit: "kPa", default: 15 },
    { key: "ru", label: "Pore-pressure ratio ru", min: 0, max: 0.5, step: 0.05, default: 0.1 },
  ],
  compute: (p) => dump(p),
  outputs: [
    { key: "Ht", label: "Total dump height", unit: "m", digits: 0 },
    { key: "bo", label: "Overall slope angle", unit: "°", digits: 1, tone: (v) => (v <= 28 ? "ok" : "warn") },
    { key: "fos", label: "FOS (infinite slope at z = H/2)", digits: 2, tone: (v) => (v >= 1.2 ? "ok" : v >= 1 ? "warn" : "crit") },
  ],
  caption: "Simplified effective-stress infinite-slope check of the overall dump profile (γ = 18 kN/m³). Detailed design uses limit-equilibrium circular/non-circular analyses including the foundation.",
  render: (p, o) => {
    const k = Math.min(300 / (o.horiz + 20), 170 / (o.Ht + 5));
    const toeX = 40;
    const base = 215;
    const pts: [number, number][] = [[toeX, base]];
    let x = toeX;
    let y = base;
    for (let i = 0; i < p.n; i++) {
      x += (p.h / Math.tan(rad(p.a))) * k;
      y -= p.h * k;
      pts.push([x, y]);
      if (i < p.n - 1) {
        x += p.b * k;
        pts.push([x, y]);
      }
    }
    pts.push([390, y], [390, base]);
    const col = o.fos >= 1.2 ? C.safe : o.fos >= 1 ? C.hazard : C.crit;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
        <rect x={0} y={base} width={400} height={25} fill={MAT.soil} />
        <g className={o.fos < 1 ? "shake" : undefined}>
          <polygon points={polyline(pts)} fill={MAT.goaf} stroke={C.ink} />
          <polygon points={polyline(pts)} fill={MAT.rockShade} />
        </g>
        {o.fos < 1 && <Cracks key={`d${Math.round(o.fos * 20)}`} cracks={[{ x: pts[pts.length - 3][0] - 10, y: pts[pts.length - 3][1] + 2, len: 40, angle: 120, seed: 3 }, { x: (toeX + pts[pts.length - 3][0]) / 2, y: (base + pts[pts.length - 3][1]) / 2, len: 30, angle: 150, seed: 7 }]} color="#7F1D1D" width={2} />}
        <line x1={toeX} y1={base} x2={pts[pts.length - 3][0]} y2={pts[pts.length - 3][1]} stroke={col} strokeWidth={2} strokeDasharray="6 4" />
        <Txt x={toeX + 30} y={base - 6} size={9} weight={800} fill={col}>
          {`overall ${o.bo.toFixed(1)}°`}
        </Txt>
        <Txt x={20} y={26} size={16} weight={900} mono fill={col}>
          {`FOS ${o.fos.toFixed(2)}`}
        </Txt>
        <Txt x={20} y={42} size={9} mono>
          {`${p.n} × ${p.h} m decks · berms ${p.b} m`}
        </Txt>
        {p.ru > 0 && <Stream d={`M${toeX} ${base - 2} L390 ${(base - o.Ht * k * p.ru * 1.6).toFixed(1)}`} color={C.tech} width={2} speed={0.3} />}
      </g>
    );
  },
};

export const U5_SIMS = [pitSim, draglineSim, matchSim, haulSim, dumpSim];
