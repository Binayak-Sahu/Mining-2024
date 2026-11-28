"use client";

import type { ReactNode } from "react";
import type { SimDef, Vals } from "@/lib/types";
import { UNITS } from "@/content";
import { overburden } from "@/content/sims/u0";
import { coalRank, apparentDip } from "@/content/sims/u1";
import { SvgTex } from "./Tex";
import { GREYS, num, type Family } from "./tokens";

/**
 * Phase 15.5-v3a pilot copies of three sims, redrawn to DESIGN.md §5.6. Sandbox only: the production SimDefs are
 * imported and spread, so params, compute, outputs (readouts) and the lesson objective are the production ones; only
 * the drawing and the grip positions (re-laid out for 14 px labels) are new. Production sim files are untouched.
 */

export interface PilotDef extends SimDef {
  family: Family;
  /** viewBox height (width is always 400). */
  viewH: number;
  /** The objective of the first lesson sim stage that uses this sim (production content). */
  goal?: { text: string; test: (p: Vals, o: Vals) => boolean };
  start?: Vals;
  /** Where the objective comes from, e.g. "Lesson 1.1 · Cook a coking coal". */
  where?: string;
  /** Formulas from the lesson, typeset with KaTeX under the stage. `work` adds a worked line (hidden while predicting). */
  formulas: { tex: string; caption: string }[];
  work?: (p: Vals, o: Vals) => string | null;
  note?: (p: Vals) => string | null;
}

/** §5.6 label size: 18 viewBox units = 14.1 px when the 400-wide stage is drawn 314 px wide (390 px phone). */
const LBL = 18;
const INK = "var(--text)";
const INK2 = "var(--text-2)";
const INK3 = "var(--text-3)";
/** Text and lines drawn ON a light fill keep a fixed dark ink in both themes (§5.6); fills keep their values. */
const ON_FILL = "#141414";

function T({ x, y, children, fill = INK2, anchor = "start", size = LBL, weight = 600 }: { x: number; y: number; children: ReactNode; fill?: string; anchor?: "start" | "middle" | "end"; size?: number; weight?: number }) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} textAnchor={anchor} style={{ fill }}>
      {children}
    </text>
  );
}

/** Arrowhead + shaft as one filled shape (vertical, pointing down). */
function DownArrow({ x, y1, y2, w = 8, head = 20, fill }: { x: number; y1: number; y2: number; w?: number; head?: number; fill: string }) {
  const hy = Math.max(y1, y2 - head);
  return <path d={`M${x - w / 2} ${y1} L${x + w / 2} ${y1} L${x + w / 2} ${hy} L${x + head * 0.6} ${hy} L${x} ${y2} L${x - head * 0.6} ${hy} L${x - w / 2} ${hy} Z`} style={{ fill }} strokeLinejoin="round" />;
}

