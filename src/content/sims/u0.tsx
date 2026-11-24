import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Dim, clamp } from "@/components/sim/svg";

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
  render: (p, o) => {
    const top = 20;
    const bottom = 220;
    const yWork = top + ((bottom - top) * p.H) / 1200;
    const layers = [C.soil, C.sand, C.shale, C.sand, C.shale, C.rock];
    const arrowLen = clamp(o.sv * 4, 6, 150);
    return (
      <g>
        {layers.map((c, i) => (
          <rect key={i} x={40} y={top + (i * (bottom - top)) / layers.length} width={160} height={(bottom - top) / layers.length} fill={c} opacity={0.85} />
        ))}
        <rect x={40} y={yWork - 4} width={160} height={8} fill={C.coal} />
        <rect x={100} y={yWork - 4} width={40} height={8} fill="white" stroke={C.ink} />
        <Txt x={120} y={yWork + 3} size={7} anchor="middle" weight={700}>
          GALLERY
        </Txt>
        <Dim x1={30} y1={top} x2={30} y2={yWork} label={`${p.H} m`} />
        <Arrow x1={120} y1={yWork - 6 - arrowLen} x2={120} y2={yWork - 6} color={o.sv > 20 ? C.crit : C.tech} width={4} head={9} />
        <Txt x={230} y={40} size={11} weight={700}>
          σv = ρ·g·H
        </Txt>
        <Txt x={230} y={58} size={10} mono>
          {`= ${p.rho.toFixed(2)}×9.81×${p.H}`}
        </Txt>
        <Txt x={230} y={76} size={14} weight={800} mono fill={o.sv > 20 ? C.crit : C.ink}>
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
