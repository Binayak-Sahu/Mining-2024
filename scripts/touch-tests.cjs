/* eslint-disable @typescript-eslint/no-require-imports -- plain Node/CJS test runner (Playwright from the global install). */
/**
 * Mobile-touch regression tests (Phase 14.5 hotfix). Real touch input via CDP (Input.dispatchTouchEvent),
 * so the browser's own touch-action / scroll arbitration is exercised — not synthetic mouse events.
 *
 *   npm run build && PORT=4310 node scripts/serve-out.mjs &
 *   NODE_PATH=$(npm root -g) node scripts/touch-tests.cjs http://localhost:4310 [outDir]
 *
 * Exit code 1 on any failure.
 */
const { chromium } = require("playwright");

const base = process.argv[2] || "http://localhost:4310";
const out = process.argv[3] || null;
const results = [];
const ok = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function newPhone(b, scheme = "light") {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: scheme, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, cdp, errors };
}

/** A real finger drag: touchStart, n touchMoves along a straight line, touchEnd. */
async function touchDrag(cdp, x0, y0, x1, y1, steps = 14) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, id: 1 }] });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await new Promise((r) => setTimeout(r, 250));
}

async function touchTap(cdp, x, y) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  await new Promise((r) => setTimeout(r, 40));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await new Promise((r) => setTimeout(r, 300));
}

/** Put the element in the middle of the viewport with page room to scroll either way. */
async function centre(page, locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  return locator.boundingBox();
}

async function sliderDiagonal(phone, label) {
  const { page, cdp } = phone;
  // Grip parameters keep their sliders in a collapsed "Fine-tune" row — open it so every slider is tested.
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  await page.waitForTimeout(200);
  const sliders = page.locator(".slider, .sim-slider");
  const n = await sliders.count();
  let failures = 0;
  for (let k = 0; k < n; k++) {
    const s = sliders.nth(k);
    const input = s.locator("input[type=range]");
    if (await input.isDisabled()) continue;
    let box = await centre(page, s);
    if (!box) continue;
    // The lesson's sim stage is sticky: scroll until the slider is clear of it (a finger can only reach an uncovered slider).
    for (let tries = 0; tries < 20; tries++) {
      const t0 = await s.locator(".slider-thumb, .sim-slider-thumb").boundingBox();
      const covered = await page.evaluate(([x, y, sel]) => { const e = document.elementFromPoint(x, y); return !(e && e.closest(sel)); }, [t0.x + t0.width / 2, t0.y + t0.height / 2, ".slider, .sim-slider"]);
      if (!covered) break;
      await page.evaluate(() => window.scrollBy(0, -40));
      await page.waitForTimeout(80);
    }
    box = await s.boundingBox();
    const before = await input.inputValue();
    const thumb = await s.locator(".slider-thumb, .sim-slider-thumb").boundingBox();
    const sy0 = await page.evaluate(() => scrollY);
    const x0 = thumb.x + thumb.width / 2;
    const y0 = thumb.y + thumb.height / 2;
    // Mostly-horizontal drag with a real vertical component (≈ 52°: a sloppy thumb drag on a phone), towards whichever side has room.
    const dir = x0 > box.x + box.width / 2 ? -1 : 1;
    await touchDrag(cdp, x0, y0, x0 + dir * 72, y0 + 92);
    const after = await input.inputValue();
    const sy1 = await page.evaluate(() => scrollY);
    const pass = after !== before && Math.abs(sy1 - sy0) < 2;
    if (!pass) failures++;
    ok(`${label}: slider ${k + 1}/${n} diagonal drag`, pass, `value ${before}→${after}, scroll Δ${Math.round(sy1 - sy0)}`);
  }
  return failures;
}

async function gripDiagonal(phone, label) {
  const { page, cdp } = phone;
  const grips = page.locator('svg [role="slider"]');
  const n = await grips.count();
  for (let k = 0; k < n; k++) {
    const g = grips.nth(k);
    await centre(page, page.locator("svg[role=img]").first());
    const before = await g.getAttribute("aria-valuenow");
    const bb = await g.boundingBox();
    if (!bb) continue;
    const sy0 = await page.evaluate(() => scrollY);
    const x0 = bb.x + bb.width / 2;
    const y0 = bb.y + bb.height / 2;
    const name = (await g.getAttribute("aria-label")) || "";
    // A diagonal drag along the grip's own axis (x grips: mostly horizontal; y grips: mostly vertical).
    const isY = /O₂|Oxygen|Likelihood|Depth|depth|height|Height/.test(name) && bb.height >= bb.width - 2;
    const dx = isY ? 30 : -70;
    const dy = isY ? -60 : 35;
    await touchDrag(cdp, x0, y0, x0 + dx, y0 + dy);
    const after = await g.getAttribute("aria-valuenow");
    const sy1 = await page.evaluate(() => scrollY);
    ok(`${label}: grip ${k + 1}/${n} diagonal drag (${name.replace("Drag to change ", "")})`, after !== before && Math.abs(sy1 - sy0) < 2, `value ${before}→${after}, scroll Δ${Math.round(sy1 - sy0)}`);
  }
}

async function pageStillScrolls(phone, label) {
  // Scrolling must still work when a finger lands on a slider track away from the thumb (vertical swipe).
  const { page, cdp } = phone;
  const s = page.locator(".slider, .sim-slider").first();
  if (!(await s.count())) return;
  const box = await centre(page, s);
  const thumb = await s.locator(".slider-thumb, .sim-slider-thumb").boundingBox();
  const x = thumb.x + thumb.width / 2 > box.x + box.width / 2 ? box.x + 20 : box.x + box.width - 20;
  const y = box.y + box.height / 2;
  const sy0 = await page.evaluate(() => scrollY);
  const below = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
  const up = below < sy0; // swipe in the direction with more page to scroll
  const room = up ? sy0 : below;
  await touchDrag(cdp, x, y, x, up ? y + 160 : y - 160, 10);
  const sy1 = await page.evaluate(() => scrollY);
  ok(`${label}: vertical swipe over a slider track still scrolls the page`, Math.abs(sy1 - sy0) >= Math.min(40, room - 2), `scroll Δ${Math.round(sy1 - sy0)} (room ${Math.round(room)})`);
}

(async () => {
  const b = await chromium.launch();

  // 1. Slider + grip scroll-steal (Sim Lab: Coward's triangle has 2 sliders + 2 grips; u3 pillar has a segmented param too).
  for (const sim of ["u7-coward", "u3-pillar", "u0-overburden"]) {
    const phone = await newPhone(b);
    await phone.page.goto(`${base}/lab/?sim=${sim}`, { waitUntil: "networkidle" });
    await phone.page.waitForTimeout(600);
    await sliderDiagonal(phone, `lab ${sim}`);
    await gripDiagonal(phone, `lab ${sim}`);
    await pageStillScrolls(phone, `lab ${sim}`);
    if (phone.errors.length) ok(`lab ${sim}: console errors`, false, phone.errors.slice(0, 2).join(" | "));
    await phone.ctx.close();
  }

  if (process.env.ONLY_SLIDERS) return finish(b);
  await require("./touch-tests-more.cjs")({ b, base, out, ok, newPhone, touchDrag, touchTap, centre, sliderDiagonal, gripDiagonal });
  return finish(b);
})();

async function finish(b) {
  await b.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} touch checks passed`);
  process.exit(failed.length ? 1 : 0);
}
