/**
 * Illustration audit (DESIGN.md §5.5, dev tool). Checks every unit illustration src/assets/illustrations/u0.svg … u10.svg,
 * including files re-exported from Figma, and fails on:
 *   - viewBox:  the root viewBox is not exactly 0 0 160 160
 *   - text:     any <text>, <tspan> or <textPath>
 *   - gradient: any gradient element, or a fill/stroke that points at one
 *   - outline:  a stroke on a filled or closed shape (strokes are only allowed on open, unfilled paths: wires, ropes)
 *   - hues:     more than 2 hue families (greys do not count)
 *   - missing:  a unit file that does not exist
 * Warns (does not fail) on colours outside the §2.2 / §5.5 palette and when the unit's own family is absent.
 *
 * Run: npm run audit:illus            (exit code 1 when anything fails)
 *      npm run audit:illus -- <dir>   (audit every .svg in another folder, e.g. a Figma export)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { UNIT_FAMILY } from "../src/components/ds/v3/tokens";

type Fam = "blue" | "yellow" | "purple" | "orange" | "teal" | "grey";

/** DESIGN.md §2.2 deep / mid / light tones and the §5.5 greys. */
const PALETTE: Record<string, Fam> = {
  "#2E46C2": "blue", "#4C6EF5": "blue", "#AAB9FF": "blue",
  "#B88A0A": "yellow", "#F6C22C": "yellow", "#FCE38A": "yellow",
  "#6A3FD0": "purple", "#9A5CFF": "purple", "#CDB6FF": "purple",
  "#C25E12": "orange", "#F28A2E": "orange", "#FFC08A": "orange",
  "#0E7C6F": "teal", "#1FB5A3": "teal", "#8FE3D8": "teal",
  "#5E5E5E": "grey", "#9A9A9A": "grey", "#D9D9D9": "grey",
};
const NAMED: Record<string, string> = { black: "#000000", white: "#FFFFFF", gray: "#808080", grey: "#808080" };

const SHAPES = new Set(["path", "rect", "circle", "ellipse", "polygon", "polyline", "line"]);
const ALWAYS_CLOSED = new Set(["rect", "circle", "ellipse", "polygon"]);
const GRADIENTS = new Set(["lineargradient", "radialgradient", "meshgradient"]);
const TEXT = new Set(["text", "tspan", "textpath"]);

function hex(c: string): string | null {
  const v = c.trim().toLowerCase();
  if (NAMED[v]) return NAMED[v];
  let m = v.match(/^#([0-9a-f]{3})$/);
  if (m) return ("#" + m[1].split("").map((ch) => ch + ch).join("")).toUpperCase();
  m = v.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
  if (m) return "#" + m[1].toUpperCase();
  m = v.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/);
  if (m) return "#" + [m[1], m[2], m[3]].map((n) => Math.round(+n).toString(16).padStart(2, "0")).join("").toUpperCase();
  return null;
}

/** Palette family, or the nearest family by hue for an off-palette colour (low saturation counts as grey). */
function family(h: string): { fam: Fam; exact: boolean } {
  if (PALETTE[h]) return { fam: PALETTE[h], exact: true };
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  if (s < 0.15 || max - min < 0.08) return { fam: "grey", exact: false };
  let hue = max === r ? ((g - b) / (max - min)) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
  hue = (hue * 60 + 360) % 360;
  const centres: [Fam, number][] = [["orange", 25], ["yellow", 45], ["teal", 172], ["blue", 228], ["purple", 265]];
  const d = (a: number, c: number) => Math.min(Math.abs(a - c), 360 - Math.abs(a - c));
  return { fam: centres.reduce((best, cur) => (d(hue, cur[1]) < d(hue, best[1]) ? cur : best))[0], exact: false };
}

function attrs(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of src.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
  if (out.style) {
    for (const decl of out.style.split(";")) {
      const i = decl.indexOf(":");
      if (i > 0) out[decl.slice(0, i).trim().toLowerCase()] = decl.slice(i + 1).trim();
    }
  }
  return out;
}

const none = (v: string | undefined) => v === undefined || v === "none" || v === "transparent";

