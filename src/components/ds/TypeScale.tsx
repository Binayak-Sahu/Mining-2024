const STYLES: [string, string, string][] = [
  ["t-display", "display · 32/38 · 800", "Finding half"],
  ["t-title", "title · 26/32 · 700", "Complete the sentence."],
  ["t-heading", "heading · 21/28 · 700", "Methane and its limits"],
  ["t-body", "body · 18/29 · 400", "An explosion needs enough methane and enough oxygen at the same time."],
  ["t-body-lg", "body-lg · 20/32 · 500", "The lower explosive limit is the leanest mix that burns."],
  ["t-secondary", "secondary · 16/24 · 400", "A short description under a title."],
  ["t-eyebrow", "eyebrow · 13/16 · 700 · caps", "Unit 7 · Ventilation"],
  ["t-label", "label · 14/20 · 600", "Chips, pills, readout labels"],
  ["t-tab", "tab · 12/16 · 600", "Warmup"],
  ["t-readout", "readout · 17/24 · 600 mono", "Q = 42.5 m³/s"],
];

/** §3 type scale, one sample per style. */
export function TypeScale() {
  return (
    <ul className="space-y-6">
      {STYLES.map(([cls, spec, sample]) => (
        <li key={cls} className="pb-6" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="t-label" style={{ color: "var(--text-2)" }}>
            .{cls} · {spec}
          </div>
          <div className={`${cls} mt-2`}>{sample}</div>
        </li>
      ))}
    </ul>
  );
}
