/* eslint-disable @typescript-eslint/no-require-imports -- plain Node/CJS test runner (Playwright from the global install). */
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
    // Client-side navigation to /lab?sim=… while /lab is mounted (e.g. Codex thumbnail → Sim Lab, then another).
    await page.evaluate(() => {
      const a = document.createElement("a");
      a.href = `${location.pathname.replace(/lab\/?$/, "")}lab/?sim=u3-pillar`;
      a.id = "t-nav";
      a.textContent = "go";
      document.body.appendChild(a);
    });
    await page.evaluate(() => window.next && window.next.router && window.next.router.push(`/lab/?sim=u3-pillar`));
    await page.waitForTimeout(900);
    ok("sim lab: client navigation to another ?sim updates the sim", /tributary|pillar/i.test((await heading()) || ""), (await heading()) || "");
    if (phone.errors.length) ok("sim lab: console errors", false, phone.errors.slice(0, 2).join(" | "));
    void link;
    await phone.ctx.close();
  }

  if (t.extra) await t.extra(t);
};
