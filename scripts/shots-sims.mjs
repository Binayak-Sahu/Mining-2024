/**
 * Phase 15.5-v3e: screenshot and measure redrawn sims at 390×844, light and dark.
 *   node scripts/shots-sims.mjs <base-url> <out-dir> [sim ids…]   (default: every sim marked done in docs/sim-redraw.md)
 * Per sim: the Sim Lab page (stage, readouts, a grip mid-drag with its value pill) and its first lesson sim stage
 * (via the Inspector stage jumper). Checks: 0 console errors, no horizontal overflow, smallest SVG/KaTeX label ≥ 14 px,
 * grip disc 28 px / hit area ≥ 44 px, lesson CTA on screen, sim title size (display ≤ 2 lines, else title).
 * Also checks Codex thumbnails hide their labels. Exit 1 on any failure.
 */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // NODE_PATH=$(npm root -g)
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const [base = "http://localhost:4310", outDir = ".audit/v3e", ...ids0] = process.argv.slice(2);
const ids = ids0.length ? ids0 : [...readFileSync("docs/sim-redraw.md", "utf8").matchAll(/^\|\s*`([^`]+)`\s*\|[^|]*\|\s*(?:done-v2|done|unsure[^|]*)\s*\|/gm)].map((m) => m[1]);
const stages = JSON.parse(execSync("npx tsx --tsconfig scripts/tsconfig.json scripts/sim-stages.ts", { encoding: "utf8" }));
mkdirSync(outDir, { recursive: true });
const PREFS = JSON.stringify({ state: { theme: "system", muted: true, masterUnlock: true, theoryFirst: true }, version: 1 });
const results = [];
let fails = 0;
const ok = (name, pass, info = "") => {
  if (!pass) fails++;
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${info ? `  — ${info}` : ""}`);
};

const measure = (page) =>
  page.evaluate(() => {
    const st = document.querySelector(".sim-stage:not([data-thumb])");
    if (!st) return null;
    const svg = st.querySelector("svg");
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const k = r.width / vb.width;
    let min = 99;
    let minWhat = "";
    for (const t of svg.querySelectorAll("text")) {
      if (t.closest("[data-pill]") || t.closest("[data-pin]")) continue;
      const fs = parseFloat(t.getAttribute("font-size") || "0") * k;
      if (t.textContent.trim() && fs < min && t.getBoundingClientRect().width > 0) {
        min = fs;
        minWhat = t.textContent.trim();
      }
    }
    for (const fo of svg.querySelectorAll("[data-tex] .sim-fo")) {
      const fs = parseFloat(fo.style.fontSize) * k;
      if (fs < min) {
        min = fs;
        minWhat = "KaTeX " + fo.textContent.trim().slice(0, 20);
      }
    }
    const grips = [...svg.querySelectorAll("[data-grip]")].map((g) => {
      const c = g.querySelectorAll("circle");
      return { hit: c[0].getBoundingClientRect().width, disc: c[1].getBoundingClientRect().width }; // c[1]: the 28 px disc incl. ring and ledge
    });
    // v3.2: every label and KaTeX box inside the 24-unit inset (real boxes)
    const ins = 24 * k - 0.5;
    const outside = [];
    for (const t of svg.querySelectorAll("text, [data-tex] .sim-fo")) {
      if (t.closest("[data-pill]") || t.closest("[data-pin]")) continue;
      const b = t.getBoundingClientRect();
      if (!b.width || !t.textContent.trim()) continue;
      if (b.left < r.left + ins || b.right > r.right - ins || b.top < r.top + ins || b.bottom > r.bottom - ins) outside.push(t.textContent.trim().slice(0, 24));
    }
    return { outside, stageW: st.getBoundingClientRect().width, drawW: r.width, min, minWhat, grips, overflow: document.documentElement.scrollWidth - innerWidth };
  });

