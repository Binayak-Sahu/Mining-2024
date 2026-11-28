/**
 * Regenerates src/components/ds/v3/katex-woff2.css from the installed katex: the stock katex.min.css with only the woff2
 * font sources, so the service-worker precache holds 20 KaTeX font files instead of 60 (woff2 + woff + ttf).
 * Run after updating katex: node scripts/katex-css.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const css = readFileSync(require.resolve("katex/dist/katex.min.css"), "utf8");
const { version } = require("katex/package.json");
const out = css.replace(
  /src:url\(fonts\/([\w-]+)\.woff2\) format\("woff2"\),url\(fonts\/[\w-]+\.woff\) format\("woff"\),url\(fonts\/[\w-]+\.ttf\) format\("truetype"\)/g,
  (_, f) => `src:url(../../../../node_modules/katex/dist/fonts/${f}.woff2) format("woff2")`,
);
if (/format\("(woff|truetype)"\)/.test(out)) throw new Error("katex.min.css changed shape: some non-woff2 sources were not rewritten");
writeFileSync(
  "src/components/ds/v3/katex-woff2.css",
  `/* KaTeX ${version} (MIT, https://katex.org) katex.min.css with woff2-only font sources, so the service-worker precache holds 20 font files instead of 60. Regenerate with: node scripts/katex-css.mjs */\n` + out,
);
console.log("wrote src/components/ds/v3/katex-woff2.css");
