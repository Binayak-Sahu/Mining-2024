/**
 * Writes the first-draft DESIGN.md §5.5 unit illustrations to src/assets/illustrations/u0.svg … u10.svg.
 * The .svg files are the source of truth once written: Bink edits them in Figma and exports over the same name.
 * To protect those edits, this script only overwrites a file that still carries its draft marker comment;
 * pass --force to overwrite anyway, and unit ids (e.g. u3 u5) to limit which files it writes.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/draw-illustrations.ts [--force] [u3 u5 …]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DRAWINGS } from "./illustrations/drawings";

const MARK = "<!-- draft: scripts/draw-illustrations.ts -->";
const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const dir = join(__dirname, "..", "src", "assets", "illustrations");

for (const [id, d] of Object.entries(DRAWINGS)) {
  if (only.length && !only.includes(id)) continue;
  const file = join(dir, `${id}.svg`);
  if (existsSync(file) && !force && !readFileSync(file, "utf8").includes(MARK)) {
    console.log(`skip ${id}.svg: edited outside this script (no draft marker); use --force to overwrite`);
    continue;
  }
  const svg = d.svg().replace(/^<svg([^>]*)>/, `<svg$1>${MARK}`);
  writeFileSync(file, svg + "\n");
  console.log(`wrote ${id}.svg: ${d.subject} (${svg.length} bytes)`);
}
