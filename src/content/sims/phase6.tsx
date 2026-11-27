/**
 * Phase 6 simulations: three-point dip & strike, multi-mode slope failure, longwall face cycle,
 * thick-seam BG vs LTCC, froth flotation circuit, and FLP/IS electrical zoning.
 */
import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Plot, clamp, rad, deg, polyline, Cracks } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";

/* =========================================================================
 * 1. Three-point dip & strike solver
 * ========================================================================= */

export const BH = { A: [0, 0], B: [400, 0], C: [150, 350] } as const;

export function threePoint(p: Record<string, number>) {
  const eA = p.zA - p.dA;
  const eB = p.zB - p.dB;
  const eC = p.zC - p.dC;
  const a = (eB - eA) / 400; // dz/dE
  const b = (eC - eA - 150 * a) / 350; // dz/dN
  const g = Math.hypot(a, b);
  const dip = deg(Math.atan(g));
  const dipAz = g > 1e-9 ? (deg(Math.atan2(-a, -b)) + 360) % 360 : 0;
  const strike = (dipAz + 270) % 360;
  const app = deg(Math.atan(Math.tan(rad(dip)) * Math.cos(rad(p.sec - dipAz))));
  return { eA, eB, eC, a, b, dip, dipAz, strike, app };
}

export const dipStrikeSim: SimDef = {
  id: "u1-dip3",
  title: "Three-point problem — seam dip & strike from three boreholes",
  params: [
    { key: "zA", label: "Borehole A collar RL", min: 150, max: 250, step: 1, unit: "m", default: 200 },
    { key: "dA", label: "A: depth to seam", min: 50, max: 250, step: 1, unit: "m", default: 100 },
    { key: "zB", label: "Borehole B collar RL", min: 150, max: 250, step: 1, unit: "m", default: 210 },
    { key: "dB", label: "B: depth to seam", min: 50, max: 250, step: 1, unit: "m", default: 130 },
    { key: "zC", label: "Borehole C collar RL", min: 150, max: 250, step: 1, unit: "m", default: 190 },
    { key: "dC", label: "C: depth to seam", min: 50, max: 250, step: 1, unit: "m", default: 160 },
    { key: "sec", label: "Section line azimuth", min: 0, max: 359, step: 1, unit: "°", default: 90 },
  ],
  compute: (p) => {
    const r = threePoint(p);
    return { dip: r.dip, dipAz: r.dipAz, strike: r.strike, app: r.app, eA: r.eA, eB: r.eB, eC: r.eC };
  },
  outputs: [
    { key: "dip", label: "True dip θ", unit: "°", digits: 2 },
    { key: "dipAz", label: "Dip direction (azimuth)", unit: "°", digits: 1 },
    { key: "strike", label: "Strike", digits: 0, format: (v) => `${v.toFixed(0)}° / ${((v + 180) % 360).toFixed(0)}°` },
    { key: "app", label: "Apparent dip on section", unit: "°", digits: 2 },
    { key: "eA", label: "Seam RL at A / B / C", format: (v, o) => `${v.toFixed(0)} / ${o.eB.toFixed(0)} / ${o.eC.toFixed(0)} m` },
  ],
  caption: "Seam RL = collar RL − depth. The plane through the three seam points gives gradient (a, b); tan θ = √(a² + b²); down-dip azimuth = atan2(−a, −b); apparent dip tan α = tan θ·cos(section az − dip az).",
  render: (p) => {
    const r = threePoint(p);
    const k = 0.4;
    const X = (E: number) => 20 + (E + 50) * k;
    const Y = (N: number) => 210 - (N + 50) * k;
    const cE = (0 + 400 + 150) / 3;
    const cN = (0 + 0 + 350) / 3;
    const dE = Math.sin(rad(r.dipAz));
    const dN = Math.cos(rad(r.dipAz));
    const sE = Math.sin(rad(r.strike));
    const sN = Math.cos(rad(r.strike));
    const zc = r.eA + r.a * cE + r.b * cN;
    // structure contours every 20 m
    const g = Math.hypot(r.a, r.b);
    const contours = [];
    if (g > 1e-4) {
      for (let lvl = Math.ceil((zc - 120) / 20) * 20; lvl <= zc + 120; lvl += 20) {
        const t = (zc - lvl) / g; // distance down-dip from centroid
        const pE = cE + dE * t;
        const pN = cN + dN * t;
        if (Math.abs(t) > 320) continue;
        contours.push(
          <g key={lvl}>
            <line x1={X(pE - sE * 300)} y1={Y(pN - sN * 300)} x2={X(pE + sE * 300)} y2={Y(pN + sN * 300)} stroke={C.line} strokeWidth={1} />
            {X(pE + sE * 60) > 26 && X(pE + sE * 60) < 186 && Y(pN + sN * 60) > 40 && Y(pN + sN * 60) < 204 && Object.values(BH).every(([e, n]) => Math.hypot(X(e) - X(pE + sE * 60), Y(n) - Y(pN + sN * 60)) > 26) && (
              <Txt x={X(pE + sE * 60)} y={Y(pN + sN * 60)} size={6} fill={C.slate} mono>
                {lvl.toFixed(0)}
              </Txt>
            )}
          </g>,
        );
      }
    }
    const secE = Math.sin(rad(p.sec));
    const secN = Math.cos(rad(p.sec));
    const bh: [string, readonly [number, number], number][] = [
      ["A", BH.A, r.eA],
      ["B", BH.B, r.eB],
      ["C", BH.C, r.eC],
    ];
    const alpha = rad(r.app);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        <defs>
          <clipPath id="mapclip">
            <rect x={20} y={30} width={180} height={180} />
          </clipPath>
        </defs>
        <rect x={20} y={30} width={180} height={180} rx={3} fill="#F0FDF4" stroke="#86EFAC" />
        <g clipPath="url(#mapclip)">
          {contours}
          <line x1={X(cE - sE * 400)} y1={Y(cN - sN * 400)} x2={X(cE + sE * 400)} y2={Y(cN + sN * 400)} stroke={C.ink} strokeWidth={2.5} />
          <line x1={X(cE - secE * 400)} y1={Y(cN - secN * 400)} x2={X(cE + secE * 400)} y2={Y(cN + secN * 400)} stroke={C.tech} strokeWidth={1.5} strokeDasharray="5 3" />
        </g>
        <Arrow x1={X(cE)} y1={Y(cN)} x2={X(cE + dE * 110)} y2={Y(cN + dN * 110)} color={C.crit} width={2.5} />
        {bh.map(([n, [e, nn], rl]) => (
          <g key={n}>
            <circle cx={X(e)} cy={Y(nn)} r={9} fill={C.hazard} opacity={0.2} />
            <circle cx={X(e)} cy={Y(nn)} r={5} fill={C.hazard} stroke={C.ink} />
            <Txt x={X(e) + 7} y={Y(nn) - 4} size={8} weight={800}>
              {n}
            </Txt>
            <Txt x={X(e) + 7} y={Y(nn) + 7} size={7} mono fill={C.slate}>
              {`${rl.toFixed(0)}`}
            </Txt>
          </g>
        ))}
        <Txt x={20} y={22} size={8} weight={700} fill={C.slate}>
          PLAN · N↑ · structure contours (m RL)
        </Txt>
        <Txt x={22} y={225} size={8} fill={C.crit} weight={700}>
          {`dip ${r.dip.toFixed(1)}° → ${r.dipAz.toFixed(0)}°`}
        </Txt>
        <Txt x={120} y={225} size={8} fill={C.ink} weight={700}>
          ━ strike
        </Txt>
        <Txt x={215} y={22} size={8} weight={700} fill={C.slate}>
          {`SECTION along ${p.sec}°`}
        </Txt>
        <rect x={215} y={30} width={170} height={30} fill={MAT.sky} />
        <rect x={215} y={60} width={170} height={120} fill={MAT.sand} />
        <rect x={215} y={30} width={170} height={150} fill="none" stroke="#A8A29E" />
        <line x1={215} x2={385} y1={60} y2={60} stroke="#65A30D" strokeWidth={3} />
        <line x1={215} y1={105 - 85 * Math.tan(alpha)} x2={385} y2={105 + 85 * Math.tan(alpha)} stroke="#0F172A" strokeWidth={8} />
        <line x1={215} y1={105 - 85 * Math.tan(alpha)} x2={385} y2={105 + 85 * Math.tan(alpha)} stroke={MAT.coal} strokeWidth={6} />
        <Txt x={222} y={170} size={11} weight={900} mono fill={C.tech}>
          {`α = ${r.app.toFixed(2)}°`}
        </Txt>
        <Txt x={222} y={198} size={8} fill={C.slate}>
          + = seam deepens along section direction
        </Txt>
      </g>
    );
  },
};

