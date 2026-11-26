"use client";

import { useState } from "react";

const TONES: [string, string, string][] = [
  ["tone-tech", "action", "Check"],
  ["tone-safe", "success", "Continue"],
  ["tone-crit", "danger", "Delete"],
  ["tone-hazard", "energy", "Fight boss"],
  ["tone-ink", "ink", "Continue"],
  ["tone-ghost", "ghost", "Review"],
  ["tone-violet", "violet → action", "Forge"],
];

/** §5.1 buttons: every tone, disabled, and a press demo (face sinks 4 px into its ledge). */
export function Buttons() {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="space-y-6">
      <ul className="space-y-6">
        {TONES.map(([cls, name, text]) => (
          <li key={cls}>
            <div className="t-label mb-2" style={{ color: "var(--text-2)" }}>
              .{cls} → {name}
            </div>
            <button type="button" className={`btn-3d ${cls} w-full`}>
              {text}
            </button>
          </li>
        ))}
        <li>
          <div className="t-label mb-2" style={{ color: "var(--text-2)" }}>
            disabled (answer pending)
          </div>
          <button type="button" className="btn-3d tone-tech w-full" disabled>
            Check
          </button>
        </li>
        <li>
          <div className="t-label mb-2" style={{ color: "var(--text-2)" }}>
            secondary ghost pills
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-3d btn-sm tone-ghost">
              Why?
            </button>
            <button type="button" className="btn-3d btn-sm tone-ghost">
              Hint
            </button>
          </div>
        </li>
      </ul>
      <div>
        <div className="t-label mb-2" style={{ color: "var(--text-2)" }}>
          Press demo: tap to hold the pressed state
        </div>
        <button type="button" data-pressed={pressed} aria-pressed={pressed} onClick={() => setPressed((p) => !p)} className="btn-3d tone-tech w-full">
          {pressed ? "Pressed (tap to release)" : "Tap to press"}
        </button>
      </div>
    </div>
  );
}
