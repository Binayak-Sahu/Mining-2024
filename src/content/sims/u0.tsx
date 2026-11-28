import type { SimDef } from "@/lib/types";
import { T, INK, INK3, SURFACE, ON_LIGHT, GREYS, U, BAD, DimLine, num, clamp } from "@/components/sim/v3";

/** Column frame: x 56–250; the 0–1200 m depth scale gives the gallery y ≈ 73 at 300 m (lesson hotspots at 70,32 / 150,45 / 175,70 stay on strata, load path, seam). */
const OB = { top: 26, bottom: 214, x0: 56, x1: 250 };
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
  primary: ["sv", "grad"],
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
    const h = OB.bottom - OB.top;
    const lx = 276;
    const b1 = clamp(y + 6, OB.top + 44, 188);
    return (
      <g>
        <defs>
          <clipPath id="u0ob-clip">
            <rect x={OB.x0} y={OB.top} width={OB.x1 - OB.x0} height={h} rx={8} />
          </clipPath>
        </defs>
        {/* host rock: three flat bands of overburden */}
        <g clipPath="url(#u0ob-clip)">
          <rect x={OB.x0} y={OB.top} width={OB.x1 - OB.x0} height={h} fill={GREYS.light} />
          <rect x={OB.x0} y={OB.top + h * 0.34} width={OB.x1 - OB.x0} height={h * 0.33} style={{ fill: U.light }} />
          {/* the seam with the gallery */}
          <rect x={OB.x0} y={y - 8} width={OB.x1 - OB.x0} height={16} fill={GREYS.deep} />
        </g>
        <rect x={OB.x0} y={OB.top} width={OB.x1 - OB.x0} height={h} rx={8} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} />
        <line x1={OB.x0 - 8} x2={OB.x1 + 8} y1={OB.top} y2={OB.top} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
        <T x={lx} y={OB.top + 18}>
          Surface
        </T>
        <rect x={132} y={y - 8} width={36} height={16} rx={3} style={{ fill: SURFACE }} />
        {y >= OB.top + 84 && (
          <T x={OB.x0 + 8} y={OB.top + 68} fill={ON_LIGHT}>
            Strata
          </T>
        )}
        {/* load path onto the gallery */}
        <path
          data-state={crit ? "unsafe" : "safe"}
          d={`M146 ${top} h8 v${y - 9 - top - 14} h7 l-11 14 l-11 -14 h7 z`}
          style={{ fill: crit ? BAD : U.mid, stroke: INK3 }}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* depth */}
        <DimLine x1={OB.x1 + 14} y1={OB.top} x2={OB.x1 + 14} y2={y} />
        <line x1={OB.x1} x2={lx - 6} y1={y} y2={b1 - 6} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <T x={lx} y={b1} fill={INK} weight={700}>
          Gallery
        </T>
        <T x={lx} y={b1 + 22} fill={INK} weight={700}>
          {num(p.H, 0, "m")}
        </T>
      </g>
    );
  },
};

export const U0_SIMS = [overburden];
