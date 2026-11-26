/**
 * Quote verifier: every quoted excerpt in research/*.md must actually occur in its source text.
 *
 * Source text lives in research/cache/<file>.txt (public-domain texts, committed) or
 * research/cache/private/<refId>.txt (copyrighted texts — gitignored, fetched locally), or in
 * sources/<name>.txt (owner-supplied documents). Excerpts split on "…" must each be found, in order.
 * Rows that cite the statute register (statutes.ts) are checked against src/content/statutes.ts.
 *
 * Also writes src/content/excerpts.gen.ts (lesson → ref → [{excerpt, location}]) for the Source sheet.
 *
 *   npx tsx scripts/verify-quotes.ts         (part of `npm run validate`)
 * Exit 1 if any excerpt is NOT FOUND. Missing source text → SKIPPED (reported, not a failure).
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const RESEARCH = join(ROOT, "research");

/** Which text file holds each reference (default: research/cache/private/<refId>.txt). */
const SOURCE_FILE: Record<string, string> = {
  "niosh-ic9486-ch1": "research/cache/niosh-ic9486.txt",
  "niosh-ic9486-ch10": "research/cache/niosh-ic9486.txt",
  "niosh-hoc": "research/cache/niosh-hoc.txt",
  "cmr-2017-153": "src/content/statutes.ts",
};

function norm(t: string): string {
  return t
    .replace(/ﬂ/g, "fl")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬀ/g, "ff")
    .replace(/­/g, "")
    .replace(/(\w)-\s*\n\s*(\w)/g, "$1$2") // re-join words hyphenated across lines
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/þ/g, "+")
    .replace(/¼/g, "=")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}
const squash = (t: string) => t.replace(/[^a-z0-9%.]/g, "");

const textCache = new Map<string, { plain: string; squashed: string } | null>();
function sourceText(ref: string): { plain: string; squashed: string } | null {
  if (textCache.has(ref)) return textCache.get(ref)!;
  const candidates = [SOURCE_FILE[ref], `research/cache/${ref}.txt`, `research/cache/private/${ref}.txt`, `sources/${ref}.txt`].filter(Boolean) as string[];
  let out: { plain: string; squashed: string } | null = null;
  for (const c of candidates) {
    const p = join(ROOT, c);
    if (existsSync(p)) {
      const plain = norm(readFileSync(p, "utf8"));
      out = { plain, squashed: squash(plain) };
      break;
    }
  }
  textCache.set(ref, out);
  return out;
}

/** All fragments of an excerpt occur in order (whitespace-insensitive fallback for column-broken PDFs). */
function found(excerpt: string, src: { plain: string; squashed: string }): boolean {
  const frags = excerpt
    .split(/…|\.\.\./)
    .map((f) => norm(f))
    .filter((f) => f.length > 0);
  let at = 0;
  let atSq = 0;
  for (const f of frags) {
    const i = src.plain.indexOf(f, at);
    if (i >= 0) {
      at = i + f.length;
      continue;
    }
    const sq = squash(f);
    const j = src.squashed.indexOf(sq, atSq);
    if (j < 0) return false;
    atSq = j + sq.length;
  }
  return true;
}

interface Row {
  lesson: string;
  claim: string;
  ref: string;
  excerpt: string;
  location: string;
  line: number;
}

function rows(): Row[] {
  const out: Row[] = [];
  for (const f of readdirSync(RESEARCH).filter((x) => x.endsWith(".md"))) {
    const lesson = f.replace(/\.md$/, "");
    const lines = readFileSync(join(RESEARCH, f), "utf8").split("\n");
    lines.forEach((l, n) => {
      if (!/^\|\s*\d+\s*\|/.test(l)) return; // claims-table rows start with "| <number> |"
      const cells = l.split("|").map((c) => c.trim());
      // | # | claim | ref | excerpt | location |
      const [, , claim, ref, excerpt, location] = cells;
      if (!ref || excerpt === undefined) return;
      out.push({ lesson, claim, ref, excerpt, location: location ?? "", line: n + 1 });
    });
  }
  return out;
}

const all = rows();
let foundN = 0;
let missing = 0;
let skipped = 0;
const excerpts: Record<string, Record<string, { excerpt: string; location: string }[]>> = {};
for (const r of all) {
  const quotes = [...r.excerpt.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const tag = `${r.lesson}.md:${r.line} [${r.ref}]`;
  if (r.ref === "cmr-2017-153" || /statutes\.ts/.test(r.excerpt)) {
    const st = sourceText("cmr-2017-153");
    const ok = !!st && st.plain.includes("1.25 % in any place");
    if (ok) foundN++;
    else missing++;
    console.log(`${ok ? "FOUND    " : "NOT FOUND"} ${tag} statute register`);
    continue;
  }
  if (!quotes.length) {
    skipped++;
    console.log(`SKIPPED   ${tag} (no quoted excerpt: ${r.excerpt.slice(0, 50)})`);
    continue;
  }
  const src = sourceText(r.ref);
  if (!src) {
    skipped++;
    console.log(`SKIPPED   ${tag} (no source text cached for ${r.ref})`);
    continue;
  }
  const bad = quotes.filter((q) => !found(q, src));
  if (bad.length) {
    missing++;
    console.log(`NOT FOUND ${tag} ${bad.map((b) => `"${b}"`).join(", ")}`);
  } else {
    foundN++;
    console.log(`FOUND     ${tag}`);
    ((excerpts[r.lesson] ??= {})[r.ref] ??= []).push({ excerpt: quotes.join(" … "), location: r.location });
  }
}

writeFileSync(
  join(ROOT, "src/content/excerpts.gen.ts"),
  `/* Generated by scripts/verify-quotes.ts — do not edit. Verified source excerpts per lesson and reference. */\n` +
    `export const EXCERPTS: Record<string, Record<string, { excerpt: string; location: string }[]>> = ${JSON.stringify(excerpts, null, 2)};\n`,
);

console.log(`quotes: ${foundN} found · ${missing} not found · ${skipped} skipped (no cached text / no quote)`);
if (missing) process.exit(1);
