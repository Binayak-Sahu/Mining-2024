/**
 * Fixed screenshot set for design work (Phase 15.5 onward): the same routes and states every time, so slices can be
 * pixel-diffed against a "before" folder.
 *
 *   NEXT_PUBLIC_BASE_PATH=/Mining-2024 npm run build && NEXT_PUBLIC_BASE_PATH=/Mining-2024 PORT=4310 node scripts/serve-out.mjs &
 *   NODE_PATH=$(npm root -g) node scripts/shots.mjs http://localhost:4310/Mining-2024 .audit/15.5a-before
 *   NODE_PATH=$(npm root -g) node scripts/shots.mjs diff .audit/15.5a-before .audit/15.5a-after
 *
 * Shots are 390×844, deviceScaleFactor 1, reduced motion, service worker blocked, light + dark (colour scheme,
 * theme pref "system"), with localStorage["strata-qa"]="1" and the Inspector master unlock on (needed for the sim
 * stage jumper). Each state is saved as `<scheme>-<name>.png` (viewport) and, for pages, `<scheme>-<name>-full.png`.
 * /design-system is shot only if the route exists (HTTP 200).
 *
 * Diff mode compares every PNG present in both folders pixel by pixel and prints the changed-pixel count and the
 * bounding box of the change. Exit code 1 if any file differs or is missing on one side.
 */
import { createRequire } from "node:module";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const SCHEMES = ["light", "dark"];
const PREFS = JSON.stringify({ state: { theme: "system", muted: false, masterUnlock: true, theoryFirst: true }, version: 1 });

/** Route shots: [name, path]. */
const PAGES = [
  ["campaign", "/"],
  ["unit-u7", "/unit/u7/"],
  ["tools", "/tools/"],
  ["exam", "/exam/"],
  ["profile", "/profile/"],
];

const settle = (page, ms = 600) => page.waitForTimeout(ms);

/** Lesson states, each a function that drives a fresh page to the state and returns the shots to take. */
const STATES = [
  {
    // u7-l1 flow screen 1 (predict): pick a wrong option, Check → "Not quite" verdict. Then the right one → explain screen.
    path: "/lesson/u7-l1/",
    async run(page, shoot) {
      await page.getByRole("radio", { name: /No, dilution makes it safe/ }).click();
      await page.getByRole("button", { name: "Check", exact: true }).click();
      await page.getByText("Not quite").first().waitFor();
      await settle(page);
      await shoot("lesson-question-wrong");
      await page.getByRole("button", { name: "Try again" }).click();
      await page.getByRole("radio", { name: /Yes, on its way down/ }).click();
      await page.getByRole("button", { name: "Check", exact: true }).click();
      await settle(page);
      await shoot("lesson-question-right");
      await page.getByRole("button", { name: "Continue" }).click();
      await settle(page);
      await shoot("lesson-read");
    },
  },
  {
    // u3-l1 stage 2 (sim) via the Inspector stage jumper.
    path: "/lesson/u3-l1/",
    async run(page, shoot) {
      await page.getByRole("button", { name: /^More/ }).click();
      await settle(page, 400);
      await shoot("lesson-more-menu");
      await page.getByRole("button", { name: "Inspector menu" }).click();
      await page.getByRole("group", { name: "Stage jumper" }).getByRole("button", { name: "2", exact: true }).click();
      await settle(page, 900);
      await shoot("lesson-sim-stage");
    },
  },
];

async function newPage(browser, scheme) {
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
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  return { ctx, page, errors };
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function shootAll(base, out) {
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  let problems = 0;
  const report = (name, errors, ov) => {
    const bad = errors.length > 0 || ov > 0;
    if (bad) problems++;
    console.log(`${bad ? "WARN" : "ok  "}  ${name}${errors.length ? `  console errors: ${errors.join(" | ")}` : ""}${ov > 0 ? `  horizontal overflow ${ov}px` : ""}`);
  };
  const pages = [...PAGES];
  const probe = await fetch(`${base}/design-system/`).catch(() => null);
  if (probe && probe.ok) pages.push(["design-system", "/design-system/"]);

  for (const scheme of SCHEMES) {
    for (const [name, path] of pages) {
      const { ctx, page, errors } = await newPage(browser, scheme);
      await page.goto(base + path, { waitUntil: "networkidle" });
      await settle(page, 900);
      await page.screenshot({ path: join(out, `${scheme}-${name}.png`) });
      await page.screenshot({ path: join(out, `${scheme}-${name}-full.png`), fullPage: true });
      report(`${scheme}-${name}`, errors, await overflow(page));
      await ctx.close();
    }
    for (const st of STATES) {
      const { ctx, page, errors } = await newPage(browser, scheme);
      await page.goto(base + st.path, { waitUntil: "networkidle" });
      await settle(page, 900);
      const shot = async (name) => {
        await page.screenshot({ path: join(out, `${scheme}-${name}.png`) });
        report(`${scheme}-${name}`, errors, await overflow(page));
      };
      try {
        await st.run(page, shot);
      } catch (e) {
        problems++;
        console.log(`FAIL  ${scheme} ${st.path}: ${e.message.split("\n")[0]}`);
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(problems ? `${problems} shot(s) with problems` : "all shots clean");
  return problems;
}

async function diff(a, b) {
  const names = new Set([...(await readdir(a)), ...(await readdir(b))].filter((f) => f.endsWith(".png")));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let changed = 0;
  for (const f of [...names].sort()) {
    let A, B;
    try {
      A = (await readFile(join(a, f))).toString("base64");
      B = (await readFile(join(b, f))).toString("base64");
    } catch {
      changed++;
      console.log(`MISSING  ${f}`);
      continue;
    }
    const r = await page.evaluate(
      async ([A, B]) => {
        const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = "data:image/png;base64," + s; });
        const [ia, ib] = await Promise.all([load(A), load(B)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return { size: `${ia.width}×${ia.height} vs ${ib.width}×${ib.height}` };
        const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
        const da = px(ia), db = px(ib);
        let n = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let i = 0; i < da.length; i += 4) {
          const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
          if (d > 0) {
            n++; max = Math.max(max, d);
            const p = i / 4, x = p % ia.width, y = (p - x) / ia.width;
            x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
          }
        }
        return { n, max, box: n ? `x${x0}–${x1} y${y0}–${y1}` : "", total: da.length / 4 };
      },
      [A, B],
    );
    if (r.size) { changed++; console.log(`SIZE     ${f}  ${r.size}`); continue; }
    if (r.n) changed++;
    console.log(`${r.n ? "DIFF    " : "same    "} ${f}${r.n ? `  ${r.n} px (${((100 * r.n) / r.total).toFixed(3)} %), max channel Δ ${r.max}, box ${r.box}` : ""}`);
  }
  await browser.close();
  console.log(changed ? `${changed} file(s) differ` : "all identical");
  return changed;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "diff") {
  process.exit((await diff(rest[0], rest[1])) ? 1 : 0);
} else {
  const base = (cmd || "http://localhost:4310").replace(/\/$/, "");
  const out = rest[0] || ".audit/shots";
  process.exit((await shootAll(base, out)) ? 1 : 0);
}
