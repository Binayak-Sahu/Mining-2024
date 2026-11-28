/**
 * Phase 6 simulations: three-point dip & strike, multi-mode slope failure, longwall face cycle,
 * thick-seam BG vs LTCC, froth flotation circuit, and FLP/IS electrical zoning.
 */
import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Plot, clamp, rad, deg, polyline, Cracks } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";
import { T, INK, INK2, INK3, OK_LIGHT, ON_LIGHT, ON_DEEP, GREYS, U, OK, BAD, BAD_TEXT, BAD_LIGHT, SURFACE, pts, num } from "@/components/sim/v3";

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
  // §5.6d redraw (v3.2): legacy toe (90, 205) and scale kept; one stage per failure mode, mass colour carries the state.
  v3: {
    viewH: 250,
    formula: (p) =>
      p.mode === 0
        ? "\\mathrm{FoS} = \\dfrac{cA + W\\cos\\psi_p\\,(1-r_u)\\tan\\varphi}{W\\sin\\psi_p}"
        : p.mode === 1
          ? "k = \\dfrac{\\sin\\beta}{\\sin(\\xi/2)}"
          : p.mode === 2
            ? "F = \\dfrac{\\sum \\big[cb + (W-ub)\\tan\\varphi\\big]/m_\\alpha}{\\sum W\\sin\\alpha}"
            : "\\text{topples if } b/h < \\tan\\psi;\\ \\text{slides if } \\psi > \\varphi",
  },
  render: (p, o, t) => {
    const VH = 250;
    const fail = o.fos < 1;
    const d = fail ? ((t % 3) / 3) * 22 : 0;
    const state = !Number.isFinite(o.fos) || o.fos >= 1.3 ? "safe" : fail ? "unsafe" : undefined;
    const massFill = state === "safe" ? OK_LIGHT : state === "unsafe" ? BAD_LIGHT : U.light;
    const k = 2.4;
    const toeX = 90;
    const toeY = 195;
    const Hp = p.H * k;
    const crestX = toeX + Hp / Math.tan(rad(p.pf));
    const topY = toeY - Hp;
    const rockPoly = [[0, toeY], [toeX, toeY], [crestX, topY], [400, topY], [400, VH], [0, VH]] as [number, number][];
    const clip = (
      <clipPath id="u3-modes-clip">
        <rect x={0} y={0} width={400} height={VH} rx={12} />
      </clipPath>
    );
    const profile = (
      <polyline points={pts([[0, toeY], [toeX, toeY], [crestX, topY], [400, topY]])} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    );
    const crestLabel = (
      <T x={crestX > 290 ? 376 : Math.max(crestX + 10, topY < 66 ? 160 : 0)} y={Math.max(topY - 12, 42)} anchor={crestX > 290 ? "end" : "start"}>
        Crest
      </T>
    );
    if (p.mode === 1) {
      const hW = 110;
      const faceT = 60;
      const faceB = 186;
      const half = clamp(hW * Math.tan(rad(p.xi / 2)), 25, 160);
      const apexY = faceT + hW;
      const sl = 160 / half;
      const wedge: [number, number][] = [[200 - half, faceT], [200 + half, faceT], [200, apexY]];
      return (
        <g>
          {clip}
          <g clipPath="url(#u3-modes-clip)">
            <rect x={0} y={0} width={400} height={VH} style={{ fill: GREYS.light }} />
            <rect x={0} y={faceT} width={400} height={faceB - faceT} style={{ fill: GREYS.mid }} />
            <line x1={0} y1={faceT} x2={400} y2={faceT} style={{ stroke: INK3 }} strokeWidth={1.5} />
            <line x1={0} y1={faceB} x2={400} y2={faceB} style={{ stroke: INK3 }} strokeWidth={1.5} />
            <g className={fail ? "shake" : undefined}>
              <polygon data-state={state} points={pts(wedge)} style={{ fill: massFill, stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" transform={`translate(0 ${d})`} />
            </g>
            <line x1={200 - half} y1={faceT} x2={200 + (faceB - apexY) / sl} y2={faceB} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" />
            <line x1={200 + half} y1={faceT} x2={200 - (faceB - apexY) / sl} y2={faceB} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" />
          </g>
          <Arrow x1={200} y1={faceT + 36} x2={200} y2={faceB + 14} color={ON_LIGHT} width={2} head={10} />
          <T x={24} y={44}>Crest</T>
          <T x={24} y={220} fill={ON_LIGHT}>Pit floor</T>
          <T x={376} y={44} anchor="end">Face view</T>
          <T x={376} y={220} anchor="end" fill={ON_LIGHT}>Line of intersection</T>
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
      const mid = arc.length ? arc[Math.floor(arc.length * 0.6)] : null;
      return (
        <g>
          {clip}
          <g clipPath="url(#u3-modes-clip)">
            <polygon points={pts(rockPoly)} style={{ fill: GREYS.light }} />
            {arc.length > 0 && (
              <g transform={`rotate(${deg(ang)} ${S(b.cx)} ${SY(b.cy)})`}>
                <polygon data-state={state} points={pts(mass)} style={{ fill: massFill, stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" />
              </g>
            )}
            {profile}
          </g>
          {crestLabel}
          <T x={toeX} y={220} anchor="middle" fill={ON_LIGHT}>Toe</T>
          <T x={376} y={220} anchor="end" fill={ON_LIGHT}>Weak ground</T>
          {mid && (
            <>
              <T x={24} y={44}>Slip circle</T>
              <line x1={64} y1={52} x2={mid[0]} y2={mid[1]} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
            </>
          )}
        </g>
      );
    }
    if (p.mode === 3) {
      const bw = 26;
      const bhgt = Math.min(bw / p.bh, 72);
      const a = rad(p.pp);
      const x0 = clamp(24 + bhgt * Math.sin(a), 40, 130);
      const y0 = 195;
      const step = bw + 2;
      const n = Math.max(4, Math.min(9, Math.floor(140 / (step * Math.sin(a)))));
      const yAt = (x: number) => y0 - (x - x0) * Math.tan(a);
      const xe = Math.min(400, x0 + y0 / Math.tan(a));
      const rock: [number, number][] = [[0, y0], [x0, y0], [xe, yAt(xe)], [400, yAt(xe)], [400, VH], [0, VH]];
      const blocks = [];
      for (let i = 0; i < n; i++) {
        const bx = x0 + i * step * Math.cos(a);
        const by = y0 - i * step * Math.sin(a);
        const tilt = fail && o.mech === 1 ? Math.min(d * 2, 35) : 0;
        const slide = fail && o.mech === 2 ? d : 0;
        blocks.push(
          <g key={i} transform={`translate(${-slide * Math.cos(a)} ${slide * Math.sin(a)}) rotate(${-p.pp - tilt} ${bx} ${by})`}>
            <rect data-state={state} x={bx} y={by - bhgt} width={bw} height={bhgt} style={{ fill: massFill, stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" />
          </g>,
        );
      }
      return (
        <g>
          {clip}
          <g clipPath="url(#u3-modes-clip)">
            <polygon points={pts(rock)} style={{ fill: GREYS.light }} />
            <polyline points={pts([[0, y0], [x0, y0], [xe, yAt(xe)]])} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            {blocks}
          </g>
          <T x={p.pp > 45 ? 376 : 24} y={44} anchor={p.pp > 45 ? "end" : "start"} fill={p.pp > 45 ? ON_LIGHT : INK2}>
            Rock columns
          </T>
          <T x={376} y={220} anchor="end" fill={ON_LIGHT}>Intact rock</T>
          <T x={24} y={220} fill={ON_LIGHT}>Pit floor</T>
        </g>
      );
    }
    // plane
    const planeX = toeX + Hp / Math.tan(rad(p.pp));
    const fits = planeX <= 400;
    const endX = fits ? planeX : 400;
    const endY = fits ? topY : toeY - (400 - toeX) * Math.tan(rad(p.pp));
    const dx = d * Math.cos(rad(p.pp));
    const dy = d * Math.sin(rad(p.pp));
    const blk: [number, number][] = fits ? [[toeX, toeY], [crestX, topY], [planeX, topY]] : [[toeX, toeY], [crestX, topY], [400, topY], [400, endY]];
    const bc: [number, number] = [blk.reduce((s, q) => s + q[0], 0) / blk.length, blk.reduce((s, q) => s + q[1], 0) / blk.length];
    const wy = topY + (1 - p.ru * 1.5) * Hp * 0.8;
    // keep the "Crest" label off the block leader (64,52) -> centroid
    const yC = Math.max(topY - 12, 42);
    const lx = 64 + ((bc[0] - 64) * (yC - 52)) / Math.max(bc[1] - 52, 1);
    const crestHit = o.kin === 1 && lx > crestX - 4 && lx < crestX + 62;
    const crestEl = (
      <T x={crestX > 290 ? 376 : crestHit ? crestX + 62 + 8 : Math.max(crestX + 10, topY < 66 ? 160 : 0)} y={yC} anchor={crestX > 290 ? "end" : "start"}>
        Crest
      </T>
    );
    return (
      <g>
        {clip}
        <g clipPath="url(#u3-modes-clip)">
          <polygon points={pts(rockPoly)} style={{ fill: GREYS.light }} />
          {o.kin === 1 && (
            <g className={fail ? "shake" : undefined}>
              <polygon data-state={state} points={pts(blk)} style={{ fill: massFill, stroke: ON_LIGHT }} strokeWidth={2.5} strokeLinejoin="round" transform={`translate(${-dx} ${dy})`} />
            </g>
          )}
          {fail && o.kin === 1 && (
            <g data-state="unsafe">
              <Cracks key={`m${p.mode}`} cracks={[{ x: Math.min(planeX, 396) + 6, y: topY, len: 30, angle: 100, seed: 5 }]} color={ON_LIGHT} width={2} />
            </g>
          )}
          <line x1={toeX} y1={toeY} x2={endX} y2={endY} style={{ stroke: o.kin === 1 ? ON_LIGHT : INK3 }} strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" />
          {p.ru > 0 && <line x1={toeX} y1={toeY - 4} x2={400} y2={wy} style={{ stroke: U.ink }} strokeWidth={2} strokeDasharray="8 4" />}
          {profile}
        </g>
        {crestEl}
        {o.kin === 1 && (
          <>
            <T x={24} y={44}>Sliding block</T>
            <line x1={64} y1={52} x2={bc[0]} y2={bc[1]} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />
          </>
        )}
        <line x1={24} y1={213} x2={48} y2={213} style={{ stroke: o.kin === 1 ? ON_LIGHT : INK3 }} strokeWidth={1.5} strokeDasharray="6 4" strokeLinecap="round" />
        <T x={56} y={220} fill={ON_LIGHT}>Failure plane</T>
        {p.ru > 0 && (
          <>
            <line x1={232} y1={213} x2={256} y2={213} style={{ stroke: U.ink }} strokeWidth={2} strokeDasharray="8 4" />
            <T x={376} y={220} anchor="end" fill={ON_LIGHT}>
              Water table
            </T>
          </>
        )}
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
  // §5.6d redraw (v3.2): plan view on top, shield section and leg pressure below; 24-unit inset, scene fills clipped.
  v3: { viewH: 320 },
  render: (p, _o, t) => {
    const T8 = 8;
    const u = (t % T8) / T8;
    const shearNo = Math.floor(t / T8);
    const cum = shearNo * p.web + u * p.web;
    const weighting = cum > p.wi * 0.5 && cum % p.wi < p.web * 1.5;
    const n = 22;
    const x0 = 50;
    const W = 300;
    const fx = (f: number) => x0 + f * W;
    const lag = 0.15;
    const shX = u;
    const shields = [];
    let afc = `M 24 84 L ${fx(0)} 84`;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const behind = shX - f;
      const state = behind > lag + 0.06 ? 2 : behind > lag ? 1 : 0; // 0 old, 1 advancing, 2 advanced
      const dy = state === 2 ? -8 : state === 1 ? -4 : 0;
      shields.push(<rect key={i} x={fx(f) - 5} y={92 + dy} width={10} height={22} rx={2} style={{ fill: state === 1 ? U.deep : U.light }} />);
      afc += ` L ${fx(f)} ${84 + (state >= 1 ? -8 : 0) * (state === 1 ? 0.5 : 1)}`;
    }
    afc += ` L ${fx(1)} 84 L 376 84`;
    const midBehind = shX - 0.5;
    const midState = midBehind > lag + 0.06 ? 2 : midBehind > lag ? 1 : 0;
    const pressure = weighting ? 100 : midState === 1 ? 5 : 55 + 25 * clamp(midBehind < 0 ? u : 1 - u, 0, 1);
    const sx = midState === 2 ? 14 : midState === 1 ? 7 : 0;
    const cy = midState === 1 ? 234 : 226;
    const cb = 68 - 8 * u;
    const state = weighting ? "unsafe" : pressure < 20 ? undefined : "safe";
    return (
      <g>
        <defs>
          <clipPath id="lwc-clip">
            <rect x={12} y={12} width={376} height={296} rx={12} />
          </clipPath>
        </defs>
        <g clipPath="url(#lwc-clip)">
          <rect x={0} y={0} width={400} height={cb} fill={GREYS.deep} />
          <rect x={0} y={cb} width={fx(shX)} height={8 * u + 6} fill={GREYS.mid} />
          <rect x={0} y={120} width={400} height={48} fill={GREYS.mid} />
          <rect x={0} y={204} width={212} height={16} fill={GREYS.light} />
          <rect x={0} y={278} width={212} height={40} fill={GREYS.light} />
        </g>
        <path d={afc} fill="none" style={{ stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
        {shields}
        {/* DERD shearer: body and two drums */}
        <rect x={fx(shX) - 14} y={72} width={28} height={10} rx={3} style={{ fill: U.mid, stroke: INK }} strokeWidth={2.5} />
        <circle cx={fx(shX) - 16} cy={68} r={6} fill={GREYS.light} style={{ stroke: INK }} strokeWidth={2.5} />
        <circle cx={fx(shX) + 16} cy={64} r={6} fill={GREYS.light} style={{ stroke: INK }} strokeWidth={2.5} />
        <T x={clamp(fx(shX), 74, 326)} y={44} anchor="middle" fill={ON_DEEP} weight={700}>
          DERD
        </T>
        <T x={32} y={150} fill={ON_LIGHT} weight={700}>
          Goaf (caving)
        </T>
        <T x={368} y={150} anchor="end" fill={ON_LIGHT} weight={700}>
          {`Advance ${num(cum, 1, "m")}`}
        </T>
        <T x={24} y={196} weight={700}>
          {`Shield: ${["set against roof", "lower → advance", "set (new web)"][midState]}`}
        </T>
        {/* section of the middle shield */}
        <g transform={`translate(${sx} 0)`}>
          <rect x={70} y={cy} width={80} height={7} rx={2} style={{ fill: U.mid }} />
          <line x1={95} y1={cy + 7} x2={100} y2={270} style={{ stroke: INK }} strokeWidth={4} strokeLinecap="round" />
          <line x1={125} y1={cy + 7} x2={120} y2={270} style={{ stroke: INK }} strokeWidth={4} strokeLinecap="round" />
          <rect x={80} y={270} width={60} height={8} rx={2} fill={GREYS.deep} />
          <line x1={70} y1={cy + 3} x2={48} y2={262} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        </g>
        <rect x={160} y={260} width={24} height={18} rx={2} style={{ fill: U.deep }} />
        <T x={232} y={240} fill={INK} weight={700}>
          Leg pressure
        </T>
        <rect x={232} y={250} width={144} height={14} rx={7} fill={GREYS.light} />
        <rect x={232} y={250} width={Math.max(14, 1.44 * pressure)} height={14} rx={7} data-state={state} style={{ fill: pressure >= 100 ? BAD : pressure < 20 ? U.mid : OK }} />
        <g data-state={weighting ? "unsafe" : "safe"}>
          <T x={232} y={290} fill={weighting ? BAD_TEXT : INK} weight={700}>
            {weighting ? "Weighting: yield!" : `${num(pressure, 0, "%")} of yield`}
          </T>
        </g>
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
  primary: ["rec", "dil"],
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
  // §5.6d redraw (v3.2): seam section between roof shale and floor; BG ring holes over a gallery, or the LTCC shield, draw window and goaf.
  v3: { viewH: 250 },
  render: (p, o, t) => {
    const bot = 198;
    const k = 9;
    const seamTop = bot - p.T * k;
    const flow = (t % 2) / 2;
    const mid = (seamTop + bot) / 2;
    const scene = (
      <>
        <defs>
          <clipPath id="thick-clip">
            <rect x={12} y={12} width={376} height={226} rx={12} />
          </clipPath>
        </defs>
        <g clipPath="url(#thick-clip)">
          <rect x={0} y={0} width={400} height={seamTop} fill={GREYS.light} />
          <rect x={0} y={seamTop} width={400} height={bot - seamTop} fill={GREYS.deep} />
          <rect x={0} y={bot} width={400} height={52} fill={GREYS.light} />
        </g>
      </>
    );
    const leaderDown = (x: number) => <line x1={x} y1={bot + 4} x2={x} y2={202} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />;
    if (p.meth === 0) {
      const gap = p.B * 10;
      const xs = [0, 1, 2, 3, 4, 5].map((i) => 190 + i * gap);
      const rings = [];
      for (let i = 0; i < 6; i++) {
        for (let j = -3; j <= 3; j++) rings.push(<line key={`${i}_${j}`} x1={xs[i]} y1={bot - 4} x2={xs[i] + j * 6} y2={seamTop + 6} stroke={ON_DEEP} strokeWidth={1.5} strokeLinecap="round" />);
      }
      return (
        <g>
          {scene}
          <rect x={0} y={bot - 20} width={124} height={20} style={{ fill: SURFACE }} />
          <polygon points={pts([[124, bot], [150, bot - 26], [176, bot]])} fill={GREYS.mid} />
          {rings}
          <rect x={30 + flow * 60} y={bot - 16} width={28} height={12} rx={3} style={{ fill: U.mid }} />
          <line x1={xs[0]} y1={bot + 6} x2={xs[1]} y2={bot + 6} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />
          <line x1={xs[0]} y1={bot + 2} x2={xs[0]} y2={bot + 10} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />
          <line x1={xs[1]} y1={bot + 2} x2={xs[1]} y2={bot + 10} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />
          <T x={(xs[0] + xs[1]) / 2} y={220} anchor="middle" fill={ON_LIGHT} weight={700}>
            Burden
          </T>
          <T x={24} y={220} fill={ON_LIGHT} weight={700}>
            Gallery, LHD
          </T>
          {leaderDown(60)}
          <T x={376} y={220} anchor="end" fill={ON_LIGHT} weight={700}>
            Floor
          </T>
          <T x={24} y={46} fill={ON_LIGHT} weight={700}>
            Roof shale
          </T>
          <T x={376} y={46} anchor="end" fill={ON_LIGHT} weight={700}>
            Ring holes
          </T>
          <line x1={xs[5]} y1={54} x2={xs[5]} y2={seamTop + 4} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />
          <T x={28} y={(seamTop + bot - 20) / 2 + 6} fill={ON_DEEP} weight={700}>
            Seam
          </T>
        </g>
      );
    }
    const cut = bot - p.hc * k;
    const drawn = clamp(o.top / 100, 0, 1);
    const yTop = seamTop + (cut - seamTop) * drawn; // top of the caved coal still in the window
    const shaleD = clamp(o.dil / 26, 0, 1) * (cut - seamTop);
    const shaleState = o.dil > 8 ? "unsafe" : undefined;
    const dash = -((t * 20) % 16);
    return (
      <g>
        {scene}
        {/* goaf, cut void, caved top coal behind the canopy, shale intruding from the roof */}
        <g clipPath="url(#thick-clip)">
          <rect x={0} y={seamTop} width={112} height={bot - seamTop} fill={GREYS.mid} />
          <rect x={112} y={cut} width={150} height={bot - cut} style={{ fill: SURFACE }} />
          <rect x={112} y={seamTop} width={38} height={yTop - seamTop} style={{ fill: SURFACE }} />
          <rect x={112} y={yTop} width={38} height={cut - yTop} style={{ fill: U.mid }} />
          {shaleD > 2 && <rect x={112} y={seamTop} width={38} height={shaleD} data-state={shaleState} fill={shaleState ? BAD_LIGHT : GREYS.light} />}
        </g>
        {cut - yTop > 6 && <line x1={131} y1={yTop + 4} x2={131} y2={cut} stroke={ON_DEEP} strokeWidth={2.5} strokeDasharray="8 8" strokeDashoffset={dash} strokeLinecap="round" />}
        <line x1={131} y1={cut + 2} x2={131} y2={bot - 16} style={{ stroke: INK }} strokeWidth={2.5} strokeDasharray="8 8" strokeDashoffset={dash} strokeLinecap="round" />
        {/* shield: canopy, legs, tail canopy over the rear AFC */}
        <rect x={150} y={cut} width={108} height={7} rx={2} style={{ fill: U.mid, stroke: INK }} strokeWidth={2.5} />
        <line x1={176} y1={cut + 7} x2={180} y2={bot - 8} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        <line x1={226} y1={cut + 7} x2={222} y2={bot - 8} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        <line x1={150} y1={cut + 4} x2={124} y2={bot - 24} style={{ stroke: INK }} strokeWidth={3} strokeLinecap="round" />
        <rect x={160} y={bot - 8} width={80} height={8} rx={2} style={{ fill: U.deep }} />
        <rect x={112} y={bot - 12} width={44} height={12} rx={2} style={{ fill: U.deep }} />
        <T x={24} y={46} fill={ON_LIGHT} weight={700}>
          Roof shale
        </T>
        <T x={376} y={46} anchor="end" fill={ON_LIGHT} weight={700}>
          Top coal
        </T>
        <line x1={330} y1={54} x2={330} y2={seamTop + 6} style={{ stroke: ON_LIGHT }} strokeWidth={1.5} />
        <T x={372} y={mid + 6} anchor="end" fill={ON_DEEP} weight={700}>
          Seam
        </T>
        <T x={28} y={bot - 12} fill={ON_LIGHT} weight={700}>
          Goaf
        </T>
        <T x={134} y={220} anchor="middle" fill={ON_LIGHT} weight={700}>
          Rear AFC
        </T>
        {leaderDown(134)}
        <T x={210} y={220} anchor="middle" fill={ON_LIGHT} weight={700}>
          Shield
        </T>
        {leaderDown(210)}
        <T x={376} y={220} anchor="end" fill={ON_LIGHT} weight={700}>
          Floor
        </T>
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
