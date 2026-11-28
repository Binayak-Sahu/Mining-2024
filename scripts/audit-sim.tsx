/**
 * §5.6 sim audit (Phase 15.5-v3e, dev tool). For every redrawn sim (`def.v3`) it renders the drawing in every state the
 * app shows (defaults, each param at min and max, every lesson stage's values) and fails on:
 *   grid      grid paper: <pattern>, the legacy texture/hatch ids, or a lattice of evenly spaced parallel lines
 *   gradient  any gradient not marked data-heat (a heat ramp only where temperature is the data), legacy url(#grad-*),
 *             or a decorative SVG filter (shadows, glows)
 *   text      text under 14 px rendered at 390 px wide (font-size < 17.8 viewBox units), or text with no size
 *   hue       more than 2 hue families (neutrals, success and danger don't count)
 *   golden    no golden-value entry (tests/sims.golden.json) with min, default and (if the sim has an objective) objective-met
 * It also checks docs/sim-redraw.md: every sim marked done there must be redrawn (def.v3) and vice versa.
 *
 * Run: npm run audit:sim            (exit 1 on any finding)
 *      npm run audit:sim -- u7      (only sims whose id contains the filter)
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { UNITS } from "../src/content";
import { ALL_SIMS } from "../src/content/sims";
import { FAMILIES, type Family } from "../src/components/ds/v3/tokens";
import { familyOf } from "../src/lib/family";
import { GOLDEN_FILE, firstGoal, type Golden } from "./lib/golden";
import type { SimDef, Vals } from "../src/lib/types";

const filter = process.argv[2] ?? "";
import { readouts as goldenReadouts } from "./lib/golden";
const readoutTexts = (def: SimDef, vals: Vals) => goldenReadouts(def, vals).map((r) => r.text.replace(/\u00a0|\u202f|\u2009/g, " ").trim()).filter((t) => t.length >= 2);
const MIN_UNITS = (14 * 400) / 314; // 17.83: 14 px at the 314 px drawing width of a 390 px phone

function defaults(def: SimDef, o?: Vals): Vals {
  const v: Vals = {};
  for (const p of def.params) v[p.key] = p.default;
  return { ...v, ...(o ?? {}) };
}

/* ---------- colour → hue family ---------- */
const hexRgb = (h: string): [number, number, number] | null => {
  let m = /^#([0-9a-f]{3})$/i.exec(h);
  if (m) return [0, 1, 2].map((i) => parseInt(m![1][i] + m![1][i], 16)) as [number, number, number];
  m = /^#([0-9a-f]{6})/i.exec(h);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as [number, number, number];
  m = /^rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(h);
  if (m) return [+m[1], +m[2], +m[3]];
  return null;
};
const hueOf = ([r, g, b]: [number, number, number]) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d === 0) return { h: 0, chroma: 0 };
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, chroma: d };
};
const STATE_HEX = ["#86efac", "#fca5a5", "#22c55e", "#15803d", "#ef4444", "#b91c1c", "#dcfce7", "#fee2e2", "#0f2e1a", "#f87171", "#4ade80"];
const famHues = (Object.keys(FAMILIES) as Family[]).map((f) => {
  const t = FAMILIES[f];
  return { f, hues: [t.face, t.deep, t.mid, t.light, t.ink.light, t.ink.dark].map((c) => hueOf(hexRgb(c)!).h) };
});
const hd = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

