import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Dim, clamp, rad, deg, Meter, Stream } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";
import { T, INK, INK2, INK3, ON_LIGHT, GREYS, U, LBL, HeatRamp, num } from "@/components/sim/v3";
import { SvgTex } from "@/components/sim/Tex";

/* ---------------- Coalification & rank ---------------- */

const RANKS = [
  { max: 0.25, name: "Peat", color: "#a16207" },
  { max: 0.4, name: "Lignite", color: "#78350f" },
  { max: 0.6, name: "Sub-bituminous", color: "#57534e" },
  { max: 1.1, name: "HV Bituminous", color: "#44403c" },
  { max: 1.5, name: "MV Bituminous (prime coking)", color: "#292524" },
  { max: 2.0, name: "LV Bituminous", color: "#1c1917" },
  { max: 2.5, name: "Semi-anthracite", color: "#111827" },
  { max: 99, name: "Anthracite", color: "#030712" },
];

/** Ladder names short enough for 14 px labels (the readout keeps the full name). */
const SHORT = ["Peat", "Lignite", "Sub-bitum.", "HV bitum.", "MV bitum.", "LV bitum.", "Semi-anthr.", "Anthracite"];
/** §5.6d frame: burial column x 32–88 (lesson pins 1 and 2 sit on it), depth scale y 30–210, ladder x 186 (pin 3 on Anthracite). */
const CR = { top: 30, bottom: 210, x0: 32, x1: 88, lx: 186, lw: 26, bandH: 180 / 8 };
const crY = (D: number) => CR.top + (D / 8) * (CR.bottom - CR.top);
const bandTop = (i: number) => CR.bottom - (i + 1) * CR.bandH;

export function rankIndex(ro: number): number {
  return RANKS.findIndex((r) => ro < r.max);
}