/* =========================================================================
 * 2. Multi-mode slope failure (plane, wedge, circular, toppling)
 * ========================================================================= */

const MODES = ["Plane", "Wedge", "Circular", "Toppling"];

function planeFos(H: number, pf: number, pp: number, c: number, phi: number, ru: number, g = 25) {
  if (pp >= pf) return { fos: Infinity, W: 0, A: H / Math.sin(rad(pp)) };
  const W = 0.5 * g * H * H * (1 / Math.tan(rad(pp)) - 1 / Math.tan(rad(pf)));
  const A = H / Math.sin(rad(pp));
  const fos = (c * A + W * Math.cos(rad(pp)) * (1 - ru) * Math.tan(rad(phi))) / (W * Math.sin(rad(pp)));
  return { fos, W, A };
}

/** Bishop's simplified method with a coarse critical-circle search (circles through the toe). */
export function bishop(H: number, pf: number, c: number, phi: number, ru: number) {
  const g = 20;
  const xc = H / Math.tan(rad(pf));
  const ys = (x: number) => (x < 0 ? 0 : x < xc ? x * Math.tan(rad(pf)) : H);
  const tphi = Math.tan(rad(phi));
  let best = { fos: Infinity, cx: 0, cy: 0, R: 0, xe: 0 };
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 7; j++) {
      const cx = -0.2 * H + ((xc + 0.8 * H) * i) / 6;
      const cy = H * (1.1 + (1.6 * j) / 6);
      const R = Math.hypot(cx, cy);
      if (R <= cy - H) continue;
      const xe = cx + Math.sqrt(R * R - (cy - H) * (cy - H));
      if (xe <= xc) continue;
      const n = 20;
      const b = xe / n;
      const sl: { W: number; a: number; u: number }[] = [];
      for (let s = 0; s < n; s++) {
        const x = (s + 0.5) * b;
        const yb = cy - Math.sqrt(Math.max(R * R - (x - cx) * (x - cx), 0));
        const h = Math.max(ys(x) - yb, 0);
        const sa = clamp((x - cx) / R, -0.99, 0.99);
        sl.push({ W: g * h * b, a: Math.asin(sa), u: ru * g * h });
      }
      const drive = sl.reduce((s, q) => s + q.W * Math.sin(q.a), 0);
      if (drive <= 1) continue;
      let F = 1.2;
      for (let it = 0; it < 6; it++) {
        let res = 0;
        for (const q of sl) {
          const m = Math.cos(q.a) * (1 + (Math.tan(q.a) * tphi) / F);
          res += (c * b + (q.W - q.u * b) * tphi) / Math.max(m, 0.2);
        }
        F = res / drive;
      }
      if (F < best.fos) best = { fos: F, cx, cy, R, xe };
    }
  return best;
}

export function slopeModes(p: Record<string, number>) {
  const m = p.mode;
  if (m === 0) {
    const r = planeFos(p.H, p.pf, p.pp, p.c, p.phi, p.ru);
    return { fos: r.fos, kin: p.pp < p.pf ? 1 : 0, mech: 0 };
  }
  if (m === 1) {
    const k = 1 / Math.sin(rad(p.xi / 2));
    const r = planeFos(p.H, p.pf, p.pp, 0, p.phi, p.ru);
    const coh = p.pp < p.pf ? (p.c * r.A * 1.4) / Math.max(r.W * Math.sin(rad(p.pp)), 1) : 0;
    const fos = p.pp < p.pf ? k * r.fos + coh : Infinity;
    return { fos, kin: p.pp < p.pf ? 1 : 0, mech: 0 };
  }
  if (m === 2) {
    const b = bishop(p.H, p.pf, p.c, p.phi, p.ru);
    return { fos: b.fos, kin: 1, mech: 0 };
  }
  const topple = p.bh / Math.tan(rad(p.pp));
  const slide = Math.tan(rad(p.phi)) / Math.tan(rad(p.pp));
  return { fos: Math.min(topple, slide), kin: 1, mech: topple < slide ? 1 : 2 };
}