function goalFor(simId: string): { goal?: PilotDef["goal"]; start?: Vals; where?: string } {
  for (const u of UNITS)
    for (const [li, l] of u.lessons.entries())
      for (const s of l.stages)
        if (s.kind === "sim" && s.sim === simId) return { goal: s.goal, start: s.start, where: `Lesson ${u.n}.${li + 1} · ${s.title}` };
  return {};
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rad = (d: number) => (d * Math.PI) / 180;

/* ---------------- Virgin vertical stress (U0, blue) ---------------- */

const OB = { top: 52, bottom: 268, x0: 96, x1: 236 };
const obY = (H: number) => OB.top + ((OB.bottom - OB.top) * H) / 1200;

export const overburdenV3: PilotDef = {
  ...overburden,
  ...goalFor(overburden.id),
  family: "blue",
  viewH: 284,
  handles: [{ key: "H", axis: "y", at: (p) => [OB.x1, obY(p.H)], toValue: (y) => ((y - OB.top) / (OB.bottom - OB.top)) * 1200 }],
  formulas: [{ tex: "\\sigma_v = \\rho\\, g\\, H", caption: "Vertical stress from overburden weight" }],
  work: (p, o) => (p.__predicting === 1 ? null : `\\sigma_v = ${p.rho.toFixed(2)} \\times 9.81 \\times ${p.H} \\,/\\, 1000 = ${o.sv.toFixed(2)}\\ \\text{MPa}`),
  note: (p) => (p.__predicting === 1 ? null : "Rule of thumb: ≈ 0.025 MPa per metre (2.5 t/m³ rock). Pillars, roof bolts and shaft linings all start here."),
  render: (p, o) => {
    const y = obY(p.H);
    const crit = o.sv > 20;
    const len = clamp(o.sv * 4.4, 10, Math.max(10, y - 12 - 14));
    const beds = [0.18, 0.37, 0.55, 0.71, 0.86];
    return (
      <g>
        <T x={OB.x0} y={OB.top - 14} weight={700}>
          Surface
        </T>
        <rect x={OB.x0} y={OB.top} width={OB.x1 - OB.x0} height={OB.bottom - OB.top} rx={8} fill={GREYS.light} />
        {beds.map((f) => (
          <line key={f} x1={OB.x0} x2={OB.x1} y1={OB.top + f * (OB.bottom - OB.top)} y2={OB.top + f * (OB.bottom - OB.top)} stroke={GREYS.mid} strokeWidth={1.5} />
        ))}
        <line x1={OB.x0 - 6} x2={OB.x1 + 6} y1={OB.top} y2={OB.top} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        {/* seam with the gallery */}
        <rect x={OB.x0} y={y - 8} width={OB.x1 - OB.x0} height={16} fill={GREYS.deep} />
        <rect x={148} y={y - 8} width={36} height={16} rx={3} style={{ fill: "var(--surface)" }} />
        <T x={OB.x0 + 8} y={y < 220 ? y + 32 : y - 16} fill={ON_FILL} weight={700}>
          Gallery
        </T>
        {/* load arrow onto the gallery */}
        <DownArrow x={166} y1={y - 12 - len} y2={y - 10} fill={crit ? "var(--danger)" : "var(--u-mid)"} />
        {/* depth dimension */}
        <line x1={80} x2={80} y1={OB.top} y2={y} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <line x1={74} x2={86} y1={OB.top} y2={OB.top} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <line x1={74} x2={86} y1={y} y2={y} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={70} y={clamp((OB.top + y) / 2 + 6, OB.top + 12, OB.bottom)} anchor="end" fill={INK} weight={700}>
          {num(p.H, 0, "m")}
        </T>
        {/* result */}
        <SvgTex x={256} y={92} tex="\sigma_v" size={26} color="var(--text-2)" />
        <T x={256} y={128} fill={crit ? "var(--danger-text)" : INK} size={28} weight={800}>
          {num(o.sv, 2)}
        </T>
        <T x={256} y={154} fill={INK2}>
          MPa
        </T>
      </g>
    );
  },
};

/* ---------------- Coalification furnace (U1, orange) ---------------- */

const RANK_SHORT = ["Peat", "Lignite", "Sub-bituminous", "HV bituminous", "MV bituminous", "LV bituminous", "Semi-anthracite", "Anthracite"];
const RANK_MAX = [0.25, 0.4, 0.6, 1.1, 1.5, 2.0, 2.5, 5];
const CR = { top: 52, bottom: 268, cx0: 56, cx1: 146, lx: 206, lw: 30 };
const crY = (D: number) => CR.top + (D / 8) * (CR.bottom - CR.top);
const bandH = (CR.bottom - CR.top) / RANK_SHORT.length;

export const coalRankV3: PilotDef = {
  ...coalRank,
  ...goalFor(coalRank.id),
  family: "orange",
  viewH: 284,
  handles: [{ key: "D", axis: "y", at: (p) => [CR.cx1, crY(p.D)], toValue: (y) => ((y - CR.top) / (CR.bottom - CR.top)) * 8 }],
  formulas: [
    { tex: "k = A \\exp(-E_a/RT)", caption: "Arrhenius kinetics: why temperature dominates rank, and why time only adds logarithmically." },
    { tex: "X_{\\text{daf}} = X_{\\text{ad}} \\times \\dfrac{100}{100 - M - A}", caption: "Convert air-dried analysis to dry-ash-free basis" },
  ],
  render: (p, o) => {
    const y = crY(p.D);
    const k = o.rank as number;
    const lo = k === 0 ? 0.15 : RANK_MAX[k - 1];
    const hi = RANK_MAX[k];
    const frac = clamp((Math.log(o.ro) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)), 0, 1);
    const bandTop = (i: number) => CR.bottom - (i + 1) * bandH;
    const py = bandTop(k) + bandH - frac * bandH;
    return (
      <g>
        <defs>
          <linearGradient id="v3-heat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--u-light)" />
            <stop offset="0.5" stopColor="var(--u-mid)" />
            <stop offset="1" stopColor="var(--u-deep)" />
          </linearGradient>
        </defs>
        <T x={CR.cx0} y={CR.top - 16} weight={700}>
          Burial
        </T>
        <T x={CR.lx} y={CR.top - 16} weight={700}>
          Rank
        </T>
        {/* heat ramp: temperature is the data here (§5.6) */}
        <rect x={CR.cx0} y={CR.top} width={CR.cx1 - CR.cx0} height={CR.bottom - CR.top} rx={8} fill="url(#v3-heat)" />
        {[0, 8].map((d) => (
          <T key={d} x={CR.cx0 - 8} y={crY(d) + (d ? 0 : 12)} anchor="end" fill={INK2}>
            {num(d, 0, "km")}
          </T>
        ))}
        {[2, 4, 6].map((d) => (
          <line key={d} x1={CR.cx0 - 10} x2={CR.cx0 - 2} y1={crY(d)} y2={crY(d)} style={{ stroke: INK3 }} strokeWidth={1.5} />
        ))}
        {/* the seam at max burial, with its peak temperature */}
        <rect x={CR.cx0} y={y - 13} width={CR.cx1 - CR.cx0} height={26} rx={6} fill={GREYS.deep} />
        <T x={(CR.cx0 + CR.cx1) / 2 - 8} y={y + 6} anchor="middle" fill="#FFFFFF" weight={800}>
          {num(o.T, 0, "°C")}
        </T>
        {/* rank ladder: equal bands, Ro placed on a log scale inside its band */}
        {RANK_SHORT.map((name, i) => {
          const on = i === k;
          return (
            <g key={name}>
              <rect x={CR.lx} y={bandTop(i) + 1} width={CR.lw} height={bandH - 2} rx={4} style={{ fill: on ? "var(--u-mid)" : GREYS.light }} />
              {on && <rect x={CR.lx - 4} y={bandTop(i) - 3} width={CR.lw + 8} height={bandH + 6} rx={7} fill="none" style={{ stroke: "var(--u-ink)" }} strokeWidth={3} />}
              <T x={CR.lx + CR.lw + 12} y={bandTop(i) + bandH / 2 + 6} fill={on ? INK : INK2} weight={on ? 800 : 500}>
                {name}
              </T>
            </g>
          );
        })}
        <path d={`M${CR.lx - 8} ${py} l-12 -8 v16 z`} style={{ fill: INK }} strokeLinejoin="round" />
      </g>
    );
  },
};