export const coalRank: SimDef = {
  id: "u1-coalrank",
  title: "Coalification furnace — burial, heat and time",
  params: [
    { key: "D", label: "Maximum burial depth", min: 0.2, max: 8, step: 0.1, unit: "km", default: 2 },
    { key: "grad", label: "Geothermal gradient", min: 15, max: 60, step: 1, unit: "°C/km", default: 30 },
    { key: "time", label: "Time at max temperature", min: 5, max: 300, step: 5, unit: "Myr", default: 100 },
  ],
  compute: (p) => {
    const T = 25 + p.grad * p.D;
    const ro = 0.2 * Math.exp(0.012 * (T - 25)) * Math.pow(p.time / 100, 0.12);
    const vm = clamp(60 - 25 * Math.log(Math.max(ro, 0.05) / 0.3), 3, 65);
    const moist = clamp(45 * Math.exp(-2.2 * (ro - 0.25)), 1, 70);
    const gcv = 5500 + 3200 * (1 - Math.exp(-2.2 * Math.max(ro - 0.25, 0)));
    return { T, ro, vm, moist, gcv, rank: rankIndex(ro) };
  },
  outputs: [
    { key: "T", label: "Peak temperature", unit: "°C", digits: 0 },
    { key: "ro", label: "Vitrinite reflectance Ro", unit: "%", digits: 2 },
    { key: "rank", label: "Rank", format: (v) => RANKS[v]?.name ?? "—", tone: (v) => (v === 4 ? "ok" : "info") },
    { key: "vm", label: "Volatile matter (daf)", unit: "%", digits: 1 },
    { key: "moist", label: "Bed moisture", unit: "%", digits: 1 },
    { key: "gcv", label: "GCV (daf)", unit: "kcal/kg", digits: 0 },
  ],
  // §5.6 redraw (v3e): burial column and rank ladder keep their legacy places, so the lesson hotspots still land on them.
  primary: ["ro", "rank"],
  v3: { viewH: 250 },
  handles: [{ key: "D", axis: "y", at: (p) => [CR.x1, crY(p.D)], toValue: (y) => ((y - CR.top) / (CR.bottom - CR.top)) * 8 }],
  render: (p, o) => {
    const y = crY(p.D);
    const k = o.rank as number;
    const lo = k === 0 ? 0.15 : RANKS[k - 1].max;
    const hi = Math.min(RANKS[k].max, 5);
    const frac = clamp((Math.log(o.ro) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)), 0, 1);
    const py = bandTop(k) + CR.bandH - frac * CR.bandH;
    const sy = y + 6; // seam label baseline
    const ly = [py - 12, py + 26].find((c) => c > CR.top + 14 && Math.abs(c - sy) >= 24) ?? py + 26; // Ro label clear of the seam label
    const free = (yy: number) => Math.abs(y - yy) > 26;
    return (
      <g>
        <defs>
          {/* heat ramp: burial temperature is the data here (§5.6) */}
          <HeatRamp id="u1-coal-heat" stops={[[0, "var(--u-light)"], [0.5, "var(--u-mid)"], [1, "var(--u-deep)"]]} />
          <clipPath id="u1-coal-clip">
            <rect x={0} y={0} width={400} height={250} rx={12} />
          </clipPath>
        </defs>
        {/* host rock beside the burial column, edge to edge, clipped to the stage radius */}
        <g clipPath="url(#u1-coal-clip)">
          <rect x={0} y={0} width={106} height={250} style={{ fill: GREYS.light }} />
        </g>
        <rect x={CR.x0} y={CR.top} width={CR.x1 - CR.x0} height={CR.bottom - CR.top} rx={8} fill="url(#u1-coal-heat)" style={{ stroke: INK }} strokeWidth={2.5} />
        {free(CR.top + 7) && (
          <T x={CR.x1 + 24} y={CR.top + 13}>
            {num(0, 0, "km")}
          </T>
        )}
        {free(CR.bottom - 6) && (
          <T x={CR.x1 + 24} y={CR.bottom}>
            {num(8, 0, "km")}
          </T>
        )}
        {/* the seam at maximum burial */}
        <rect x={CR.x0} y={y - 10} width={CR.x1 - CR.x0} height={20} rx={5} fill={GREYS.deep} />
        <line x1={CR.x1 + 6} y1={y} x2={CR.x1 + 20} y2={y} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={CR.x1 + 24} y={sy} fill={INK} weight={700}>
          Seam
        </T>
        {/* rank ladder: equal bands, Ro placed on a log scale inside its band */}
        {RANKS.map((r, i) => {
          const on = i === k;
          return (
            <g key={r.name}>
              <rect x={CR.lx} y={bandTop(i) + 1.5} width={CR.lw} height={CR.bandH - 3} rx={4} style={{ fill: on ? U.mid : GREYS.light }} />
              {on && <rect x={CR.lx - 4} y={bandTop(i) - 2.5} width={CR.lw + 8} height={CR.bandH + 5} rx={7} fill="none" style={{ stroke: U.ink }} strokeWidth={2.5} />}
              <T x={CR.lx + CR.lw + 10} y={bandTop(i) + CR.bandH / 2 + 6} fill={on ? INK : INK2} weight={on ? 700 : 500}>
                {`${SHORT[i]} ${i + 1}`}
              </T>
            </g>
          );
        })}
        <path d={`M${CR.lx - 6} ${py} l-13 -8 v16 z`} style={{ fill: INK }} strokeLinejoin="round" />
        <SvgTex x={CR.lx - 22} y={ly} tex="R_o" size={LBL} anchor="end" color="var(--text)" />
      </g>
    );
  },
};

/* ---------------- Supergene enrichment ---------------- */

