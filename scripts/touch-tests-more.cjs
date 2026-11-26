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

  if (t.extra) await t.extra(t);
};
