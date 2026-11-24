/**
 * SVG layout audit (dev tool, not shipped).
 *
 * Renders every simulation in every context the app shows it in (Sim Lab defaults, each lesson stage's
 * parameters, theory hotspots, every parameter at its min and max) to static SVG, then measures the
 * real text boxes in headless Chromium with the app's own fonts and reports:
 *   - clip:    text that leaves the 400 x 240 drawing area
 *   - overlap: two text labels that overlap each other
 *   - pin:     a numbered hotspot pin that covers text, an arrowhead/thick stroke, or another pin
 *
 * Run: npm run audit:svg            (exit code 1 when anything is found)
 *      npm run audit:svg -- u3-pillar   (only sims whose id contains the filter)
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { UNITS } from "../src/content";
import { ALL_SIMS } from "../src/content/sims";
import { SvgDefs } from "../src/components/sim/defs";
import type { SimDef, Vals, Hotspot } from "../src/lib/types";

const require = createRequire(import.meta.url);
const filter = process.argv[2] ?? "";

interface Case {
  sim: string;
  ctx: string;
  vals: Vals;
  pins: Hotspot[];
}

function defaults(def: SimDef, o?: Vals): Vals {
  const v: Vals = {};
  for (const p of def.params) v[p.key] = p.default;
  return { ...v, ...(o ?? {}) };
}

const cases: Case[] = [];
const simById = new Map(ALL_SIMS.map((s) => [s.id, s]));
for (const def of ALL_SIMS) {
  if (filter && !def.id.includes(filter)) continue;
  cases.push({ sim: def.id, ctx: "defaults", vals: defaults(def), pins: [] });
  for (const p of def.params) {
    const lo = p.options ? p.options[0].value : p.min;
    const hi = p.options ? p.options[p.options.length - 1].value : p.max;
    cases.push({ sim: def.id, ctx: `${p.key}=min`, vals: defaults(def, { [p.key]: lo }), pins: [] });
    cases.push({ sim: def.id, ctx: `${p.key}=max`, vals: defaults(def, { [p.key]: hi }), pins: [] });
  }
}
for (const u of UNITS)
  for (const l of [...u.lessons, u.boss])
    l.stages.forEach((st, i) => {
      const at = `${l.id}#${i}`;
      const push = (sim: string | undefined, vals: Vals | undefined, pins: Hotspot[], tag: string) => {
        if (!sim) return;
        const def = simById.get(sim);
        if (!def || (filter && !def.id.includes(filter))) return;
        cases.push({ sim, ctx: `${at} ${tag}`, vals: defaults(def, vals), pins });
      };
      if (st.kind === "theory") push(st.sim, st.simParams, st.hotspots, "theory");
      if (st.kind === "sim") push(st.sim, st.start, [], "sim-start");
      if (st.kind === "predict") {
        push(st.sim, st.before, [], "predict-before");
        push(st.sim, { ...st.before, ...st.after }, [], "predict-after");
      }
      if (st.kind === "numeric") push(st.sim, st.params, [], "numeric");
    });

const font = (pkg: string, file: string) => "file://" + resolve(require.resolve(`${pkg}/package.json`), "..", "files", file);
const css = `
@font-face{font-family:"Plus Jakarta Sans Variable";font-weight:200 800;src:url("${font("@fontsource-variable/plus-jakarta-sans", "plus-jakarta-sans-latin-wght-normal.woff2")}") format("woff2")}
@font-face{font-family:"JetBrains Mono Variable";font-weight:100 800;src:url("${font("@fontsource-variable/jetbrains-mono", "jetbrains-mono-latin-wght-normal.woff2")}") format("woff2")}
@font-face{font-family:"JetBrains Mono Variable";font-weight:100 800;unicode-range:U+0370-03FF;src:url("${font("@fontsource-variable/jetbrains-mono", "jetbrains-mono-greek-wght-normal.woff2")}") format("woff2")}
body{margin:0;font-family:"Plus Jakarta Sans Variable"} svg.case{display:block;width:448px;height:288px}`;

const body = cases
  .map((c, k) => {
    const def = simById.get(c.sim)!;
    const out = def.compute(c.vals);
    const pins = c.pins.map((h, i) => createElement("circle", { key: i, "data-pin": i, cx: h.x, cy: h.y, r: 8, fill: "#3B82F6" }));
    return renderToStaticMarkup(createElement("svg", { className: "case", "data-k": k, viewBox: "-24 -24 448 288", xmlns: "http://www.w3.org/2000/svg" }, createElement(Fragment, null, def.render(c.vals, out, 0), ...pins)));
  })
  .join("\n");

const dir = resolve(process.env.AUDIT_DIR ?? ".audit");
mkdirSync(dir, { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${renderToStaticMarkup(createElement("div", null, createElement(SvgDefs)))}${body}</body></html>`;
writeFileSync(join(dir, "svgs.html"), html);
writeFileSync(join(dir, "cases.json"), JSON.stringify(cases.map((c) => ({ sim: c.sim, ctx: c.ctx, pins: c.pins.length }))));

// ---- measure in Chromium ----
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 460, height: 300 } });
  await page.goto("file://" + join(dir, "svgs.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ path: resolve("scripts/audit-measure.js") });
  const meta = cases.map((c) => ({ sim: c.sim, ctx: c.ctx }));
  const findings: string[] = await page.evaluate(`window.measureSvgs(${JSON.stringify(meta)})`);
  await browser.close();
  const uniq = [...new Set(findings)];
  writeFileSync(join(dir, "findings.txt"), uniq.join("\n") + "\n");
  const by = (k: string) => uniq.filter((f) => f.startsWith(k)).length;
  console.log(uniq.slice(0, Number(process.env.AUDIT_SHOW ?? 60)).join("\n"));
  console.log(`\n${cases.length} renders · clip ${by("clip")} · overlap ${by("overlap")} · pin ${by("pin")}  (full list: ${join(dir, "findings.txt")})`);
  process.exit(uniq.length ? 1 : 0);
})();
