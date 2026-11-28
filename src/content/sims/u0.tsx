import type { SimDef } from "@/lib/types";
import { T, INK, SURFACE, ON_LIGHT, GREYS, U, BAD, BAD_TEXT, DimLine, num, clamp } from "@/components/sim/v3";
import { SvgTex } from "@/components/sim/Tex";

/** Column frame: legacy x 56–200 and the 0–1200 m depth scale give the gallery y = 70 at 300 m (lesson hotspot). */
const OB = { top: 20, bottom: 220, x0: 56, x1: 200 };
const obY = (H: number) => OB.top + ((OB.bottom - OB.top) * H) / 1200;

export const overburden: SimDef = {
  id: "u0-overburden",
  title: "Overburden column — vertical stress gauge",
  params: [
    { key: "H", label: "Depth of working, H", min: 50, max: 1200, step: 10, unit: "m", default: 300 },
    { key: "rho", label: "Average overburden density, ρ", min: 2.0, max: 3.0, step: 0.05, unit: "t/m³", default: 2.5 },
  ],
  compute: (p) => {
    const sv = (p.rho * 1000 * 9.81 * p.H) / 1e6;
    return { sv, grad: sv / p.H * 1000, coal: 20 };
  },
  outputs: [
    { key: "sv", label: "Vertical stress σv", unit: "MPa", digits: 2, tone: (v) => (v > 20 ? "crit" : v > 10 ? "warn" : "ok") },
    { key: "grad", label: "Stress gradient", unit: "kPa/m", digits: 1 },
    {
      key: "sv",
      label: "vs coal UCS ≈ 20 MPa",
      format: (v) => (v >= 20 ? "σv ≥ UCS — yield likely" : `${((v / 20) * 100).toFixed(0)}% of UCS`),
      tone: (v) => (v >= 20 ? "crit" : v > 10 ? "warn" : "ok"),
    },
  ],
  caption: "Rule of thumb: ≈ 0.025 MPa per metre (2.5 t/m³ rock). Pillars, roof bolts and shaft linings all start here.",
  // §5.6 redraw (v3e). Column, gallery and load path keep their legacy places so the lesson hotspots still land on them.
  v3: {
    viewH: 240,
    // Predict stages pass __predicting = 1 before the reveal: hide the working that gives the answer away.
    formula: (p, o) => (p.__predicting === 1 ? "\\sigma_v = \\rho\\, g\\, H" : `\\sigma_v = \\rho g H = ${p.rho.toFixed(2)} \\times 9.81 \\times ${p.H} = ${o.sv.toFixed(2)}\\ \\text{MPa}`),
  },
  handles: [{ key: "H", axis: "y", at: (p) => [OB.x1, obY(p.H)], toValue: (y) => ((y - OB.top) / (OB.bottom - OB.top)) * 1200 }],
  render: (p, o) => {
    const y = obY(p.H);
    const crit = o.sv > 20;
    const top = y - 9 - clamp(o.sv * 5, 22, Math.max(22, y - 9 - OB.top - 4));
    const beds = [0.2, 0.4, 0.6, 0.8];
    return (
      <g>
        <rect x={OB.x0} y={OB.top} width={OB.x1 - OB.x0} height={OB.bottom - OB.top} rx={8} fill={GREYS.light} />
        {beds.map((f) => (
          <line key={f} x1={OB.x0} x2={OB.x1} y1={OB.top + f * (OB.bottom - OB.top)} y2={OB.top + f * (OB.bottom - OB.top)} stroke={GREYS.mid} strokeWidth={1.5} />
        ))}
        <line x1={OB.x0 - 8} x2={OB.x1 + 8} y1={OB.top} y2={OB.top} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        <T x={OB.x1 + 40} y={OB.top + 6}>
          Surface
        </T>
        {/* the seam with the gallery */}
        <rect x={OB.x0} y={y - 8} width={OB.x1 - OB.x0} height={16} fill={GREYS.deep} />
        <rect x={132} y={y - 8} width={36} height={16} rx={3} style={{ fill: SURFACE }} />
        <T x={OB.x0 + 8} y={y < 170 ? y + 30 : y - 16} fill={ON_LIGHT} weight={700}>
          Gallery
        </T>
        {/* load path onto the gallery */}
        <path d={`M146 ${top} h8 v${y - 9 - top - 14} h7 l-11 14 l-11 -14 h7 z`} style={{ fill: crit ? BAD : U.mid }} strokeLinejoin="round" />
        {/* depth */}
        <DimLine x1={OB.x1 + 30} y1={OB.top} x2={OB.x1 + 30} y2={y} />
        <T x={OB.x1 + 40} y={clamp(y + 6, OB.top + 42, OB.bottom)} fill={INK} weight={700}>
          {num(p.H, 0, "m")}
        </T>
        {/* result */}
        <SvgTex x={306} y={112} tex="\sigma_v" size={24} color="var(--text-2)" />
        <T x={306} y={150} fill={crit ? BAD_TEXT : INK} size={26} weight={800}>
          {num(o.sv, 2)}
        </T>
        <T x={306} y={174}>
          MPa
        </T>
      </g>
    );
  },
};

export const U0_SIMS = [overburden];