/* ---------------- True vs apparent dip (U1, orange) ---------------- */

const PV = { cx: 100, cy: 128, r: 78 };
const SV = { x0: 214, x1: 392, g: 76, bottom: 228 };

export const apparentDipV3: PilotDef = {
  ...apparentDip,
  ...goalFor(apparentDip.id),
  family: "orange",
  viewH: 252,
  handles: [
    {
      key: "beta",
      axis: "x",
      at: (p) => [PV.cx + PV.r * Math.cos(rad(p.beta)), PV.cy + PV.r * Math.sin(rad(p.beta))],
      toValue: (x) => (Math.acos(clamp((x - PV.cx) / PV.r, 0, 1)) * 180) / Math.PI,
    },
  ],
  formulas: [{ tex: "\\tan\\alpha = \\tan\\delta \\cdot \\sin\\beta", caption: "Apparent dip α for a section at β from strike · δ true dip" }],
  render: (p, o) => {
    const { cx, cy, r } = PV;
    const b = rad(p.beta);
    const a = rad(o.alpha);
    const ex = SV.x1;
    const ey = SV.g + (SV.x1 - SV.x0) * Math.tan(a);
    return (
      <g>
        <T x={cx - r} y={30} weight={700}>
          Plan
        </T>
        <circle cx={cx} cy={cy} r={r} style={{ fill: "var(--u-light)" }} />
        {/* strike (solid) and section line (dashed) */}
        <line x1={cx - r} x2={cx + r} y1={cy} y2={cy} stroke={ON_FILL} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={cx - r * Math.cos(b)} y1={cy - r * Math.sin(b)} x2={cx + r * Math.cos(b)} y2={cy + r * Math.sin(b)} stroke={ON_FILL} strokeWidth={2.5} strokeDasharray="7 6" strokeLinecap="round" />
        {/* true dip arrow, square to strike */}
        <line x1={cx} y1={cy} x2={cx} y2={cy + 40} stroke={ON_FILL} strokeWidth={2.5} strokeLinecap="round" />
        <path d={`M${cx - 7} ${cy + 36} L${cx} ${cy + 50} L${cx + 7} ${cy + 36} Z`} fill={ON_FILL} strokeLinejoin="round" />
        <SvgTex x={cx - 6} y={cy + 24} tex={`\\delta = ${p.delta}\\text{°}`} size={LBL} anchor="end" color={ON_FILL} />
        {/* β arc from strike to the section line */}
        {p.beta > 2 && <path d={`M${cx + 28} ${cy} A28 28 0 0 1 ${cx + 28 * Math.cos(b)} ${cy + 28 * Math.sin(b)}`} fill="none" stroke={ON_FILL} strokeWidth={1.5} />}
        <SvgTex x={cx + 8} y={cy - 22} tex={`\\beta = ${p.beta}\\text{°}`} size={LBL} color={ON_FILL} />
        <circle cx={cx} cy={cy} r={4} fill={ON_FILL} />
        {/* legend for the two lines, off the fill */}
        <line x1={cx - r} x2={cx - r + 24} y1={cy + r + 22} y2={cy + r + 22} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        <T x={cx - r + 32} y={cy + r + 28}>
          Strike
        </T>
        <line x1={cx + 22} x2={cx + 46} y1={cy + r + 22} y2={cy + r + 22} style={{ stroke: INK }} strokeWidth={2.5} strokeDasharray="7 6" strokeLinecap="round" />
        <T x={cx + 54} y={cy + r + 28}>
          Section
        </T>

        <T x={SV.x0} y={30} weight={700}>
          Section
        </T>
        <clipPath id="v3-sec">
          <rect x={SV.x0} y={SV.g} width={SV.x1 - SV.x0} height={SV.bottom - SV.g} rx={8} />
        </clipPath>
        <rect x={SV.x0} y={SV.g} width={SV.x1 - SV.x0} height={SV.bottom - SV.g} rx={8} fill={GREYS.light} />
        <polygon clipPath="url(#v3-sec)" points={`${SV.x0},${SV.g} ${ex},${ey} ${ex},${ey + 16} ${SV.x0},${SV.g + 16}`} fill={GREYS.deep} />
        <line x1={SV.x0 - 4} x2={SV.x1 + 4} y1={SV.g} y2={SV.g} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        {o.alpha > 1 && <path clipPath="url(#v3-sec)" d={`M${SV.x0 + 64} ${SV.g} A64 64 0 0 1 ${SV.x0 + 64 * Math.cos(a)} ${SV.g + 64 * Math.sin(a)}`} fill="none" stroke={ON_FILL} strokeWidth={2} />}
        <SvgTex x={SV.x0 + 6} y={SV.g - 16} tex={`\\alpha = ${o.alpha.toFixed(1)}\\text{°}`} size={20} color="var(--text)" />
      </g>
    );
  },
};

export const PILOTS: { def: PilotDef; name: string }[] = [
  { def: coalRankV3, name: "Coalification furnace" },
  { def: overburdenV3, name: "Virgin vertical stress" },
  { def: apparentDipV3, name: "Dip and strike" },
];
