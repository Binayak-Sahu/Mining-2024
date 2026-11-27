/**
 * Text-contrast sweep (Phase 15.5b onward): loads every exported route at 390×844 in light and dark and reports every
 * visible text element whose contrast against its effective background is under 4.5:1 (WCAG AA, normal text).
 * Large text (≥ 24 px, or ≥ 18.66 px and bold) is tagged "large" because 3:1 is its AA threshold.
 *
 *   NEXT_PUBLIC_BASE_PATH=/Mining-2024 npm run build && NEXT_PUBLIC_BASE_PATH=/Mining-2024 PORT=4310 node scripts/serve-out.mjs &
 *   NODE_PATH=$(npm root -g) node scripts/contrast-sweep.mjs http://localhost:4310/Mining-2024 [out.json] [route-filter | states]
 *
 * "states" instead of a route filter measures the interaction states in STATES (sheets, menus, later screens).
 *
 * Background: the nearest ancestor with a non-transparent background colour, alpha-composited over the ones below it.
 * A gradient background is resolved to its worst stop (tagged "gradient"). Ancestor opacity is applied to the text
 * colour. SVG text (sim diagrams, 15.5e) is skipped. The same pass lists text under 14 px (DESIGN.md §3 floor).
 */
import { createRequire } from "node:module";
import { readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scan } from "./lib/contrast-scan.mjs";
import { STATES } from "./lib/sweep-states.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PREFS = JSON.stringify({ state: { theme: "system", muted: false, masterUnlock: process.argv[4] === "states", theoryFirst: true }, version: 1 });

async function routes(dir = "out", prefix = "") {
  const found = [];
  for (const e of await readdir(join(dir, prefix))) {
    const p = join(dir, prefix, e);
    if ((await stat(p)).isDirectory()) {
      if (e.startsWith("_next") || e === "404") continue;
      found.push(...(await routes(dir, join(prefix, e))));
    } else if (e === "index.html") found.push("/" + (prefix ? prefix.replace(/\\/g, "/") + "/" : ""));
  }
  return found.sort();
}



const base = (process.argv[2] || "http://localhost:4310").replace(/\/$/, "");
const outFile = process.argv[3];
const statesMode = process.argv[4] === "states";
const filter = process.argv[4] && !statesMode ? new RegExp(process.argv[4]) : null;
const list = statesMode ? STATES : (await routes()).filter((r) => !filter || filter.test(r)).map((r) => [r, "", null]);
const browser = await chromium.launch();
const results = [];
for (const scheme of ["light", "dark"]) {
  for (const [r, stateName, drive] of list) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: scheme, reducedMotion: "reduce", serviceWorkers: "block" });
    await ctx.addInitScript((prefs) => {
      try {
        localStorage.setItem("strata-qa", "1");
        if (!localStorage.getItem("strata-prefs")) localStorage.setItem("strata-prefs", prefs);
      } catch {
        /* storage blocked */
      }
    }, PREFS);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
    await page.goto(base + r, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    if (drive) {
      try {
        await drive(page);
      } catch (e) {
        errors.push(`state "${stateName}" failed: ${e.message.split("\n")[0]}`);
      }
      await page.waitForTimeout(600);
    }
    const res = await page.evaluate(scan);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    results.push({ scheme, route: r, state: stateName, ...res, errors, overflow: ov });
    const tag = `${scheme.padEnd(5)} ${r}${stateName ? ` [${stateName}]` : ""}`;
    console.log(`${res.low.length ? "LOW " : "ok  "} ${tag}  low=${res.low.length} small=${res.small.length}${errors.length ? ` errors=${errors.length}` : ""}${ov > 0 ? ` overflow=${ov}` : ""}`);
    for (const l of res.low) console.log(`       ${l.ratio.toFixed(2)}${l.large ? " large" : ""}${l.grad ? " gradient" : ""}  ${l.size}px/${l.weight}  <${l.tag} ${l.cls}> "${l.text}"`);
    await ctx.close();
  }
}
await browser.close();
if (outFile) await writeFile(outFile, JSON.stringify(results, null, 1));
const low = results.reduce((n, r) => n + r.low.length, 0);
console.log(`${low} low-contrast text element(s) across ${results.length} route×theme pages`);