export const slopeModesSim: SimDef = {
  id: "u3-slope-modes",
  title: "Slope failure modes — plane, wedge, circular (Bishop) and toppling",
  animated: true,
  params: [
    { key: "mode", label: "Failure mode", min: 0, max: 3, step: 1, default: 0, options: MODES.map((m, i) => ({ value: i, label: m })) },
    { key: "H", label: "Slope height", min: 10, max: 60, step: 1, unit: "m", default: 30 },
    { key: "pf", label: "Bench / slope face angle", min: 25, max: 85, step: 1, unit: "°", default: 60 },
    { key: "pp", label: "Joint dip (plane / wedge-line plunge / toppling base)", min: 10, max: 80, step: 1, unit: "°", default: 35 },
    { key: "xi", label: "Wedge included angle ξ", min: 40, max: 150, step: 1, unit: "°", default: 90 },
    { key: "bh", label: "Toppling block width/height b/h", min: 0.1, max: 1.5, step: 0.05, default: 0.5 },
    { key: "c", label: "Cohesion c", min: 0, max: 150, step: 5, unit: "kPa", default: 30 },
    { key: "phi", label: "Friction angle φ", min: 15, max: 45, step: 1, unit: "°", default: 30 },
    { key: "ru", label: "Pore-pressure ratio ru", min: 0, max: 0.6, step: 0.05, default: 0.2 },
  ],
  compute: (p) => slopeModes(p),
  outputs: [
    { key: "fos", label: "Factor of Safety", format: (v) => (Number.isFinite(v) ? v.toFixed(2) : "∞ (kinematically impossible)"), tone: (v) => (v >= 1.3 ? "ok" : v >= 1 ? "warn" : "crit") },
    { key: "kin", label: "Kinematics", format: (v, _, p) => (p.mode >= 2 ? "Not structurally controlled" : v ? "Daylights in face — feasible" : "Does not daylight"), tone: (v) => (v ? "warn" : "ok") },
    { key: "mech", label: "Toppling check", format: (v, _, p) => (p.mode !== 3 ? "—" : v === 1 ? "Topples first (b/h < tan ψ)" : "Slides first (ψ > φ)") },
  ],
  caption: "Plane: limit equilibrium. Wedge: Hoek & Bray wedge factor k = sinβ/sin(ξ/2) (symmetric wedge, β = 90°) on the line of intersection. Circular: Bishop's simplified method, 49-circle search through the toe (γ = 20 kN/m³). Toppling: b/h vs tan ψ, sliding tanφ/tanψ.",
  render: (p, o, t) => {
    const fail = o.fos < 1;
    const d = fail ? ((t % 3) / 3) * 22 : 0;
    const col = o.fos >= 1.3 ? C.safe : o.fos >= 1 ? C.hazard : C.crit;
    const k = 2.6;
    const toeX = 90;
    const toeY = 205;
    const Hp = p.H * k;
    const crestX = toeX + Hp / Math.tan(rad(p.pf));
    const topY = toeY - Hp;
    const header = (
      <g>
        <Txt x={12} y={22} size={15} weight={900} mono fill={col}>
          {Number.isFinite(o.fos) ? `FoS ${o.fos.toFixed(2)}` : "FoS ∞"}
        </Txt>
        <Txt x={12} y={38} size={9} weight={800} fill={C.slate}>
          {`${MODES[p.mode].toUpperCase()} FAILURE${fail ? " — MOVING" : ""}`}
        </Txt>
      </g>
    );
    if (p.mode === 1) {
      // front view of a face with a wedge between two joint traces
      const half = clamp(80 * Math.tan(rad(p.xi / 2)), 25, 150);
      return (
        <g>
          <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
          <rect x={40} y={50} width={320} height={160} fill={MAT.rock} stroke={C.ink} />
          <polygon points={polyline([[200 - half, 50], [200 + half, 50], [200, 50 + 150]])} fill={col} opacity={0.6} stroke={C.ink} transform={`translate(0 ${d})`} />
          <line x1={200 - half - 40} y1={50 - 40 * (150 / half)} x2={200} y2={200} stroke={C.ink} strokeDasharray="5 3" />
          <line x1={200 + half + 40} y1={50 - 40 * (150 / half)} x2={200} y2={200} stroke={C.ink} strokeDasharray="5 3" />
          <Arrow x1={200} y1={120} x2={200} y2={175} color={C.crit} width={2} />
          <Txt x={208} y={170} size={8} fill={C.crit} weight={700}>
            {`line of intersection plunge ${p.pp}°`}
          </Txt>
          <Txt x={60} y={228} size={8} fill={C.slate}>
            {`face view · included angle ξ = ${p.xi}° · wedge factor k = ${(1 / Math.sin(rad(p.xi / 2))).toFixed(2)}`}
          </Txt>
          {header}
        </g>
      );
    }
    if (p.mode === 2) {
      const b = bishop(p.H, p.pf, p.c, p.phi, p.ru);
      const S = (x: number) => toeX + x * k;
      const SY = (y: number) => toeY - y * k;
      const arc: [number, number][] = [];
      const ang = fail ? d / 120 : 0;
      if (Number.isFinite(b.fos)) {
        for (let i = 0; i <= 30; i++) {
          const x = (b.xe * i) / 30;
          const y = b.cy - Math.sqrt(Math.max(b.R * b.R - (x - b.cx) ** 2, 0));
          arc.push([S(x), SY(y)]);
        }
      }
      const mass: [number, number][] = [[S(0), SY(0)], [crestX, topY], [S(b.xe), topY], ...arc.slice().reverse()];
      return (
        <g>
          <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
          <polygon points={polyline([[0, toeY], [toeX, toeY], [crestX, topY], [400, topY], [400, 240], [0, 240]])} fill={MAT.goaf} />
          {arc.length > 0 && (
            <g transform={`rotate(${deg(ang)} ${S(b.cx)} ${SY(b.cy)})`}>
              <polygon points={polyline(mass)} fill={col} opacity={0.55} stroke={C.ink} />
            </g>
          )}
          {arc.length > 0 && <circle cx={S(b.cx)} cy={SY(b.cy)} r={3} fill={C.ink} />}
          <Txt x={396} y={225} size={7.5} fill={C.slate} anchor="end">
            critical circle (Bishop, weak overburden/dump)
          </Txt>
          {header}
        </g>
      );
    }
    if (p.mode === 3) {
      const n = 6;
      const bw = 18;
      const bhgt = bw / p.bh;
      const baseAng = p.pp;
      const blocks = [];
      for (let i = 0; i < n; i++) {
        const bx = 120 + i * (bw + 2) * Math.cos(rad(baseAng));
        const by = 210 - i * (bw + 2) * Math.sin(rad(baseAng));
        const tilt = fail && o.mech === 1 ? Math.min(d * 2, 35) : 0;
        const slide = fail && o.mech === 2 ? d : 0;
        blocks.push(
          <g key={i} transform={`translate(${-slide * Math.cos(rad(baseAng))} ${slide * Math.sin(rad(baseAng))}) rotate(${-baseAng - tilt} ${bx} ${by})`}>
            <rect x={bx} y={by - Math.min(bhgt, 140)} width={bw} height={Math.min(bhgt, 140)} fill={col} opacity={0.7} stroke={C.ink} />
          </g>,
        );
      }
      return (
        <g>
          <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
          <polygon points={polyline([[60, 215], [380, 215 - 320 * Math.tan(rad(baseAng))], [400, 240], [0, 240]])} fill={MAT.rock} />
          {blocks}
          <Txt x={230} y={232} size={8} fill={C.slate}>
            {`b/h ${p.bh.toFixed(2)} vs tan ψ ${Math.tan(rad(p.pp)).toFixed(2)}`}
          </Txt>
          {header}
        </g>
      );
    }
    // plane
    const planeX = toeX + Hp / Math.tan(rad(p.pp));
    const dx = d * Math.cos(rad(p.pp));
    const dy = d * Math.sin(rad(p.pp));
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.sky} />
        <polygon points={polyline([[0, toeY], [toeX, toeY], [crestX, topY], [400, topY], [400, 240], [0, 240]])} fill={MAT.shale} />
        {fail && <Cracks key={`m${p.mode}`} cracks={[{ x: crestX + 20, y: topY, len: 34, angle: 100, seed: 5 }, { x: crestX + 46, y: topY, len: 26, angle: 80, seed: 11 }]} color="#7F1D1D" width={2} />}
        {o.kin === 1 && planeX <= 400 && (
          <polygon points={polyline([[toeX, toeY], [crestX, topY], [planeX, topY]])} fill={col} opacity={0.6} stroke={C.ink} transform={`translate(${-dx} ${dy})`} />
        )}
        <line x1={toeX} y1={toeY} x2={Math.min(planeX, 400)} y2={planeX <= 400 ? topY : toeY - (400 - toeX) * Math.tan(rad(p.pp))} stroke={C.ink} strokeDasharray="6 4" />
        {p.ru > 0 && <line x1={toeX} y1={toeY - 3} x2={400} y2={topY + (1 - p.ru * 1.5) * Hp * 0.8} stroke={C.tech} strokeWidth={2} strokeDasharray="8 4" />}
        {header}
      </g>
    );
  },
};

