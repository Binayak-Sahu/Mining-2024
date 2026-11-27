"use client";

import { useMemo, useState } from "react";
import { Calculator, Wind, Columns3, Bomb, Activity, Mountain, Compass, Droplets, RotateCcw, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { stageSlide, fadeQuick } from "@/lib/motion";
import { toneText } from "@/components/ui/tone";

/** Picker icon and one-line blurb per calculator. Tiles are neutral (§1.4: colour is for meaning only). */
const TOOL_STYLE: Record<string, { Icon: LucideIcon; blurb: string }> = {
  atkinson: { Icon: Wind, blurb: "Airway pressure & power" },
  pillar: { Icon: Columns3, blurb: "Pillar FoS + Reg. 111" },
  kuzram: { Icon: Bomb, blurb: "Blast fragmentation" },
  ppv: { Icon: Activity, blurb: "Ground vibration limit" },
  besr: { Icon: Mountain, blurb: "Break-even strip ratio" },
  dipstrike: { Icon: Compass, blurb: "Three-point problem" },
  pump: { Icon: Droplets, blurb: "Head, power & NPSH" },
};
import { fmt } from "@/lib/calc";
import { kuzRam } from "@/content/sims/u4";
import { pump } from "@/content/sims/u7";
import { threePoint } from "@/content/sims/phase6";
import { minPillarCentres } from "@/content/statutes";

type Inputs = Record<string, number>;

interface Field {
  key: string;
  label: string;
  unit?: string;
  default: number;
  options?: { value: number; label: string }[];
}

interface Out {
  label: string;
  value: number | string;
  unit?: string;
  digits?: number;
  tone?: "ok" | "warn" | "crit";
}

interface Tool {
  id: string;
  name: string;
  formula: string;
  fields: Field[];
  run: (v: Inputs) => Out[];
}

const PPV_LIMITS = [
  [5, 10, 15],
  [10, 20, 25],
  [2, 5, 10],
];

export const TOOLS: Tool[] = [
  {
    id: "atkinson",
    name: "Atkinson ventilation (P = RQ²)",
    formula: "R = K·C·L / A³ · P = R·Q² · air power = P·Q · A_eq = 1.19·Q/√P",
    fields: [
      { key: "K", label: "Friction factor K", unit: "Ns²/m⁴", default: 0.012 },
      { key: "C", label: "Perimeter C", unit: "m", default: 14 },
      { key: "L", label: "Length L", unit: "m", default: 1000 },
      { key: "A", label: "Area A", unit: "m²", default: 12 },
      { key: "Q", label: "Airflow Q", unit: "m³/s", default: 40 },
      { key: "eta", label: "Fan efficiency", default: 0.75 },
    ],
    run: (v) => {
      const R = (v.K * v.C * v.L) / Math.pow(v.A, 3);
      const P = R * v.Q * v.Q;
      return [
        { label: "Resistance R", value: R, unit: "Ns²/m⁸", digits: 4 },
        { label: "Pressure drop P", value: P, unit: "Pa", digits: 1 },
        { label: "Velocity", value: v.Q / v.A, unit: "m/s", digits: 2 },
        { label: "Air power", value: (P * v.Q) / 1000, unit: "kW", digits: 2 },
        { label: "Fan shaft power", value: (P * v.Q) / 1000 / v.eta, unit: "kW", digits: 2 },
        { label: "Equivalent orifice", value: P > 0 ? (1.19 * v.Q) / Math.sqrt(P) : 0, unit: "m²", digits: 2 },
      ];
    },
  },
  {
    id: "pillar",
    name: "Pillar FoS (tributary area)",
    formula: "σp = 0.025·H·(w+B)²/w² · Salamon–Munro S = 7.176 h^−0.66 w^0.46 · CMRI S = 0.27σc h^−0.36 + (H/250+1)(w/h−1)",
    fields: [
      { key: "H", label: "Depth H", unit: "m", default: 300 },
      { key: "w", label: "Pillar width w (solid)", unit: "m", default: 22 },
      { key: "B", label: "Gallery width B", unit: "m", default: 4.8 },
      { key: "h", label: "Working height h", unit: "m", default: 3 },
      { key: "sc", label: "Coal cube strength σc", unit: "MPa", default: 30 },
    ],
    run: (v) => {
      const sp = (0.025 * v.H * (v.w + v.B) ** 2) / (v.w * v.w);
      const sm = 7.176 * Math.pow(v.h, -0.66) * Math.pow(v.w, 0.46);
      const cm = 0.27 * v.sc * Math.pow(v.h, -0.36) + (v.H / 250 + 1) * (v.w / v.h - 1);
      const tone = (f: number) => (f >= 1.5 ? "ok" : f >= 1.2 ? "warn" : "crit") as Out["tone"];
      return [
        { label: "Pillar stress σp", value: sp, unit: "MPa", digits: 2 },
        { label: "FoS — Salamon–Munro", value: sm / sp, digits: 2, tone: tone(sm / sp) },
        { label: "FoS — CMRI (Sheorey)", value: cm / sp, digits: 2, tone: tone(cm / sp) },
        { label: "Development extraction", value: 100 * (1 - (v.w * v.w) / (v.w + v.B) ** 2), unit: "%", digits: 1 },
        { label: "Gallery vs CMR 2017 Reg. 111", value: v.B <= 4.8 && v.h <= 3 ? "Within 4.8 m × 3 m" : "Exceeds — needs written permission", tone: v.B <= 4.8 && v.h <= 3 ? "ok" : "crit" },
        ...((): Out[] => {
          const min = minPillarCentres(v.H, v.B);
          const c = v.w + v.B;
          return min === null
            ? [{ label: "Min. centres (Reg. 111(4))", value: "Gallery > 4.8 m — outside table", tone: "crit" }]
            : [
                { label: "Pillar centres provided", value: c, unit: "m", digits: 1 },
                { label: "Min. centres (CMR 2017 Reg. 111(4))", value: min, unit: "m", digits: 1, tone: c >= min ? "ok" : "crit" },
              ];
        })(),
      ];
    },
  },
  {
    id: "kuzram",
    name: "Kuz-Ram fragmentation",
    formula: "X50 = A·K^−0.8·Q^(1/6)·(115/RWS)^(19/20) · stemming 0.8B, sub-drill 0.3B",
    fields: [
      { key: "B", label: "Burden", unit: "m", default: 4.5 },
      { key: "S", label: "Spacing", unit: "m", default: 5.5 },
      { key: "d", label: "Hole diameter", unit: "mm", default: 150 },
      { key: "Hb", label: "Bench height", unit: "m", default: 10 },
      { key: "A", label: "Rock factor A", default: 8 },
      { key: "ex", label: "Explosive", default: 0, options: [{ value: 0, label: "ANFO" }, { value: 1, label: "Heavy ANFO" }, { value: 2, label: "Emulsion" }] },
    ],
    run: (v) => {
      const k = kuzRam(v);
      return [
        { label: "Charge per hole", value: k.Q, unit: "kg", digits: 1 },
        { label: "Powder factor", value: k.K, unit: "kg/m³", digits: 3 },
        { label: "Mean size X50", value: k.x50, unit: "cm", digits: 1 },
        { label: "Uniformity n", value: k.n, digits: 2 },
        { label: "Oversize > 1 m", value: k.over, unit: "%", digits: 1, tone: k.over <= 3 ? "ok" : k.over <= 8 ? "warn" : "crit" },
      ];
    },
  },
  {
    id: "ppv",
    name: "PPV scaled distance & DGMS limit",
    formula: "V = K·(D/√Q)^−b · Q_max = [D/(K/V_lim)^(1/b)]² · limits DGMS TC 7/1997",
    fields: [
      { key: "D", label: "Distance", unit: "m", default: 300 },
      { key: "Q", label: "Max charge per delay", unit: "kg", default: 200 },
      { key: "K", label: "Site constant K", default: 1140 },
      { key: "b", label: "Site exponent b", default: 1.6 },
      { key: "st", label: "Structure", default: 0, options: [{ value: 0, label: "Domestic/kuccha" }, { value: 1, label: "Industrial" }, { value: 2, label: "Historical/sensitive" }] },
      { key: "f", label: "Dominant frequency", default: 0, options: [{ value: 0, label: "< 8 Hz" }, { value: 1, label: "8–25 Hz" }, { value: 2, label: "> 25 Hz" }] },
    ],
    run: (v) => {
      const ppv = v.K * Math.pow(v.D / Math.sqrt(v.Q), -v.b);
      const lim = PPV_LIMITS[v.st][v.f];
      return [
        { label: "Scaled distance", value: v.D / Math.sqrt(v.Q), unit: "m/√kg", digits: 2 },
        { label: "Predicted PPV", value: ppv, unit: "mm/s", digits: 2, tone: ppv <= lim ? "ok" : "crit" },
        { label: "Permissible PPV", value: lim, unit: "mm/s", digits: 0 },
        { label: "Max charge per delay", value: Math.pow(v.D / Math.pow(v.K / lim, 1 / v.b), 2), unit: "kg", digits: 0 },
      ];
    },
  },
  {
    id: "besr",
    name: "Break-even stripping ratio",
    formula: "BESR = (V − C)/S · profit/t = (V − C) − SR·S",
    fields: [
      { key: "V", label: "Coal value", unit: "₹/t", default: 3500 },
      { key: "C", label: "Cost excl. stripping", unit: "₹/t", default: 2300 },
      { key: "S", label: "Stripping cost", unit: "₹/m³", default: 160 },
      { key: "SR", label: "Planned stripping ratio", unit: "m³/t", default: 6.2 },
    ],
    run: (v) => {
      const besr = (v.V - v.C) / v.S;
      const profit = v.V - v.C - v.SR * v.S;
      return [
        { label: "BESR", value: besr, unit: "m³/t", digits: 2 },
        { label: "Profit after stripping", value: profit, unit: "₹/t", digits: 0, tone: profit >= 0 ? "ok" : "crit" },
        { label: "Verdict", value: v.SR <= besr ? "Economic (SR ≤ BESR)" : "Uneconomic (SR > BESR)", tone: v.SR <= besr ? "ok" : "crit" },
      ];
    },
  },
  {
    id: "dipstrike",
    name: "Three-point dip & strike",
    formula: "Boreholes A(0,0), B(400 E, 0), C(150 E, 350 N) m · seam RL = collar − depth · tan θ = |∇z|",
    fields: [
      { key: "zA", label: "A collar RL", unit: "m", default: 200 },
      { key: "dA", label: "A depth to seam", unit: "m", default: 100 },
      { key: "zB", label: "B collar RL", unit: "m", default: 210 },
      { key: "dB", label: "B depth to seam", unit: "m", default: 130 },
      { key: "zC", label: "C collar RL", unit: "m", default: 190 },
      { key: "dC", label: "C depth to seam", unit: "m", default: 160 },
      { key: "sec", label: "Section azimuth", unit: "°", default: 90 },
    ],
    run: (v) => {
      const r = threePoint(v);
      return [
        { label: "True dip", value: r.dip, unit: "°", digits: 2 },
        { label: "Dip direction", value: r.dipAz, unit: "° (azimuth)", digits: 1 },
        { label: "Strike", value: `${r.strike.toFixed(0)}° / ${((r.strike + 180) % 360).toFixed(0)}°` },
        { label: "Gradient", value: Math.tan((r.dip * Math.PI) / 180) > 0 ? `1 in ${(1 / Math.tan((r.dip * Math.PI) / 180)).toFixed(2)}` : "level" },
        { label: "Apparent dip on section", value: r.app, unit: "°", digits: 2 },
      ];
    },
  },
  {
    id: "pump",
    name: "Pump head, power & NPSH",
    formula: "H = H_static + h_f (Darcy, f = 0.02, L = H + 200 m) · P = ρgQH/η (η 0.75) · NPSHa = (101.3 − Pv)/ρg − lift − 0.5",
    fields: [
      { key: "Q", label: "Flow", unit: "m³/h", default: 200 },
      { key: "H", label: "Static head", unit: "m", default: 300 },
      { key: "d", label: "Rising main Ø", unit: "mm", default: 200 },
      { key: "hs1", label: "Head per stage", unit: "m", default: 60 },
      { key: "lift", label: "Suction lift", unit: "m", default: 4 },
      { key: "T", label: "Water temperature", unit: "°C", default: 30 },
      { key: "npshr", label: "NPSH required", unit: "m", default: 4 },
    ],
    run: (v) => {
      const r = pump(v);
      return [
        { label: "Velocity in main", value: r.v, unit: "m/s", digits: 2 },
        { label: "Friction head", value: r.hf, unit: "m", digits: 2 },
        { label: "Total head", value: r.Ht, unit: "m", digits: 1 },
        { label: "Stages", value: r.stages, digits: 0 },
        { label: "Motor power", value: r.power, unit: "kW", digits: 0 },
        { label: "NPSH available", value: r.npsha, unit: "m", digits: 2 },
        { label: "NPSH margin", value: r.margin, unit: "m", digits: 2, tone: r.margin < 0 ? "crit" : r.margin < 0.5 ? "warn" : "ok" },
      ];
    },
  },
];

function defaultsOf(t: Tool): Inputs {
  return Object.fromEntries(t.fields.map((f) => [f.key, f.default]));
}

export function Tools() {
  const [id, setId] = useState(TOOLS[0].id);
  const tool = TOOLS.find((t) => t.id === id)!;
  const [vals, setVals] = useState<Record<string, Inputs>>(() => Object.fromEntries(TOOLS.map((t) => [t.id, defaultsOf(t)])));
  const [raw, setRaw] = useState<Record<string, string>>({});
  const v = vals[id];
  const outs = useMemo(() => {
    try {
      return tool.run(v);
    } catch {
      return [];
    }
  }, [tool, v]);

  const setField = (key: string, text: string) => {
    setRaw((r) => ({ ...r, [`${id}.${key}`]: text }));
    const n = Number(text);
    if (text.trim() !== "" && Number.isFinite(n)) setVals((all) => ({ ...all, [id]: { ...all[id], [key]: n } }));
  };

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 space-y-8">
      <div className="flex items-start gap-4">
        <span className="unit-tile w-14 h-14 shrink-0 mt-1" aria-hidden>
          <Calculator size={26} />
        </span>
        <div className="min-w-0">
          <h1 className="t-display text-fg">Field calculators</h1>
          <p className="t-secondary mt-1">The same engineering models as the lessons. Plug in your own mine&apos;s numbers.</p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1.5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-7" aria-label="Calculators" role="group">
        {TOOLS.map((t) => {
          const st = TOOL_STYLE[t.id] ?? { Icon: Calculator, blurb: "" };
          const on = t.id === id;
          return (
            <button key={t.id} type="button" aria-pressed={on} onClick={() => setId(t.id)} data-on={on} className="tile-3d shrink-0 w-[156px] sm:w-auto text-left p-3 flex flex-col gap-2 min-h-[112px]">
              <span className="w-10 h-10 rounded-[12px] bg-surface-2 text-fg flex items-center justify-center" aria-hidden>
                <st.Icon size={20} />
              </span>
              <span className="t-label text-fg" style={{ fontWeight: 700 }}>{t.name}</span>
              <span className="t-label text-fg-2 -mt-1" style={{ fontWeight: 400 }}>{st.blurb}</span>
            </button>
          );
        })}
      </div>
      <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={stageSlide} className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 md:gap-6">
        <div className="card p-5 sm:p-6 space-y-4">
          <h2 className="t-heading text-fg">{tool.name}</h2>
          {tool.fields.map((f) => (
            <label key={f.key} className="block">
              <span className="t-label text-fg-2">
                {f.label}
                {f.unit && <span className="text-fg-3"> ({f.unit})</span>}
              </span>
              {f.options ? (
                <select value={v[f.key]} onChange={(e) => setVals((all) => ({ ...all, [id]: { ...all[id], [f.key]: Number(e.target.value) } }))} className="field-input mt-2 w-full">
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input inputMode="decimal" aria-label={f.label} value={raw[`${id}.${f.key}`] ?? String(v[f.key])} onChange={(e) => setField(f.key, e.target.value)} className="field-input readout mt-2 w-full" />
              )}
            </label>
          ))}
          <button
            type="button"
            onClick={() => {
              setVals((all) => ({ ...all, [id]: defaultsOf(tool) }));
              setRaw((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith(`${id}.`))));
            }}
            className="btn-3d btn-sm tone-ghost"
          >
            <RotateCcw size={16} aria-hidden /> Reset to example values
          </button>
        </div>
        <div className="card p-5 sm:p-6 self-start">
          <div className="t-eyebrow">Live output</div>
          <p className="readout t-label text-fg-2 mt-3" style={{ fontWeight: 400 }}>{tool.formula}</p>
          <div className="mt-2">
            {outs.map((o) => (
              <div key={o.label} className="ds-readout-row last:border-b-0">
                <span className="t-label text-fg-2 min-w-0">{o.label}</span>
                <motion.span key={String(o.value)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={fadeQuick} className={`t-readout text-right shrink-0 max-w-[60%] ${toneText(o.tone)}`}>
                  {typeof o.value === "number" ? fmt(o.value, o.digits ?? 2) : o.value}
                  {typeof o.value === "number" && o.unit ? <span className="text-fg-2" style={{ fontWeight: 400 }}> {o.unit}</span> : null}
                </motion.span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
