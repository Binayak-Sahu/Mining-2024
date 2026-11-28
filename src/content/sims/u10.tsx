import type { SimDef } from "@/lib/types";
import { C, Txt, clamp, SANS, Stream } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";
import { T, INK, INK2, INK3, ON_LIGHT, ON_DEEP, GREYS, U, textW } from "@/components/sim/v3";

/* ---------------- Statutory hierarchy & duties explorer ---------------- */

export const ROLES = [
  { name: "Owner", tier: 0, duty: "Provides the financial and other resources needed for compliance and appoints the agent, manager and officials. Owner, agent and manager share responsibility for compliance with the Act and the regulations." },
  { name: "Agent", tier: 0, duty: "Acts on the owner's behalf in the management, control and supervision of the mine. Must not obstruct or override the manager's statutory duties." },
  { name: "Manager", tier: 1, duty: "Holder of the appropriate Manager's Certificate. Exercises overall control, management, supervision and direction of the mine; frames standing orders and support rules; ensures compliance throughout." },
  { name: "Asst. Manager", tier: 2, duty: "Holds charge of a section or shift under the manager and is responsible for compliance within it." },
  { name: "Ventilation Officer", tier: 2, duty: "Ventilation surveys, air quantity and quality measurements, gas records, ventilation plans and the control of ventilation devices." },
  { name: "Safety Officer", tier: 2, duty: "Assists in safety management — risk assessment, accident/incident investigation, safety committee work, training and inspections. Kept free of production duties." },
  { name: "Surveyor", tier: 2, duty: "Prepares and maintains the mine plans and sections and carries out the surveys on which they are based; responsible for their accuracy." },
  { name: "Overman", tier: 3, duty: "In charge of a district for the shift: inspects workings, ensures ventilation, supports and safe practices, and supervises sirdars and workers." },
  { name: "Mining Sirdar", tier: 4, duty: "In charge of a smaller district: inspects working places, tests for gas, makes places safe and withdraws persons from danger." },
  { name: "Shotfirer", tier: 4, duty: "Charges, stems and fires shots under the regulations; tests for gas before firing; deals with misfires; accounts for explosives." },
];

const LAWS = ["Mines Act 1952 / OSH&WC Code 2020", "Mines Rules 1955 · Rescue Rules 1985 · VT Rules", "CMR 2017 · MMR 1961 · CEA safety regs", "DGMS circulars & technical circulars", "Mine standing orders · SMP · SSR"];

export const rolesSim: SimDef = {
  id: "u10-roles",
  title: "Statutory architecture & duty explorer",
  params: [{ key: "role", label: "Select a statutory position", min: 0, max: ROLES.length - 1, step: 1, default: 2, options: ROLES.map((r, i) => ({ value: i, label: r.name })) }],
  compute: (p) => ({ tier: ROLES[p.role].tier, role: p.role }),
  outputs: [
    { key: "role", label: "Position", format: (v) => ROLES[v].name },
    { key: "tier", label: "Level", format: (v) => ["Ownership & management", "Statutory management", "Specialist officials", "Supervisory", "Front-line competent persons"][v] },
  ],
  primary: ["tier"],
  v3: { viewH: 400 },
  render: (p) => {
    const r = ROLES[p.role];
    const H = 400;
    const lines = wrapDuty(r.duty);
    const cy = 142;
    return (
      <g>
        <clipPath id="u10roles-clip">
          <rect x={12} y={12} width={376} height={H - 24} rx={12} />
        </clipPath>
        <g clipPath="url(#u10roles-clip)">
          <rect x={0} y={0} width={400} height={cy - 8} fill={GREYS.light} />
        </g>
        {ROLE_LAWS.map((l, i) => {
          const y = 28 + i * 22;
          return (
            <g key={l}>
              <T x={24} y={y + 6} fill={ON_LIGHT}>
                {l}
              </T>
              <rect x={200} y={y - 8} width={100 + i * 15 + 60} height={16} rx={4} fill={[U.deep, U.deep, U.mid, U.mid, GREYS.mid][i]} />
            </g>
          );
        })}
        <rect x={24} y={cy} width={352} height={H - 24 - cy} rx={12} fill="var(--surface)" stroke={INK3} strokeWidth={1.5} />
        <rect x={24} y={cy} width={6} height={H - 24 - cy} rx={3} fill={U.deep} />
        <T x={40} y={cy + 28} fill={INK}>
          {`Duty · level ${r.tier + 1} of 5`}
        </T>
        {lines.map((ln, i) => (
          <T key={i} x={40} y={cy + 56 + i * 23} fill={INK2} weight={500}>
            {ln}
          </T>
        ))}
      </g>
    );
  },
};