export function audit(svg: string, unitId?: string): { fails: string[]; warns: string[]; families: string[] } {
  const fails: string[] = [], warns: string[] = [];
  const body = svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<\?[\s\S]*?\?>/g, "").replace(/<!DOCTYPE[^>]*>/gi, "");
  const gradientIds = new Set<string>();
  for (const m of body.matchAll(/<(linearGradient|radialGradient|meshgradient)\b([^>]*)>/gi)) {
    const id = attrs(m[2]).id;
    if (id) gradientIds.add(id);
  }

  // inherited paint: [fill, stroke, stroke-width]
  const stack: { fill?: string; stroke?: string; sw?: string }[] = [{ fill: "#000000" }];
  const fams = new Map<Fam, Set<string>>();
  let root = true;
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, close, rawName, rest, self] = m;
    const name = rawName.toLowerCase();
    if (close) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const a = attrs(rest);
    if (root) {
      root = false;
      if (name !== "svg") fails.push("root element is not <svg>");
      const vb = (a.viewbox ?? "").trim().split(/[\s,]+/).map(Number);
      if (vb.length !== 4 || vb[0] !== 0 || vb[1] !== 0 || vb[2] !== 160 || vb[3] !== 160) fails.push(`viewBox is "${a.viewbox ?? "(none)"}", must be "0 0 160 160"`);
    }
    if (TEXT.has(name)) fails.push(`text: <${rawName}> element`);
    if (GRADIENTS.has(name)) fails.push(`gradient: <${rawName}> element`);
    if (name === "style") fails.push("a <style> element: export with inline attributes (Figma: uncheck 'Include id', keep presentation attributes)");
    if (name === "image") fails.push("an embedded raster <image>");

    const parent = stack[stack.length - 1];
    const cur = {
      fill: a.fill ?? parent.fill,
      stroke: a.stroke ?? parent.stroke,
      sw: a["stroke-width"] ?? parent.sw,
    };
    for (const k of ["fill", "stroke"] as const) {
      const ref = cur[k]?.match(/url\(\s*['"]?#([^'")]+)/);
      if (ref && gradientIds.has(ref[1])) fails.push(`gradient: ${k} uses url(#${ref[1]})`);
    }

    if (SHAPES.has(name)) {
      const filled = !none(cur.fill) && a["fill-opacity"] !== "0" && a.opacity !== "0";
      const stroked = !none(cur.stroke) && cur.sw !== "0" && a["stroke-opacity"] !== "0";
      const closed = ALWAYS_CLOSED.has(name) || (name === "path" && /z/i.test(a.d ?? ""));
      if (stroked && (filled || closed)) {
        const what = filled ? "filled" : "closed";
        fails.push(`outline: stroke ${cur.stroke} on a ${what} <${name}>${a.d ? ` (d="${a.d.slice(0, 40)}…")` : ""}`);
      }
      for (const [paint, on] of [[cur.fill, filled], [cur.stroke, stroked]] as const) {
        if (!on || !paint || paint.startsWith("url(")) continue;
        const h = hex(paint);
        if (!h) {
          warns.push(`unparsed colour "${paint}"`);
          continue;
        }
        const { fam, exact } = family(h);
        if (!exact) warns.push(`off-palette colour ${h} (counted as ${fam})`);
        if (!fams.has(fam)) fams.set(fam, new Set());
        fams.get(fam)!.add(h);
      }
    }
    if (!self) stack.push(cur);
  }

  const hues = [...fams.keys()].filter((f) => f !== "grey");
  if (hues.length > 2) fails.push(`hues: ${hues.length} hue families (${hues.join(", ")}), max 2 (the unit's family + one accent)`);
  const want = unitId ? UNIT_FAMILY[unitId] : undefined;
  if (want && !hues.includes(want)) warns.push(`the unit's family (${want}) is not used`);
  return { fails: [...new Set(fails)], warns: [...new Set(warns)], families: [...fams.keys()] };
}

function main() {
  const arg = process.argv[2];
  const dir = arg ?? join(__dirname, "..", "src", "assets", "illustrations");
  const units = Object.keys(UNIT_FAMILY);
  const files = arg ? readdirSync(dir).filter((f) => f.endsWith(".svg")).sort() : units.map((u) => `${u}.svg`);
  let failed = 0;
  for (const f of files) {
    const path = join(dir, f);
    if (!existsSync(path)) {
      console.log(`FAIL ${f}\n  - missing: no such file`);
      failed++;
      continue;
    }
    const id = basename(f, ".svg");
    const { fails, warns, families } = audit(readFileSync(path, "utf8"), UNIT_FAMILY[id] ? id : undefined);
    console.log(`${fails.length ? "FAIL" : "ok  "} ${f}  [${families.join(", ")}]`);
    for (const x of fails) console.log(`  - ${x}`);
    for (const x of warns) console.log(`  ~ warn: ${x}`);
    if (fails.length) failed++;
  }
  console.log(failed ? `\n${failed} of ${files.length} illustration(s) failed` : `\nall ${files.length} illustrations pass`);
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
