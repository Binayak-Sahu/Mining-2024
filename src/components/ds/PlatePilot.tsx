"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ALL_SIMS } from "@/content/sims";
import type { SimDef } from "@/lib/types";

/**
 * Phase 15.5f pilot of the DESIGN.md §2.3b plate (both themes), /design-system only.
 *
 * Production sim files are NOT changed: the sim renders as it does today and this component re-colours its own
 * copy in the DOM with the v2.1 token rules, so Bink can judge the result before any sim is converted:
 *   - neutral ink / caption / line / paper colours → --plate-ink, --plate-ink-2, --plate-line, --plate-bg
 *   - semantic markers (red, blue, green, amber) → the app's danger / action / success / energy faces
 *     (text in those hues → the tone's tint text, so it stays readable on the plate)
 *   - material fills (patterns, gradients, rock, coal, ore, heat ramp) → --mat-*: light = today's colour; dark = same
 *     hue, saturation −10, lightness max(L − 12, 22 + L/3) (the floor keeps near-black coal visible and in order),
 *     plus a 1 px --plate-line outline on dark materials
 *   - text drawn ON a material → --mat-ink: #1F1F1F on light fills, #FFFFFF on dark fills (fixed in both themes)
 */

type Theme = "light" | "dark";
type RGB = [number, number, number];

const PILOT = ["u1-coalrank", "u0-overburden", "u1-supergene"];
const NAMES: Record<string, string> = { "u1-coalrank": "Coalification", "u0-overburden": "Virgin vertical stress", "u1-supergene": "Ore genesis (supergene)" };

const TOK: Record<Theme, Record<string, string>> = {
  light: { ink: "#1F1F1F", ink2: "#5C5C5C", line: "#CFCFCF", bg: "#F7F6F2", danger: "#DC2626", action: "#3B5BF6", success: "#15803D", energy: "#F5B417", dangerT: "#B91C1C", actionT: "#2A43C2", successT: "#15803D", energyT: "#92600A" },
  dark: { ink: "#ECECEC", ink2: "#A3A3A3", line: "#3A3A3A", bg: "#181A1D", danger: "#DC2626", action: "#3B5BF6", success: "#15803D", energy: "#F5B417", dangerT: "#F87171", actionT: "#9DAEFF", successT: "#4ADE80", energyT: "#F5C84A" },
};
const VAR: Record<string, string> = { ink: "--plate-ink", ink2: "--plate-ink-2", line: "--plate-line", bg: "--plate-bg", danger: "--danger", action: "--action", success: "--success", energy: "--energy", dangerT: "--danger-tint-text", actionT: "--action-tint-text", successT: "--success-tint-text", energyT: "--energy-tint-text" };

const INK = new Set(["#0f172a", "#1e293b", "#111827"]);
const INK2 = new Set(["#334155", "#475569", "#64748b", "#57534e"]);
const LINE = new Set(["#94a3b8", "#cbd5e1", "#e2e8f0"]);
const PAPER = new Set(["#f8fafc", "#f1f5f9"]);
const SEM: Record<string, string> = { "#ef4444": "danger", "#dc2626": "danger", "#3b82f6": "action", "#10b981": "success", "#f59e0b": "energy" };