const ROLE_LAWS = ["Act / Code", "Rules", "Regulations", "DGMS circulars", "Mine orders"];

function wrapDuty(d: string): string[] {
  const out: string[] = [];
  let l = "";
  for (const t of d.split(" ")) {
    if (l && textW(l + " " + t, 18) > 316) {
      out.push(l);
      l = t;
    } else l = l ? l + " " + t : t;
  }
  out.push(l);
  return out;
}

/* ---------------- Degree of gassiness ---------------- */

export function gassiness(p: Record<string, number>) {
  return p.em > 10 ? 3 : p.em > 1 || p.gb > 0.1 ? 2 : 1;
}


/** Piecewise emission scale: 0–1 (I), 1–10 (II), 10–20 (III) m³/t. */
function gxe(e: number): number {
  const v = clamp(e, 0, 20);
  return v <= 1 ? 30 + v * 60 : v <= 10 ? 90 + ((v - 1) / 9) * 160 : 250 + ((v - 10) / 10) * 120;
}
function gxeInv(x: number): number {
  const c = clamp(x, 30, 370);
  return c <= 90 ? (c - 30) / 60 : c <= 250 ? 1 + ((c - 90) / 160) * 9 : 10 + ((c - 250) / 120) * 10;
}

function GassyScene({ p, deg, t }: { p: Record<string, number>; deg: number; t: number }) {
  const gx = 30 + clamp(p.gb, 0, 1) * 340;
  const over = p.gb > 0.1;
  const bands: { a: number; b: number; fill: string; ink: string; l: string; d: number }[] = [
    { a: 0, b: 1, fill: U.light, ink: ON_LIGHT, l: "I", d: 1 },
    { a: 1, b: 10, fill: U.mid, ink: ON_LIGHT, l: "II", d: 2 },
    { a: 10, b: 20, fill: U.deep, ink: ON_DEEP, l: "III", d: 3 },
  ];
  return (
    <g>
      {bands.map((b) => (
        <g key={b.l}>
          <rect x={gxe(b.a)} y={28} width={gxe(b.b) - gxe(b.a)} height={40} fill={b.fill} />
          <T x={(gxe(b.a) + gxe(b.b)) / 2} y={54} anchor="middle" fill={b.ink} weight={800}>
            {b.l}
          </T>
        </g>
      ))}
      <rect x={30} y={28} width={340} height={40} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} />
      {bands.filter((b) => b.d === deg).map((b) => (
        <rect key={b.l} x={gxe(b.a)} y={28} width={gxe(b.b) - gxe(b.a)} height={40} fill="none" style={{ stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
      ))}
      <T x={30} y={92} anchor="middle">0</T>
      <T x={90} y={92} anchor="middle">1</T>
      <T x={250} y={92} anchor="middle">10</T>
      <T x={370} y={92} anchor="end">20 m³/t</T>
      <line x1={gxe(p.em)} x2={gxe(p.em)} y1={28} y2={68} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={30} y={110} width={340} height={16} rx={8} fill={GREYS.light} />
      <rect x={30} y={110} width={Math.max(clamp(p.gb, 0, 1) * 340, 0)} height={16} rx={8} fill={over ? U.deep : U.mid} />
      <line x1={64} x2={64} y1={104} y2={132} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={gx} cy={118} r={5} fill={INK} />
      <T x={64} y={154} anchor="middle">0.1 %</T>
      <T x={370} y={154} anchor="end">General-body gas</T>
      <rect x={30} y={178} width={340} height={48} rx={12} fill={GREYS.deep} />
      <circle cx={46} cy={202} r={5} fill="#FFFFFF" />
      <T x={58} y={208} fill={ON_DEEP}>CH₄</T>
      {[0, 1, 2, 3, 4].map((k) => {
        const ph = (t * (0.2 + deg * 0.15) + k / 5) % 1;
        return <circle key={k} cx={130 + k * 52} cy={218 - ph * 36} r={4} fill="#FFFFFF" opacity={0.9 * (1 - ph * 0.5)} />;
      })}
    </g>
  );
}

export const gassySim: SimDef = {
  id: "u10-gassy",
  title: "Degree of gassiness classifier (coal seams)",
  params: [
    { key: "em", label: "Rate of methane emission", min: 0, max: 20, step: 0.1, unit: "m³/t", default: 0.5 },
    { key: "gb", label: "Inflammable gas in general body", min: 0, max: 1, step: 0.01, unit: "%", default: 0.05 },
  ],
  compute: (p) => ({ deg: gassiness(p) }),
  outputs: [
    { key: "deg", label: "Classification", format: (v) => `Degree ${["", "I", "II", "III"][v]}`, tone: (v) => (v === 1 ? "ok" : v === 2 ? "warn" : "crit") },
    { key: "deg", label: "Key implication", format: (v) => ["", "Least gassy — still test regularly", "Gassy: flameproof/IS apparatus, permitted explosives, stricter gas testing", "Most gassy: strictest controls; continuous monitoring, drainage often needed"][v] },
  ],
  caption: "Degree I: ≤ 0.1 % inflammable gas in general body AND emission ≤ 1 m³/t. Degree II: > 0.1 % or > 1 m³/t up to 10 m³/t. Degree III: > 10 m³/t.",
  animated: true,
  primary: ["deg"],
  // §5.6 redraw (v3e): the emission scale is piecewise (I | II | III each get room); pins sit on I, II, III and the 0.1 % mark.
  v3: { viewH: 250 },
  handles: [
    { key: "em", axis: "x", at: (p) => [gxe(p.em), 48], toValue: (x) => gxeInv(x), color: "#0F172A" },
    { key: "gb", axis: "x", at: (p) => [30 + clamp(p.gb, 0, 1) * 340, 118], toValue: (x) => (x - 30) / 340, color: "#F59E0B" },
  ],
  render: (p, o, t) => <GassyScene p={p} deg={o.deg} t={t} />,
};

/* ---------------- Risk matrix (SMP / HIRA / WRAC) ---------------- */

const CONTROLS = [
  { name: "No additional control", dL: 0, dC: 0 },
  { name: "PPE", dL: 0, dC: 1 },
  { name: "Administrative (training, permits)", dL: 1, dC: 0 },
  { name: "Engineering (guards, interlocks, PDS)", dL: 2, dC: 0 },
  { name: "Substitution", dL: 3, dC: 0 },
  { name: "Elimination", dL: 4, dC: 0 },
];

export function risk(p: Record<string, number>) {
  const c = CONTROLS[p.ctrl];
  // Elimination removes the hazard itself: nothing left to rate, so residual risk falls to the floor (1).
  const elim = c.name === "Elimination";
  const L2 = elim ? 1 : Math.max(1, p.L - c.dL);
  const C2 = elim ? 1 : Math.max(1, p.C - c.dC);
  const band = (r: number) => (r <= 4 ? 0 : r <= 9 ? 1 : r <= 16 ? 2 : 3);
  return { inh: p.L * p.C, res: L2 * C2, L2, C2, bi: band(p.L * p.C), br: band(L2 * C2) };
}

const BANDS = ["Low", "Medium", "High", "Very high"];

export const riskSim: SimDef = {
  id: "u10-risk",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["res", "br"],
  title: "Risk matrix — hazard rating and hierarchy of controls",
  params: [
    { key: "L", label: "Likelihood (1 rare – 5 almost certain)", min: 1, max: 5, step: 1, default: 4 },
    { key: "C", label: "Consequence (1 minor – 5 fatality/multiple)", min: 1, max: 5, step: 1, default: 5 },
    { key: "ctrl", label: "Control applied", min: 0, max: 5, step: 1, default: 0, options: CONTROLS.map((c, i) => ({ value: i, label: c.name.split(" (")[0] })) },
  ],
  compute: (p) => risk(p),
  outputs: [
    { key: "inh", label: "Inherent risk L×C", digits: 0, tone: (_, o) => (["ok", "warn", "crit", "crit"] as const)[o.bi] },
    { key: "res", label: "Residual risk", digits: 0, tone: (_, o) => (["ok", "warn", "crit", "crit"] as const)[o.br] },
    { key: "br", label: "Residual band", format: (v) => BANDS[v], tone: (v) => (["ok", "warn", "crit", "crit"] as const)[v] },
  ],
  caption: "Hierarchy of controls: elimination > substitution > engineering > administrative > PPE. PPE only reduces consequence for the wearer; it never removes the hazard.",
  handles: [
    { key: "C", axis: "x", at: (p) => [40 + (p.C - 1) * 34 + 16, 196], toValue: (x) => (x - 40 - 16) / 34 + 1, color: "#EF4444" },
    { key: "L", axis: "y", at: (p) => [24, 20 + (5 - p.L) * 34 + 16], toValue: (y) => 5 - (y - 20 - 16) / 34, color: "#EF4444" },
  ],
  render: (p, o) => {
    const s = 34;
    const x0 = 40;
    const y0 = 20;
    const col = (r: number) => (r <= 4 ? "#86efac" : r <= 9 ? "#fde68a" : r <= 16 ? "#fdba74" : "#fca5a5");
    const cells = [];
    for (let L = 1; L <= 5; L++)
      for (let Cc = 1; Cc <= 5; Cc++)
        cells.push(
          <g key={`${L}${Cc}`}>
            <rect x={x0 + (Cc - 1) * s} y={y0 + (5 - L) * s} width={s - 2} height={s - 2} rx={4} fill={col(L * Cc)} />
            <rect x={x0 + (Cc - 1) * s} y={y0 + (5 - L) * s} width={s - 2} height={10} rx={4} fill={MAT.glass} />
            <Txt x={x0 + (Cc - 1) * s + s / 2 - 1} y={y0 + (5 - L) * s + s / 2 + 3} size={8} anchor="middle" mono fill={C.slate}>
              {L * Cc}
            </Txt>
          </g>,
        );
    const cx = (Cc: number) => x0 + (Cc - 1) * s + s / 2 - 1;
    const cy = (L: number) => y0 + (5 - L) * s + s / 2 - 1;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        {cells}
        <Txt x={x0 + 2.5 * s} y={y0 + 5 * s + 14} size={8} anchor="middle" fill={C.slate} weight={700}>
          CONSEQUENCE →
        </Txt>
        <Txt x={12} y={y0 + 2.5 * s} size={8} fill={C.slate} weight={700}>
          L
        </Txt>
        {(p.C !== o.C2 || p.L !== o.L2) && <Stream d={`M${cx(p.C)} ${cy(p.L)} Q ${(cx(p.C) + cx(o.C2)) / 2 + 16} ${(cy(p.L) + cy(o.L2)) / 2 - 16} ${cx(o.C2)} ${cy(o.L2)}`} color={C.tech} width={2} speed={0.5} />}
        <circle cx={cx(p.C)} cy={cy(p.L)} r={12} fill="none" stroke={C.crit} strokeWidth={3} />
        <circle cx={cx(o.C2)} cy={cy(o.L2)} r={9} fill="none" stroke={C.tech} strokeWidth={3.5} />
        <circle cx={cx(o.C2)} cy={cy(o.L2)} r={11} fill="none" stroke="white" strokeWidth={1} />
        <Txt x={235} y={40} size={10} weight={800}>
          ○ inherent ({o.inh})
        </Txt>
        <Txt x={235} y={58} size={10} weight={800} fill={C.tech}>
          ● residual ({o.res})
        </Txt>
        {CONTROLS.slice(1)
          .reverse()
          .map((c, i) => (
            <g key={c.name}>
              <rect x={235} y={80 + i * 22} width={150 - i * 14} height={18} rx={5} fill={p.ctrl === CONTROLS.length - 1 - i ? C.tech : "#e2e8f0"} filter={p.ctrl === CONTROLS.length - 1 - i ? "url(#f-shadow)" : undefined} />
              <Txt x={240} y={93 + i * 22} size={8} weight={700} fill={p.ctrl === CONTROLS.length - 1 - i ? "white" : C.ink}>
                {c.name.split(" (")[0]}
              </Txt>
            </g>
          ))}
      </g>
    );
  },
};