/* =========================================================================
 * 3. Longwall face cycle: DERD shearer, AFC snake, shield advance, weighting
 * ========================================================================= */

export function lwCycle(p: Record<string, number>) {
  const cycle = p.L / p.v + 10;
  const shears = (1440 * 0.6) / cycle;
  const prod = shears * p.L * p.web * p.m * 1.4;
  const adv = shears * p.web;
  return { cycle, shears, prod, adv, weighting: adv / p.wi };
}

export const longwallCycleSim: SimDef = {
  id: "u6-lwcycle",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["prod", "shears"],
  title: "Longwall face cycle — DERD shearer, AFC snake and shield advance",
  animated: true,
  params: [
    { key: "L", label: "Face length", min: 150, max: 350, step: 10, unit: "m", default: 250 },
    { key: "v", label: "Shearer haulage speed", min: 2, max: 20, step: 0.5, unit: "m/min", default: 4 },
    { key: "web", label: "Web (depth of cut)", min: 0.5, max: 1, step: 0.05, unit: "m", default: 0.6 },
    { key: "m", label: "Extraction height", min: 1.5, max: 5, step: 0.1, unit: "m", default: 2.5 },
    { key: "wi", label: "Periodic weighting interval", min: 10, max: 40, step: 1, unit: "m", default: 20 },
  ],
  compute: (p) => lwCycle(p),
  outputs: [
    { key: "cycle", label: "Shear cycle (incl. 10 min turnaround)", unit: "min", digits: 1 },
    { key: "shears", label: "Shears per day (60 % availability)", digits: 1 },
    { key: "prod", label: "Production", unit: "t/day", digits: 0, tone: (v) => (v >= 12000 ? "ok" : "warn") },
    { key: "adv", label: "Face advance", unit: "m/day", digits: 1 },
    { key: "weighting", label: "Weighting events per day", digits: 2 },
  ],
  caption: "Shields 15 % of face length behind the trailing drum lower–advance–set; the AFC is snaked over behind them. Leg pressure spikes each time cumulative advance crosses the periodic-weighting interval.",
  render: (p, _o, t) => {
    const T = 8;
    const u = (t % T) / T;
    const shearNo = Math.floor(t / T);
    const cum = shearNo * p.web + u * p.web;
    const weighting = cum > p.wi * 0.5 && cum % p.wi < p.web * 1.5;
    const n = 22;
    const x0 = 20;
    const W = 360;
    const fx = (f: number) => x0 + f * W;
    const lag = 0.15;
    const shX = u;
    const shields = [];
    let afc = `M ${fx(0)} 92`;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const behind = shX - f;
      const state = behind > lag + 0.06 ? 2 : behind > lag ? 1 : 0; // 0 old, 1 advancing, 2 advanced
      const dy = state === 2 ? -8 : state === 1 ? -4 : 0;
      shields.push(<rect key={i} x={fx(f) - 6} y={98 + dy} width={12} height={22} rx={2} fill={state === 1 ? C.hazard : C.tech} stroke={C.ink} strokeWidth={0.6} />);
      afc += ` L ${fx(f)} ${92 + (state >= 1 ? -8 : 0) * (state === 1 ? 0.5 : 1)}`;
    }
    afc += ` L ${fx(1)} 92`;
    const sec = Math.floor(u * 3) % 3; // section view of the middle shield
    const midBehind = shX - 0.5;
    const midState = midBehind > lag + 0.06 ? 2 : midBehind > lag ? 1 : 0;
    const pressure = weighting ? 100 : midState === 1 ? 5 : 55 + 25 * clamp(midBehind < 0 ? u : 1 - u, 0, 1);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f1f5f9" />
        <Txt x={20} y={14} size={8} weight={700} fill={C.slate}>
          PLAN VIEW · coal face ↑ · goaf ↓
        </Txt>
        <rect x={x0} y={20} width={W} height={56 - 8 * u} fill={MAT.coal} />
        <rect x={x0} y={76 - 8 * u} width={fx(shX) - x0} height={8 * u + 6} fill="#334155" opacity={0.25} />
        <path d={afc} fill="none" stroke={C.hazard} strokeWidth={3} />
        {shields}
        <rect x={x0} y={124} width={W} height={16} fill={MAT.goaf} />
        <Txt x={x0 + 4} y={135} size={7} fill="white" weight={700}>
          GOAF (caving)
        </Txt>
        <g transform={`translate(${fx(shX)} 84)`}>
          <rect x={-16} y={-4} width={32} height={10} fill={C.crit} rx={2} />
          <circle cx={-18} cy={-10 + 4} r={7} fill={C.slate} stroke={C.ink} />
          <circle cx={18} cy={-14 + 4} r={7} fill={C.slate} stroke={C.ink} />
        </g>
        <Txt x={fx(shX)} y={20 + 10} size={7} anchor="middle" fill="white" weight={800}>
          DERD
        </Txt>
        <Txt x={20} y={156} size={8} weight={700} fill={C.slate}>
          {`SECTION · shield ${["SET against roof", "LOWER → ADVANCE", "SET (new web)"][midState]}`}
        </Txt>
        <rect x={20} y={162} width={190} height={8} fill={MAT.shale} />
        <rect x={20} y={222} width={190} height={8} fill={MAT.sand} />
        <g transform={`translate(${midState === 2 ? 14 : midState === 1 ? 7 : 0} 0)`}>
          <rect x={70} y={midState === 1 ? 178 : 171} width={80} height={6} fill={C.tech} />
          <line x1={95} y1={midState === 1 ? 184 : 177} x2={100} y2={216} stroke={C.ink} strokeWidth={4} />
          <line x1={125} y1={midState === 1 ? 184 : 177} x2={120} y2={216} stroke={C.ink} strokeWidth={4} />
          <rect x={80} y={216} width={60} height={6} fill={C.slate} />
          <line x1={70} y1={174} x2={45} y2={210} stroke={C.ink} strokeWidth={3} />
        </g>
        <rect x={160} y={200} width={24} height={16} fill={C.hazard} />
        <Txt x={230} y={170} size={9} weight={800}>
          Leg pressure
        </Txt>
        <rect x={230} y={178} width={150} height={12} fill="#e2e8f0" rx={6} />
        <rect x={230} y={178} width={1.5 * pressure} height={12} fill={pressure >= 100 ? C.crit : pressure < 20 ? C.hazard : C.safe} rx={6} />
        <Txt x={230} y={206} size={9} mono fill={weighting ? C.crit : C.ink} weight={700}>
          {weighting ? "PERIODIC WEIGHTING — yield!" : `${pressure.toFixed(0)} % of yield`}
        </Txt>
        <Txt x={230} y={224} size={8} mono fill={C.slate}>
          {`advance ${cum.toFixed(1)} m · sweep ${sec + 1}`}
        </Txt>
      </g>
    );
  },
};

