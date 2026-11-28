import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, clamp, rad, deg, polyline, Cracks, Stream } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";
import { T, LBL, INK, INK3, ON_LIGHT, GREYS, U, OK_LIGHT, BAD_LIGHT, BAD, OK, Arrow as V3Arrow, DimLine, pts, num, textW } from "@/components/sim/v3";
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
          <rect x={246} y={ly - 22} width={130} height={32} rx={16} style={{ fill: ok ? OK_LIGHT : BAD_LIGHT }} />
          <SvgTex x={361} y={ly - 1} tex={ok ? "\\mathrm{SR}\\le\\mathrm{BESR}" : "\\mathrm{SR}>\\mathrm{BESR}"} size={18} anchor="end" color={ON_LIGHT} />
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
    const tip = Math.max(58, coalBot - d.h * k - 18);
    const peakX = X(p.W + d.e - Math.min(p.R, d.Rreq));
    const sp = -d.c - d.b / 2 + d.d;
    const hp = d.h * k;
    const mx = X(p.W + d.e);
    const uu = (Math.sin(t * 1.1) + 1) / 2;
    const bx = X(p.W / 2) + (X(sp) - X(p.W / 2)) * uu;
    const by = Math.min(coalTop - 8, coalBot - hp - 10) * uu + (coalTop - 8) * (1 - uu) - 18 * Math.sin(uu * Math.PI);
    return (
      <g>
        <defs>
          <clipPath id="u5dl-clip">
            <rect x={12} y={12} width={376} height={216} rx={12} />
          </clipPath>
        </defs>
        {/* bench: overburden and seam beyond the cut, floor under everything (scene fills run edge to edge, clipped) */}
        <g clipPath="url(#u5dl-clip)">
          <rect x={0} y={0} width={400} height={240} fill={GREYS.light} opacity={0.35} />
          <rect x={X(p.W)} y={surf} width={400 - X(p.W)} height={coalTop - surf} style={{ fill: U.light }} />
          <rect x={0} y={coalTop} width={400} height={6} fill={GREYS.deep} />
          <rect x={0} y={coalBot} width={400} height={240 - coalBot} fill={GREYS.light} />
          {/* ground surface (a path: the lesson's dragline pin sits on it by design) */}
          <path d={`M${X(p.W)} ${surf} H400`} style={{ stroke: INK }} strokeWidth={2.5} />
        </g>
        {/* the cut (removed) */}
        <rect x={X(0)} y={surf} width={X(p.W) - X(0)} height={coalTop - surf} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="5 5" />
        {/* spoil pile */}
        <polygon points={pts([[X(sp - d.b / 2), coalBot], [X(sp), coalBot - hp], [X(sp + d.b / 2), coalBot]])} data-state={d.reh > 0 ? "unsafe" : "safe"} fill={d.reh > 0 ? BAD_LIGHT : GREYS.mid} stroke={ON_LIGHT} strokeWidth={2} strokeLinejoin="round" />
        <T x={Math.max(Math.min(X(sp), (X(0) + X(p.W)) / 2 - 56), 24 + textW("Spoil") / 2)} y={coalBot + 22} anchor="middle" fill={ON_LIGHT} weight={700}>
          Spoil
        </T>
        <T x={(X(0) + X(p.W)) / 2} y={coalBot + 22} anchor="middle" fill={ON_LIGHT}>
          Cut
        </T>
        {/* dragline: house, tub, boom, rope and bucket */}
        <rect x={mx - 13} y={surf - 17} width={26} height={14} rx={3} style={{ fill: U.deep }} />
        <rect x={mx - 15} y={surf - 4} width={30} height={4} rx={2} fill={GREYS.deep} />
        <path d={`M${mx} ${surf - 10} L${peakX} ${tip}`} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        <line x1={peakX} y1={tip} x2={bx} y2={by} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <path d={`M${bx - 7} ${by} h14 l-2 7 h-10 z`} fill={GREYS.deep} />
        <DimLine x1={mx} y1={surf - 26} x2={peakX} y2={surf - 26} />
        <T x={clamp((mx + peakX) / 2, 24 + textW("R 120 m") / 2, 376 - textW("R 120 m") / 2)} y={surf - 33} anchor="middle" fill={INK} weight={700}>
          {`R ${num(p.R, 0, "m")}`}
        </T>
        <T x={376} y={coalBot + 22} anchor="end" fill={ON_LIGHT}>
          Coal
        </T>
        {d.reh > 0 && (
          <T x={24} y={208} fill={ON_LIGHT} weight={800}>
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
  // §5.6d redraw (v3.2): same loop geometry as legacy (lanes y 90 / 150, shovel left, dump right) so the four pins stay put.
  v3: { viewH: 250 },
  render: (p, _o, t) => {
    const r = truckShovel(p);
    const R = 30;
    const straight = 240;
    const arc = Math.PI * R;
    const total = 2 * straight + 2 * arc;
    // position + heading (deg) at fraction u of the loop; loaded on the top lane and the dump arc
    const loop = (u: number): { x: number; y: number; a: number; loaded: boolean } => {
      const s = (((u % 1) + 1) % 1) * total;
      if (s < straight) return { x: 80 + s, y: 90, a: 0, loaded: true };
      if (s < straight + arc) {
        const th = -Math.PI / 2 + (s - straight) / R;
        return { x: 320 + R * Math.cos(th), y: 120 + R * Math.sin(th), a: deg(th) + 90, loaded: true };
      }
      if (s < 2 * straight + arc) return { x: 320 - (s - straight - arc), y: 150, a: 180, loaded: false };
      const th = Math.PI / 2 + (s - 2 * straight - arc) / R;
      return { x: 80 + R * Math.cos(th), y: 120 + R * Math.sin(th), a: deg(th) + 90, loaded: false };
    };
    const speed = 1 / (r.tCycle * 0.6);
    const waiting = Math.max(0, Math.round(p.N - r.tCycle / r.tLoad));
    const moving = Math.max(p.N - waiting, 1);
    const balanced = Math.abs(r.mf - 1) <= 0.05;
    const status = r.mf < 0.95 ? "Shovel waits for trucks" : r.mf > 1.05 ? "Trucks queue at shovel" : "Balanced fleet";
    const trucks = [];
    for (let i = 0; i < p.N; i++) {
      if (i < waiting) {
        trucks.push(
          <rect key={i} x={100 + i * 13} y={115} width={11} height={10} rx={2} data-state="unsafe" fill={BAD_LIGHT} style={{ stroke: INK3 }} strokeWidth={1.5} />,
        );
        continue;
      }
      const q = loop(t * speed + (i - waiting) / moving);
      trucks.push(
        <g key={i} transform={`translate(${q.x} ${q.y}) rotate(${q.a})`}>
          <rect x={-8} y={-5} width={16} height={10} rx={2} fill={q.loaded ? U.deep : GREYS.light} style={{ stroke: q.loaded ? ON_LIGHT : INK3 }} strokeWidth={1.5} />
        </g>,
      );
    }
    const pillW = textW(status) + 20;
    return (
      <g>
        <defs>
          <clipPath id="u5match-clip">
            <rect x={12} y={12} width={376} height={226} rx={12} />
          </clipPath>
        </defs>
        {/* host ground, edge to edge, clipped */}
        <g clipPath="url(#u5match-clip)">
          <rect x={0} y={0} width={400} height={250} fill={GREYS.light} opacity={0.35} />
          <rect x={80} y={90} width={240} height={60} rx={30} fill="none" stroke={GREYS.mid} strokeWidth={24} />
          <rect x={80} y={90} width={240} height={60} rx={30} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} strokeDasharray="6 6" />
        </g>
        {/* shovel (loading unit) */}
        <rect x={30} y={138} width={46} height={16} rx={4} fill={GREYS.deep} />
        <rect x={34} y={106} width={38} height={34} rx={5} style={{ fill: U.deep, stroke: INK }} strokeWidth={2.5} />
        <path d="M72 116 L96 100" style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        {/* dump bay */}
        <polygon points="338,96 372,96 364,128 344,128" fill={GREYS.deep} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinejoin="round" />
        {trucks}
        {/* labels */}
        <line x1={50} y1={68} x2={50} y2={104} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={24} y={62} fill={INK}>
          Shovel
        </T>
        <line x1={354} y1={68} x2={354} y2={94} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={376} y={62} anchor="end" fill={INK}>
          Dump
        </T>
        <T x={200} y={66} anchor="middle">
          Loaded →
        </T>
        <T x={200} y={192} anchor="middle">
          ← Empty return
        </T>
        <rect x={200 - pillW / 2} y={198} width={pillW} height={26} rx={13} data-state={balanced ? "met" : "unmet"} fill={balanced ? OK_LIGHT : BAD_LIGHT} />
        <T x={200} y={217} anchor="middle" fill={ON_LIGHT} weight={700}>
          {status}
        </T>
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

const HW = { x0: 36, y0: 150, L: 210, k: 2.6 };

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
  // §5.6 redraw (v3e): ramp drawn with 2.6× vertical exaggeration; plan-view curve panel at right.
  v3: { viewH: 250, formula: () => "F = GVW\\,g\\,(RR + GR)" },
  handles: [{ key: "gr", axis: "y", at: (p) => { const a = Math.atan(p.gr / 100); return [HW.x0 + HW.L * Math.cos(a), HW.y0 - HW.L * Math.sin(a) * HW.k]; }, toValue: (y) => 100 * Math.tan(Math.asin(clamp((HW.y0 - y) / (HW.L * HW.k), -0.99, 0.99))) }],
  render: (p, o, t) => {
    const ang = Math.atan(p.gr / 100);
    const { x0, y0, L, k } = HW;
    const x1 = x0 + L * Math.cos(ang);
    const y1 = y0 - L * Math.sin(ang) * k;
    const tx = (x0 + x1) / 2;
    const ty = (y0 + y1) / 2;
    const a3 = deg(Math.atan2(y1 - y0, x1 - x0));
    const steep = Math.abs(p.gr) > 6.25;
    // plan-view curve: radius drawn from Rc (24..76 units)
    const r = 20 + ((p.Rc - 30) / 270) * 32;
    const cx0 = 290;
    const cy0 = 214;
    const ex = cx0 + r;
    const ey = cy0 - r;
    const arc = `M ${cx0} ${cy0 + 8} L ${cx0} ${cy0} A ${r} ${r} 0 0 1 ${ex} ${ey} L ${ex + 8} ${ey}`;
    const wheelRot = ((t * o.v * 25) % 360).toFixed(0);
    return (
      <g>
        <clipPath id="u5haul-clip">
          <rect x={12} y={12} width={376} height={226} rx={12} />
        </clipPath>
        <g clipPath="url(#u5haul-clip)">
          <rect x={0} y={0} width={400} height={250} fill={GREYS.light} opacity={0.35} />
          <polygon points={pts([[0, y0], [x0, y0], [x1, y1], [x1 + 8, y1], [x1 + 8, 250], [0, 250]])} fill={GREYS.light} />
          <rect x={256} y={120} width={150} height={140} fill={U.light} />
        </g>
        {/* ramp: road surface + moving centre-line dashes */}
        <polyline points={pts([[x0 - 12, y0], [x0, y0], [x1, y1], [x1 + 8, y1]])} fill="none" data-state={steep ? "unsafe" : "safe"} style={{ stroke: steep ? BAD : GREYS.deep }} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={x0} y1={y0} x2={x1} y2={y1} style={{ stroke: GREYS.light }} strokeWidth={1.5} strokeDasharray="5 6" strokeDashoffset={-(t * o.v * 0.8) % 11} />
        <T x={tx} y={Math.min(ty + 40, 212)} anchor="middle" fill={ON_LIGHT} weight={700}>
          Haul ramp
        </T>
        {/* truck */}
        <g transform={`translate(${tx},${ty}) rotate(${a3})`}>
          <path d="M -32 -17 L -32 -40 L 8 -40 L 14 -17 Z" fill={U.mid} style={{ stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
          <rect x={10} y={-38} width={22} height={21} rx={3} fill={U.light} style={{ stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
          {[-18, 20].map((wx) => (
            <g key={wx}>
              <circle cx={wx} cy={-11} r={11} fill={GREYS.deep} style={{ stroke: INK }} strokeWidth={2.5} />
              <g transform={`rotate(${wheelRot} ${wx} -11)`}>
                <line x1={wx - 6} y1={-11} x2={wx + 6} y2={-11} stroke="#FFFFFF" strokeWidth={2} />
                <line x1={wx} y1={-17} x2={wx} y2={-5} stroke="#FFFFFF" strokeWidth={2} />
              </g>
            </g>
          ))}
        </g>
        {/* rimpull direction: rotates with the ramp, outside the truck group so the label stays level */}
        <g transform={`translate(${tx},${ty}) rotate(${a3})`}>{o.tr > 0 ? <V3Arrow x1={-30} y1={-56} x2={30} y2={-56} color={U.deep} /> : <V3Arrow x1={30} y1={-56} x2={-30} y2={-56} color={U.deep} />}</g>
        <T x={tx} y={ty - 74} anchor="middle" fill={INK}>
          {o.tr > 0 ? "Rimpull" : "Retarder"}
        </T>
        {/* plan view of the curve */}
        <rect x={262} y={128} width={114} height={98} rx={8} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={274} y={150} fill={ON_LIGHT} weight={700}>
          Plan view
        </T>
        <path d={arc} fill="none" style={{ stroke: GREYS.deep }} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        <path d={arc} fill="none" style={{ stroke: GREYS.light }} strokeWidth={1.5} strokeDasharray="4 5" />
        <line x1={cx0} y1={cy0 - r} x2={cx0} y2={cy0} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <line x1={cx0} y1={cy0 - r} x2={ex} y2={cy0 - r} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <SvgTex x={cx0 - 10} y={cy0 - r / 2 + 6} tex="R" size={LBL} anchor="end" color="#141414" />
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
  // §5.6d redraw (v3.2): same toe (40, 215) and scale as the legacy section, so hotspots stay put.
  v3: { viewH: 250 },
  render: (p, o) => {
    const k = Math.min(300 / (o.horiz + 20), 170 / (o.Ht + 5));
    const toeX = 40;
    const base = 215;
    const pp: [number, number][] = [[toeX, base]];
    let x = toeX;
    let y = base;
    for (let i = 0; i < p.n; i++) {
      x += (p.h / Math.tan(rad(p.a))) * k;
      y -= p.h * k;
      pp.push([x, y]);
      if (i < p.n - 1) {
        x += p.b * k;
        pp.push([x, y]);
      }
    }
    const crest = pp[pp.length - 1];
    const safe = o.fos >= 1.2;
    const col = safe ? OK : BAD;
    const poly = [...pp, [400, y], [400, base]] as [number, number][];
    // labels on the left, with 1.5 px leaders to the part they name
    const faceT: [number, number] = [(pp[0][0] + pp[1][0]) / 2, (pp[0][1] + pp[1][1]) / 2];
    const bermT: [number, number] = p.n > 1 ? [(pp[1][0] + pp[2][0]) / 2, pp[1][1]] : [(crest[0] + 376) / 2, crest[1]];
    const ovT: [number, number] = [(toeX + crest[0]) / 2, (base + crest[1]) / 2];
    const lead = (lx: number, ly: number, t: [number, number]) => (
      <line x1={lx} y1={ly} x2={t[0]} y2={t[1]} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
    );
    // water label on the top deck, above the line when it fits
    const wx = (crest[0] + 376) / 2;
    const wLine = base - o.Ht * k * p.ru * 1.6 * ((wx - toeX) / (390 - toeX));
    const wAbove = wLine - 8 - 18 - 8 >= crest[1];
    const wY = wAbove ? wLine - 8 : wLine + 26;
    const showW = p.ru > 0 && 376 - crest[0] >= textW("Water") + 12 && wY <= base - 8;
    return (
      <g>
        <clipPath id="u5-dump-clip">
          <rect x={0} y={0} width={400} height={250} rx={12} />
        </clipPath>
        <g clipPath="url(#u5-dump-clip)">
          <rect x={0} y={base} width={400} height={35} fill={GREYS.light} />
          <g className={o.fos < 1 ? "shake" : undefined}>
            <polygon points={pts(poly)} style={{ fill: U.light, stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" />
          </g>
          {o.fos < 1 && (
            <g data-state="unsafe">
              <Cracks key={`d${Math.round(o.fos * 20)}`} cracks={[{ x: crest[0] - 10, y: crest[1] + 2, len: 40, angle: 120, seed: 3 }, { x: (toeX + crest[0]) / 2, y: (base + crest[1]) / 2, len: 30, angle: 150, seed: 7 }]} color={ON_LIGHT} width={2} />
            </g>
          )}
          <line data-state={safe ? "safe" : "unsafe"} x1={toeX} y1={base} x2={crest[0]} y2={crest[1]} style={{ stroke: col }} strokeWidth={2.5} strokeDasharray="6 4" strokeLinecap="round" />
          {p.ru > 0 && <Stream d={`M${toeX} ${base - 2} L390 ${(base - o.Ht * k * p.ru * 1.6).toFixed(1)}`} color="var(--u-ink)" width={2} speed={0.3} />}
        </g>
        {showW && (
          <T x={wx} y={wY} anchor="middle" fill={ON_LIGHT}>
            Water
          </T>
        )}
        <T x={24} y={44}>Overall slope</T>
        {lead(24 + textW("Overall slope") + 6, 38, ovT)}
        <T x={24} y={74}>Berm</T>
        {lead(24 + textW("Berm") + 6, 68, bermT)}
        <T x={24} y={104}>Deck face</T>
        {lead(24 + textW("Deck face") + 6, 98, faceT)}
      </g>
    );
  },
};

export const U5_SIMS = [pitSim, draglineSim, matchSim, haulSim, dumpSim];
