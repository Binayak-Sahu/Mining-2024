import type { SimDef } from "@/lib/types";
import { C, Txt, Arrow, Dim, clamp, rad } from "@/components/sim/svg";

/* ---------------- Access selection: adit vs incline vs shaft ---------------- */

export const accessSim: SimDef = {
  id: "u2-access",
  title: "Access trade-off — adit, incline or shaft",
  params: [
    { key: "D", label: "Seam depth below portal", min: 50, max: 900, step: 10, unit: "m", default: 250 },
    { key: "ang", label: "Incline gradient (belt)", min: 8, max: 16, step: 0.5, unit: "°", default: 14 },
    { key: "P", label: "Target output", min: 0.5, max: 10, step: 0.5, unit: "Mtpa", default: 3 },
    { key: "hill", label: "Topography", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Flat (seam below valley)" }, { value: 1, label: "Hilly (seam above valley floor)" }] },
  ],
  compute: (p) => {
    const L = p.D / Math.sin(rad(p.ang));
    const incline = 0.08 * L + 1.5 * p.P; // ₹ crore: drivage+belt per metre + belt drive per Mtpa
    const shaft = 25 + 0.25 * p.D + 4 * p.P; // headgear/winder fixed + sinking/lining per metre + winding capacity
    const adit = p.hill ? 0.05 * 600 + 1.2 * p.P : Infinity;
    const best = p.hill ? 0 : incline <= shaft ? 1 : 2;
    return { L, incline, shaft, adit, best };
  },
  outputs: [
    { key: "L", label: "Incline length", unit: "m", digits: 0 },
    { key: "incline", label: "Incline capex", unit: "₹ cr", digits: 0 },
    { key: "shaft", label: "Shaft capex", unit: "₹ cr", digits: 0 },
    { key: "best", label: "Preferred access", format: (v) => ["ADIT (drift from hillside)", "INCLINE (belt conveyor)", "VERTICAL SHAFT (winding)"][v], tone: () => "ok" },
  ],
  caption: "Indicative cost model (₹ crore): incline ≈ 0.08/m + belt drives; shaft ≈ fixed headgear + 0.25/m sinking & lining + winding capacity. Adit only where the seam outcrops above drainage.",
  render: (p, o) => {
    const surf = 40;
    const scale = 170 / 900;
    const yS = surf + p.D * scale;
    const xShaft = 300;
    const xEnd = xShaft;
    const xStart = clamp(xEnd - (p.D * scale) / Math.tan(rad(p.ang)), -400, 400);
    const max = Math.max(o.incline, o.shaft, Number.isFinite(o.adit) ? o.adit : 0);
    return (
      <g>
        {p.hill ? (
          <path d={`M0 ${surf + 60} L120 ${surf + 60} L220 ${surf - 25} L400 ${surf - 25} L400 0 L0 0 Z`} fill="#e0f2fe" />
        ) : (
          <rect x={0} y={0} width={400} height={surf} fill="#e0f2fe" />
        )}
        <path d={p.hill ? `M0 ${surf + 60} L120 ${surf + 60} L220 ${surf - 25} L400 ${surf - 25} L400 240 L0 240 Z` : `M0 ${surf} L400 ${surf} L400 240 L0 240 Z`} fill="#e7e5e4" />
        <rect x={0} y={yS} width={400} height={6} fill={C.coal} />
        {p.hill ? (
          <g>
            <line x1={120} y1={surf + 55} x2={300} y2={surf + 55} stroke={C.safe} strokeWidth={4} />
            <Txt x={130} y={surf + 50} size={9} weight={800} fill={C.safe}>
              ADIT — gravity drainage, no hoisting
            </Txt>
          </g>
        ) : (
          <g>
            <line x1={Math.max(xStart, 0)} y1={xStart < 0 ? yS - (xEnd - 0) * Math.tan(rad(p.ang)) : surf} x2={xEnd} y2={yS} stroke={o.best === 1 ? C.safe : C.slate} strokeWidth={4} />
            <rect x={xShaft + 30} y={surf - 18} width={14} height={18} fill={C.ink} />
            <line x1={xShaft + 37} y1={surf} x2={xShaft + 37} y2={yS} stroke={o.best === 2 ? C.safe : C.slate} strokeWidth={6} />
            <Txt x={xShaft + 30} y={surf - 22} size={8} weight={700} fill={C.ink}>
              SHAFT
            </Txt>
            <Txt x={Math.max(xStart, 0) + 6} y={surf - 4} size={8} weight={700} fill={C.ink}>
              {xStart < 0 ? "INCLINE (off-chart)" : "INCLINE"}
            </Txt>
          </g>
        )}
        <Dim x1={392} y1={surf} x2={392} y2={yS} label="" color={C.ink} />
        <Txt x={386} y={(surf + yS) / 2 + 3} size={9} anchor="end" mono weight={700}>
          {`${p.D} m`}
        </Txt>
        <g transform="translate(16,150)">
          {[
            { label: "Incline", v: o.incline, c: C.tech },
            { label: "Shaft", v: o.shaft, c: C.hazard },
            ...(p.hill ? [{ label: "Adit", v: o.adit, c: C.safe }] : []),
          ].map((b, i) => (
            <g key={b.label}>
              <rect x={0} y={i * 22} width={(170 * b.v) / max} height={14} fill={b.c} rx={2} />
              <Txt x={4} y={i * 22 + 10} size={8} fill="white" weight={800}>
                {b.label} ₹{b.v.toFixed(0)} cr
              </Txt>
            </g>
          ))}
        </g>
      </g>
    );
  },
};

/* ---------------- Shaft sinking cycle with Galloway stage ---------------- */

export const sinkingSim: SimDef = {
  id: "u2-sinking",
  title: "Conventional sinking cycle & Galloway stage",
  params: [
    { key: "dia", label: "Finished shaft diameter", min: 4, max: 8, step: 0.5, unit: "m", default: 6 },
    { key: "hole", label: "Hole depth per round", min: 1.5, max: 4, step: 0.1, unit: "m", default: 2.4 },
    { key: "pull", label: "Pull efficiency", min: 0.7, max: 0.95, step: 0.01, default: 0.85 },
    { key: "grab", label: "Cactus-grab mucking rate", min: 10, max: 60, step: 1, unit: "m³/h", default: 20 },
    { key: "conc", label: "Lining method", min: 0, max: 1, step: 1, default: 0, options: [{ value: 0, label: "Sequential (pause to line)" }, { value: 1, label: "Concurrent from Galloway stage" }] },
  ],
  compute: (p) => {
    const dexc = p.dia + 2 * 0.45;
    const area = (Math.PI / 4) * dexc * dexc;
    const adv = p.hole * p.pull;
    const loose = area * adv * 1.6;
    const holes = Math.round(area * 1.6);
    const drill = (holes * p.hole) / (6 * 18);
    const blast = 1.5;
    const muck = loose / p.grab;
    const line = p.conc ? 0 : 2.2;
    const misc = 1.0;
    const cycle = drill + blast + muck + line + misc;
    const perMonth = (24 / cycle) * adv * 26 * 0.6;
    return { dexc, area, adv, loose, holes, drill, blast, muck, line, misc, cycle, perMonth };
  },
  outputs: [
    { key: "adv", label: "Advance / round", unit: "m", digits: 2 },
    { key: "loose", label: "Loose muck / round", unit: "m³", digits: 0 },
    { key: "cycle", label: "Cycle time", unit: "h", digits: 1 },
    { key: "muck", label: "Mucking time", unit: "h", digits: 1, tone: (v, o) => (v / o.cycle > 0.5 ? "warn" : "ok") },
    { key: "perMonth", label: "Sinking rate", unit: "m/month", digits: 0, tone: (v) => (v >= 70 ? "ok" : v >= 45 ? "warn" : "crit") },
  ],
  caption: "Monthly rate = rounds/day × advance × 26 working days × 0.6 availability (dewatering, inspections, shift changes).",
  render: (p, o) => {
    const segs = [
      { k: "drill", label: "Drill", c: C.tech },
      { k: "blast", label: "Charge·Blast·Vent", c: C.crit },
      { k: "muck", label: "Muck (grab+kibble)", c: C.hazard },
      { k: "line", label: "Line", c: C.slate },
      { k: "misc", label: "Misc", c: C.rock },
    ];
    let x = 150;
    const w = 235 / o.cycle;
    const sw = 40 + p.dia * 6;
    return (
      <g>
        <rect x={20} y={20} width={110} height={205} fill="#e7e5e4" />
        <rect x={75 - sw / 2} y={20} width={sw} height={205} fill="#f8fafc" />
        <rect x={75 - sw / 2 - 5} y={20} width={5} height={p.conc ? 150 : 110} fill={C.slate} />
        <rect x={75 + sw / 2} y={20} width={5} height={p.conc ? 150 : 110} fill={C.slate} />
        {[0, 1, 2].map((d) => (
          <rect key={d} x={75 - sw / 2 + 2} y={120 + d * 12} width={sw - 4} height={4} fill={C.ink} />
        ))}
        <Txt x={75} y={116} size={7} anchor="middle" weight={700}>
          GALLOWAY STAGE
        </Txt>
        <line x1={75} y1={20} x2={75} y2={185} stroke={C.ink} />
        <rect x={68} y={185} width={14} height={14} fill={C.hazard} />
        <Txt x={75} y={180} size={7} anchor="middle">
          kibble
        </Txt>
        <path d={`M ${75 - sw / 2} 215 L ${75 + sw / 2} 215 L ${75 + sw / 2} 225 L ${75 - sw / 2} 225 Z`} fill={C.rock} />
        <Txt x={75} y={237} size={7} anchor="middle" fill={C.slate}>
          sump / shaft bottom
        </Txt>
        <Txt x={150} y={30} size={9} weight={700} fill={C.slate}>
          CYCLE GANTT · {o.cycle.toFixed(1)} h
        </Txt>
        {segs.map((s) => {
          const v = o[s.k];
          const el = (
            <g key={s.k}>
              <rect x={x} y={40} width={Math.max(v * w, 0)} height={26} fill={s.c} />
              {v * w > 26 && (
                <Txt x={x + 3} y={56} size={7} fill="white" weight={700}>
                  {v.toFixed(1)}h
                </Txt>
              )}
            </g>
          );
          x += v * w;
          return el;
        })}
        {segs.map((s, i) => (
          <g key={s.label}>
            <rect x={150} y={80 + i * 14} width={9} height={9} fill={s.c} />
            <Txt x={164} y={88 + i * 14} size={8}>
              {s.label}
            </Txt>
          </g>
        ))}
        <Txt x={150} y={170} size={9} mono>
          Excavated Ø {o.dexc.toFixed(1)} m · {o.holes} holes
        </Txt>
        <Txt x={150} y={186} size={9} mono>
          Advance {o.adv.toFixed(2)} m/round
        </Txt>
        <Txt x={150} y={210} size={16} weight={900} mono fill={o.perMonth >= 70 ? C.safe : C.hazard}>
          {o.perMonth.toFixed(0)} m/month
        </Txt>
      </g>
    );
  },
};

/* ---------------- Ground freezing ---------------- */

export const freezeSim: SimDef = {
  id: "u2-freeze",
  title: "Freeze-wall design through a running-sand aquifer",
  params: [
    { key: "h", label: "Depth to base of aquifer", min: 30, max: 300, step: 5, unit: "m", default: 120 },
    { key: "r", label: "Excavated shaft radius", min: 2.5, max: 5, step: 0.1, unit: "m", default: 3.5 },
    { key: "sig", label: "Frozen-ground strength σ", min: 2, max: 10, step: 0.5, unit: "MPa", default: 4 },
  ],
  compute: (p) => {
    const pr = 0.013 * p.h;
    const lameOk = p.sig > 2 * pr;
    const lame = lameOk ? p.r * (Math.sqrt(p.sig / (p.sig - 2 * pr)) - 1) : NaN;
    const x = pr / p.sig;
    const domke = p.r * (0.29 * x + 2.3 * x * x);
    const e = lameOk ? Math.max(lame, domke) : NaN;
    const Rf = p.r + (Number.isFinite(e) ? e * 0.55 : 0);
    const n = Number.isFinite(e) ? Math.ceil((2 * Math.PI * Rf) / 1.2) : 0;
    return { pr, lame, domke, e, Rf, n, ok: lameOk ? 1 : 0 };
  },
  outputs: [
    { key: "pr", label: "Lateral pressure p", unit: "MPa", digits: 2 },
    { key: "lame", label: "Lamé thickness", unit: "m", digits: 2, format: (v) => (Number.isFinite(v) ? `${v.toFixed(2)} m` : "σ ≤ 2p — fails") , tone: (v) => (Number.isFinite(v) ? "info" : "crit") },
    { key: "domke", label: "Domke thickness", unit: "m", digits: 2 },
    { key: "e", label: "Design wall thickness", format: (v) => (Number.isFinite(v) ? `${v.toFixed(2)} m` : "INFEASIBLE"), tone: (v) => (!Number.isFinite(v) ? "crit" : v > 4 ? "warn" : "ok") },
    { key: "n", label: "Freeze holes @1.2 m", digits: 0, format: (v) => (v ? String(v) : "—") },
  ],
  render: (p, o) => {
    const cx = 120;
    const cy = 125;
    const k = 12; // px per m
    const rIn = p.r * k;
    const e = Number.isFinite(o.e) ? o.e : 0;
    const rOut = (p.r + e) * k;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#fef9c3" />
        <Txt x={10} y={16} size={9} weight={700} fill={C.slate}>
          PLAN AT AQUIFER BASE ({p.h} m)
        </Txt>
        <circle cx={cx} cy={cy} r={Math.min(rOut, 110)} fill={o.ok ? "#bae6fd" : "#fecaca"} stroke={o.ok ? C.tech : C.crit} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={rIn} fill="white" stroke={C.ink} strokeWidth={2} />
        {Array.from({ length: o.n }).map((_, i) => {
          const a = (2 * Math.PI * i) / Math.max(o.n, 1);
          const R = o.Rf * k;
          return <circle key={i} cx={cx + R * Math.cos(a)} cy={cy + R * Math.sin(a)} r={2.2} fill={C.tech} />;
        })}
        <Txt x={cx} y={cy + 3} size={9} anchor="middle" weight={700}>
          SHAFT
        </Txt>
        {[0, 1, 2, 3].map((i) => {
          const a = (Math.PI / 2) * i + Math.PI / 4;
          const R = Math.min(rOut, 110) + 22;
          return <Arrow key={i} x1={cx + R * Math.cos(a)} y1={cy + R * Math.sin(a)} x2={cx + (R - 18) * Math.cos(a)} y2={cy + (R - 18) * Math.sin(a)} color={C.crit} />;
        })}
        <Txt x={255} y={50} size={10} weight={800}>
          Lamé (thick cylinder)
        </Txt>
        <Txt x={255} y={64} size={9} mono>
          e = r[√(σ/(σ−2p)) − 1]
        </Txt>
        <Txt x={255} y={90} size={10} weight={800}>
          Domke (frozen soil)
        </Txt>
        <Txt x={255} y={104} size={9} mono>
          e = r[0.29p/σ + 2.3(p/σ)²]
        </Txt>
        <Txt x={255} y={132} size={9} fill={C.slate}>
          p ≈ 0.013 MPa per m
        </Txt>
        <Txt x={255} y={146} size={9} fill={C.slate}>
          (saturated sand + water)
        </Txt>
        <Txt x={255} y={176} size={14} weight={900} mono fill={o.ok ? C.ink : C.crit}>
          {o.ok ? `e = ${o.e.toFixed(2)} m` : "σ ≤ 2p !"}
        </Txt>
        <Txt x={255} y={194} size={9} fill={C.slate}>
          Colder brine (−30 °C) ⇒ higher σ
        </Txt>
      </g>
    );
  },
};

