/**
 * Lists every lesson-content formula string (`expr`) that KaTeX cannot typeset as written (src/lib/formulaTex.ts), so the
 * app shows it as plain text. Content is never rewritten. Run: npx tsx --tsconfig scripts/tsconfig.json scripts/formula-report.ts [out.md]
 */
import { writeFileSync } from "node:fs";
import { UNITS } from "@/content";
import { formulaToHtml } from "@/lib/formulaTex";

const seen = new Map<string, string>();
const walk = (o: unknown, where: string) => {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach((x) => walk(x, where));
  const r = o as Record<string, unknown>;
  if (typeof r.expr === "string" && typeof r.meaning === "string" && !seen.has(r.expr)) seen.set(r.expr, where);
  const id = typeof r.id === "string" ? r.id : where;
  for (const k of Object.keys(r)) walk(r[k], id);
};
walk(UNITS, "");
const plain = [...seen].filter(([e]) => formulaToHtml(e) === null);
const lines = [`# Formulas shown as plain text (not valid TeX)`, ``, `${seen.size} unique formula strings, ${seen.size - plain.length} typeset, ${plain.length} plain.`, ``, `| Lesson / stage | Formula as written |`, `|---|---|`, ...plain.map(([e, w]) => `| ${w} | \`${e}\` |`)];
const out = lines.join("\n") + "\n";
if (process.argv[2]) writeFileSync(process.argv[2], out);
console.log(out);
