/**
 * Whole-app sweep (Phase 15.5e): every exported route, every sim stage (and ConceptFlow try-it screen) and every
 * scripted interaction state, at 390×844 and 1440×900, light and dark, under reduced motion. Per page it records
 * console errors, horizontal overflow, whether the lesson CTA is fully on screen, and text under 4.5:1
 * (scripts/lib/contrast-scan.mjs, the same scan as contrast-sweep.mjs). It also checks that the end-of-lesson
 * confetti stays off under reduced motion (and, as a control, appears without it).
 *
 *   NEXT_PUBLIC_BASE_PATH=/Mining-2024 npm run build && NEXT_PUBLIC_BASE_PATH=/Mining-2024 PORT=4310 node scripts/serve-out.mjs &
 *   NODE_PATH=$(npm root -g) node scripts/sweep.mjs http://localhost:4310/Mining-2024 <out-dir> [routes|sims|states|confetti|all] [390|1440] [light|dark]
 *
 * Writes <out-dir>/sweep-<part>-<vw>-<scheme>.json and viewport screenshots <out-dir>/<vw>-<scheme>-<name>.png
 * (lesson routes are scanned but not shot; sims and states are). Exit code 1 on any failure.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scan } from "./lib/contrast-scan.mjs";
import { STATES } from "./lib/sweep-states.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const [baseArg, outDir = ".audit/sweep", partArg = "all", vwArg, schemeArg] = process.argv.slice(2);
const base = (baseArg || "http://localhost:4310").replace(/\/$/, "");
const VIEWPORTS = { 390: { width: 390, height: 844, isMobile: true }, 1440: { width: 1440, height: 900, isMobile: false } };
const vws = vwArg ? [vwArg] : ["390", "1440"];
const schemes = schemeArg ? [schemeArg] : ["light", "dark"];
const parts = partArg === "all" ? ["routes", "sims", "states", "confetti"] : [partArg];
const PREFS = (master) => JSON.stringify({ state: { theme: "system", muted: true, masterUnlock: master, theoryFirst: true }, version: 1 });
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

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

const browser = await chromium.launch();
await mkdir(outDir, { recursive: true });

async function open(vw, scheme, { master = true, reduced = true } = {}) {
  const v = VIEWPORTS[vw];
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, isMobile: v.isMobile, hasTouch: true, colorScheme: scheme, reducedMotion: reduced ? "reduce" : "no-preference", serviceWorkers: "block" });
  await ctx.addInitScript((prefs) => {
    try {
      localStorage.setItem("strata-qa", "1");
      localStorage.setItem("strata-grip-hint", "1");
      if (!localStorage.getItem("strata-prefs")) localStorage.setItem("strata-prefs", prefs);
    } catch {
      /* storage blocked */
    }
  }, PREFS(master));
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  return { ctx, page, errors };
}

/** Lesson CTA: the footer's last button must sit fully inside the viewport. null = page has no lesson footer. */
const ctaCheck = (page) =>
  page.evaluate(() => {
    const bar = document.querySelector(".action-bar");
    if (!bar) return null;
    const btns = [...bar.querySelectorAll("button, a")].filter((b) => b.getBoundingClientRect().height > 0);
    if (!btns.length) return null;
    const r = btns[btns.length - 1].getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight + 0.5 && r.left >= 0 && r.right <= innerWidth + 0.5;
  });

async function measure(page, errors, tag, shot) {
  const res = await page.evaluate(scan);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const cta = await ctaCheck(page);
  if (shot) await page.screenshot({ path: join(outDir, `${shot}.png`) });
  const fail = res.low.length > 0 || errors.length > 0 || overflow > 0 || cta === false;
  console.log(`${fail ? "FAIL" : "ok  "} ${tag}  low=${res.low.length} small=${res.small.length}${errors.length ? ` errors=${errors.length}` : ""}${overflow > 0 ? ` overflow=${overflow}` : ""}${cta === false ? " CTA-off-screen" : ""}`);
  for (const l of res.low) console.log(`       ${l.ratio.toFixed(2)}${l.large ? " large" : ""}  ${l.size}px/${l.weight}  <${l.tag} ${l.cls}> "${l.text}"`);
  for (const e of errors) console.log(`       error: ${e}`);
  return { tag, low: res.low, small: res.small, errors: [...errors], overflow, cta, fail };
}

