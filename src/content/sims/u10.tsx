import type { SimDef } from "@/lib/types";
import { C, Txt, clamp, SANS, Stream } from "@/components/sim/svg";
import { MAT } from "@/components/sim/defs";
import { T, INK, INK2, INK3, ON_LIGHT, ON_DEEP, GREYS, U, textW, OK, BAD, OK_LIGHT, BAD_LIGHT } from "@/components/sim/v3";
import { SvgTex } from "@/components/sim/Tex";

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
  primary: ["tier", "role"],
  v3: { viewH: 410 },
  render: (p) => {
    const r = ROLES[p.role];
    const H = 410;
    const lines = wrapDuty(r.duty);
    const cy = 152;
    return (
      <g>
        <clipPath id="u10roles-clip">
          <rect x={12} y={12} width={376} height={H - 24} rx={12} />
        </clipPath>
        <g clipPath="url(#u10roles-clip)">
          <rect x={0} y={0} width={400} height={cy - 8} fill={GREYS.light} />
        </g>
        {ROLE_LAWS.map((l, i) => {
          const y = 34 + i * 22;
          return (
            <g key={l}>
              <T x={28} y={y + 6} fill={ON_LIGHT}>
                {l}
              </T>
              <rect x={200} y={y - 8} width={100 + i * 15} height={16} rx={4} fill={[U.deep, U.deep, U.mid, U.mid, GREYS.mid][i]} />
            </g>
          );
        })}
        <rect x={26} y={cy} width={348} height={H - 26 - cy} rx={12} fill="var(--surface)" stroke={INK3} strokeWidth={1.5} />
        <rect x={26} y={cy} width={6} height={H - 26 - cy} rx={3} fill={U.deep} />
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
          <T x={b.d === 1 ? gxe(b.b) - 10 : (gxe(b.a) + gxe(b.b)) / 2} y={54} anchor={b.d === 1 ? "end" : "middle"} fill={b.ink} weight={800}>
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
      <line x1={gxe(p.em)} x2={gxe(p.em)} y1={28} y2={68} style={{ stroke: INK }} strokeWidth={2} strokeLinecap="round" />
      <rect x={30} y={110} width={340} height={16} rx={8} fill={GREYS.light} />
      <rect x={30} y={110} width={Math.max(clamp(p.gb, 0, 1) * 340, 0)} height={16} rx={8} fill={over ? U.deep : U.mid} />
      <line x1={64} x2={64} y1={104} y2={132} style={{ stroke: INK }} strokeWidth={2} strokeLinecap="round" />
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
  primary: ["deg", "deg"],
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
const RM = { x0: 76, y0: 24, s: 27 };

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
  // §5.6d redraw: matrix 70..210 × 24..164 (cell 28); pins (210,37) and (74,190) keep their features, the controls ladder pin (388,143) is outside the 24-unit inset.
  v3: { viewH: 270 },
  handles: [
    { key: "C", axis: "x", at: (p) => [RM.x0 + (p.C - 1) * RM.s + RM.s / 2, 170], toValue: (x) => (x - RM.x0 - RM.s / 2) / RM.s + 1 },
    { key: "L", axis: "y", at: (p) => [66, RM.y0 + (5 - p.L) * RM.s + RM.s / 2], toValue: (y) => 5 - (y - RM.y0 - RM.s / 2) / RM.s },
  ],
  render: (p, o) => {
    const { s, x0, y0 } = RM;
    const fillOf = (r: number) => (r <= 4 ? GREYS.light : r <= 9 ? U.light : r <= 16 ? U.mid : U.deep);
    const cx = (Cc: number) => x0 + (Cc - 1) * s + s / 2;
    const cy = (L: number) => y0 + (5 - L) * s + s / 2;
    const moved = p.C !== o.C2 || p.L !== o.L2;
    const sel = CONTROLS.length - 1 - p.ctrl; // ladder row index, top = Elimination
    const cells = [];
    for (let L = 1; L <= 5; L++)
      for (let Cc = 1; Cc <= 5; Cc++)
        cells.push(
          <g key={`${L}${Cc}`}>
            <rect x={x0 + (Cc - 1) * s} y={y0 + (5 - L) * s} width={s - 2} height={s - 2} rx={4} fill={fillOf(L * Cc)} />
          </g>,
        );
    return (
      <g>
        {cells}
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <T x={cx(v) - 1} y={208} anchor="middle">
              {String(v)}
            </T>
            <T x={36} y={cy(v) + 5} anchor="middle">
              {String(v)}
            </T>
          </g>
        ))}
        <T x={24} y={241}>
          Likelihood ↑ · Consequence →
        </T>
        {moved && <Stream d={`M${cx(p.C)} ${cy(p.L)} Q ${(cx(p.C) + cx(o.C2)) / 2 + 14} ${(cy(p.L) + cy(o.L2)) / 2 - 14} ${cx(o.C2)} ${cy(o.L2)}`} color="var(--u-ink)" width={2} speed={0.5} />}
        <circle cx={cx(p.C)} cy={cy(p.L)} r={11} fill="none" style={{ stroke: INK }} strokeWidth={2.5} />
        <g data-state={o.br >= 2 ? "unsafe" : "safe"}>
          <circle cx={cx(o.C2)} cy={cy(o.L2)} r={7} fill={o.br >= 2 ? BAD : OK} style={{ stroke: "#FFFFFF" }} strokeWidth={1.5} />
        </g>
        {[...CONTROLS.slice(1)].reverse().map((c, i) => {
          const y = y0 + i * RM.s;
          return (
            <g key={c.name}>
              <rect x={216} y={y + 5} width={14} height={14} rx={3} fill={i === sel ? U.deep : "none"} style={{ stroke: i === sel ? U.deep : INK3 }} strokeWidth={1.5} />
              <T x={234} y={y + 20} fill={i === sel ? INK : INK2} weight={i === sel ? 800 : 600}>
                {c.name.split(" (")[0]}
              </T>
            </g>
          );
        })}
        <circle cx={225} cy={190} r={9} fill="none" style={{ stroke: INK }} strokeWidth={2.5} />
        <T x={240} y={196}>
          Inherent
        </T>
        <circle cx={225} cy={213} r={7} style={{ fill: INK2 }} />
        <T x={240} y={219}>
          Residual
        </T>
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
  // §5.6 redraw (v3e): tree drawn top-down; gates sit under the lesson pins (AND ~200,62; OR ~105,122; basic events ~252,158).
  v3: { viewH: 290 },
  render: (p, o) => {
    const box = (cx: number, y: number, w: number, label: string, main = false) => (
      <g>
        <rect x={cx - w / 2} y={y} width={w} height={28} rx={6} fill={U.light} style={{ stroke: main ? INK : INK3 }} strokeWidth={main ? 2.5 : 1.5} />
        <T x={cx} y={y + 20} anchor="middle" fill={ON_LIGHT} weight={700}>
          {label}
        </T>
      </g>
    );
    const gate = (x: number, y: number, kind: "AND" | "OR") => (
      <g>
        {kind === "AND" ? (
          <path d={`M ${x - 16} ${y + 24} L ${x - 16} ${y + 12} A 16 12 0 0 1 ${x + 16} ${y + 12} L ${x + 16} ${y + 24} Z`} fill={GREYS.light} style={{ stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
        ) : (
          <path d={`M ${x - 16} ${y + 24} Q ${x} ${y + 16} ${x + 16} ${y + 24} Q ${x + 14} ${y + 8} ${x} ${y} Q ${x - 14} ${y + 8} ${x - 16} ${y + 24} Z`} fill={GREYS.light} style={{ stroke: INK }} strokeWidth={2.5} strokeLinejoin="round" />
        )}
        <T x={x + 24} y={y + 20}>
          {kind}
        </T>
      </g>
    );
    const ln = (x1: number, y1: number, x2: number, y2: number) => <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: INK3 }} strokeWidth={1.5} strokeLinecap="round" />;
    const leaves = [
      { x: 50, l: "Vent", v: p.p1 },
      { x: 110, l: "Burst", v: p.p2 },
      { x: 170, l: "Layer", v: p.p3 },
      { x: 230, l: "Spark", v: p.p4 },
      { x: 290, l: "Frict.", v: p.p5 },
      { x: 350, l: "Shot", v: p.p6 },
    ];
    const safe = o.top <= 0.001;
    return (
      <g>
        <rect x={100} y={24} width={200} height={28} rx={6} data-state={safe ? "safe" : "unsafe"} fill={safe ? OK_LIGHT : BAD_LIGHT} style={{ stroke: INK }} strokeWidth={2.5} />
        <T x={200} y={44} anchor="middle" fill={ON_LIGHT} weight={700}>
          Firedamp explosion
        </T>
        {ln(200, 52, 200, 56)}
        {gate(200, 56, "AND")}
        {ln(200, 80, 200, 86)}
        {ln(105, 86, 295, 86)}
        {ln(105, 86, 105, 92)}
        {ln(295, 86, 295, 92)}
        {box(105, 92, 150, "Flammable gas")}
        {box(295, 92, 110, "Ignition")}
        {ln(105, 120, 105, 122)}
        {ln(295, 120, 295, 122)}
        {gate(105, 122, "OR")}
        {gate(295, 122, "OR")}
        {ln(105, 146, 105, 156)}
        {ln(295, 146, 295, 156)}
        {ln(50, 156, 170, 156)}
        {ln(230, 156, 350, 156)}
        {leaves.map((lf) => (
          <g key={lf.l}>
            {ln(lf.x, 156, lf.x, 168)}
            <circle cx={lf.x} cy={190} r={22} fill={lf.v > 0.1 ? U.mid : U.light} style={{ stroke: INK3 }} strokeWidth={1.5} />
            <T x={lf.x} y={196} anchor="middle" fill={ON_LIGHT} weight={700}>
              {lf.v.toFixed(2)}
            </T>
            <T x={lf.x} y={228} anchor="middle">
              {lf.l}
            </T>
          </g>
        ))}
        <T x={200} y={256} anchor="middle">
          AND: both needed · OR: any one
        </T>
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
  v3: { viewH: 250 },
  handles: [{ key: "travel", axis: "x", at: (p, o) => [30 + p.travel * (340 / Math.max(o.dur, 1)), 59], toValue: (x, p) => (x - 30) / (340 / Math.max(scbaSim.compute(p).dur, 1)), color: "#3B82F6" }],
  render: (p, o, t) => {
    const total = Math.max(o.dur, 1);
    const k = 340 / total;
    const tr = p.travel * k;
    const res = o.dur * (p.res / 100) * k;
    const wk = Math.max(0, o.workTime) * k;
    const okWork = o.workTime >= 20;
    const frac = clamp(o.turn / p.P, 0, 1);
    const ang = Math.PI * (1 - frac); // gauge needle: 0 bar at left, charged pressure at right
    const gx = 340, gy = 186, gr = 28;
    const cyc = (t * 0.08) % 1;
    const wx = 30 + cyc * (2 * tr + wk);
    return (
      <g>
        {/* mission timeline: in, work, out, reserve */}
        <rect x={30} y={40} width={340} height={38} rx={6} fill={GREYS.light} />
        <rect x={30} y={40} width={tr} height={38} fill={U.mid} />
        <rect x={30 + tr} y={40} width={wk} height={38} data-state={okWork ? "met" : "unmet"} fill={okWork ? OK_LIGHT : BAD_LIGHT} />
        <rect x={30 + tr + wk} y={40} width={tr} height={38} fill={U.mid} />
        <rect x={370 - res} y={40} width={res} height={38} fill={GREYS.deep} />
        <rect x={30} y={40} width={340} height={38} rx={6} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} />
        <g transform={`translate(${wx.toFixed(1)} 40)`}>
          <circle cx={0} cy={-9} r={3.5} style={{ fill: INK }} />
          <path d="M0 -5 L0 3 M-4 -1 L4 -1 M0 3 L-3 9 M0 3 L3 9" style={{ stroke: INK }} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </g>
        {/* legend */}
        <rect x={30} y={92} width={14} height={14} rx={3} fill={U.mid} />
        <T x={50} y={106}>Travel</T>
        <rect x={128} y={92} width={14} height={14} rx={3} data-state={okWork ? "met" : "unmet"} fill={okWork ? OK_LIGHT : BAD_LIGHT} />
        <T x={148} y={106}>Work</T>
        <rect x={218} y={92} width={14} height={14} rx={3} fill={GREYS.deep} />
        <T x={238} y={106}>Reserve</T>
        {/* cylinder, filled to the turn-around pressure */}
        <rect x={62} y={122} width={16} height={10} rx={3} fill={GREYS.mid} />
        <rect x={44} y={130} width={52} height={70} rx={20} fill={GREYS.light} style={{ stroke: INK }} strokeWidth={2.5} />
        <clipPath id="u10scba-cyl">
          <rect x={45} y={131} width={50} height={68} rx={19} />
        </clipPath>
        <g clipPath="url(#u10scba-cyl)">
          <rect x={44} y={130 + 70 * (1 - frac)} width={52} height={70 * frac} fill={U.mid} />
        </g>
        <T x={70} y={220} anchor="middle">Cylinder</T>
        {/* working formula and loop note */}
        <SvgTex x={116} y={158} tex="t=V\,P/q" size={20} color="var(--text)" />
        <T x={116} y={192} size={18}>Alkali absorbs CO₂</T>
        <T x={116} y={216} size={18}>Cylinder adds O₂</T>
        {/* turn-around gauge */}
        <path d={`M ${gx - gr} ${gy} A ${gr} ${gr} 0 0 1 ${gx + gr} ${gy}`} fill="none" style={{ stroke: INK3 }} strokeWidth={1.5} />
        <line x1={gx - gr} y1={gy} x2={gx + gr} y2={gy} style={{ stroke: INK3 }} strokeWidth={1.5} />
        <line x1={gx} y1={gy} x2={gx + Math.cos(ang) * (gr - 4)} y2={gy - Math.sin(ang) * (gr - 4)} style={{ stroke: INK }} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={gx} cy={gy} r={3.5} style={{ fill: INK }} />
        <T x={gx + gr} y={220} anchor="end">Turn gauge</T>
      </g>
    );
  },
};

export const U10_SIMS = [rolesSim, gassySim, riskSim, ftaSim, scbaSim];