/* ---------------- Burn-cut drift round ---------------- */

export const burnCutSim: SimDef = {
  id: "u2-burncut",
  title: "Parallel-hole burn cut — pull and firing sequence",
  animated: true,
  params: [
    { key: "phi", label: "Empty relief hole Ø", min: 51, max: 200, step: 1, unit: "mm", default: 64 },
    { key: "S", label: "Drift cross-section", min: 6, max: 30, step: 1, unit: "m²", default: 16 },
    { key: "f", label: "Protodyakonov hardness f", min: 2, max: 15, step: 1, default: 8 },
  ],
  compute: (p) => {
    const phi = p.phi / 1000;
    const H = 0.15 + 34.1 * phi - 39.4 * phi * phi;
    const adv = 0.95 * H;
    const a1 = 1.5 * phi * 1000;
    const N = Math.round(2.7 * Math.sqrt(p.f * p.S));
    return { H, adv, a1, N, vol: adv * p.S };
  },
  outputs: [
    { key: "H", label: "Max hole depth (Holmberg)", unit: "m", digits: 2 },
    { key: "adv", label: "Expected pull (95%)", unit: "m", digits: 2, tone: (v) => (v >= 3.5 ? "ok" : v >= 2.5 ? "warn" : "crit") },
    { key: "a1", label: "1st-square burden ≤ 1.5φ", unit: "mm", digits: 0 },
    { key: "N", label: "Holes N = 2.7√(fS)", digits: 0 },
    { key: "vol", label: "Solid rock / round", unit: "m³", digits: 1 },
  ],
  render: (p, o, t) => {
    const w = Math.sqrt(p.S) * 1.15;
    const h = p.S / w;
    const k = 150 / Math.max(w, h);
    const cx = 140;
    const by = 200;
    const W = w * k;
    const Hh = h * k;
    const x0 = cx - W / 2;
    const y0 = by - Hh;
    // generate holes: cut square, easers ring, perimeter, lifters
    type Hole = { x: number; y: number; d: number };
    const holes: Hole[] = [];
    const ccx = cx;
    const ccy = y0 + Hh * 0.55;
    const s1 = 12;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => holes.push({ x: ccx + a * s1, y: ccy + b * s1, d: 1 }));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => holes.push({ x: ccx + a * s1 * 1.9, y: ccy + b * s1 * 1.9, d: 2 }));
    const rest = Math.max(o.N - 8, 8);
    const per = Math.round(rest * 0.45);
    const yA = y0 + Hh * 0.25;
    const wall = by - 14 - yA;
    const archN = Math.max(3, Math.round(per * 0.5));
    const wallN = Math.max(1, Math.floor((per - archN) / 2));
    for (let i = 0; i < wallN; i++) {
      const y = by - 14 - (i * wall) / wallN;
      holes.push({ x: x0 + 7, y, d: 5 }, { x: x0 + W - 7, y, d: 5 });
    }
    for (let i = 0; i <= archN; i++) {
      const u = i / archN;
      const bx = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * (x0 + W);
      const byy = (1 - u) * (1 - u) * yA + 2 * u * (1 - u) * (y0 - Hh * 0.15) + u * u * yA;
      holes.push({ x: bx + (cx - bx) * 0.06, y: byy + 7, d: 5 });
    }
    const lifters = Math.max(3, Math.round(rest * 0.2));
    for (let i = 0; i < lifters; i++) holes.push({ x: x0 + 8 + (i * (W - 16)) / Math.max(lifters - 1, 1), y: by - 6, d: 6 });
    const easers = Math.max(o.N - holes.length, 0);
    for (let i = 0; i < easers; i++) {
      const a = (2 * Math.PI * i) / easers;
      holes.push({ x: ccx + Math.cos(a) * W * 0.3, y: ccy + Math.sin(a) * Hh * 0.28, d: 3 + (i % 2) });
    }
    const phase = (t % 4) / 4 * 7;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#e7e5e4" />
        <path d={`M ${x0} ${by} L ${x0} ${y0 + Hh * 0.25} Q ${cx} ${y0 - Hh * 0.15} ${x0 + W} ${y0 + Hh * 0.25} L ${x0 + W} ${by} Z`} fill="#a8a29e" stroke={C.ink} strokeWidth={1.5} />
        <circle cx={ccx} cy={ccy} r={Math.max(3, (p.phi / 1000) * k * 2.2)} fill="white" stroke={C.ink} strokeWidth={1.5} />
        {holes.map((hh, i) => {
          const fired = phase >= hh.d;
          return <circle key={i} cx={hh.x} cy={hh.y} r={3.2} fill={fired ? C.crit : C.ink} opacity={fired ? 0.9 : 1} />;
        })}
        <Txt x={cx} y={228} size={8} anchor="middle" fill={C.slate}>
          Firing order by delay: cut → cut-spreaders → easers → perimeter → lifters
        </Txt>
        <Txt x={265} y={40} size={10} weight={800}>
          Holmberg pull
        </Txt>
        <Txt x={265} y={54} size={8} mono>
          H = 0.15 + 34.1φ − 39.4φ²
        </Txt>
        <Txt x={265} y={80} size={10} weight={800}>
          Relief hole
        </Txt>
        <Txt x={265} y={94} size={8} mono>
          φ = {p.phi} mm (free face)
        </Txt>
        <Txt x={265} y={128} size={20} weight={900} mono fill={o.adv >= 3.5 ? C.safe : C.hazard}>
          {o.adv.toFixed(2)} m
        </Txt>
        <Txt x={265} y={142} size={8} fill={C.slate}>
          pull per round
        </Txt>
        <Txt x={265} y={170} size={9} mono>
          delay #{Math.min(Math.floor(phase), 6)}
        </Txt>
      </g>
    );
  },
};

