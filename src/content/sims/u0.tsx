import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Dim, clamp } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";

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
  handles: [{ key: "H", axis: "y", at: (p) => [168, 20 + (200 * p.H) / 1200], toValue: (y) => (y - 20) * 6, color: "#3B82F6" }],
  render: (p, o) => {
    const top = 20;
    const bottom = 220;
    const yWork = top + ((bottom - top) * p.H) / 1200;
    const layers = [MAT.soil, MAT.sand, MAT.shale, MAT.sand, MAT.shale, MAT.rock];
    const arrowLen = clamp(o.sv * 4, 6, 150);
    return (
      <g>
        {layers.map((c, i) => (
          <rect key={i} x={56} y={top + (i * (bottom - top)) / layers.length} width={144} height={(bottom - top) / layers.length} fill={c} />
        ))}
        <rect x={56} y={top} width={144} height={bottom - top} fill={MAT.rockShade} />
        <rect x={56} y={top - 6} width={144} height={6} rx={1} fill="#65A30D" />
        <rect x={56} y={top} width={144} height={bottom - top} fill="none" stroke="rgba(15,23,42,0.35)" />
        <rect x={56} y={yWork - 4} width={144} height={8} fill={MAT.coal} />
        <rect x={100} y={yWork - 4} width={40} height={8} fill="#FEF3C7" stroke={C.ink} />
        <circle cx={120} cy={yWork} r={14} fill="url(#grad-lamp)" />
        <Txt x={120} y={yWork + 3} size={7} anchor="middle" weight={700}>
          GALLERY
        </Txt>
        <Dim x1={46} y1={top} x2={46} y2={yWork} label={`${p.H} m`} side="left" />
        <Arrow x1={120} y1={yWork - 6 - arrowLen} x2={120} y2={yWork - 6} color={o.sv > 20 ? C.crit : C.tech} width={4} head={9} />
        <Txt x={230} y={40} size={11} weight={700}>
          σv = ρ·g·H
        </Txt>
        <Txt x={230} y={58} size={10} mono>
          {`= ${p.rho.toFixed(2)}×9.81×${p.H}`}
        </Txt>
        <Txt x={230} y={78} size={15} weight={800} mono fill={o.sv > 20 ? C.crit : C.ink}>
          {`${o.sv.toFixed(2)} MPa`}
        </Txt>
        <Txt x={230} y={104} size={9} fill={C.slate}>
          Rule of thumb: ≈ 0.025 MPa per metre
        </Txt>
        <Txt x={230} y={118} size={9} fill={C.slate}>
          (2.5 t/m³ rock). Pillars, roof bolts
        </Txt>
        <Txt x={230} y={132} size={9} fill={C.slate}>
          and shaft linings all start here.
        </Txt>
      </g>
    );
  },
};

export const U0_SIMS = [overburden];