function parse(c: string): { rgb: RGB; a: number } | null {
  const s = c.trim().toLowerCase();
  if (s === "white") return { rgb: [255, 255, 255], a: 1 };
  if (s === "black") return { rgb: [0, 0, 0], a: 1 };
  let m = s.match(/^#([0-9a-f]{6})$/);
  if (m) return { rgb: [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as RGB, a: 1 };
  m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return { rgb: [...m[1]].map((h) => parseInt(h + h, 16)) as RGB, a: 1 };
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  }
  return null;
}
const hex = (rgb: RGB) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l * 100];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}
function fromHsl(h: number, s: number, l: number): RGB {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
/** --mat-* dark rule: same hue, saturation −10, lightness max(L − 12, 22 + L/3). */
function matDark(rgb: RGB): RGB {
  const [h, s, l] = toHsl(rgb);
  return fromHsl(h, Math.max(0, s - 10), Math.max(l - 12, 22 + l / 3));
}
function lum([r, g, b]: RGB) {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a: RGB, b: RGB) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/** Map one colour by its role. Returns [css value to apply, resolved rgb for measuring]. */
function mapColour(raw: string, role: "fill" | "stroke" | "stop" | "text", theme: Theme): [string, RGB] | null {
  const p = parse(raw);
  if (!p) return null;
  const h = hex(p.rgb);
  const t = TOK[theme];
  const tok = (k: string): [string, RGB] => [p.a < 1 ? hex(parse(t[k])!.rgb) : `var(${VAR[k]})`, parse(t[k])!.rgb];
  if (role === "text") {
    if (SEM[h]) return tok(SEM[h] + "T");
    if (INK.has(h)) return tok("ink");
    if (INK2.has(h)) return tok("ink2");
    return null; // white / tinted text: decided by what it sits on (mat-ink pass)
  }
  if (role !== "stop" && SEM[h]) return tok(SEM[h]);
  if (role === "stroke") {
    if (h === "#ffffff") return tok("bg"); // separators drawn in white read as gaps in the plate
    if (INK.has(h) && p.a < 1) return tok("line");
    if (INK.has(h)) return tok("ink");
    if (INK2.has(h)) return tok("ink2");
    if (LINE.has(h)) return tok("line");
  }
  if (role === "fill" && PAPER.has(h)) return tok("bg");
  // material
  const rgb = theme === "dark" ? matDark(p.rgb) : p.rgb;
  return [hex(rgb), rgb];
}

const ATTR: [string, "fill" | "stroke" | "stop"][] = [["fill", "fill"], ["stroke", "stroke"], ["stop-color", "stop"], ["flood-color", "stop"]];

/** Copy the global pattern/gradient/filter library into this plate with suffixed ids and re-coloured contents. */
function cloneDefs(svg: SVGSVGElement, theme: Theme, suffix: string) {
  const src = document.querySelector("#pat-coal")?.closest("defs");
  if (!src) return;
  const defs = src.cloneNode(true) as SVGDefsElement;
  defs.querySelectorAll("[id]").forEach((el) => (el.id = el.id + suffix));
  recolour(defs, theme, suffix);
  svg.insertBefore(defs, svg.firstChild);
}

function recolour(root: Element, theme: Theme, suffix: string) {
  root.querySelectorAll("*").forEach((el) => {
    if (el.tagName === "text" || el.closest("text")) return;
    for (const [a, role] of ATTR) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const u = v.match(/^url\(#([\w-]+)\)$/);
      if (u) {
        if (document.getElementById(u[1] + suffix) || root.querySelector(`#${u[1]}${suffix}`)) el.setAttribute(a, `url(#${u[1]}${suffix})`);
        continue;
      }
      const m = mapColour(v, role, theme);
      if (!m) continue;
      el.setAttribute(`data-orig-${a}`, v);
      (el as SVGElement).style.setProperty(a, m[0]);
      // dark materials: 1 px --plate-line outline so they do not sink into the dark plate
      if (theme === "dark" && role === "fill" && !el.getAttribute("stroke") && el.tagName !== "stop" && !el.closest("pattern") && toHsl(parse(v)?.rgb ?? [255, 255, 255])[2] < 30 && !INK.has(hex(parse(v)!.rgb)))
        (el as SVGElement).style.setProperty("stroke", "var(--plate-line)");
    }
    if (el.getAttribute("filter") === "url(#f-glow)") el.removeAttribute("filter"); // Never List: no glows
  });
}

/** Base colour of the topmost opaque shape under a screen point (a pattern's first rect, a gradient's first stop).
 * Uses isPointInFill rather than elementsFromPoint so plates below the fold are measured too. */
function paintAt(svg: SVGSVGElement, x: number, y: number): RGB | null {
  const shapes = [...svg.querySelectorAll<SVGGeometryElement>("rect, path, circle, ellipse, polygon")].filter((el) => !el.closest("defs, text, pattern"));
  for (let i = shapes.length - 1; i >= 0; i--) {
    const el = shapes[i];
    const cs = getComputedStyle(el);
    if (Number(cs.opacity) < 0.6 || cs.fill === "none" || cs.display === "none") continue;
    const m = el.getScreenCTM();
    if (!m) continue;
    const pt = new DOMPoint(x, y).matrixTransform(m.inverse());
    if (!el.isPointInFill(pt)) continue;
    const u = cs.fill.match(/url\("?#([\w-]+)"?\)/);
    if (u) {
      const d = svg.querySelector(`#${CSS.escape(u[1])}`);
      const first = d?.querySelector("rect, stop");
      if (!first) continue;
      const p = parse(first.tagName === "stop" ? getComputedStyle(first).stopColor : getComputedStyle(first).fill);
      if (p) return p.rgb;
      continue;
    }
    const p = parse(cs.fill);
    if (p && p.a >= 0.6) return p.rgb;
  }
  return null;
}

interface Stats { minRatio: number; minPx: number; texts: number; onMat: number }

function Plate({ sim, theme }: { sim: SimDef; theme: Theme }) {
  const ref = useRef<SVGSVGElement>(null);
  const [st, setSt] = useState<Stats | null>(null);
  const p = Object.fromEntries(sim.params.map((q) => [q.key, q.default])) as Record<string, number>;
  const o = sim.compute(p);
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const suffix = `-p21${theme[0]}-${sim.id}`;
    // the sim's own <defs> ids appear once per plate here, so make them unique before re-colouring
    svg.querySelectorAll("[id]").forEach((el) => (el.id = el.id + suffix));
    cloneDefs(svg, theme, suffix);
    recolour(svg, theme, suffix);
    // text pass: plate ink on the bare plate, --mat-ink on materials
    const t = TOK[theme];
    const bg = parse(t.bg)!.rgb;
    const scale = svg.getBoundingClientRect().width / 400;
    let minRatio = 99, minPx = 99, onMat = 0;
    const texts = [...svg.querySelectorAll("text")];
    for (const el of texts) {
      const r = el.getBoundingClientRect();
      const under = paintAt(svg, r.left + r.width / 2, r.top + r.height / 2);
      const back = under ?? bg;
      const orig = el.getAttribute("fill") ?? "#0f172a";
      let m = mapColour(orig, "text", theme);
      if (under) {
        onMat++;
        const dark: RGB = [0x1f, 0x1f, 0x1f], light: RGB = [255, 255, 255];
        const pick = contrast(dark, back) >= contrast(light, back) ? dark : light;
        if (!m || contrast(m[1], back) < 4.5) m = [hex(pick), pick];
      } else if (!m) {
        m = [`var(--plate-ink)`, parse(t.ink)!.rgb];
      }
      el.style.fill = m[0];
      minRatio = Math.min(minRatio, contrast(m[1], back));
      minPx = Math.min(minPx, Number(el.getAttribute("font-size") ?? 10) * scale);
    }
    setSt({ minRatio, minPx, texts: texts.length, onMat });
  }, [theme, sim.id]);

  return (
    <figure className="min-w-0">
      <div className="ds21-plate" data-theme={theme}>
        <svg ref={ref} viewBox="0 0 400 240" className="block w-full h-auto" role="img" aria-label={`${NAMES[sim.id]} on the ${theme} plate`}>
          {sim.render(p, o, 0)}
        </svg>
      </div>
      <figcaption className="t-label mt-2" style={{ color: "var(--text-2)", fontWeight: 400 }} data-min-ratio={st?.minRatio.toFixed(2)} data-min-px={st?.minPx.toFixed(1)}>
        {st ? `${st.texts} labels (${st.onMat} on materials) · lowest text contrast ${st.minRatio.toFixed(2)}:1 · smallest text ${st.minPx.toFixed(1)} px` : "…"}
      </figcaption>
    </figure>
  );
}

/** §2.3b pilot: three sims on the v2.1 plate, light and dark. */
export function PlatePilot() {
  const sims = PILOT.map((id) => ALL_SIMS.find((s) => s.id === id)).filter(Boolean) as SimDef[];
  return (
    <div className="space-y-10">
      {sims.map((sim) => (
        <div key={sim.id}>
          <h3 className="t-heading">{NAMES[sim.id]}</h3>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            {(["light", "dark"] as const).map((theme) => (
              <div key={theme} className={`ds2-${theme} ds21-${theme} rounded-[20px] p-3 min-w-0`} style={{ background: "var(--bg)", border: "2px solid var(--line)" }}>
                <div className="t-eyebrow mb-3">{theme === "light" ? "Light" : "Dark"}</div>
                <Plate sim={sim} theme={theme} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
