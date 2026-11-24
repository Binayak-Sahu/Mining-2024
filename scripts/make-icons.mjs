// Renders public/icon.svg to the PNG icon sizes used by the PWA manifest and iOS.
// Run once with: node scripts/make-icons.mjs  (needs Playwright; outputs are committed)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, "../public/icon.svg"), "utf8");
  const b = await chromium.launch();
  const p = await b.newPage();
  const shots = [
    ["icon-192.png", 192, 0],
    ["icon-512.png", 512, 0],
    ["apple-touch-icon.png", 180, 0],
    ["icon-maskable-512.png", 512, 0.12],
  ];
  for (const [name, size, pad] of shots) {
    await p.setViewportSize({ width: size, height: size });
    const inner = Math.round(size * (1 - 2 * pad));
    await p.setContent(`<html><body style="margin:0;background:#0F172A;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, "../public", name), omitBackground: false });
  }
  await b.close();
})();
