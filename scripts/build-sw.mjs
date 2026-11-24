// Post-build step: lists every file of the static export in out/precache.json so the
// service worker can make the whole app available offline.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
if (!existsSync(OUT)) {
  console.error("build-sw: out/ not found — run next build first");
  process.exit(1);
}
const SKIP = new Set(["sw.js", "precache.json", ".nojekyll"]);
const files = [];
let bytes = 0;
const hash = createHash("sha1");

function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else {
      let rel = relative(OUT, p).split(sep).join("/");
      if (SKIP.has(rel)) continue;
      bytes += st.size;
      hash.update(rel).update(readFileSync(p));
      // Pages are requested as directory URLs ("lesson/u1-l1/") because of trailingSlash.
      if (rel === "index.html") rel = "./";
      else if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length);
      files.push(rel);
    }
  }
}
walk(OUT);
const version = hash.digest("hex").slice(0, 12);
writeFileSync(join(OUT, "precache.json"), JSON.stringify({ version, files }));
console.log(`build-sw: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB, version ${version}`);
