/**
 * Golden test for the sim redraw (Phase 15.5-v3e): every sim's limits, draggable parts and readouts at its recorded
 * min / default / objective-met states must match tests/sims.golden.json exactly. A redraw changes pictures only.
 * Run: npm run test:golden
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_SIMS } from "../src/content/sims";
import { GOLDEN_FILE, firstGoal, readouts, type Golden } from "../scripts/lib/golden";

const db: Record<string, Golden> = JSON.parse(readFileSync(GOLDEN_FILE, "utf8"));

for (const def of ALL_SIMS) {
  test(`${def.id} golden`, () => {
    const g = db[def.id];
    assert.ok(g, `no golden entry for ${def.id}: run npm run golden:record before editing it`);
    assert.deepEqual(
      def.params.map((p) => ({ key: p.key, min: p.min, max: p.max, step: p.step, default: p.default, ...(p.options ? { options: p.options.map((o) => o.value) } : {}) })),
      g.params,
      "params / limits changed",
    );
    assert.deepEqual((def.handles ?? []).map((h) => ({ key: h.key, axis: h.axis })), g.handles, "draggable parts changed");
    assert.deepEqual(def.outputs.map((o) => o.key), g.outputs, "readout list changed");
    for (const s of g.states) {
      assert.deepEqual(readouts(def, s.vals), s.readouts, `readouts changed at ${s.name}`);
      if (s.name === "objective-met" && s.goalMet) {
        const goal = firstGoal(def.id)!.goal;
        assert.ok(goal.test(s.vals, def.compute(s.vals)), "objective no longer met at the recorded state");
      }
    }
  });
}