export const supergene: SimDef = {
  id: "u1-supergene",
  title: "Supergene enrichment profile",
  params: [
    { key: "g0", label: "Primary (hypogene) grade", min: 0.2, max: 1.5, step: 0.05, unit: "% Cu", default: 0.5 },
    { key: "Hl", label: "Leached cap thickness", min: 20, max: 200, step: 5, unit: "m", default: 80 },
    { key: "Hb", label: "Enriched blanket thickness", min: 10, max: 80, step: 5, unit: "m", default: 30 },
    { key: "eta", label: "Leaching efficiency η", min: 0.3, max: 0.95, step: 0.05, default: 0.8 },
  ],
  compute: (p) => {
    const cap = p.g0 * (1 - p.eta);
    const blanket = p.g0 * (1 + (p.eta * p.Hl) / p.Hb);
    return { cap, blanket, ef: blanket / p.g0 };
  },
  outputs: [
    { key: "cap", label: "Leached cap grade", unit: "% Cu", digits: 2, tone: () => "warn" },
    { key: "blanket", label: "Blanket grade", unit: "% Cu", digits: 2, tone: (v) => (v >= 2 ? "ok" : "info") },
    { key: "ef", label: "Enrichment factor", unit: "×", digits: 2 },
  ],
  handles: [
    { key: "Hl", axis: "y", at: (p) => [215, 40 + (p.Hl * 150) / (p.Hl + p.Hb + 60)], toValue: (y, p) => { const d = clamp(y - 40, 1, 148); return (d * (p.Hb + 60)) / (150 - d); }, color: "#0EA5E9" },
    { key: "Hb", axis: "y", at: (p) => [265, 40 + ((p.Hl + p.Hb) * 150) / (p.Hl + p.Hb + 60)], toValue: (y, p) => { const d = clamp(y - 40, 1, 148); return (60 * d) / (150 - d) - p.Hl; }, color: "#1D4ED8" },
  ],
  render: (p, o) => {
    const scale = 150 / (p.Hl + p.Hb + 60);
    const y0 = 40;
    const y1 = y0 + p.Hl * scale;
    const y2 = y1 + p.Hb * scale;
    return (
      <g>
        <rect x={0} y={0} width={400} height={y0} fill={MAT.sky} />
        <rect x={0} y={y0} width={400} height={y1 - y0} fill={MAT.soil} />
        <rect x={0} y={y0} width={400} height={y1 - y0} fill="#c2410c" opacity={0.35} />
        <rect x={0} y={y1} width={400} height={y2 - y1} fill={MAT.ore} />
        <rect x={0} y={y1} width={400} height={y2 - y1} fill="#1d4ed8" opacity={0.55} />
        <rect x={0} y={y2} width={400} height={240 - y2} fill={MAT.rock} />
        <path d={`M0 ${y0} Q100 ${y0 - 12} 200 ${y0} T400 ${y0} L400 ${y0 + 4} L0 ${y0 + 4} Z`} fill="#65A30D" />
        <Stream d={`M0 ${y1} L400 ${y1}`} color={C.air} width={2.5} speed={0.25} />
        <Txt x={392} y={y1 - 3} size={8} anchor="end" fill="#075985" weight={700}>
          WATER TABLE
        </Txt>
        {[60, 140, 220, 300].map((x) => (
          <Stream key={x} d={`M${x} ${y0 + 6} L${x} ${y1 - 4}`} color="#BAE6FD" width={1.6} speed={0.35} />
        ))}
        <Txt x={10} y={y0 + 14} size={9} weight={800} fill="white">
          Leached cap / gossan (limonite, hematite) · {o.cap.toFixed(2)}% Cu
        </Txt>
        <Txt x={10} y={y1 + 13} size={9} weight={800} fill="white">
          Enriched blanket (chalcocite, covellite) · {o.blanket.toFixed(2)}% Cu
        </Txt>
        <Txt x={10} y={y2 + 14} size={9} weight={800}>
          Primary sulphide (chalcopyrite, pyrite) · {p.g0.toFixed(2)}% Cu
        </Txt>
        <Dim x1={355} y1={y0} x2={355} y2={y1} label={`${p.Hl} m`} color={C.ink} />
        <Dim x1={355} y1={y1} x2={355} y2={y2} label={`${p.Hb} m`} color={C.ink} />
        <Txt x={10} y={232} size={8} fill={C.ink}>
          Cu leached above the water table re-precipitates in the reducing zone below.
        </Txt>
      </g>
    );
  },
};

