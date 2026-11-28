/**
 * Drawing kit for the DESIGN.md §5.5 unit illustrations (dev only, never shipped).
 * World axes as in iso.ts: x to the lower right, y to the lower left, z up. Visible faces: +z top (`light`),
 * +y front-left (`mid`), +x front-right (`deep`). Light comes from the top-left.
 *
 * Every shape is a filled path. The only strokes are open paths (wires, hoses, ropes, grooves) with fill="none";
 * scripts/audit-illustrations.ts fails any stroke on a closed or filled shape.
 */
import { hull, ring, type P2, type V3 } from "./iso";

export type { P2, V3 };
export type Tones = { light: string; mid: string; deep: string };

/** DESIGN.md §2.2 illustration tones (deep / mid / light) and the §5.5 greys. */
export const PAL = {
  blue: { light: "#AAB9FF", mid: "#4C6EF5", deep: "#2E46C2" },
  yellow: { light: "#FCE38A", mid: "#F6C22C", deep: "#B88A0A" },
  purple: { light: "#CDB6FF", mid: "#9A5CFF", deep: "#6A3FD0" },
  orange: { light: "#FFC08A", mid: "#F28A2E", deep: "#C25E12" },
  teal: { light: "#8FE3D8", mid: "#1FB5A3", deep: "#0E7C6F" },
  grey: { light: "#D9D9D9", mid: "#9A9A9A", deep: "#5E5E5E" },
} satisfies Record<string, Tones>;

const C = Math.cos(Math.PI / 6);
const r1 = (n: number) => Math.round(n * 10) / 10;
const f = (p: P2) => `${r1(p[0])} ${r1(p[1])}`;

/** Closed path through screen points with each corner rounded by r (a number, or one per vertex). */
export function rounded(pts: P2[], r: number | number[]): string {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const cur = pts[i], prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const lp = Math.hypot(prev[0] - cur[0], prev[1] - cur[1]), ln = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const want = Array.isArray(r) ? r[i] : r;
    const ri = Math.min(want, lp / 2, ln / 2);
    if (ri <= 0.05) {
      d += `${i ? "L" : "M"}${f(cur)} `;
      continue;
    }
    const a: P2 = [cur[0] + ((prev[0] - cur[0]) / lp) * ri, cur[1] + ((prev[1] - cur[1]) / lp) * ri];
    const b: P2 = [cur[0] + ((next[0] - cur[0]) / ln) * ri, cur[1] + ((next[1] - cur[1]) / ln) * ri];
    d += `${i ? "L" : "M"}${f(a)} Q${f(cur)} ${f(b)} `;
  }
  return d + "Z";
}

/** Open smooth path (Catmull-Rom) through screen points. */
function smooth(pts: P2[]): string {
  let d = `M${f(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1)} ${f(c2)} ${f(p2)}`;
  }
  return d;
}

export class Pic {
  els: string[] = [];
  pts: P2[] = [];
  constructor(public s = 1, public o: P2 = [0, 0]) {}

  /** World → screen. */
  p = ([x, y, z]: V3): P2 => [this.o[0] + (x - y) * C * this.s, this.o[1] + ((x + y) * 0.5 - z) * this.s];

  /** Filled screen polygon, corners rounded by r world units. */
  shape(pts: P2[], fill: string, r: number | number[] = 0) {
    this.pts.push(...pts);
    const rs = Array.isArray(r) ? r.map((v) => v * this.s) : r * this.s;
    this.els.push(`<path d="${rounded(pts, rs)}" fill="${fill}"/>`);
  }

  /** Filled world polygon. */
  poly(world: V3[], fill: string, r: number | number[] = 0) {
    this.shape(world.map(this.p), fill, r);
  }