const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: scheme, reducedMotion: "reduce", serviceWorkers: "block" });
  await ctx.addInitScript((prefs) => {
    try {
      localStorage.setItem("strata-qa", "1");
      localStorage.setItem("strata-grip-hint", "1");
      if (!localStorage.getItem("strata-prefs")) localStorage.setItem("strata-prefs", prefs);
    } catch {}
  }, PREFS);
  const page = await ctx.newPage();
  let errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  for (const id of ids) {
    // Sim Lab
    errors = [];
    await page.goto(`${base}/lab/?sim=${id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.locator(".sim-stage").first().scrollIntoViewIfNeeded();
    const m = await measure(page);
    const L = `${id} lab ${scheme}`;
    ok(`${L}: §5.6 stage renders`, !!m);
    if (m) {
      ok(`${L}: smallest label ≥ 14 px`, m.min >= 13.95, `${m.min.toFixed(1)} px (${m.minWhat}) · stage ${m.stageW.toFixed(0)} px, drawing ${m.drawW.toFixed(0)} px`);
      if (process.env.V32) ok(`${L}: labels inside the 24 px inset`, m.outside.length === 0, m.outside.slice(0, 3).join(" | "));
      ok(`${L}: no horizontal overflow`, m.overflow <= 0, `${m.overflow}`);
      for (const [i, g] of m.grips.entries()) ok(`${L}: grip ${i + 1} disc 28 px, hit ≥ 44 px`, Math.abs(g.disc - 28) < 1.5 && g.hit >= 43.5, `disc ${g.disc.toFixed(1)}, hit ${g.hit.toFixed(1)}`);
    }
    await page.screenshot({ path: join(outDir, `${id}-lab-${scheme}.png`) });
    // a grip mid-drag: value pill
    const grip = page.locator(".sim-stage [data-grip]").first();
    if (await grip.count()) {
      const bb = await grip.boundingBox();
      const g = await grip.getAttribute("aria-label");
      const dy = /O₂|Depth|depth|height|Height|lift|Dry|Max/i.test(g || "") ? -24 : 0;
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await page.mouse.down();
      await page.mouse.move(bb.x + bb.width / 2 + (dy ? 0 : -24), bb.y + bb.height / 2 + dy, { steps: 4 });
      await page.waitForTimeout(250);
      const pill = await page.evaluate(() => {
        const t = document.querySelector(".sim-stage [data-pill] text");
        if (!t) return null;
        const svg = t.closest("svg");
        return { fs: parseFloat(t.getAttribute("font-size")) * (svg.getBoundingClientRect().width / svg.viewBox.baseVal.width), text: t.textContent };
      });
      ok(`${L}: value pill while dragging (14 px)`, !!pill && Math.abs(pill.fs - 14) < 0.6, pill ? `${pill.text} @ ${pill.fs.toFixed(1)} px` : "none");
      await page.screenshot({ path: join(outDir, `${id}-lab-drag-${scheme}.png`) });
      await page.mouse.up();
    }
    ok(`${L}: 0 console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
    // Lesson sim stage (first sim/predict/theory stage that shows it)
    const st = (stages[id] || []).find((s) => s.kind === "sim") || (stages[id] || [])[0];
    if (!st) continue;
    errors = [];
    await page.goto(`${base}/lesson/${st.lesson}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    if (st.index > 0) {
      await page.getByRole("button", { name: /^More/ }).click();
      await page.waitForTimeout(250);
      await page.getByRole("button", { name: "Inspector menu" }).click();
      await page.waitForTimeout(350);
      await page.locator('[aria-label="Stage jumper"] button').nth(st.index).click();
      await page.waitForTimeout(900);
    }
    const LL = `${id} lesson ${st.lesson}#${st.index} (${st.kind}) ${scheme}`;
    const lm = await measure(page);
    ok(`${LL}: stage renders`, !!lm);
    if (lm) ok(`${LL}: smallest label ≥ 14 px, no overflow`, lm.min >= 13.95 && lm.overflow <= 0, `${lm.min.toFixed(1)} px, overflow ${lm.overflow}`);
    const title = await page.evaluate(() => {
      const h = document.querySelector("[data-sim-title]");
      if (!h) return null;
      const lh = parseFloat(getComputedStyle(h).lineHeight);
      return { size: h.dataset.simTitle, lines: Math.round(h.getBoundingClientRect().height / lh), text: h.textContent };
    });
    if (st.kind === "sim") ok(`${LL}: sim title size rule`, !!title && (title.size === "display" ? title.lines <= 2 : true), title ? `${title.size}, ${title.lines} line(s): ${title.text}` : "no title");
    const cta = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].filter((x) => /Check|Continue|File to|Tap all|Next|Reach the objective/.test(x.textContent || "")).map((x) => x.getBoundingClientRect()).find((r) => r.width > 0);
      return b ? b.bottom <= innerHeight && b.top >= 0 : false;
    });
    ok(`${LL}: CTA on screen`, cta);
    await page.screenshot({ path: join(outDir, `${id}-lesson-${scheme}.png`) });
    ok(`${LL}: 0 console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
  }
  // Codex thumbnails hide labels
  errors = [];
  await page.goto(`${base}/codex/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const th = await page.evaluate(() => {
    const ts = [...document.querySelectorAll(".sim-stage[data-thumb]")];
    const vis = ts.flatMap((s) => [...s.querySelectorAll("text, [data-tex]")]).filter((t) => getComputedStyle(t).display !== "none" && t.getBoundingClientRect().width > 0);
    return { n: ts.length, visible: vis.length };
  });
  ok(`codex ${scheme}: §5.6 thumbnails hide labels`, th.visible === 0, `${th.n} thumbnails, ${th.visible} visible labels`);
  await page.screenshot({ path: join(outDir, `codex-${scheme}.png`), fullPage: false });
  ok(`codex ${scheme}: 0 console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}
await browser.close();
writeFileSync(join(outDir, "results.txt"), results.join("\n") + "\n");
console.log(results.filter((r) => r.startsWith("FAIL")).join("\n"));
console.log(`\n${results.length - fails}/${results.length} checks passed (${ids.length} sims) → ${outDir}`);
process.exit(fails ? 1 : 0);