/* =========================================================================
 * 4. Thick-seam: Blasting Gallery vs Longwall Top Coal Caving
 * ========================================================================= */

export function thickSeam(p: Record<string, number>) {
  if (p.meth === 0) {
    const rec = 50 + 10 * (3 - p.B);
    const dil = 3 + 4 * (3 - p.B);
    return { rec, dil, top: 0 };
  }
  const Ht = Math.max(p.T - p.hc, 0);
  const f = 0.85 * (1 - Math.exp(-2.2 * p.D));
  const dil = 2 + 18 * Math.pow(Math.max(0, p.D - 0.8), 1.5);
  const rec = ((p.hc * 0.98 + Ht * f * 0.92) / p.T) * 100;
  return { rec, dil, top: f * 100 };
}

export const thickSeamSim: SimDef = {
  id: "u6-thick",
  title: "Thick-seam extraction — Blasting Gallery vs Longwall Top Coal Caving",
  animated: true,
  params: [
    { key: "meth", label: "Method", min: 0, max: 1, step: 1, default: 1, options: [{ value: 0, label: "Blasting Gallery (BG)" }, { value: 1, label: "Longwall Top Coal Caving (LTCC)" }] },
    { key: "T", label: "Seam thickness", min: 6, max: 15, step: 0.5, unit: "m", default: 10 },
    { key: "hc", label: "LTCC cutting height", min: 2.5, max: 4, step: 0.1, unit: "m", default: 3 },
    { key: "D", label: "LTCC draw interval (draw factor)", min: 0.2, max: 2, step: 0.05, default: 0.5 },
    { key: "B", label: "BG ring-hole burden", min: 1.2, max: 3, step: 0.1, unit: "m", default: 2.5 },
  ],
  compute: (p) => thickSeam(p),
  outputs: [
    { key: "rec", label: "Coal recovery", unit: "%", digits: 1, tone: (v) => (v >= 78 ? "ok" : v >= 65 ? "warn" : "crit") },
    { key: "dil", label: "Roof-shale dilution", unit: "%", digits: 1, tone: (v) => (v <= 8 ? "ok" : v <= 12 ? "warn" : "crit") },
    { key: "top", label: "Top coal drawn (LTCC)", unit: "%", digits: 0, format: (v, _, p) => (p.meth ? `${v.toFixed(0)} %` : "—") },
  ],
  caption: "Indicative performance model. LTCC: longer draw recovers more top coal until caved roof shale reaches the window (dilution). BG: tighter ring burden improves fragmentation and recovery but raises explosive use and over-break dilution.",
  render: (p, o, t) => {
    const top = 40;
    const bot = 200;
    const k = (bot - top) / 15;
    const seamTop = bot - p.T * k;
    const flow = (t % 2) / 2;
    if (p.meth === 0) {
      const rings = [];
      for (let i = 0; i < 6; i++) {
        const x = 140 + i * p.B * 14;
        for (let j = -3; j <= 3; j++) rings.push(<line key={`${i}${j}`} x1={x} y1={bot - 10} x2={x + j * 9} y2={seamTop + 6} stroke={i < 2 ? C.crit : C.ink} strokeWidth={1} />);
      }
      return (
        <g>
          <rect x={0} y={0} width={400} height={240} fill={MAT.shale} />
          <rect x={0} y={seamTop} width={400} height={bot - seamTop} fill={MAT.coal} />
          <rect x={20} y={bot - 18} width={110} height={18} fill="#f8fafc" />
          <rect x={0} y={bot} width={400} height={40} fill={MAT.sand} />
          {rings}
          <polygon points={polyline([[130, bot], [200, seamTop + 20], [260, bot]])} fill={MAT.goaf} opacity={0.85} />
          <rect x={30 + flow * 60} y={bot - 15} width={26} height={12} rx={2} fill={C.hazard} />
          <Txt x={30} y={bot + 14} size={8} weight={700}>
            remote-controlled LHD in gallery
          </Txt>
          <Txt x={140} y={seamTop - 6} size={8} weight={700} fill={C.crit}>
            {`ring holes · burden ${p.B} m (fired in sequence)`}
          </Txt>
          <Txt x={12} y={22} size={13} weight={900} mono>
            {`BG · recovery ${o.rec.toFixed(0)}% · dilution ${o.dil.toFixed(0)}%`}
          </Txt>
        </g>
      );
    }
    const cut = bot - p.hc * k;
    const drawn = clamp(o.top / 100, 0, 1);
    const cone = (seamTop - 10) + (cut - seamTop) * (1 - drawn);
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.shale} />
        <rect x={0} y={seamTop} width={400} height={bot - seamTop} fill={MAT.coal} />
        <rect x={0} y={bot} width={400} height={40} fill={MAT.sand} />
        <rect x={95} y={cut} width={120} height={bot - cut} fill="#f8fafc" />
        <Txt x={300} y={cut - 6} size={8} fill="white" weight={700} anchor="middle">
          top coal above the shield (caves on release)
        </Txt>
        <Txt x={300} y={bot - 10} size={8} fill="white" weight={700} anchor="middle">
          {`face: cutting height ${p.hc} m`}
        </Txt>
        <rect x={150} y={cut} width={55} height={8} fill={C.tech} />
        <line x1={160} y1={cut + 8} x2={165} y2={bot - 6} stroke={C.ink} strokeWidth={4} />
        <line x1={190} y1={cut + 8} x2={185} y2={bot - 6} stroke={C.ink} strokeWidth={4} />
        <line x1={150} y1={cut + 4} x2={110} y2={bot - 20} stroke={C.ink} strokeWidth={3} />
        <rect x={100} y={bot - 12} width={60} height={10} fill={C.hazard} />
        <Txt x={100} y={bot + 14} size={7} weight={700}>
          rear AFC + draw window
        </Txt>
        <polygon points={polyline([[40, seamTop], [140, seamTop], [125, cone], [55, cone]])} fill={MAT.goaf} />
        {o.dil > 4 && <polygon points={polyline([[70, seamTop - 30], [110, seamTop - 30], [100, cone + 10], [80, cone + 10]])} fill="#a8a29e" opacity={0.9} stroke={C.crit} />}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={95 + (i % 2) * 8} cy={cone + ((flow + i * 0.25) % 1) * (bot - 12 - cone)} r={2.5} fill={o.dil > 8 && i % 2 ? C.rock : "#0f172a"} stroke="white" strokeWidth={0.5} />
        ))}
        <rect x={0} y={seamTop - 40} width={400} height={40} fill={MAT.sand} opacity={0.85} />
        <Txt x={200} y={Math.max(seamTop - 26, 42)} size={8} anchor="middle" weight={700}>
          ROOF SHALE (dilution source)
        </Txt>
        <Txt x={12} y={22} size={13} weight={900} mono>
          {`LTCC · recovery ${o.rec.toFixed(0)}% · dilution ${o.dil.toFixed(1)}%`}
        </Txt>
      </g>
    );
  },
};

