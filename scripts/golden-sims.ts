/**
 * Golden values for the sim redraw (Phase 15.5-v3e). For every sim: its params (limits), its draggable parts (handle key +
 * axis) and its readouts (raw value, formatted text, tone) at 3 fixed input states — min (every param at its min / first
 * option), default, and objective-met (a state found to meet the first lesson sim-stage goal for that sim).
 *
 *   npm run golden:record            add entries for sims that have none (never overwrites)
 *   npm run golden:record -- --force u7-fan   re-record one sim (only when its behaviour is meant to change: ask Bink first)
 *
 * The check is tests/sims.golden.test.ts (npm run test:golden). Readouts are behaviour, so a redraw must keep them exact.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { ALL_SIMS } from "../src/content/sims";
import { goldenFor, GOLDEN_FILE, type Golden } from "./lib/golden";

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const db: Record<string, Golden> = existsSync(GOLDEN_FILE) ? JSON.parse(readFileSync(GOLDEN_FILE, "utf8")) : {};
let added = 0;
for (const def of ALL_SIMS) {
  if (only.length && !only.includes(def.id)) continue;
  if (db[def.id] && !force) continue;
  db[def.id] = goldenFor(def);
  added++;
  const g = db[def.id];
  console.log(`${def.id}: ${g.states.map((s) => `${s.name}${s.goalMet === false ? " (goal NOT met)" : ""}`).join(", ")}`);
}
const sorted = Object.fromEntries(Object.keys(db).sort().map((k) => [k, db[k]]));
writeFileSync(GOLDEN_FILE, JSON.stringify(sorted, null, 1) + "\n");
console.log(`${added} recorded · ${Object.keys(db).length} sims in ${GOLDEN_FILE}`);
