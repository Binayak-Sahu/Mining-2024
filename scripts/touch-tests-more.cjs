/**
 * Mobile-touch regression tests, part 2 (Phase 14.5 hotfix). Called from touch-tests.cjs.
 */
module.exports = async function more(t) {
  const { b, base, ok, newPhone, touchTap } = t;

  // ---- 2. Sim Lab picker: switch sims 5 times through the bottom-sheet drawer with real taps ----
  {
    const phone = await newPhone(b);
    const { page, cdp } = phone;
    await page.goto(`${base}/lab/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const heading = () => page.locator("section h2").first().textContent();
    const seen = [await heading()];
    const targets = [5, 12, 20, 33, 47];
    let switched = 0;
    for (const n of targets) {
      const trigger = page.getByRole("button", { name: /Browse all/ });
      const tb = await trigger.boundingBox();
      await touchTap(cdp, tb.x + tb.width / 2, tb.y + tb.height / 2);
      await page.waitForTimeout(500);
      const items = page.locator('[role="dialog"] button.w-full');
      const item = items.nth(n);
      await item.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(250);
      const want = ((await item.textContent()) || "").replace(/^U\d+/, "").trim();
      const ib = await item.boundingBox();
      await touchTap(cdp, ib.x + ib.width / 2, ib.y + ib.height / 2);
      await page.waitForTimeout(700);
      const h = (await heading()) || "";
      const open = await page.locator('[role="dialog"]').count();
      if (h.trim() === want && !open) switched++;
      seen.push(h);
    }
    ok("sim lab: 5 drawer switches with touch taps", switched === targets.length, `${switched}/5 switched; url ${page.url().replace(base, "")}`);
    // Back to /lab with a ?sim param while already on /lab (client navigation), and a fresh load with ?sim.
    await page.evaluate(() => window.history.pushState(null, "", window.location.pathname));
    const link = await page.evaluate(() => !!document.querySelector('a[href*="/lab"]'));
    await page.goto(`${base}/lab/?sim=u7-coward`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    ok("sim lab: fresh load honours ?sim", /Coward/.test((await heading()) || ""), (await heading()) || "");
    // Returning to /lab with a ?sim param through real links: Codex thumbnail → lab, back, another thumbnail.
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.setItem("strata-prefs", JSON.stringify({ state: { theme: "system", muted: true, masterUnlock: true, theoryFirst: true }, version: 1 })));
    let thumbs = 0;
    for (const k of [0, 3]) {
      await page.goto(`${base}/codex/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const a = page.locator('a[href*="sim="]').nth(k);
      const href = (await a.getAttribute("href")) || "";
      const want = decodeURIComponent((href.split("sim=")[1] || "").split("&")[0]);
      await a.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(250);
      const ab = await a.boundingBox();
      await touchTap(cdp, ab.x + ab.width / 2, ab.y + ab.height / 2);
      await page.waitForURL(/\/lab\//, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(800);
      const h = (await heading()) || "";
      const title = await page.evaluate((id) => id, want);
      const url = page.url();
      if (url.includes(`sim=${want}`) && h.length > 0) thumbs++;
      void title;
    }
    ok("sim lab: Codex thumbnails open the right sim (twice, with ?sim)", thumbs === 2, `${thumbs}/2`);
    if (phone.errors.length) ok("sim lab: console errors", false, phone.errors.slice(0, 2).join(" | "));
    void link;
    await phone.ctx.close();
  }

  // ---- 2b. Repair app keeps progress, clears only strata-* caches; Home restore link only when empty ----
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    ok("home: 'Restore from backup' shown when progress is empty", (await page.getByRole("link", { name: /Restore from backup/ }).count()) === 1);
    const seed = JSON.stringify({ state: { xp: 40, xpByDay: {}, streak: 1, longestStreak: 1, lastActiveDay: "2026-11-25", heartsLost: 0, lessons: { "u0-l1": { done: true, best: 3, completedAt: 1 } }, attempts: {}, codex: {}, formulas: {}, srs: {}, warmupDoneDay: null, exams: [], freeRoam: false }, version: 2 });
    await page.evaluate((s) => localStorage.setItem("strata-progress-v1", s), seed);
    await page.evaluate(async () => { const c = await caches.open("strata-test-old"); await c.put("/x", new Response("x")); const d = await caches.open("other-app"); await d.put("/y", new Response("y")); });
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    ok("home: no restore link once progress exists", (await page.getByRole("link", { name: /Restore from backup/ }).count()) === 0);
    await page.goto(`${base}/profile/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const btn = page.getByRole("button", { name: /Repair app/ });
    await btn.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const bb = await btn.boundingBox();
    await touchTap(cdp, bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);
    const after = await page.evaluate(async () => ({ prog: localStorage.getItem("strata-progress-v1"), keys: await caches.keys(), regs: (await navigator.serviceWorker.getRegistrations()).length }));
    ok("repair app: progress byte-identical", after.prog === seed);
    // After the reload a fresh worker and cache may install again — the stale one must be gone.
    ok("repair app: stale strata-* cache removed, other apps' caches kept", !after.keys.includes("strata-test-old") && after.keys.includes("other-app"), JSON.stringify(after.keys));
    await ctx.close();
  }

  // ---- 3/4. u7-l1 by touch: back navigation, review state, swipe back, Notes, recap, sim stage ----
  for (const scheme of ["light", "dark"]) {
    const phone = await newPhone(b, scheme);
    const { page, cdp } = phone;
    const L = `u7-l1 ${scheme}`;
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("strata-qa", "1"); });
    await page.goto(`${base}/lesson/u7-l1/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const tapEl = async (loc) => { await loc.evaluate((el) => el.scrollIntoView({ block: "center" })); await page.waitForTimeout(150); const bb = await loc.boundingBox(); await touchTap(cdp, bb.x + bb.width / 2, bb.y + bb.height / 2); };
    const hearts = () => page.locator('[aria-label$="safety hearts"]').first().getAttribute("aria-label");
    const h0 = await hearts();
    // Screen 1 (predict): answer by touch until right, Continue.
    for (let k = 0; k < 4; k++) {
      const r = page.locator('[role="radio"]:not([disabled])').first();
      await tapEl(r);
      await tapEl(page.getByRole("button", { name: /^Check$/ }));
      await page.waitForTimeout(350);
      if (await page.getByRole("button", { name: /Try again/ }).count()) { await tapEl(page.getByRole("button", { name: /Try again/ })); continue; }
      break;
    }
    await page.waitForTimeout(400);
    await tapEl(page.getByRole("button", { name: /^Continue$/ }).first());
    await page.waitForTimeout(600);
    ok(`${L}: Back button on screen 2`, (await page.getByRole("button", { name: "Previous screen" }).count()) === 1);
    await tapEl(page.getByRole("button", { name: "Previous screen" }));
    await page.waitForTimeout(600);
    const reviewBadge = (await page.getByText(/^Review$/).count()) > 0;
    const radiosDisabled = await page.locator('[role="radio"]').evaluateAll((els) => els.length > 0 && els.every((e) => e.disabled));
    ok(`${L}: back shows the answered screen in review state (no re-scoring)`, reviewBadge && radiosDisabled);
    ok(`${L}: hearts unchanged by back navigation`, (await hearts()) === h0, `${h0} → ${await hearts()}`);
    // Forward again, then swipe right on the explanation to go back.
    await tapEl(page.getByRole("button", { name: /^Continue$/ }).first());
    await page.waitForTimeout(600);
    const txt = page.locator(".lesson-screen p.flow-body").first();
    const tb = await txt.boundingBox();
    const before = await page.locator(".lesson-screen").first().innerText();
    await t.touchDrag(cdp, tb.x + 30, tb.y + tb.height / 2, tb.x + 230, tb.y + tb.height / 2 + 6, 10);
    await page.waitForTimeout(700);
    const after = await page.locator(".lesson-screen").first().innerText();
    ok(`${L}: swipe right goes back a screen`, before !== after && /Review/.test(after), "");
    // Notes sheet lists the explanation seen.
    // Notes live in the top bar's ⋯ menu (15.5c).
    await tapEl(page.getByRole("button", { name: /^More/ }));
    await page.waitForTimeout(400);
    await tapEl(page.getByRole("button", { name: /Lesson notes/ }));
    await page.waitForTimeout(500);
    const notes = await page.locator('[role="dialog"] li').count();
    ok(`${L}: Notes sheet lists explanations seen so far`, notes >= 1, `${notes} note(s)`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    if (phone.errors.length) ok(`${L}: console errors`, false, phone.errors.slice(0, 2).join(" | "));
    await phone.ctx.close();
  }
  // Recap + sim stage (Inspector jumper reaches stage 2; the run is a sandbox).
  for (const scheme of ["light", "dark"]) {
    const phone = await newPhone(b, scheme);
    const { page, cdp } = phone;
    const L = `u7-l1 sim ${scheme}`;
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("strata-qa", "1"); localStorage.setItem("strata-prefs", JSON.stringify({ state: { theme: "system", muted: true, masterUnlock: true, theoryFirst: true }, version: 1 })); });
    await page.goto(`${base}/lesson/u7-l1/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /^More/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Inspector menu" }).click();
    await page.waitForTimeout(400);
    await page.locator('[aria-label="Stage jumper"] button').nth(1).click();
    await page.waitForTimeout(1000);
    // Tap the completed first segment → read-only recap.
    const seg = page.getByRole("button", { name: /Re-read stage 1/ });
    const sb = await seg.boundingBox();
    await touchTap(cdp, sb.x + sb.width / 2, sb.y + sb.height / 2);
    await page.waitForTimeout(500);
    ok(`${L}: tapping a completed segment opens it read-only`, (await page.getByText(/read-only/).count()) > 0);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    // Sticky diagram: after scrolling, the canvas is still on screen.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const cv = await page.locator("svg[role=img]").first().boundingBox();
    ok(`${L}: diagram stays visible while controls scroll (sticky)`, cv && cv.y >= 40 && cv.y + cv.height <= 844, cv ? `top ${Math.round(cv.y)}` : "no canvas");
    await page.evaluate(() => window.scrollTo(0, 0));
    await t.sliderDiagonal(phone, L);
    await t.gripDiagonal(phone, L);
    // Compact success strip: reach the objective (fuel-rich zone) via the fine-tune sliders.
    await page.evaluate(() => {
      const set = (i, v) => { const el = document.querySelectorAll('.slider input[type=range]')[i]; const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; s.call(el, String(v)); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };
      set(0, 25); set(1, 12);
    });
    await page.waitForTimeout(800);
    const bar = await page.locator(".action-bar").boundingBox();
    ok(`${L}: success sheet is compact (≤ 150 px incl. Continue)`, bar && bar.height <= 150, bar ? `${Math.round(bar.height)} px` : "no bar");
    ok(`${L}: success sheet offers Why? and Continue`, (await page.getByRole("button", { name: "Why?" }).count()) === 1 && (await page.getByRole("button", { name: /^Continue$/ }).count()) >= 1);
    if (phone.errors.length) ok(`${L}: console errors`, false, phone.errors.slice(0, 2).join(" | "));
    await phone.ctx.close();
  }

  if (t.extra) await t.extra(t);
};