/* =========================================================================
 * 5. Froth flotation circuit (sphalerite with pyrite gangue)
 * ========================================================================= */

export function flotation(p: Record<string, number>) {
  const kc = 1 - Math.exp(-p.col / 40);
  const ht = kc * (0.3 + 0.7 * (1 - Math.exp(-p.act / 120)));
  const hp = kc * 0.65 * Math.exp(-p.dep / 120);
  const S = (1 - Math.exp(-p.fr / 10)) * (p.fr > 35 ? Math.max(0.2, 1 - (p.fr - 35) / 60) : 1);
  const B = (1 - Math.exp(-(p.air * p.rpm) / 900)) * (p.air > 2 ? Math.max(0.3, 1 - (p.air - 2) * 0.4) : 1);
  const Rt = 1 - Math.exp(-4.5 * ht * B * S);
  const Rp = 1 - Math.exp(-4.5 * hp * B * S);
  const Rg = 0.008 + 0.05 * Math.max(0, (p.fr - 25) / 35) + 0.012 * p.air;
  const mass = 0.1 * Rt + 0.15 * Rp + 0.75 * Rg;
  const grade = mass > 0 ? (0.67 * 0.1 * Rt) / mass * 100 : 0;
  return { Rt: Rt * 100, Rp: Rp * 100, grade, S, B, mass: mass * 100 };
}