/* ---------------- Fault tree ---------------- */

export function fta(p: Record<string, number>) {
  const or = (...ps: number[]) => 1 - ps.reduce((a, b) => a * (1 - b), 1);
  const gas = or(p.p1, p.p2, p.p3);
  const ign = or(p.p4, p.p5, p.p6);
  return { gas, ign, top: gas * ign };
}

export const ftaSim: SimDef = {
  id: "u10-fta",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["gas", "top"],
  title: "Fault tree — firedamp explosion",
  params: [
    { key: "p1", label: "Ventilation failure (per yr)", min: 0, max: 0.5, step: 0.005, default: 0.1 },
    { key: "p2", label: "Gas outburst / feeder", min: 0, max: 0.5, step: 0.005, default: 0.05 },
    { key: "p3", label: "Roof layering undetected", min: 0, max: 0.5, step: 0.005, default: 0.1 },
    { key: "p4", label: "FLP/electrical spark", min: 0, max: 0.5, step: 0.005, default: 0.05 },
    { key: "p5", label: "Frictional ignition", min: 0, max: 0.5, step: 0.005, default: 0.05 },
    { key: "p6", label: "Shotfiring flame", min: 0, max: 0.5, step: 0.005, default: 0.02 },
  ],
  compute: (p) => fta(p),
  outputs: [
    { key: "gas", label: "P(flammable mixture) — OR gate", digits: 4 },
    { key: "ign", label: "P(ignition source) — OR gate", digits: 4 },
    { key: "top", label: "P(explosion) — AND gate", digits: 5, tone: (v) => (v <= 0.001 ? "ok" : v <= 0.01 ? "warn" : "crit") },
  ],
  caption: "OR: P = 1 − Π(1 − pᵢ). AND: P = Π pᵢ. Independent basic events assumed; probabilities per year.",
  render: (p, o) => {
    const box = (x: number, y: number, w: number, label: string, val: number, color: string) => (
      <g>
        <rect x={x - w / 2} y={y} width={w} height={30} rx={6} fill="white" stroke={color} strokeWidth={2} filter="url(#f-shadow)" />
        <Txt x={x} y={y + 12} size={7.5} anchor="middle" weight={700}>
          {label}
        </Txt>
        <Txt x={x} y={y + 24} size={8} anchor="middle" mono fill={color}>
          {val.toFixed(val < 0.01 ? 5 : 3)}
        </Txt>
      </g>
    );
    const gate = (x: number, y: number, kind: "AND" | "OR") =>
      kind === "AND" ? (
        <path d={`M ${x - 12} ${y + 20} L ${x - 12} ${y + 8} A 12 12 0 0 1 ${x + 12} ${y + 8} L ${x + 12} ${y + 20} Z`} fill={MAT.metal} stroke={C.ink} />
      ) : (
        <path d={`M ${x - 12} ${y + 20} Q ${x} ${y + 12} ${x + 12} ${y + 20} Q ${x + 10} ${y + 6} ${x} ${y} Q ${x - 10} ${y + 6} ${x - 12} ${y + 20} Z`} fill={MAT.metal} stroke={C.ink} />
      );
    const leaves = [
      { x: 40, l: "Vent fail", v: p.p1 },
      { x: 105, l: "Outburst", v: p.p2 },
      { x: 170, l: "Layering", v: p.p3 },
      { x: 230, l: "Spark", v: p.p4 },
      { x: 295, l: "Friction", v: p.p5 },
      { x: 360, l: "Shotfiring", v: p.p6 },
    ];
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        {o.top > 0.001 && <rect x={135} y={6} width={130} height={30} rx={6} fill={C.crit} opacity={0.35} filter="url(#f-glow)" />}
        {box(200, 6, 130, "FIREDAMP EXPLOSION", o.top, o.top <= 0.001 ? C.safe : C.crit)}
        <line x1={200} y1={36} x2={200} y2={50} stroke={C.ink} />
        {gate(200, 50, "AND")}
        <line x1={105} y1={70} x2={295} y2={70} stroke={C.ink} />
        <line x1={105} y1={70} x2={105} y2={80} stroke={C.ink} />
        <line x1={295} y1={70} x2={295} y2={80} stroke={C.ink} />
        {box(105, 80, 120, "Flammable mixture", o.gas, C.hazard)}
        {box(295, 80, 120, "Ignition source", o.ign, C.hazard)}
        {gate(105, 112, "OR")}
        {gate(295, 112, "OR")}
        <line x1={40} y1={140} x2={170} y2={140} stroke={C.ink} />
        <line x1={230} y1={140} x2={360} y2={140} stroke={C.ink} />
        <line x1={105} y1={132} x2={105} y2={140} stroke={C.ink} />
        <line x1={295} y1={132} x2={295} y2={140} stroke={C.ink} />
        {leaves.map((lf) => (
          <g key={lf.l}>
            <line x1={lf.x} y1={140} x2={lf.x} y2={156} stroke={C.ink} />
            <circle cx={lf.x} cy={176} r={20} fill="white" stroke={C.tech} strokeWidth={1.5} />
            <circle cx={lf.x} cy={176} r={20} fill={lf.v > 0.1 ? C.crit : lf.v > 0.02 ? C.hazard : C.safe} opacity={0.12 + Math.min(lf.v, 0.5)} />
            <Txt x={lf.x} y={174} size={7} anchor="middle" weight={700}>
              {lf.l}
            </Txt>
            <Txt x={lf.x} y={185} size={7} anchor="middle" mono fill={C.tech}>
              {lf.v.toFixed(3)}
            </Txt>
          </g>
        ))}
        <Txt x={200} y={226} size={9} anchor="middle" fill={C.slate}>
          AND gate: both branches must occur · OR gate: any one event suffices
        </Txt>
      </g>
    );
  },
};