/* ---------------- Mechanical excavation ---------------- */

const MACH = [
  { name: "Roadheader (boom-type)", k: 0.55, max: 100 },
  { name: "Continuous miner (drum)", k: 0.65, max: 40 },
  { name: "Hard-rock TBM (disc cutters)", k: 0.8, max: 250 },
];

export const cuttingSim: SimDef = {
  id: "u2-cutting",
  title: "Rock-cutting machines — specific energy and cutting rate",
  params: [
    { key: "m", label: "Machine", min: 0, max: 2, step: 1, default: 0, options: MACH.map((m, i) => ({ value: i, label: m.name.split(" (")[0] })) },
    { key: "ucs", label: "Rock UCS", min: 10, max: 250, step: 5, unit: "MPa", default: 60 },
    { key: "P", label: "Cutting power", min: 100, max: 500, step: 10, unit: "kW", default: 300 },
  ],
  compute: (p) => {
    const m = MACH[p.m];
    const se = 0.11 * p.ucs;
    const icr = (m.k * p.P) / se;
    return { se, icr, ok: p.ucs <= m.max ? 1 : 0, max: m.max };
  },
  outputs: [
    { key: "se", label: "Specific energy SE", unit: "kWh/m³", digits: 1 },
    { key: "icr", label: "Instantaneous cutting rate", unit: "m³/h", digits: 1, tone: (v, o) => (!o.ok ? "crit" : v >= 15 ? "ok" : "warn") },
    { key: "ok", label: "Within machine envelope?", format: (v, o) => (v ? `Yes (≤ ${o.max} MPa)` : `NO — exceeds ${o.max} MPa; pick wear/vibration`), tone: (v) => (v ? "ok" : "crit") },
  ],
  caption: "ICR = k·P / SE with energy-transfer ratio k; SE ≈ 0.11 × UCS (kWh/m³) is an indicative linear fit for sedimentary rocks.",
  render: (p, o) => {
    const sx = (u: number) => 30 + (u / 250) * 340;
    return (
      <g>
        <Txt x={30} y={20} size={9} weight={700} fill={C.slate}>
          ROCK STRENGTH SCALE (UCS, MPa) & MACHINE ENVELOPES
        </Txt>
        <rect x={30} y={30} width={340} height={12} fill="url(#ucsg)" rx={3} />
        <defs>
          <linearGradient id="ucsg" x1="0" x2="1">
            <stop offset="0" stopColor="#1e293b" />
            <stop offset="0.2" stopColor="#a8a29e" />
            <stop offset="1" stopColor="#57534e" />
          </linearGradient>
        </defs>
        {[0, 50, 100, 150, 200, 250].map((u) => (
          <Txt key={u} x={sx(u)} y={54} size={7} anchor="middle" mono fill={C.slate}>
            {u}
          </Txt>
        ))}
        {MACH.map((m, i) => (
          <g key={m.name}>
            <rect x={sx(0)} y={64 + i * 18} width={sx(m.max) - sx(0)} height={12} rx={3} fill={i === p.m ? C.tech : "#cbd5e1"} />
            <Txt x={sx(0) + 4} y={73 + i * 18} size={7.5} weight={700} fill={i === p.m ? "white" : C.ink}>
              {m.name}
            </Txt>
          </g>
        ))}
        <line x1={sx(p.ucs)} x2={sx(p.ucs)} y1={26} y2={122} stroke={o.ok ? C.safe : C.crit} strokeWidth={2.5} />
        <Txt x={sx(p.ucs)} y={132} size={9} anchor="middle" mono weight={800} fill={o.ok ? C.safe : C.crit}>
          {p.ucs} MPa
        </Txt>
        {/* machine schematic */}
        <rect x={40} y={180} width={110} height={30} rx={4} fill={C.hazard} />
        <circle cx={60} cy={215} r={8} fill={C.ink} />
        <circle cx={130} cy={215} r={8} fill={C.ink} />
        {p.m === 2 ? (
          <g>
            <rect x={150} y={160} width={14} height={60} fill={C.ink} />
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={166} cy={168 + i * 15} r={4} fill={C.slate} />
            ))}
          </g>
        ) : (
          <g>
            <line x1={140} y1={188} x2={p.m === 0 ? 205 : 190} y2={p.m === 0 ? 160 : 190} stroke={C.ink} strokeWidth={8} />
            {p.m === 0 ? <circle cx={210} cy={156} r={12} fill={C.slate} stroke={C.ink} strokeWidth={2} /> : <rect x={186} y={168} width={20} height={44} rx={8} fill={C.slate} stroke={C.ink} strokeWidth={2} />}
          </g>
        )}
        <rect x={225} y={150} width={155} height={75} fill="#d6d3d1" />
        <Txt x={232} y={170} size={9} weight={800}>
          ICR = k·P / SE
        </Txt>
        <Txt x={232} y={186} size={8} mono>
          = {MACH[p.m].k}×{p.P} / {o.se.toFixed(1)}
        </Txt>
        <Txt x={232} y={212} size={16} weight={900} mono fill={o.ok ? C.ink : C.crit}>
          {o.icr.toFixed(1)} m³/h
        </Txt>
      </g>
    );
  },
};

export const U2_SIMS = [accessSim, sinkingSim, freezeSim, burnCutSim, cuttingSim];