export const flotationSim: SimDef = {
  id: "u8-flot",
  title: "Froth flotation circuit — reagents, aeration, grade–recovery",
  animated: true,
  params: [
    { key: "col", label: "Collector (xanthate)", min: 0, max: 200, step: 5, unit: "g/t", default: 30 },
    { key: "fr", label: "Frother (MIBC)", min: 0, max: 60, step: 1, unit: "g/t", default: 15 },
    { key: "act", label: "Activator (CuSO₄) for sphalerite", min: 0, max: 400, step: 10, unit: "g/t", default: 0 },
    { key: "dep", label: "Pyrite depressant (lime/cyanide)", min: 0, max: 500, step: 10, unit: "g/t", default: 0 },
    { key: "air", label: "Aeration (superficial gas velocity)", min: 0.3, max: 2.5, step: 0.1, unit: "cm/s", default: 1.2 },
    { key: "rpm", label: "Impeller speed", min: 600, max: 1600, step: 50, unit: "rpm", default: 1200 },
  ],
  compute: (p) => flotation(p),
  outputs: [
    { key: "Rt", label: "Zn (sphalerite) recovery", unit: "%", digits: 1, tone: (v) => (v >= 85 ? "ok" : v >= 70 ? "warn" : "crit") },
    { key: "grade", label: "Concentrate grade", unit: "% Zn", digits: 1, tone: (v) => (v >= 50 ? "ok" : v >= 40 ? "warn" : "crit") },
    { key: "Rp", label: "Pyrite recovered to concentrate", unit: "%", digits: 1, tone: (v) => (v <= 10 ? "ok" : "warn") },
    { key: "S", label: "Froth stability index", digits: 2 },
  ],
  caption: "Feed: 10 % sphalerite (67 % Zn), 15 % pyrite, 75 % silicates. Indicative kinetic model: collector makes surfaces hydrophobic; CuSO₄ activates sphalerite; lime/cyanide depresses pyrite; frother stabilises froth (excess entrains gangue); air and impeller set bubble flux.",
  render: (p, o, t) => {
    const frothH = 20 + o.S * 45;
    const cellTop = 30;
    const bub = [];
    for (let i = 0; i < 14; i++) {
      const x = 40 + ((i * 47) % 170);
      const phase = ((t * (0.25 + p.air * 0.2) + i * 0.13) % 1);
      const y = 210 - phase * (210 - cellTop - frothH);
      const loaded = i / 14 < o.Rt / 100;
      bub.push(
        <g key={i}>
          <circle cx={x} cy={y} r={6} fill="white" stroke={C.air} />
          {loaded && <circle cx={x + 4} cy={y - 4} r={2.5} fill={C.ore} />}
          {i % 4 === 0 && o.Rp > 20 && <circle cx={x - 4} cy={y - 3} r={2.2} fill="#facc15" />}
        </g>,
      );
    }
    const curve: [number, number][] = [];
    for (let c = 0; c <= 200; c += 10) {
      const r = flotation({ ...p, col: c });
      curve.push([r.Rt, r.grade]);
    }
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        <rect x={25} y={cellTop} width={200} height={190} rx={4} fill={MAT.water} stroke={C.ink} strokeWidth={2} />
        <rect x={25} y={cellTop} width={200} height={190} rx={4} fill="#1E293B" opacity={0.35} />
        <rect x={25} y={cellTop} width={200} height={frothH} fill="#fef3c7" />
        <Txt x={30} y={cellTop + 12} size={8} weight={800}>
          FROTH (concentrate)
        </Txt>
        <rect x={110} y={200} width={30} height={6} fill={C.ink} transform={`rotate(${(t * p.rpm) % 360} 125 203)`} />
        {bub}
        <Txt x={30} y={234} size={7} fill={C.slate}>
          ● sphalerite attached ● pyrite attached
        </Txt>
        <Plot x={262} y={30} w={125} h={150} xmin={0} xmax={100} ymin={0} ymax={67} xlabel="recovery %" ylabel="% Zn">
          {(sx, sy) => (
            <g>
              <polyline points={polyline(curve.map(([r, g]) => [sx(r), sy(g)]))} fill="none" stroke={C.tech} strokeWidth={2} />
              <circle cx={sx(o.Rt)} cy={sy(o.grade)} r={5} fill={o.Rt >= 85 && o.grade >= 50 ? C.safe : C.crit} stroke="white" strokeWidth={1.5} />
            </g>
          )}
        </Plot>
        <Txt x={262} y={210} size={8} fill={C.slate}>
          curve = collector sweep 0–200 g/t
        </Txt>
      </g>
    );
  },
};

/* =========================================================================
 * 6. FLP vs IS electrical zoning in a gassy coal mine
 * ========================================================================= */

const EQ = ["Ordinary", "FLP Ex d", "IS Ex i"];
const LOC = [
  { k: "face", name: "Shearer motor @ face (300 kW)", power: "high", gassyZone: true },
  { k: "ret", name: "CH₄ sensor in return (signal)", power: "low", gassyZone: true },
  { k: "intake", name: "Belt drive in intake", power: "high", gassyZone: false },
  { k: "sub", name: "Pit-bottom transformer/switchgear", power: "high", gassyZone: false },
] as const;

export function zones(p: Record<string, number>) {
  const gassy = p.deg >= 2;
  const status: number[] = []; // 0 ok, 1 warn, 2 fail
  const notes: string[] = [];
  LOC.forEach((l) => {
    const e = p[l.k];
    if (e === 2 && l.power === "high") {
      status.push(2);
      notes.push(`${l.name}: IS cannot supply high-power loads`);
    } else if (e === 0 && gassy && l.gassyZone) {
      status.push(2);
      notes.push(`${l.name}: non-protected apparatus where firedamp may occur`);
    } else if (e === 0 && gassy) {
      status.push(1);
      notes.push(`${l.name}: ordinary apparatus — only where fresh intake air and approvals permit`);
    } else status.push(0);
  });
  const rn = p.rn === 1;
  const elr = p.elr === 1;
  let ignition = 0; // 0 none, 1 face, 2 return, 3 arc at face from earth fault
  let trip = 0;
  if (p.ev === 1) {
    if (p.face === 0) ignition = 1;
    else if (p.ret === 0 && gassy) ignition = 2;
  }
  if (p.ev === 2) {
    trip = elr ? 1 : 0;
    if (!rn && p.face !== 1 && gassy) ignition = 3;
  }
  const score = status.filter((s) => s === 0).length + (rn ? 1 : 0) + (elr ? 1 : 0);
  return { status, notes, ignition, trip, score, faultA: rn ? 0.75 : 106 };
}