/* ---------------- Closed-circuit breathing apparatus mission planner ---------------- */

const WORK = [
  { name: "Rest / standby", q: 1.0 },
  { name: "Moderate (walking, light work)", q: 2.0 },
  { name: "Heavy (carrying, stretcher, sealing)", q: 3.0 },
];

export function scba(p: Record<string, number>) {
  const q = WORK[p.work].q + 0.2;
  const o2 = p.V * p.P;
  const dur = o2 / q;
  const usable = dur * (1 - p.res / 100);
  const workTime = usable - 2 * p.travel;
  const turn = (p.travel * q) / p.V + (p.res / 100) * p.P;
  return { q, o2, dur, workTime, turn };
}

export const scbaSim: SimDef = {
  id: "u10-scba",
  // §5.9: the objective's variables come first in the readout rows.
  primary: ["workTime", "dur"],
  title: "Rescue mission planner — closed-circuit oxygen breathing apparatus",
  params: [
    { key: "V", label: "Oxygen cylinder (water capacity)", min: 1, max: 3, step: 0.1, unit: "L", default: 2 },
    { key: "P", label: "Charged pressure", min: 100, max: 300, step: 10, unit: "bar", default: 200 },
    { key: "work", label: "Workload", min: 0, max: 2, step: 1, default: 1, options: WORK.map((w, i) => ({ value: i, label: w.name.split(" (")[0] })) },
    { key: "travel", label: "Travel time to fire seat (one way)", min: 5, max: 90, step: 1, unit: "min", default: 30 },
    { key: "res", label: "Safety reserve", min: 10, max: 30, step: 1, unit: "%", default: 20 },
  ],
  compute: (p) => scba(p),
  outputs: [
    { key: "o2", label: "Oxygen supply", unit: "L", digits: 0 },
    { key: "dur", label: "Total duration", unit: "min", digits: 0 },
    { key: "workTime", label: "Working time at site", unit: "min", digits: 0, tone: (v) => (v >= 20 ? "ok" : v > 0 ? "warn" : "crit") },
    { key: "turn", label: "Turn-around gauge reading", unit: "bar", digits: 0 },
  ],
  caption: "Consumption = metabolic O₂ + 0.2 L/min allowance. The team turns back when the gauge reaches the turn-around pressure — whichever member reaches it first.",
  animated: true,
  handles: [{ key: "travel", axis: "x", at: (p, o) => [30 + p.travel * (340 / Math.max(o.dur, 1)), 70], toValue: (x, p) => (x - 30) / (340 / Math.max(scbaSim.compute(p).dur, 1)), color: "#3B82F6" }],
  render: (p, o, t) => {
    const total = Math.max(o.dur, 1);
    const k = 340 / total;
    const tr = p.travel * k;
    const res = o.dur * (p.res / 100) * k;
    const wk = Math.max(0, o.workTime) * k;
    return (
      <g>
        <rect x={0} y={0} width={400} height={240} fill="#f8fafc" />
        <Txt x={30} y={24} size={9} weight={700} fill={C.slate}>
          MISSION OXYGEN BUDGET (minutes)
        </Txt>
        <rect x={30} y={34} width={340} height={30} rx={6} fill="#e2e8f0" />
        <rect x={30} y={34} width={tr} height={30} fill={C.tech} />
        <rect x={30 + tr} y={34} width={wk} height={30} fill={C.safe} />
        <rect x={30 + tr + wk} y={34} width={tr} height={30} fill={C.tech} opacity={0.7} />
        <rect x={370 - res} y={34} width={res} height={30} fill={C.crit} opacity={0.75} />
        <Txt x={34} y={53} size={8} fill="white" weight={800}>
          in
        </Txt>
        {wk > 30 && (
          <Txt x={34 + tr} y={53} size={8} fill="white" weight={800}>
            work
          </Txt>
        )}
        <Txt x={366} y={53} size={8} anchor="end" fill="white" weight={800}>
          reserve
        </Txt>
        <rect x={40} y={90} width={60} height={120} rx={28} fill={MAT.metalH} stroke={C.ink} strokeWidth={2} filter="url(#f-shadow)" />
        <rect x={62} y={80} width={16} height={12} rx={3} fill={MAT.steel} />
        <rect x={48} y={90 + 120 * (1 - clamp(o.turn / p.P, 0, 1))} width={44} height={120 * clamp(o.turn / p.P, 0, 1) - 6} rx={18} fill={C.hazard} opacity={0.8} />
        {[0, 1, 2].map((k) => {
          const ph = (t * 0.5 + k / 3) % 1;
          return <circle key={k} cx={70 + Math.sin(ph * 6 + k) * 5} cy={200 - ph * 100} r={2 + ph * 2} fill="white" opacity={0.6 * (1 - ph)} />;
        })}
        {(() => {
          // rescuer marker walking the mission timeline: in → work → out
          const cyc = (t * 0.08) % 1;
          const x = 30 + cyc * (2 * tr + wk);
          return (
            <g transform={`translate(${x.toFixed(1)} 30)`}>
              <circle cx={0} cy={-6} r={3} fill={C.ink} />
              <path d="M0 -3 L0 3 M-3 0 L3 0 M0 3 L-2.5 7 M0 3 L2.5 7" stroke={C.ink} strokeWidth={1.4} />
            </g>
          );
        })()}
        <Txt x={70} y={226} size={8} anchor="middle" weight={700}>
          O₂ cylinder
        </Txt>
        <Txt x={120} y={110} size={10} weight={800}>
          {`${o.o2.toFixed(0)} L O₂ ÷ ${o.q.toFixed(1)} L/min = ${o.dur.toFixed(0)} min`}
        </Txt>
        <Txt x={120} y={140} size={14} weight={900} mono fill={o.workTime >= 20 ? C.safe : C.crit}>
          {`work time ${Math.max(0, o.workTime).toFixed(0)} min`}
        </Txt>
        <Txt x={120} y={170} size={11} weight={800} mono fill={C.hazard}>
          {`turn back at ${o.turn.toFixed(0)} bar`}
        </Txt>
        <Txt x={120} y={195} size={8} fill={C.slate}>
          CO₂ absorbed by alkali (e.g. LiOH/soda lime); O₂ re-supplied.
        </Txt>
      </g>
    );
  },
};

export const U10_SIMS = [rolesSim, gassySim, riskSim, ftaSim, scbaSim];
