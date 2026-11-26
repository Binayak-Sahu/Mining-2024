"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ROWS: { label: string; value: string; dot?: string }[] = [
  { label: "Airflow Q", value: "42.5 m³/s", dot: "var(--action)" },
  { label: "Methane at face", value: "0.8 %", dot: "var(--danger)" },
  { label: "Air velocity", value: "2.1 m/s" },
  { label: "Pressure drop", value: "318 Pa" },
  { label: "Fan power", value: "13.5 kW" },
];

function Row({ label, value, dot }: (typeof ROWS)[number]) {
  return (
    <li className="ds-readout-row">
      <span className="t-label flex items-center gap-2" style={{ color: "var(--text-2)" }}>
        {dot && <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />}
        {label}
      </span>
      <span className="t-readout">{value}</span>
    </li>
  );
}

/** §5.9 sim readouts: plain rows, first 2 shown, the rest behind an "All readouts (n)" disclosure. */
export function Readouts() {
  const [all, setAll] = useState(false);
  const rest = ROWS.slice(2);
  return (
    <div>
      <ul style={{ borderTop: "1px solid var(--line)" }}>
        {ROWS.slice(0, 2).map((r) => (
          <Row key={r.label} {...r} />
        ))}
        {all && rest.map((r) => <Row key={r.label} {...r} />)}
      </ul>
      <button type="button" onClick={() => setAll((a) => !a)} aria-expanded={all} className="btn-3d btn-sm tone-ghost mt-4">
        {all ? "Fewer readouts" : `All readouts (${ROWS.length})`}
        <ChevronDown size={18} aria-hidden style={{ transform: all ? "rotate(180deg)" : undefined }} />
      </button>
    </div>
  );
}