/* ---------------- True vs apparent dip ---------------- */

/** §5.6 frame: legacy plan circle (100, 125, r 80) and section x 215–385, ground y 70 (lesson hotspots). */
const PV = { cx: 100, cy: 125, r: 80 };
const SV = { x0: 215, x1: 385, g: 70, bottom: 196 };

export const apparentDip: SimDef = {
  id: "u1-dip",
  title: "True vs apparent dip — plan and section",
  params: [
    { key: "delta", label: "True dip δ", min: 5, max: 80, step: 1, unit: "°", default: 40 },
    { key: "beta", label: "Section angle from strike β", min: 0, max: 90, step: 1, unit: "°", default: 60 },
  ],
  compute: (p) => {
    const t = Math.tan(rad(p.delta)) * Math.sin(rad(p.beta));
    const alpha = deg(Math.atan(t));
    return { alpha, grad: t > 1e-6 ? 1 / t : Infinity, ratio: alpha / p.delta };
  },
  outputs: [
    { key: "alpha", label: "Apparent dip α", unit: "°", digits: 1 },
    { key: "grad", label: "Gradient 1 in", digits: 2, format: (v) => (Number.isFinite(v) ? `1 in ${v.toFixed(2)}` : "level (∞)") },
    { key: "ratio", label: "α / δ", digits: 2 },
  ],
  // §5.6 redraw (v3e): plan circle and section keep their legacy places, so the lesson hotspots still land on them.
  v3: { viewH: 252 },
  handles: [{ key: "beta", axis: "x", at: (p) => [PV.cx + PV.r * Math.cos(rad(p.beta)), PV.cy + PV.r * Math.sin(rad(p.beta))], toValue: (x) => deg(Math.acos(clamp((x - PV.cx) / PV.r, 0, 1))) }],
  render: (p, o) => {
    const { cx, cy, r } = PV;
    const b = rad(p.beta);
    const a = rad(o.alpha);
    const ey = SV.g + (SV.x1 - SV.x0) * Math.tan(a);
    return (
      <g>
        <T x={cx - r} y={24} weight={700}>
          Plan
        </T>
        <circle cx={cx} cy={cy} r={r} style={{ fill: U.light }} />
        {/* strike (solid) and section line (dashed) */}
        <line x1={cx - r} x2={cx + r} y1={cy} y2={cy} stroke={ON_LIGHT} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx - r * Math.cos(b)} y1={cy - r * Math.sin(b)} x2={cx + r * Math.cos(b)} y2={cy + r * Math.sin(b)} stroke={ON_LIGHT} strokeWidth={2.5} strokeDasharray="7 6" strokeLinecap="round" />
        {/* true dip, square to strike */}
        <line x1={cx} y1={cy} x2={cx} y2={cy + 42} stroke={ON_LIGHT} strokeWidth={2.5} strokeLinecap="round" />
        <path d={`M${cx - 7} ${cy + 38} L${cx} ${cy + 52} L${cx + 7} ${cy + 38} Z`} fill={ON_LIGHT} strokeLinejoin="round" />
        {p.beta > 2 && <path d={`M${cx + 28} ${cy} A28 28 0 0 1 ${cx + 28 * Math.cos(b)} ${cy + 28 * Math.sin(b)}`} fill="none" stroke={ON_LIGHT} strokeWidth={1.5} />}
        <SvgTex x={cx + 8} y={cy - 18} tex={`\\beta = ${p.beta}\\degree`} size={LBL} color={ON_LIGHT} />
        <circle cx={cx} cy={cy} r={4} fill={ON_LIGHT} />
        {/* legend for the two lines, off the fill */}
        <line x1={cx - r} x2={cx - r + 22} y1={cy + r + 34} y2={cy + r + 34} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        <T x={cx - r + 30} y={cy + r + 40}>
          Strike
        </T>
        <line x1={cx + 18} x2={cx + 40} y1={cy + r + 34} y2={cy + r + 34} style={{ stroke: INK }} strokeWidth={2.5} strokeDasharray="7 6" strokeLinecap="round" />
        <T x={cx + 48} y={cy + r + 40}>
          Section
        </T>

        <T x={SV.x0} y={24} weight={700}>
          Section
        </T>
        <clipPath id="u1-dip-sec">
          <rect x={SV.x0} y={SV.g} width={SV.x1 - SV.x0} height={SV.bottom - SV.g} rx={8} />
        </clipPath>
        <rect x={SV.x0} y={SV.g} width={SV.x1 - SV.x0} height={SV.bottom - SV.g} rx={8} fill={GREYS.light} />
        <polygon clipPath="url(#u1-dip-sec)" points={`${SV.x0},${SV.g} ${SV.x1},${ey} ${SV.x1},${ey + 16} ${SV.x0},${SV.g + 16}`} fill={GREYS.deep} />
        <line x1={SV.x0 - 4} x2={SV.x1 + 4} y1={SV.g} y2={SV.g} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        {o.alpha > 1 && <path clipPath="url(#u1-dip-sec)" d={`M${SV.x0 + 64} ${SV.g} A64 64 0 0 1 ${SV.x0 + 64 * Math.cos(a)} ${SV.g + 64 * Math.sin(a)}`} fill="none" stroke={ON_LIGHT} strokeWidth={2} />}
        <SvgTex x={SV.x0 + 4} y={SV.g - 16} tex={`\\alpha = ${o.alpha.toFixed(1)}\\degree`} size={20} color="var(--text)" />
        <SvgTex x={SV.x1} y={SV.g - 16} tex={`\\delta = ${p.delta}\\degree`} size={LBL} anchor="end" color="var(--text-2)" />
        <SvgTex x={SV.x0 + 4} y={SV.bottom + 22} tex="\tan\alpha = \tan\delta\,\sin\beta" size={LBL} color="var(--text-2)" />
      </g>
    );
  },
};

