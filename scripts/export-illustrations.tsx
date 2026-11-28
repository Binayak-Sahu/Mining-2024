/**
 * Writes each DESIGN.md §5.5 illustration component in src/assets/illustrations/ as a standalone .svg (for Figma).
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/export-illustrations.tsx
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { U4Blasting, U7Ventilation } from "../src/assets/illustrations";

const dir = join(__dirname, "..", "src", "assets", "illustrations");
for (const [name, C] of [["u4-blasting", U4Blasting], ["u7-ventilation", U7Ventilation]] as const) {
  const svg = renderToStaticMarkup(createElement(C, { size: 160 })).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  writeFileSync(join(dir, `${name}.svg`), svg + "\n");
  console.log(`wrote ${name}.svg (${svg.length} bytes)`);
}
