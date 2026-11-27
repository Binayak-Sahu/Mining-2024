/**
 * Interaction states (15.5c): measured after scripted taps, because first-load scans miss sheets and later screens.
 * Each entry is [route, name, async (page) => void]; run them with the filter argument "states".
 */
export const STATES = [
  // 15.5d: path-node start popovers (current node, then a locked node).
  ["/unit/u7/", "node popover: current", async (page) => {
    await page.locator("button.path-node").first().tap();
    await page.locator(".node-pop").waitFor();
  }],
  ["/unit/u7/", "node popover: locked boss", async (page) => {
    const n = page.locator("button.path-node").last();
    await n.scrollIntoViewIfNeeded();
    await n.tap();
    await page.locator(".node-pop").waitFor();
  }],
  ["/lesson/u7-l1/", "wrong sheet + Why?", async (page) => {
    await page.getByRole("radio", { name: /No, dilution makes it safe/ }).click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Why?" }).click();
  }],
  ["/lesson/u7-l1/", "correct sheet + Why?", async (page) => {
    await page.getByRole("radio", { name: /Yes, on its way down/ }).click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Why?" }).click();
  }],
  ["/lesson/u7-l1/", "later screens (2, 3)", async (page) => {
    await page.getByRole("radio", { name: /Yes, on its way down/ }).click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Continue" }).click();
  }],
  ["/lesson/u7-l1/", "⋯ menu open", async (page) => {
    await page.getByRole("button", { name: /^More/ }).click();
  }],
  ["/lesson/u7-l1/", "Sources sheet", async (page) => {
    await page.getByRole("button", { name: /^More/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Sources/ }).click();
  }],
  ["/lesson/u3-l1/", "Inspector sheet + strip", async (page) => {
    await page.getByRole("button", { name: /^More/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Inspector menu" }).click();
  }],
  ["/lesson/u3-l1/", "predict stage, wrong first miss", async (page) => {
    await page.getByRole("button", { name: /^More/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Inspector menu" }).click();
    await page.getByRole("group", { name: "Stage jumper" }).getByRole("button", { name: "3", exact: true }).click();
    await page.waitForTimeout(600);
    const o = page.locator("button[aria-pressed].answer-tile");
    await o.nth((await o.count()) - 1).click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
  }],
  ["/lesson/u3-l1/", "crisis stage, after a pick", async (page) => {
    await page.getByRole("button", { name: /^More/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Inspector menu" }).click();
    await page.getByRole("group", { name: "Stage jumper" }).getByRole("button", { name: "6", exact: true }).click();
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: /^Take charge/ }).click();
    await page.waitForTimeout(300);
    await page.locator(".lesson-screen button.answer-tile").first().click();
  }],
  // ---- 15.5e: remaining pages, boss rounds, exam results, end of lesson ----
  ["/exam/", "exam question screen", async (page) => {
    await page.getByRole("button", { name: "Start mock exam" }).click();
    await page.getByRole("button", { name: /^Question 1(,|$)/ }).waitFor();
  }],
  ["/exam/", "exam results", async (page) => {
    await page.getByRole("button", { name: "Start mock exam" }).click();
    await page.locator(".tile-3d.w-full").first().click().catch(() => {});
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await page.getByRole("button", { name: "New paper" }).waitFor();
  }],
  ["/exam/", "exam analytics after an attempt", async (page) => {
    await page.getByRole("button", { name: "Start mock exam" }).click();
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await page.getByRole("button", { name: "Analytics" }).click();
    await page.getByText("Recent attempts").waitFor();
  }],
  ["/profile/", "reset dialog", async (page) => {
    await page.getByRole("button", { name: "Reset all progress" }).click();
    await page.getByRole("dialog").waitFor();
  }],
  ["/codex/", "statutes tab", async (page) => {
    await page.getByRole("button", { name: "Statutes", exact: true }).click();
  }],
  ["/codex/", "formulas tab", async (page) => {
    await page.getByRole("button", { name: "Formulas", exact: true }).click();
  }],
  ["/tools/", "last calculator", async (page) => {
    await page.getByRole("group", { name: "Calculators" }).getByRole("button").last().click();
  }],
  ["/lab/", "sim browser sheet (phones)", async (page) => {
    const b = page.getByRole("button", { name: /^Browse all/ });
    if (await b.isVisible()) {
      await b.click();
      await page.getByRole("dialog").waitFor();
    }
  }],
  ["/lab/?sim=u3-pillar", "sim lab: All readouts open", async (page) => {
    const sm = page.locator("summary", { hasText: "All readouts" });
    await sm.evaluate((e) => e.click());
  }],
  ["/lesson/u7-boss/", "boss round: first stage", async () => {}],
  ["/lesson/u7-boss/", "boss round: final drill, one call made", async (page) => {
    await page.getByRole("button", { name: /^More/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Inspector menu" }).click();
    const jumper = page.getByRole("group", { name: "Stage jumper" });
    await jumper.getByRole("button").first().waitFor();
    const n = await jumper.getByRole("button").count();
    await jumper.getByRole("button", { name: String(n), exact: true }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: /^Start drill/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /FALSE/ }).first().click();
  }],
  ["/lesson/u7-boss/", "boss round: stage 2", async (page) => {
    await page.getByRole("button", { name: /^More/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Inspector menu" }).click();
    await page.getByRole("group", { name: "Stage jumper" }).getByRole("button", { name: "2", exact: true }).click();
  }],
  ["/warmup/", "warmup session (seeded review item)", async (page) => {
    await page.evaluate(() => {
      const seed = { state: { xp: 40, xpByDay: {}, streak: 1, longestStreak: 1, lastActiveDay: "2026-11-25", heartsLost: 0, lessons: { "u7-l1": { completedAt: "2026-11-25", attempts: 1, bestHearts: 3, bestXp: 40 } }, attempts: {}, codex: {}, formulas: {}, srs: { "u7-l1#3": { key: "u7-l1#3", lessonId: "u7-l1", stageIndex: 3, concept: "Seed", box: 1, due: "2020-01-01", misses: 1, lastSeen: "2020-01-01" } }, warmupDoneDay: null, exams: [], freeRoam: false }, version: 2 };
      localStorage.setItem("strata-progress-v1", JSON.stringify(seed));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Start warmup" }).click();
    await page.waitForTimeout(600);
  }],
];