/* ---------------- Faults: throw & heave ---------------- */

export const faultSim: SimDef = {
  id: "u1-fault",
  title: "Fault displacement — throw, heave, gap and overlap",
  params: [
    { key: "type", label: "Fault type", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Normal" }, { value: 1, label: "Reverse / thrust" }] },
    { key: "theta", label: "Fault dip θ", min: 20, max: 85, step: 1, unit: "°", default: 60 },
    { key: "d", label: "Net dip-slip d", min: 2, max: 40, step: 1, unit: "m", default: 15 },
  ],
  compute: (p) => {
    const throwV = p.d * Math.sin(rad(p.theta));
    const heave = p.d * Math.cos(rad(p.theta));
    return { throwV, heave, zone: p.type === 0 ? 0 : 1 };
  },
  outputs: [
    { key: "throwV", label: "Throw (vertical)", unit: "m", digits: 2 },
    { key: "heave", label: "Heave (horizontal)", unit: "m", digits: 2 },
    { key: "zone", label: "Seam in plan", format: (v, o) => (v === 0 ? `Barren GAP ${o.heave.toFixed(1)} m` : `Double-seam OVERLAP ${o.heave.toFixed(1)} m`), tone: (v) => (v === 0 ? "warn" : "crit") },
  ],
  handles: [
    {
      key: "d",
      axis: "y",
      at: (p, o) => {
        const fxx = (y: number) => 170 + (y - 20) / Math.tan(rad(p.theta));
        const yH = 120 + (p.type === 0 ? 1 : -1) * o.throwV * 2.4;
        return [Math.min(fxx(yH) + 46, 388), yH + 5];
      },
      toValue: (y, p) => ((p.type === 0 ? y - 125 : 125 - y) / (2.4 * Math.sin(rad(p.theta)))),
      color: "#3B82F6",
    },
  ],
  render: (p, o) => {
    const s = 2.4; // px per metre
    const t = Math.tan(rad(p.theta));
    const fx = (y: number) => 170 + (y - 20) / t; // fault plane x at depth y (dips to the right)
    const yF = 120; // footwall seam
    const dy = (p.type === 0 ? 1 : -1) * o.throwV * s;
    const yH = yF + dy; // hanging-wall seam
    const th = 10;
    return (
      <g>
        <rect x={0} y={0} width={400} height={20} fill={MAT.sky} />
        <polygon points={`0,20 ${fx(20)},20 ${fx(240)},240 0,240`} fill={MAT.sand} />
        <polygon points={`${fx(20)},20 400,20 400,240 ${fx(240)},240`} fill={MAT.shale} />
        <polygon points={`${fx(20)},20 400,20 400,240 ${fx(240)},240`} fill={MAT.rockShade} />
        <rect x={0} y={yF} width={fx(yF)} height={th} fill={MAT.coal} />
        <rect x={fx(yH)} y={yH} width={Math.max(0, 400 - fx(yH))} height={th} fill={MAT.coal} />
        <line x1={fx(20)} y1={20} x2={fx(240)} y2={240} stroke="#7F1D1D" strokeWidth={6} opacity={0.25} />
        <line x1={fx(20)} y1={20} x2={fx(240)} y2={240} stroke={C.crit} strokeWidth={2.5} strokeDasharray="10 3" />
        <Txt x={fx(20) + 6} y={32} size={9} fill={C.crit} weight={800}>
          FAULT PLANE θ={p.theta}°
        </Txt>
        <Txt x={10} y={230} size={9} weight={700} fill={C.slate}>
          FOOTWALL
        </Txt>
        <Txt x={390} y={230} size={9} weight={700} fill={C.slate} anchor="end">
          HANGING WALL {p.type === 0 ? "↓ (down-thrown)" : "↑ (up-thrown)"}
        </Txt>
        <Arrow x1={fx(yF) + 12} y1={yF + 2} x2={fx(yH) + 12} y2={yH + 2} color={C.tech} width={2} />
        <Dim x1={Math.min(fx(yF) - 30, 330)} y1={yF} x2={Math.min(fx(yF) - 30, 330)} y2={yH} label={`T ${o.throwV.toFixed(1)} m`} color={C.ink} side="left" />
        <line x1={fx(yF)} x2={fx(yH)} y1={p.type === 0 ? yH + th + 14 : yF + th + 14} y2={p.type === 0 ? yH + th + 14 : yF + th + 14} stroke={C.hazard} strokeWidth={3} />
        <Txt x={clamp((fx(yF) + fx(yH)) / 2, 60, 340)} y={Math.min((p.type === 0 ? yH : yF) + th + 28, 214)} size={9} anchor="middle" weight={800} fill="#B45309" mono>
          heave {o.heave.toFixed(1)} m · {p.type === 0 ? "GAP" : "OVERLAP"}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Core logging & RQD ---------------- */

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic core pieces (m) for a run, given joint frequency λ (/m) and recovery. */
export function corePieces(lambda: number, run: number, recovery: number): number[] {
  const rnd = mulberry32(Math.round(lambda * 100) + 7);
  const recovered = (run * recovery) / 100;
  const out: number[] = [];
  let sum = 0;
  while (sum < recovered - 1e-9) {
    const len = Math.min(Math.max(0.005, -Math.log(1 - rnd() * 0.999) / lambda), recovered - sum);
    out.push(len);
    sum += len;
  }
  return out;
}

export const rqdSim: SimDef = {
  id: "u1-rqd",
  title: "Diamond core tray — RQD logger",
  params: [
    { key: "lambda", label: "Natural joint frequency λ", min: 0.5, max: 30, step: 0.5, unit: "/m", default: 6 },
    { key: "rec", label: "Core recovery", min: 60, max: 100, step: 1, unit: "%", default: 95 },
  ],
  compute: (p) => {
    const run = 3;
    const pieces = corePieces(p.lambda, run, p.rec);
    const sound = pieces.filter((x) => x >= 0.1).reduce((a, b) => a + b, 0);
    const rqd = (sound / run) * 100;
    const x = 0.1 * p.lambda;
    const rqdT = 100 * Math.exp(-x) * (x + 1);
    return { rqd, rqdT, n: pieces.length, cls: rqd < 25 ? 0 : rqd < 50 ? 1 : rqd < 75 ? 2 : rqd < 90 ? 3 : 4 };
  },
  outputs: [
    { key: "rqd", label: "Logged RQD", unit: "%", digits: 1, tone: (v) => (v < 50 ? "crit" : v < 75 ? "warn" : "ok") },
    { key: "rqdT", label: "Priest–Hudson RQD (100% rec.)", unit: "%", digits: 1 },
    { key: "cls", label: "Rock quality (Deere)", format: (v) => ["Very poor", "Poor", "Fair", "Good", "Excellent"][v], tone: (v) => (v <= 1 ? "crit" : v === 2 ? "warn" : "ok") },
  ],
  render: (p) => {
    const run = 3;
    const pieces = corePieces(p.lambda, run, p.rec);
    // 3 rows of 1 m each in the tray
    const px = 330; // px per metre
    const rows: { x: number; w: number; row: number; ok: boolean }[] = [];
    let pos = 0;
    for (const len of pieces) {
      let start = pos;
      let remaining = len;
      while (remaining > 1e-9) {
        const row = Math.floor(start + 1e-9);
        const rowEnd = row + 1;
        const seg = Math.min(remaining, rowEnd - start);
        rows.push({ x: 35 + (start - row) * px, w: seg * px, row, ok: len >= 0.1 });
        start += seg;
        remaining -= seg;
      }
      pos += len;
    }
    return (
      <g>
        <rect x={28} y={25} width={347} height={170} rx={6} fill={MAT.wood} filter="url(#f-shadow)" />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x={35} y={40 + r * 50} width={330} height={30} rx={3} fill="#5B3410" />
            <rect x={35} y={40 + r * 50} width={330} height={4} rx={2} fill="#3B200A" opacity={0.6} />
            <Txt x={22} y={60 + r * 50} size={8} anchor="end" fill={C.slate} mono>
              {r}m
            </Txt>
          </g>
        ))}
        {rows.map((s, i) => (
          <rect key={i} x={s.x + 0.8} y={44 + s.row * 50} width={Math.max(s.w - 1.6, 0.8)} height={22} rx={3} fill={MAT.core} stroke={s.ok ? C.safe : C.crit} strokeWidth={s.ok ? 1.5 : 0.8} />
        ))}
        <Txt x={35} y={214} size={9} weight={700}>
          <tspan fill={C.safe}>■</tspan> piece ≥ 10 cm (counts) <tspan fill={C.crit}>■</tspan> &lt; 10 cm · lost core = empty tray
        </Txt>
        <Meter x={35} y={224} w={330} value={p.rec} max={100} label="" color={C.tech} />
      </g>
    );
  },
};

/* ---------------- UNFC classifier ---------------- */

const UNFC: Record<number, string> = {
  111: "Proved Mineral Reserve",
  121: "Probable Mineral Reserve",
  122: "Probable Mineral Reserve",
  211: "Feasibility Mineral Resource",
  221: "Prefeasibility Mineral Resource",
  222: "Prefeasibility Mineral Resource",
  331: "Measured Mineral Resource",
  332: "Indicated Mineral Resource",
  333: "Inferred Mineral Resource",
  334: "Reconnaissance Mineral Resource",
};

export function unfcName(code: number): string {
  return UNFC[code] ?? "Not a standard UNFC (India) category";
}

export const unfcSim: SimDef = {
  id: "u1-unfc",
  title: "UNFC three-axis classifier (MEMC Rules 2015)",
  params: [
    { key: "E", label: "E · Economic viability", min: 1, max: 3, step: 1, default: 1, options: [{ value: 1, label: "E1 Economic" }, { value: 2, label: "E2 Potentially" }, { value: 3, label: "E3 Intrinsic" }] },
    { key: "F", label: "F · Feasibility assessment", min: 1, max: 3, step: 1, default: 1, options: [{ value: 1, label: "F1 Feasibility" }, { value: 2, label: "F2 Prefeasibility" }, { value: 3, label: "F3 Geological" }] },
    { key: "G", label: "G · Geological assurance", min: 1, max: 4, step: 1, default: 1, options: [{ value: 1, label: "G1 Detailed" }, { value: 2, label: "G2 General" }, { value: 3, label: "G3 Prospecting" }, { value: 4, label: "G4 Recon" }] },
  ],
  compute: (p) => {
    const code = 100 * p.E + 10 * p.F + p.G;
    return { code, valid: UNFC[code] ? 1 : 0, reserve: p.E === 1 && UNFC[code] ? 1 : 0 };
  },
  outputs: [
    { key: "code", label: "UNFC code", digits: 0, format: (v) => String(v) },
    { key: "code", label: "Category", format: (v) => unfcName(v), tone: (_, o) => (o.valid ? "ok" : "crit") },
    { key: "reserve", label: "Class", format: (v, o) => (!o.valid ? "—" : v ? "RESERVE (mineable)" : "REMAINING RESOURCE"), tone: (v, o) => (!o.valid ? "crit" : v ? "ok" : "warn") },
  ],
  render: (p, o) => {
    const axes = [
      { k: "E", n: 3, v: p.E, color: C.safe, labels: ["Economic", "Pot. econ.", "Intrinsic"] },
      { k: "F", n: 3, v: p.F, color: C.tech, labels: ["Feasibility", "Prefeas.", "Geological"] },
      { k: "G", n: 4, v: p.G, color: C.hazard, labels: ["Detailed", "General", "Prospect.", "Recon."] },
    ];
    return (
      <g>
        {axes.map((a, i) => (
          <g key={a.k}>
            <Txt x={30} y={42 + i * 52} size={16} weight={900} fill={a.color}>
              {a.k}
            </Txt>
            {Array.from({ length: a.n }).map((_, j) => (
              <g key={j}>
                <rect x={52 + j * 52} y={26 + i * 52} width={48} height={24} rx={6} fill={a.v === j + 1 ? a.color : "#f8fafc"} stroke={a.color} strokeWidth={a.v === j + 1 ? 0 : 1.2} filter={a.v === j + 1 ? "url(#f-shadow)" : undefined} />
                <Txt x={76 + j * 52} y={42 + i * 52} size={8} anchor="middle" weight={700} fill={a.v === j + 1 ? "white" : C.slate}>
                  {`${a.k}${j + 1}`}
                </Txt>
                <Txt x={76 + j * 52} y={60 + i * 52} size={6.5} anchor="middle" fill={C.slate}>
                  {a.labels[j]}
                </Txt>
              </g>
            ))}
          </g>
        ))}
        <rect x={270} y={30} width={115} height={150} rx={14} fill={o.valid ? (o.reserve ? C.safe : C.tech) : C.crit} filter="url(#f-shadow)" />
        <rect x={270} y={30} width={115} height={150} rx={14} fill={MAT.glass} />
        <Txt x={327} y={95} size={34} weight={900} anchor="middle" fill="white" mono>
          {String(o.code)}
        </Txt>
        <Txt x={327} y={120} size={8} anchor="middle" fill="white" weight={700}>
          {o.valid ? (o.reserve ? "RESERVE" : "RESOURCE") : "INVALID"}
        </Txt>
        <Txt x={20} y={205} size={9} fill={C.ink} weight={700}>
          {unfcName(o.code)}
        </Txt>
        <Txt x={20} y={222} size={8} fill={C.slate}>
          Reserves need E1 + a feasibility (F1) or prefeasibility (F2) study + G1/G2 assurance.
        </Txt>
      </g>
    );
  },
};

export const U1_SIMS = [coalRank, supergene, apparentDip, faultSim, rqdSim, unfcSim];
