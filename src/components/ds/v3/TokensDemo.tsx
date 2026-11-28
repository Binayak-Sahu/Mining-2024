"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";
import { FAMILIES, NEUTRALS, STATE, UNIT_FAMILY, contrast, familyVars, type Family, type Theme } from "./tokens";
import { StatBar, UnitArt } from "./Mocks";

const THEMES: Theme[] = ["light", "dark"];
const FAMS = Object.keys(FAMILIES) as Family[];

/** Measured ratio with a pass/fail mark against a threshold (4.5 text, 3 graphics). */
function Ratio({ a, b, min, label }: { a: string; b: string; min: number; label: string }) {
  const r = contrast(a, b);
  const ok = r >= min;
  return (
    <span className="tnum" data-ratio={r.toFixed(2)} data-min={min} data-ok={ok} title={`${label}: ${a} on ${b}`}>
      {r.toFixed(2)}
      {ok ? "" : " ✗"}
    </span>
  );
}

function Panel({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <div data-theme={theme} className="rounded-[28px] p-4 min-w-0" style={{ border: "2px solid var(--edge)" }}>
      <div className="v3-eyebrow mb-3">{theme === "light" ? "Light" : "Dark"}</div>
      {children}
    </div>
  );
}

function Both({ children }: { children: (t: Theme) => ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{THEMES.map((t) => <Panel key={t} theme={t}>{children(t)}</Panel>)}</div>;
}

/** §2.1 neutrals with live text contrast on bg / surface-2. */
export function Neutrals() {
  return (
    <Both>
      {(t) => {
        const n = NEUTRALS[t];
        return (
          <div className="space-y-2">
            {Object.entries(n).map(([k, v]) => {
              const text = k.startsWith("text");
              return (
                <div key={k} className="flex items-center gap-3 v3-label">
                  <span className="shrink-0 rounded-[10px]" style={{ width: 36, height: 36, background: v, border: "2px solid var(--edge)" }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    --{k} <span className="tnum" style={{ color: "var(--text-2)", fontWeight: 400 }}>{v}</span>
                  </span>
                  {text && (
                    <span className="v3-label tnum" style={{ color: "var(--text-2)", fontWeight: 400 }}>
                      <Ratio a={v} b={n.bg} min={4.5} label={`--${k} on --bg`} /> · <Ratio a={v} b={n["surface-2"]} min={4.5} label={`--${k} on --surface-2`} />
                    </span>
                  )}
                </div>
              );
            })}
            <p className="v3-label" style={{ color: "var(--text-2)", fontWeight: 400 }}>Text rows: contrast on --bg · on --surface-2 (needs 4.5).</p>
          </div>
        );
      }}
    </Both>
  );
}

/** §2.2 the five families: tones, plus the contrast of every pair the rules care about. */
export function Families() {
  return (
    <div className="space-y-4">
      {FAMS.map((f) => {
        const t = FAMILIES[f];
        const units = Object.entries(UNIT_FAMILY).filter(([, v]) => v === f).map(([u]) => u.toUpperCase()).join(", ");
        return (
          <div key={f} className="grid gap-4 sm:grid-cols-2">
            {THEMES.map((th) => {
              const n = NEUTRALS[th];
              return (
                <div key={th} data-theme={th} className="rounded-[28px] p-4 min-w-0" style={{ ...familyVars(f, th), border: "2px solid var(--edge)" } as CSSProperties}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="v3-card-title capitalize">{f}</span>
                    <span className="v3-eyebrow" style={{ color: "var(--u-ink)" }}>{units}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {([["face", t.face], ["ledge", t.ledge], ["ink", t.ink[th]], ["tint", t.tint[th]], ["deep", t.deep], ["mid", t.mid], ["light", t.light], ["glow", t.glow]] as const).map(([k, c]) => (
                      <div key={k} className="min-w-0">
                        <span className="block rounded-[8px]" style={{ height: 32, background: c, border: "2px solid var(--edge)" }} aria-hidden />
                        <span className="block v3-label" style={{ color: "var(--text-3)" }}>{k}</span>
                      </div>
                    ))}
                  </div>
                  <div className="v3-label mt-3 tnum" style={{ color: "var(--text-2)", fontWeight: 400 }}>
                    Text on face <Ratio a={t.on} b={t.face} min={4.5} label="text on face" /> · ink on bg <Ratio a={t.ink[th]} b={n.bg} min={4.5} label="ink on bg" /> · ink on tab tint <Ratio a={t.ink[th]} b={t.tint[th]} min={4.5} label="ink on tint" /> · ring on surface <Ratio a={t.ink[th]} b={n.surface} min={3} label="ring on surface" />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button type="button" className="v3-btn">Start</button>
                    <span className="v3-eyebrow" style={{ color: "var(--u-ink)" }}>Level 1</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** §4 / §5.1 buttons with ledges: unit, success, ink, ghost, disabled, and a held-down state. */
export function ButtonsV3() {
  return (
    <Both>
      {(th) => (
        <div className="space-y-4" style={familyVars("blue", th) as CSSProperties}>
          <button type="button" className="v3-btn w-full">Start</button>
          <button type="button" className="v3-btn w-full" data-pressed="true">Pressed</button>
          <button type="button" className="v3-btn tone-success w-full">
            <Check size={20} strokeWidth={3} aria-hidden /> Continue
          </button>
          <button type="button" className="v3-btn tone-ink w-full">Try again</button>
          <button type="button" className="v3-btn tone-ghost w-full">Why?</button>
          <button type="button" className="v3-btn w-full" disabled>Check</button>
          <div className="v3-label tnum" style={{ color: "var(--text-2)", fontWeight: 400 }}>
            Success text <Ratio a={STATE.success.on} b={STATE.success.face} min={4.5} label="success" /> · danger text <Ratio a={STATE.danger.on} b={STATE.danger.face} min={4.5} label="danger" /> · progress fill on track <Ratio a={STATE.success.fill[th]} b={NEUTRALS[th]["surface-2"]} min={3} label="progress" />
          </div>
        </div>
      )}
    </Both>
  );
}

/** §4 cards (static and pressable), §5.1b stat pills, §5.3 course tabs selected / unselected. */
export function SurfacesV3() {
  return (
    <Both>
      {(th) => (
        <div className="space-y-6" style={familyVars("teal", th) as CSSProperties}>
          <div className="v3-card">
            <div className="v3-eyebrow">Card</div>
            <div className="v3-card-title mt-1">Radius 28, 2 px edge, 6 px ledge</div>
            <p className="v3-secondary mt-1">The border and ledge share --edge; in dark it is lighter than the face.</p>
          </div>
          <div className="v3-card v3-press" role="button" tabIndex={0}>
            <div className="v3-card-title">Pressable card</div>
            <p className="v3-secondary mt-1">Press: down 4 px, ledge 6 → 2 px; nothing below moves.</p>
          </div>
          <StatBar />
          <div className="flex gap-3">
            {["u7", "u4"].map((u, k) => (
              <div key={u} className="v3-tile flex flex-col items-center justify-center gap-1" data-selected={k === 0} style={{ ...familyVars(UNIT_FAMILY[u], th), width: 140, height: 96 } as CSSProperties}>
                <UnitArt unitId={u} size={56} />
                <span className="v3-tab" style={{ fontWeight: k === 0 ? 800 : 600, color: k === 0 ? "var(--text)" : "var(--text-2)" }}>
                  {k === 0 ? "Selected" : "Unselected"}
                </span>
                <span className="block rounded-full" style={{ width: 56, height: 4, background: k === 0 ? "var(--u-ink)" : "transparent" }} aria-hidden />
              </div>
            ))}
          </div>
        </div>
      )}
    </Both>
  );
}