  /** Open stroked line through world points (wires, ropes, grooves). Never closed, never filled. */
  wire(world: V3[], stroke: string, width: number, curved = true) {
    const pts = world.map(this.p);
    const w = width * this.s;
    for (const q of pts) this.pts.push([q[0] - w / 2, q[1] - w / 2], [q[0] + w / 2, q[1] + w / 2]);
    const d = curved ? smooth(pts) : `M${pts.map(f).join(" L")}`;
    this.els.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  /**
   * Box from corner p (min x, y, z) with size d. The silhouette is filled `deep` (that is the +x face) with every
   * outer corner rounded; the top (`light`) and +y face (`mid`) go on top.
   */
  box([x, y, z]: V3, [dx, dy, dz]: V3, t: Tones, r = 5) {
    const A: V3 = [x, y, z + dz], B: V3 = [x + dx, y, z + dz], Cc: V3 = [x + dx, y + dy, z + dz], D: V3 = [x, y + dy, z + dz];
    const E: V3 = [x + dx, y, z], F: V3 = [x + dx, y + dy, z], G: V3 = [x, y + dy, z];
    const rr = Math.min(r, dx / 2, dy / 2, dz / 2);
    this.poly([A, B, E, F, G, D], t.deep, rr);
    this.poly([A, B, Cc, D], t.light, [rr, rr, 0, rr]);
    this.poly([D, Cc, F, G], t.mid, [0, 0, rr, rr]);
  }

  /** Upright cylinder standing on base centre c: right side `deep`, left side `mid`, top `light`. */
  upright(c: V3, r: number, h: number, t: Tones, top: string = t.light) {
    const U: V3 = [1, 0, 0], V: V3 = [0, 1, 0];
    const lo = ring(c, U, V, r), hi = ring([c[0], c[1], c[2] + h], U, V, r);
    this.shape(hull([...lo, ...hi].map(this.p)), t.deep);
    const a = Math.PI / 4, b = (5 * Math.PI) / 4;
    this.shape(hull([...ring(c, U, V, r, 32, a, b), ...ring([c[0], c[1], c[2] + h], U, V, r, 32, a, b)].map(this.p)), t.mid);
    this.shape(hi.map(this.p), top);
  }

  /**
   * Cylinder lying along +y from c (axis end y0 = c[1], cap at y0 + len facing front-left): body `deep`,
   * upper band `light`, end cap `cap` (default `mid`).
   */
  alongY(c: V3, r: number, len: number, t: Tones, cap: string = t.mid) {
    const U: V3 = [1, 0, 0], W: V3 = [0, 0, 1];
    const e: V3 = [c[0], c[1] + len, c[2]];
    this.shape(hull([...ring(c, U, W, r), ...ring(e, U, W, r)].map(this.p)), t.deep);
    this.shape(hull([...ring(c, U, W, r, 32, 0.35, Math.PI - 0.35), ...ring(e, U, W, r, 32, 0.35, Math.PI - 0.35)].map(this.p)), t.light);
    this.shape(ring(e, U, W, r).map(this.p), cap);
  }

  /** Cylinder lying along +x from c (cap at x0 + len facing front-right): body `mid`, upper band `light`, cap `deep`. */
  alongX(c: V3, r: number, len: number, t: Tones, cap: string = t.deep) {
    const U: V3 = [0, 1, 0], W: V3 = [0, 0, 1];
    const e: V3 = [c[0] + len, c[1], c[2]];
    this.shape(hull([...ring(c, U, W, r), ...ring(e, U, W, r)].map(this.p)), t.mid);
    this.shape(hull([...ring(c, U, W, r, 32, 0.35, Math.PI - 0.35), ...ring(e, U, W, r, 32, 0.35, Math.PI - 0.35)].map(this.p)), t.light);
    this.shape(ring(e, U, W, r).map(this.p), cap);
  }

  /** Flat disc in a world plane spanned by u and v. */
  disc(c: V3, u: V3, v: V3, r: number, fill: string) {
    this.shape(ring(c, u, v, r).map(this.p), fill);
  }

  svg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" fill="none">${this.els.join("")}</svg>`;
  }
}

/** Draws twice: once to measure, then scaled and centred so the art fills `box` px of the 160 grid. */
export function fit(draw: (pic: Pic) => void, box = 140): string {
  const m = new Pic();
  draw(m);
  const xs = m.pts.map((p) => p[0]), ys = m.pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const s = Math.min(box / w, box / h);
  const o: P2 = [80 - ((Math.min(...xs) + Math.max(...xs)) / 2) * s, 80 - ((Math.min(...ys) + Math.max(...ys)) / 2) * s];
  const pic = new Pic(s, o);
  draw(pic);
  return pic.svg();
}
