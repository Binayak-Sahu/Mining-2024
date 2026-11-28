/**
 * Dev preview for the §5.6 redraw (v3e): renders a sim at its defaults, each param's min/max and its lesson states at the
 * real phone drawing width (314 px), light and dark, with grips and lesson hotspot pins, to a PNG.
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/preview-sim.tsx u7-fan [out.png]
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { UNITS } from "../src/content";
import { ALL_SIMS } from "../src/content/sims";
import { familyOf } from "../src/lib/family";
import type { SimDef, Vals, Hotspot } from "../src/lib/types";

const require = createRequire(import.meta.url);
const id = process.argv[2];
const outPng = resolve(process.argv[3] ?? `.audit/preview/${id}.png`);
const def = ALL_SIMS.find((d) => d.id === id)!;
if (!def?.v3) throw new Error(`${id} has no v3`);
const dflt = (o?: Vals) => ({ ...Object.fromEntries(def.params.map((p) => [p.key, p.default])), ...(o ?? {}) });
const states: { ctx: string; vals: Vals; pins: Hotspot[] }[] = [{ ctx: "defaults", vals: dflt(), pins: [] }];
for (const u of UNITS) for (const l of [...u.lessons, u.boss]) l.stages.forEach((st, i) => {
  if (st.kind === "theory" && st.sim === id) states.push({ ctx: `${l.id}#${i} theory`, vals: dflt(st.simParams), pins: st.hotspots });
  if (st.kind === "sim" && st.sim === id) states.push({ ctx: `${l.id}#${i} sim`, vals: dflt(st.start), pins: [] });
  if (st.kind === "predict" && st.sim === id) states.push({ ctx: `${l.id}#${i} predict`, vals: dflt({ ...st.before, __predicting: 1 }), pins: [] });
});
for (const p of def.params) {
  states.push({ ctx: `${p.key}=min`, vals: dflt({ [p.key]: p.options ? p.options[0].value : p.min }), pins: [] });
  states.push({ ctx: `${p.key}=max`, vals: dflt({ [p.key]: p.options ? p.options[p.options.length - 1].value : p.max }), pins: [] });
}
const U = 400 / 314;
const one = (s: (typeof states)[number]) => {
  const o = def.compute(s.vals);
  const grips = (def.handles ?? []).map((h, i) => {
    const [x, y] = h.at(s.vals, o);
    return createElement("g", { key: `g${i}` }, createElement("circle", { cx: x, cy: y + 3 * U, r: 14 * U, style: { fill: "var(--u-ink)" } }), createElement("circle", { cx: x, cy: y, r: 12.5 * U, style: { fill: "var(--surface)", stroke: "var(--u-ink)" }, strokeWidth: 3 * U }), createElement("circle", { cx: x, cy: y, r: 22 * U, fill: "none", stroke: "#f0f", strokeWidth: 0.6, strokeDasharray: "2 2" }));
  });
  const pins = s.pins.map((h, i) => createElement("g", { key: `p${i}` }, createElement("circle", { cx: h.x, cy: h.y, r: 8, fill: "#3B82F6", stroke: "white", strokeWidth: 2 }), createElement("text", { x: h.x, y: h.y + 3.5, fontSize: 9, fill: "white", textAnchor: "middle", fontWeight: 700 }, String(i + 1))));
  const f = def.v3!.formula?.(s.vals, o);
  const katex = require("katex");
  return `<div class="cell"><div class="ctx">${s.ctx}</div><div class="sim-stage" data-family="${familyOf(def.id)}">${renderToStaticMarkup(createElement("svg", { viewBox: `0 0 400 ${def.v3!.viewH}`, style: { width: "100%", overflow: "visible", display: "block" } }, createElement(Fragment, null, def.render(s.vals, o, 0.6), ...grips, ...pins)))}</div>${f ? `<div class="f">${katex.renderToString(f, { throwOnError: false })}</div>` : ""}</div>`;
};
const css = readFileSync(resolve("src/app/globals.css"), "utf8");
const fam = css.slice(css.indexOf('[data-family="blue"]') - 1, css.indexOf("/* ---------- §5.6") > 0 ? css.length : css.length);
const fontUrl = "file://" + resolve(require.resolve("@fontsource-variable/figtree/package.json"), "..", "files", "figtree-latin-wght-normal.woff2");
const katexCss = "file://" + resolve("src/components/ui/katex-woff2.css");
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${katexCss}"><style>
@font-face{font-family:F;font-weight:300 900;src:url("${fontUrl}")}
:root{--font-sans:F}
.theme{padding:16px;display:grid;grid-template-columns:repeat(3,342px);gap:16px;font-family:F}
.light{--bg:#fff;--surface:#fff;--edge:#e3e3e3;--text:#141414;--text-2:#5c5c5c;--text-3:#6f6f6f;--success:#22c55e;--danger:#ef4444;--danger-tint-text:#b91c1c;--success-tint-text:#15803d;background:#fff;color:#141414}
.dark{--bg:#141414;--surface:#1e1e1e;--edge:#333;--text:#f5f5f5;--text-2:#a6a6a6;--text-3:#8c8c8c;--success:#22c55e;--danger:#ef4444;--danger-tint-text:#f87171;--success-tint-text:#4ade80;background:#141414;color:#f5f5f5}
.ctx{font:600 12px F;color:#f0f;margin-bottom:4px}.f{text-align:center;font-size:17px;margin-top:8px}
${fam.replace(/\.dark\[data-family/g, ".dark [data-family")}
</style></head><body style="margin:0">${["light", "dark"].map((t) => `<div class="theme ${t}">${states.map(one).join("")}</div>`).join("")}</body></html>`;
mkdirSync(dirname(outPng), { recursive: true });
const htmlPath = outPng.replace(/\.png$/, ".html");
writeFileSync(htmlPath, html);
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1100, height: 800 } });
  await pg.goto("file://" + htmlPath);
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(200);
  await pg.screenshot({ path: outPng, fullPage: true });
  await b.close();
  console.log(outPng, states.length, "states");
})();