export const zonesSim: SimDef = {
  id: "u8-zones",
  title: "FLP vs IS — gassy-mine electrical zoning troubleshooter",
  animated: true,
  params: [
    { key: "deg", label: "Seam gassiness", min: 1, max: 3, step: 1, default: 3, options: [1, 2, 3].map((d) => ({ value: d, label: `Degree ${["I", "II", "III"][d - 1]}` })) },
    { key: "face", label: "Face: shearer motor", min: 0, max: 2, step: 1, default: 0, options: EQ.map((e, i) => ({ value: i, label: e })) },
    { key: "ret", label: "Return: CH₄ sensor", min: 0, max: 2, step: 1, default: 0, options: EQ.map((e, i) => ({ value: i, label: e })) },
    { key: "intake", label: "Intake: belt drive", min: 0, max: 2, step: 1, default: 0, options: EQ.map((e, i) => ({ value: i, label: e })) },
    { key: "sub", label: "Pit bottom: transformer/switchgear", min: 0, max: 2, step: 1, default: 0, options: EQ.map((e, i) => ({ value: i, label: e })) },
    { key: "rn", label: "Restricted-neutral earthing", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Solid neutral" }, { value: 1, label: "Restricted (750 mA)" }] },
    { key: "elr", label: "Earth-leakage relays", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Not fitted" }, { value: 1, label: "Fitted" }] },
    { key: "ev", label: "Inject event", min: 0, max: 2, step: 1, default: 0, options: [{ value: 0, label: "None" }, { value: 1, label: "CH₄ layer at face" }, { value: 2, label: "Earth fault on face cable" }] },
  ],
  compute: (p) => {
    const z = zones(p);
    return { score: z.score, ignition: z.ignition, trip: z.trip, faultA: z.faultA };
  },
  outputs: [
    { key: "score", label: "Compliance checks passed", digits: 0, format: (v) => `${v} / 6`, tone: (v) => (v === 6 ? "ok" : v >= 4 ? "warn" : "crit") },
    { key: "ignition", label: "Event outcome", format: (v, o, p) => (p.ev === 0 ? "No event injected" : v === 1 ? "IGNITION at face" : v === 2 ? "IGNITION in return" : v === 3 ? "ARC IGNITION — fault on unprotected kit" : o.trip ? "Safe — protection operated" : "No ignition, but fault persists"), tone: (v, o, p) => (p.ev === 0 ? "info" : v ? "crit" : o.trip || p.ev === 1 ? "ok" : "warn") },
    { key: "faultA", label: "Earth-fault current", format: (v) => (v < 1 ? `${(v * 1000).toFixed(0)} mA` : `~${v.toFixed(0)} A`), tone: (v) => (v < 1 ? "ok" : "crit") },
  ],
  caption: "Ex d (flameproof): enclosure contains an internal explosion; flame paths quench escaping gas. Ex i (intrinsic safety): energy limited below methane's minimum ignition energy — only for low-power circuits. Teaching model; follow the mine's approved electrical scheme and the applicable regulations.",
  render: (p, o, t) => {
    const z = zones(p);
    const pos: Record<string, [number, number]> = { sub: [60, 150], intake: [190, 170], face: [330, 120], ret: [190, 60] };
    const flash = Math.floor(t * 3) % 2 === 0;
    const eqCol = (e: number) => (e === 1 ? C.tech : e === 2 ? C.safe : "#94a3b8");
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill={MAT.rock} />
        <rect x={0} y={0} width={400} height={240} fill="#F5F5F4" opacity={0.6} />
        <rect x={30} y={30} width={18} height={190} fill={MAT.metalH} />
        <Txt x={39} y={26} size={7} anchor="middle" weight={700}>
          shaft
        </Txt>
        <line x1={48} y1={170} x2={350} y2={170} stroke={C.air} strokeWidth={10} opacity={0.5} />
        <line x1={350} y1={170} x2={350} y2={60} stroke={C.coal} strokeWidth={14} />
        <line x1={350} y1={60} x2={48} y2={60} stroke="#fca5a5" strokeWidth={10} opacity={0.5} />
        <Txt x={235} y={190} size={7} fill="#0369a1" weight={700}>
          INTAKE (fresh air) →
        </Txt>
        <Txt x={225} y={46} size={7} fill={C.crit} weight={700}>
          ← RETURN (may carry firedamp)
        </Txt>
        <Txt x={365} y={120} size={7} weight={700} fill={C.ink}>
          FACE
        </Txt>
        {LOC.map((l, i) => {
          const [x, y] = pos[l.k];
          const e = p[l.k];
          const st = z.status[i];
          return (
            <g key={l.k}>
              <rect x={x - 22} y={y - 14} width={44} height={28} rx={3} fill={eqCol(e)} stroke={st === 2 ? C.crit : st === 1 ? C.hazard : C.ink} strokeWidth={st ? 3 : 1} />
              {e === 1 && [0, 1, 2].map((j) => <line key={j} x1={x - 22} x2={x + 22} y1={y - 8 + j * 8} y2={y - 8 + j * 8} stroke="white" strokeWidth={0.8} />)}
              <Txt x={x} y={y + 3} size={7} anchor="middle" fill="white" weight={800}>
                {EQ[e]}
              </Txt>
              <Txt x={x} y={y + 24} size={6} anchor="middle" fill={C.ink}>
                {l.name.split(" (")[0].split(" @")[0]}
              </Txt>
            </g>
          );
        })}
        {p.ev === 1 && <ellipse cx={330} cy={98} rx={40} ry={8} fill="#fde68a" opacity={0.8} />}
        {z.ignition > 0 && flash && (() => {
          const [x, y] = z.ignition === 2 ? pos.ret : pos.face;
          const pts = Array.from({ length: 16 }, (_, i) => {
            const r = i % 2 ? 14 : 30;
            const a = (i / 16) * Math.PI * 2;
            return [x + r * Math.cos(a), y + r * Math.sin(a)] as [number, number];
          });
          return <polygon points={polyline(pts)} fill={C.crit} opacity={0.45} stroke="#FDE68A" strokeWidth={2} />;
        })()}
        {p.ev === 2 && <line x1={300} y1={150} x2={330} y2={134} stroke={C.hazard} strokeWidth={3} strokeDasharray="3 2" />}
        {p.ev === 2 && (
          <Txt x={250} y={215} size={9} weight={900} fill={z.trip ? C.safe : C.crit}>
            {z.trip ? "ELR TRIPPED — supply isolated" : "FAULT NOT CLEARED"}
          </Txt>
        )}
        <rect x={58} y={198} width={70} height={16} rx={3} fill={p.rn ? C.safe : C.slate} />
        <Txt x={93} y={209} size={7} anchor="middle" fill="white" weight={800}>
          {p.rn ? "NER 750 mA" : "SOLID N"}
        </Txt>
        <Txt x={12} y={16} size={10} weight={900} mono fill={z.score === 6 ? C.safe : C.crit}>
          {`Degree ${["I", "II", "III"][p.deg - 1]} · ${z.score}/6 checks`}
        </Txt>
      </g>
    );
  },
};

export const PHASE6_SIMS = [dipStrikeSim, slopeModesSim, longwallCycleSim, thickSeamSim, flotationSim, zonesSim];
