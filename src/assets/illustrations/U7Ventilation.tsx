import { iso, ring, hull, path, type V3, type P2 } from "./iso";

/**
 * U7 Ventilation (DESIGN.md §5.5 draft, Phase 15.5-v3a): an axial fan casing with its blades, blowing air out
 * along its axis (chunky airflow arrows). Main hue teal, accent yellow (hub), greys for the blades.
 * Draft for Bink to refine in Figma; the .svg next to this file is exported from it (scripts/export-illustrations.tsx).
 */
const T = { light: "#8FE3D8", mid: "#1FB5A3", deep: "#0E7C6F" };
const Y = { light: "#FCE38A", mid: "#F6C22C", deep: "#B88A0A" };
const G = { light: "#D9D9D9", mid: "#9A9A9A", deep: "#5E5E5E" };

const R = 36;
const L = 44;
const U: V3 = [1, 0, 0];
const W: V3 = [0, 0, 1];
const ARROWS: [number, number, number, number][] = [[-18, -20, 10, 36], [20, -28, 12, 32]];

/** Origin that centres the whole drawing (casing hull + arrows) in the 160 × 160 box. */
const O: P2 = (() => {
  const pts: P2[] = [...ring([0, 0, 0], U, W, R), ...ring([0, -L, 0], U, W, R), ...ARROWS.flatMap(([x, h, y0, len]) => [[x, y0 + len, h] as V3, [x - 10, y0 + len - 13, h] as V3])].map((p) => iso(p, [0, 0]));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [80 - (Math.min(...xs) + Math.max(...xs)) / 2, 80 - (Math.min(...ys) + Math.max(...ys)) / 2];
})();
const pj = (p: V3) => iso(p, O);

/** Blade outline in the face plane (u, w), rotated by `a`. */
function blade(a: number, y: number): string {
  const pts: [number, number][] = [
    [0.2, -0.1], [0.5, -0.24], [0.76, -0.2], [0.8, 0.02], [0.5, 0.14], [0.2, 0.12],
  ];
  return path(pts.map(([u, w]) => {
    const ru = u * Math.cos(a) - w * Math.sin(a), rw = u * Math.sin(a) + w * Math.cos(a);
    return pj([ru * R, y, rw * R]);
  }));
}

/** Airflow arrow lying in the plane z = h, pointing along +y (out of the fan). */
function arrow(x: number, h: number, y0: number, len: number): string {
  const w = 5, hw = 10, hl = 13;
  const pts: V3[] = [
    [x - w, y0, h], [x - w, y0 + len - hl, h], [x - hw, y0 + len - hl, h], [x, y0 + len, h],
    [x + hw, y0 + len - hl, h], [x + w, y0 + len - hl, h], [x + w, y0, h],
  ];
  return path(pts.map(pj));
}

export function U7Ventilation({ size = 160, title }: { size?: number; title?: string }) {
  const front = ring([0, 0, 0], U, W, R).map(pj);
  const back = ring([0, -L, 0], U, W, R).map(pj);
  const side = hull([...front, ...back]);
  const topFront = ring([0, 0, 0], U, W, R, 32, Math.PI * 0.08, Math.PI * 0.92).map(pj);
  const topBack = ring([0, -L, 0], U, W, R, 32, Math.PI * 0.08, Math.PI * 0.92).map(pj);
  const top = hull([...topFront, ...topBack]);
  const lip = path(front);
  const hole = path(ring([0, 0.5, 0], U, W, R * 0.8).map(pj));
  const hub = path(ring([0, 1, 0], U, W, R * 0.2).map(pj));
  const nose = path(ring([0.3, 1.5, 1.6], U, W, R * 0.1).map(pj));
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {/* casing: side (deep), top (light), front lip (mid), dark opening */}
      <path d={path(side)} fill={T.deep} />
      <path d={path(top)} fill={T.light} />
      <path d={lip} fill={T.mid} />
      <path d={hole} fill={T.deep} />
      {/* blades and hub */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={blade((i * 2 * Math.PI) / 5 + 0.3, 1)} fill={i % 2 ? G.mid : G.light} />
      ))}
      <path d={hub} fill={Y.mid} />
      <path d={nose} fill={Y.light} />
      {/* airflow out of the fan */}
      <path d={arrow(-18, -22, 10, 38)} fill={T.light} />
      <path d={arrow(20, -30, 12, 34)} fill={T.mid} />
    </svg>
  );
}