async function jump(page, stage) {
  await page.getByRole("button", { name: /^More/ }).click();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Inspector menu" }).click();
  await page.getByRole("group", { name: "Stage jumper" }).getByRole("button", { name: String(stage + 1), exact: true }).click();
  await page.waitForTimeout(700);
}

let failures = 0;
for (const part of parts)
  for (const vw of vws)
    for (const scheme of schemes) {
      const results = [];
      const tagBase = `${vw} ${scheme.padEnd(5)}`;
      if (part === "routes") {
        for (const r of await routes()) {
          const { ctx, page, errors } = await open(vw, scheme, { master: false });
          await page.goto(base + r, { waitUntil: "networkidle" });
          await page.waitForTimeout(450);
          const shot = r.startsWith("/lesson/") ? null : `${vw}-${scheme}-route${slug(r) ? "-" + slug(r) : "-home"}`;
          results.push({ route: r, ...(await measure(page, errors, `${tagBase} ${r}`, shot)) });
          await ctx.close();
        }
      } else if (part === "sims") {
        const list = JSON.parse(execSync("npx tsx --tsconfig scripts/tsconfig.json scripts/list-sim-stages.ts", { encoding: "utf8" }));
        for (const s of list) {
          const { ctx, page, errors } = await open(vw, scheme);
          await page.goto(`${base}/lesson/${s.lessonId}/`, { waitUntil: "networkidle" });
          await page.waitForTimeout(400);
          try {
            if (s.stage > 0) await jump(page, s.stage);
            if (s.kind === "nudge") {
              // Walk the flow to its try-it screen: answer predict/check screens with the first option, Continue elsewhere.
              for (let k = 0; k < 14 && !(await page.locator(".plate").count()); k++) {
                const radio = page.getByRole("radio").first();
                if (await radio.count()) {
                  await radio.click();
                  await page.getByRole("button", { name: "Check", exact: true }).click();
                  await page.waitForTimeout(300);
                  const again = page.getByRole("button", { name: "Try again" });
                  if (await again.count()) {
                    await again.click();
                    const radios = page.getByRole("radio");
                    for (let j = 1; j < (await radios.count()); j++) {
                      await radios.nth(j).click();
                      await page.getByRole("button", { name: "Check", exact: true }).click();
                      await page.waitForTimeout(250);
                      if (await page.getByRole("button", { name: "Try again" }).count()) await page.getByRole("button", { name: "Try again" }).click();
                      else break;
                    }
                  }
                }
                const cont = page.getByRole("button", { name: /^Continue/ });
                if (await cont.count()) await cont.first().click();
                await page.waitForTimeout(400);
              }
            }
            const tag = `${tagBase} ${s.kind} ${s.lessonId}#${s.stage}${s.sim ? " " + s.sim : ""}`;
            results.push({ lessonId: s.lessonId, stage: s.stage, sim: s.sim, ...(await measure(page, errors, tag, `${vw}-${scheme}-sim-${s.lessonId}-${s.stage}`)) });
            // Interaction: nudge the first slider with the keyboard and open "All readouts", then measure again.
            const range = page.locator('.slider input[type="range"]').first();
            if (await range.count()) {
              await range.focus();
              await page.keyboard.press("ArrowRight");
            }
            const sm = page.locator("summary", { hasText: "All readouts" }).first();
            if (await sm.count()) await sm.evaluate((e) => e.click());
            await page.waitForTimeout(300);
            results.push({ lessonId: s.lessonId, stage: s.stage, sim: s.sim, after: true, ...(await measure(page, errors, `${tag} [slider + All readouts]`, null)) });
          } catch (e) {
            errors.push(`drive failed: ${e.message.split("\n")[0]}`);
            results.push({ lessonId: s.lessonId, stage: s.stage, ...(await measure(page, errors, `${tagBase} ${s.lessonId}#${s.stage} DRIVE FAILED`, null)) });
          }
          await ctx.close();
        }
      } else if (part === "states") {
        for (const [r, name, drive] of STATES) {
          const { ctx, page, errors } = await open(vw, scheme);
          await page.goto(base + r, { waitUntil: "networkidle" });
          await page.waitForTimeout(450);
          try {
            await drive(page);
          } catch (e) {
            errors.push(`state "${name}" failed: ${e.message.split("\n")[0]}`);
          }
          await page.waitForTimeout(600);
          results.push({ route: r, state: name, ...(await measure(page, errors, `${tagBase} ${r} [${name}]`, `${vw}-${scheme}-state-${slug(name)}`)) });
          await ctx.close();
        }
      } else if (part === "confetti") {
        // Finish u0-l1 from its last stage (statutory swipe drill) and count confetti canvases.
        for (const reduced of [true, false]) {
          const { ctx, page, errors } = await open(vw, scheme, { reduced });
          await page.goto(`${base}/lesson/u0-l1/`, { waitUntil: "networkidle" });
          await page.waitForTimeout(400);
          let canvases = -1;
          try {
            const n = await (async () => {
              await page.getByRole("button", { name: /^More/ }).click();
              await page.waitForTimeout(250);
              await page.getByRole("button", { name: "Inspector menu" }).click();
              await page.getByRole("group", { name: "Stage jumper" }).getByRole("button").first().waitFor();
              return page.getByRole("group", { name: "Stage jumper" }).getByRole("button").count();
            })();
            await page.getByRole("group", { name: "Stage jumper" }).getByRole("button", { name: String(n), exact: true }).click();
            await page.waitForTimeout(600);
            await page.getByRole("button", { name: /^Start drill/ }).click();
            for (let k = 0; k < 30 && !(await page.getByRole("button", { name: "Continue", exact: true }).count()); k++) {
              await page.getByRole("button", { name: /TRUE/ }).first().click().catch(() => {});
              await page.waitForTimeout(350);
            }
            await page.getByRole("button", { name: "Continue", exact: true }).click();
            await page.getByText(/Lesson mastered|Boss Exam cleared/).waitFor({ timeout: 8000 });
            await page.waitForTimeout(400);
            canvases = await page.evaluate(() => [...document.querySelectorAll("canvas")].filter((c) => !c.closest(".plate")).length);
            await page.waitForTimeout(reduced ? 200 : 2200); // let the entrance fades finish before measuring contrast
          } catch (e) {
            errors.push(`finish failed: ${e.message.split("\n")[0]}`);
          }
          const ok = reduced ? canvases === 0 : canvases > 0;
          if (!ok) failures++;
          console.log(`${ok ? "ok  " : "FAIL"} ${tagBase} confetti ${reduced ? "reduced motion → expect none" : "motion on → expect a canvas"}: ${canvases} canvas(es)`);
          const m = await measure(page, errors, `${tagBase} end of lesson (${reduced ? "reduced" : "motion"})`, `${vw}-${scheme}-end-of-lesson-${reduced ? "reduced" : "motion"}`);
          // Node pulse also stops under reduced motion (§6).
          results.push({ state: "end of lesson", reduced, canvases, ...m });
          await ctx.close();
        }
        // Pulse ring on the current path node: animation none under reduced motion.
        const { ctx, page } = await open(vw, scheme, { master: false });
        await page.goto(`${base}/unit/u0/`, { waitUntil: "networkidle" });
        const anim = await page.evaluate(() => {
          const r = document.querySelector(".ds-node-ring");
          return r ? getComputedStyle(r).animationName : "no ring";
        });
        const ok = anim === "none" || anim === "no ring";
        if (!ok) failures++;
        console.log(`${ok ? "ok  " : "FAIL"} ${tagBase} node pulse under reduced motion: animation-name=${anim}`);
        results.push({ state: "node pulse reduced", anim, fail: !ok });
        await ctx.close();
      }
      failures += results.filter((r) => r.fail).length;
      await writeFile(join(outDir, `sweep-${part}-${vw}-${scheme}.json`), JSON.stringify(results, null, 1));
    }
await browser.close();
console.log(`${failures} failure(s)`);
process.exit(failures ? 1 : 0);