function classify(c: string, own: Family): string | null {
  const v = c.trim().toLowerCase();
  if (!v || v === "none" || v === "transparent" || v === "currentcolor" || v.startsWith("url(") || v === "inherit") return null;
  if (/var\(--u-/.test(v)) return own;
  if (/var\(--(text|surface|bg|edge|line|canvas)/.test(v)) return "neutral";
  if (/var\(--(success|danger)/.test(v)) return "state";
  if (/var\(/.test(v)) return `unknown ${v}`;
  if (v === "white" || v === "black") return "neutral";
  if (STATE_HEX.includes(v)) return "state";
  const rgb = hexRgb(v);
  if (!rgb) return `unknown ${v}`;
  const { h, chroma } = hueOf(rgb);
  if (chroma < 28) return "neutral";
  let best: { f: string; d: number } = { f: `hue ${Math.round(h / 30) * 30}°`, d: 18 };
  for (const fh of famHues) for (const x of fh.hues) if (hd(h, x) < best.d) best = { f: fh.f, d: hd(h, x) };
  return best.f;
}

/* ---------- checks on one static render ---------- */
function check(def: SimDef, svg: string): string[] {
  const own = familyOf(def.id);
  const f: string[] = [];
  // gradients: allowed only when marked data-heat; collect their ids
  const heatIds = new Set<string>();
  for (const m of svg.matchAll(/<(linear|radial)Gradient\b([^>]*)>/g)) {
    const id = /\bid="([^"]+)"/.exec(m[2])?.[1] ?? "?";
    if (/\bdata-heat=/.test(m[2])) heatIds.add(id);
    else f.push(`gradient  ${m[1]}Gradient #${id} without data-heat`);
  }
  for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) {
    const id = m[1];
    if (heatIds.has(id)) continue;
    if (/^pat-/.test(id)) f.push(`grid      texture/hatch url(#${id})`);
    else if (/^(grad-|f-)/.test(id)) f.push(`gradient  legacy url(#${id})`);
    else if (!new RegExp(`id="${id}"`).test(svg)) f.push(`gradient  url(#${id}) refers to nothing in the drawing`);
  }
  if (/<pattern\b/.test(svg)) f.push("grid      <pattern> element");
  if (/<filter\b|\sfilter="/.test(svg)) f.push("gradient  decorative filter (shadow/glow)");
  // grid lattice: ≥ 3 evenly spaced horizontal AND ≥ 3 vertical lines of the same stroke spanning the same extent
  const lines = [...svg.matchAll(/<line\b([^>]*)\/?>/g)].map((m) => {
    const a = (k: string) => Number(new RegExp(`\\b${k}="([^"]+)"`).exec(m[1])?.[1] ?? NaN);
    const stroke = /stroke:([^;"]+)/.exec(m[1])?.[1] ?? /\bstroke="([^"]+)"/.exec(m[1])?.[1] ?? "";
    return { x1: a("x1"), y1: a("y1"), x2: a("x2"), y2: a("y2"), stroke };
  });
  const lattice = (dir: "h" | "v") => {
    const g = new Map<string, number[]>();
    for (const l of lines) {
      if (dir === "h" ? l.y1 !== l.y2 || l.x1 === l.x2 : l.x1 !== l.x2 || l.y1 === l.y2) continue;
      const key = dir === "h" ? `${l.stroke}|${Math.round(l.x1)}|${Math.round(l.x2)}` : `${l.stroke}|${Math.round(l.y1)}|${Math.round(l.y2)}`;
      (g.get(key) ?? g.set(key, []).get(key)!).push(dir === "h" ? l.y1 : l.x1);
    }
    for (const [, v] of g) {
      if (v.length < 3) continue;
      const s = [...v].sort((a, b) => a - b);
      const d = s.slice(1).map((x, i) => x - s[i]);
      if (d.every((x) => Math.abs(x - d[0]) < 0.6)) return true;
    }
    return false;
  };
  if (lattice("h") && lattice("v")) f.push("grid      lattice of evenly spaced lines (grid paper)");
  // text size
  for (const m of svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const sz = /\bfont-size="([^"]+)"/.exec(m[1])?.[1];
    const t = m[2].replace(/<[^>]+>/g, "").trim();
    if (!t) continue;
    if (!sz) f.push(`text      "${t}" has no font-size`);
    else if (Number(sz) < MIN_UNITS - 0.01) f.push(`text      "${t}" ${sz} units = ${((Number(sz) * 314) / 400).toFixed(1)} px`);
  }
  for (const m of svg.matchAll(/<foreignObject\b[\s\S]*?font-size:([\d.]+)px/g)) if (Number(m[1]) < MIN_UNITS - 0.01) f.push(`text      KaTeX label ${m[1]} units`);
  // hue families (stops inside data-heat ramps are exempt)
  const body = svg.replace(/<(linear|radial)Gradient\b[^>]*data-heat[^>]*>[\s\S]*?<\/\1Gradient>/g, "");
  const fams = new Set<string>();
  for (const m of body.matchAll(/\b(?:fill|stroke|stop-color|color)(?:="|:)([^";]+)/g)) {
    const c = classify(m[1], own);
    if (c && c !== "neutral" && c !== "state") fams.add(c);
  }
  if (fams.size > 2) f.push(`hue       ${fams.size} hue families: ${[...fams].join(", ")}`);
  for (const x of fams) if (x.startsWith("unknown")) f.push(`hue       colour not mapped to a family: ${x.slice(8)}`);
  return f;
}


/* ---------- v3.2 checks (§5.6d) on one static render ---------- */
const STATE_RE = /var\(--(success|danger)|#(86efac|fca5a5|22c55e|15803d|ef4444|b91c1c|dcfce7|fee2e2|0f2e1a|f87171|4ade80)\b/i;
const INSET = 24;
const decode = (t: string) => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\u00a0|\u202f|\u2009/g, " ").trim();
function checkV32(def: SimDef, svg: string, viewH: number, readoutTexts: string[]): string[] {
  const f: string[] = [];
  // raw controls
  if (/<input\b|<button\b|<select\b/.test(svg)) f.push("control   raw <input>/<button>/<select> in a sim render (use SimSlider / SimChips)");
  // text inside the 24 px inset (estimated: 0.56 em per char; KaTeX boxes are not measured here, shots-sims.mjs measures the real boxes)
  for (const m of svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const a = (k: string) => Number(new RegExp(`\\b${k}="([^"]+)"`).exec(m[1])?.[1] ?? NaN);
    const t = decode(m[2].replace(/<[^>]+>/g, ""));
    if (!t) continue;
    if (/data-pill|data-pin/.test(m[1])) continue;
    const x = a("x"), y = a("y"), fs = a("font-size") || 18;
    const anchor = /text-anchor="(\w+)"/.exec(m[1])?.[1] ?? "start";
    const w = t.length * fs * 0.56;
    const l = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
    const r = l + w;
    if (!(l >= INSET - 0.5 && r <= 400 - INSET + 0.5 && y - fs * 0.75 >= INSET - 0.5 && y + fs * 0.25 <= viewH - INSET + 0.5)) f.push(`inset     "${t}" (x ${l.toFixed(0)}–${r.toFixed(0)}, y ${y}) is outside the ${INSET}px inset`);
    if (readoutTexts.includes(t)) f.push(`echo      stage text "${t}" repeats a readout value`);
  }
  // state colours need data-state on the element or an ancestor <g>
  const stack: boolean[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)\b([^>]*?)(\/?)>/g)) {
    const [, close, tag, attrs, self] = m;
    if (close) {
      if (tag === "g" || tag === "svg") stack.pop();
      continue;
    }
    const has = /\bdata-state=/.test(attrs);
    if ((tag === "g" || tag === "svg") && !self) {
      stack.push(has || stack[stack.length - 1] === true);
      continue;
    }
    if (STATE_RE.test(attrs) && !has && !stack.includes(true)) f.push(`state     <${tag}> uses a success/danger colour with no data-state`);
  }
  return f;
}

/* ---------- run ---------- */
const golden: Record<string, Golden> = existsSync(GOLDEN_FILE) ? JSON.parse(readFileSync(GOLDEN_FILE, "utf8")) : {};
const tracker = resolve("docs/sim-redraw.md");
const doneInDoc = new Set<string>(); // any redrawn status: done, done-v2, unsure
const v32 = new Set<string>(); // sims that must pass the v3.2 checks (§5.6d): done-v2 only (AUDIT_SIM_V32=id,id forces more)
if (existsSync(tracker))
  for (const m of readFileSync(tracker, "utf8").matchAll(/^\|\s*`([^`]+)`\s*\|[^|]*\|\s*(done-v2|done|unsure[^|]*)\s*\|/gm)) {
    doneInDoc.add(m[1]);
    if (m[2] === "done-v2") v32.add(m[1]);
  }

for (const id of (process.env.AUDIT_SIM_V32 ?? "").split(",").filter(Boolean)) v32.add(id);
// Self-test: AUDIT_SIM_FORCE=u3-kirsch,u9-npv audits legacy sims as if redrawn (they must fail).
for (const id of (process.env.AUDIT_SIM_FORCE ?? "").split(",").filter(Boolean)) {
  const d = ALL_SIMS.find((x) => x.id === id);
  if (d && !d.v3) d.v3 = { viewH: 240 };
}
const findings: string[] = [];
const v3 = ALL_SIMS.filter((d) => d.v3 && (!filter || d.id.includes(filter)));
for (const def of v3) {
  const states: [string, Vals][] = [["defaults", defaults(def)]];
  for (const p of def.params) {
    states.push([`${p.key}=min`, defaults(def, { [p.key]: p.options ? p.options[0].value : p.min })]);
    states.push([`${p.key}=max`, defaults(def, { [p.key]: p.options ? p.options[p.options.length - 1].value : p.max })]);
  }
  for (const u of UNITS)
    for (const l of [...u.lessons, u.boss])
      l.stages.forEach((st, i) => {
        const at = `${l.id}#${i}`;
        if (st.kind === "theory" && st.sim === def.id) states.push([`${at} theory`, defaults(def, st.simParams)]);
        if (st.kind === "sim" && st.sim === def.id) states.push([`${at} sim`, defaults(def, st.start)]);
        if (st.kind === "predict" && st.sim === def.id) {
          states.push([`${at} before`, defaults(def, st.before)]);
          states.push([`${at} after`, defaults(def, { ...st.before, ...st.after })]);
        }
        if (st.kind === "numeric" && st.sim === def.id) states.push([`${at} numeric`, defaults(def, st.params)]);
      });
  const seen = new Set<string>();
  for (const [ctx, vals] of states) {
    let svg = "";
    try {
      svg = renderToStaticMarkup(createElement("svg", { viewBox: `0 0 400 ${def.v3!.viewH}` }, createElement(Fragment, null, def.render(vals, def.compute(vals), 0))));
    } catch (e) {
      findings.push(`render    ${def.id} [${ctx}]: ${(e as Error).message}`);
      continue;
    }
    const extra = v32.has(def.id) ? checkV32(def, svg, def.v3!.viewH, readoutTexts(def, vals)) : [];
    for (const x of [...check(def, svg), ...extra]) {
      const key = `${def.id} ${x}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(`${x.slice(0, 10)}${def.id} [${ctx}]: ${x.slice(10)}`);
    }
  }
  const g = golden[def.id];
  if (!g) findings.push(`golden    ${def.id}: no golden entry in tests/sims.golden.json`);
  else {
    const names = g.states.map((s) => s.name);
    const need = ["min", "default", ...(firstGoal(def.id) ? ["objective-met"] : [])];
    for (const n of need) if (!names.includes(n as never)) findings.push(`golden    ${def.id}: golden state "${n}" missing`);
    const om = g.states.find((s) => s.name === "objective-met");
    if (om && om.goalMet === false) findings.push(`golden    ${def.id}: no recorded state meets the objective`);
  }
}
if (!filter) {
  for (const d of ALL_SIMS) {
    if (d.v3 && !doneInDoc.has(d.id)) findings.push(`tracker   ${d.id}: redrawn but not marked done in docs/sim-redraw.md`);
    if (!d.v3 && doneInDoc.has(d.id)) findings.push(`tracker   ${d.id}: marked done in docs/sim-redraw.md but not redrawn (no v3)`);
  }
}

console.log(findings.join("\n"));
const by = (k: string) => findings.filter((x) => x.startsWith(k)).length;
console.log(
  `\n${v3.length} redrawn sims audited (${ALL_SIMS.filter((d) => d.v3).length}/${ALL_SIMS.length} done) · grid ${by("grid")} · gradient ${by("gradient")} · text ${by("text")} · hue ${by("hue")} · golden ${by("golden")} · inset ${by("inset")} · state ${by("state")} · control ${by("control")} · echo ${by("echo")} · tracker ${by("tracker")} · v3.2 ${v32.size}/${ALL_SIMS.filter((d) => d.v3).length} · render ${by("render")}`,
);
process.exit(findings.length ? 1 : 0);
