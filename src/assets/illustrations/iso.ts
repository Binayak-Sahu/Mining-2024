/**
 * Isometric helpers for the DESIGN.md §5.5 illustrations (30° iso, light from the top-left).
 * World axes: x runs to the lower right, y to the lower left, z up. Visible faces: +z (top, `light`), +y (front-left,
 * `mid`), +x (front-right, `deep`).
 */
export type V3 = [number, number, number];
export type P2 = [number, number];

const C = Math.cos(Math.PI / 6);
const S = 0.5;

export function iso([x, y, z]: V3, o: P2): P2 {
  return [o[0] + (x - y) * C, o[1] + (x + y) * S - z];
}

export const r1 = (n: number) => Math.round(n * 10) / 10;

export function path(pts: P2[], close = true): string {
  return pts.map((p, i) => `${i ? "L" : "M"}${r1(p[0])} ${r1(p[1])}`).join(" ") + (close ? " Z" : "");
}

/** Points of a circle of radius r around `c` in the plane spanned by unit vectors u and v. */
export function ring(c: V3, u: V3, v: V3, r: number, n = 64, from = 0, to = Math.PI * 2): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    const a = Math.cos(t) * r, b = Math.sin(t) * r;
    out.push([c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b]);
  }
  return out;
}

/** Convex hull (monotone chain) of screen points. */
export function hull(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (const q of p.reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** Screen ellipse radii of a horizontal (z = const) circle of radius r. */
export const flat = (r: number) => ({ rx: r * C * Math.SQRT2, ry: r * S * Math.SQRT2 });

/**
 * Upright cylinder: returns the three face paths (front `mid`, side `deep`, top `light`).
 * The split between front and side is the vertical through the centre, which reads as light from the top-left.
 */
export function upright(base: P2, r: number, h: number) {
  const { rx, ry } = flat(r);
  const [cx, yb] = base;
  const yt = yb - h;
  const side = `M${r1(cx - rx)} ${r1(yt)} L${r1(cx - rx)} ${r1(yb)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(yb)} L${r1(cx + rx)} ${r1(yt)} Z`;
  const front = `M${r1(cx - rx)} ${r1(yt)} L${r1(cx - rx)} ${r1(yb)} A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx)} ${r1(yb + ry)} L${r1(cx)} ${r1(yt + ry)} Z`;
  return { side, front, top: { cx, cy: yt, rx, ry } };
}
