/**
 * First-draft unit illustrations (DESIGN.md §5.5, Phase 15.5-v3d). Each entry draws one unit on the 160 grid.
 * Main hue = the unit's family (DESIGN.md §2.2); one accent family; greys for metal and rock.
 * Bink refines the exported .svg files in Figma; see scripts/draw-illustrations.ts for how edits are protected.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PAL, Pic, fit, type P2, type V3 } from "./kit";
import { ring } from "./iso";
import { U4Blasting } from "./U4Blasting";
import { U7Ventilation } from "./U7Ventilation";

const { blue: B, yellow: Y, purple: P, orange: O, teal: T, grey: G } = PAL;
const XZ: [V3, V3] = [[1, 0, 0], [0, 0, 1]];

/** Flat quad from a to b in screen space, w0 wide at a and w1 at b (tripod legs, beams). */
function strut(pic: Pic, a: V3, b: V3, w0: number, w1: number, fill: string) {
  const A = pic.p(a), Bp = pic.p(b);
  const dx = Bp[0] - A[0], dy = Bp[1] - A[1], L = Math.hypot(dx, dy);
  const n: P2 = [(-dy / L) * pic.s, (dx / L) * pic.s];
  pic.shape(
    [
      [A[0] + n[0] * w0, A[1] + n[1] * w0],
      [Bp[0] + n[0] * w1, Bp[1] + n[1] * w1],
      [Bp[0] - n[0] * w1, Bp[1] - n[1] * w1],
      [A[0] - n[0] * w0, A[1] - n[1] * w0],
    ],
    fill,
    Math.min(w0, w1),
  );
}

/** U0: hard hat with a cap lamp. Blue, accent yellow. */
function u0(pic: Pic) {
  const R = 40;
  pic.upright([0, 9, -5], 54, 5, B);
  // dome: upper half of the sphere's screen circle + front half of the base ellipse
  const c = pic.p([0, 0, 0]);
  const rho = R * 1.2247 * pic.s;
  const dome: P2[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = Math.PI - (Math.PI * i) / 48;
    dome.push([c[0] + rho * Math.cos(a), c[1] - rho * Math.sin(a)]);
  }
  dome.push(...ring([0, 0, 0], [1, 0, 0], [0, 1, 0], R, 48, -Math.PI / 4, (3 * Math.PI) / 4).map(pic.p));
  pic.shape(dome, B.deep);
  // lit side: the dome shrunk towards its upper-left point (stays inside a convex shape)
  const k: P2 = [c[0] + rho * Math.cos(2.4), c[1] - rho * Math.sin(2.4)];
  pic.shape(dome.map(([x, y]) => [k[0] + (x - k[0]) * 0.8, k[1] + (y - k[1]) * 0.8] as P2), B.mid);
  // ridge along the crown, front to back
  const w = 7, rr = Math.sqrt((R + 1.5) ** 2 - w * w);
  const side = (sx: number, from: number, to: number) =>
    Array.from({ length: 25 }, (_, i) => {
      const t = from + ((to - from) * i) / 24;
      return [sx, rr * Math.cos(t), rr * Math.sin(t)] as V3;
    });
  pic.poly([...side(-w, 0.12, 2.25), ...side(w, 2.25, 0.12)], B.light, 3);
  // front of the brim, in front of the dome
  const outer = ring([0, 9, 0], [1, 0, 0], [0, 1, 0], 54, 48, -Math.PI / 4, (3 * Math.PI) / 4);
  const inner = ring([0, 0, 0], [1, 0, 0], [0, 1, 0], R, 48, (3 * Math.PI) / 4, -Math.PI / 4);
  pic.poly([...outer, ...inner], B.light);
  // cap lamp on the front
  pic.box([-8, 24, 14], [16, 8, 20], B, 3);
  pic.alongY([0, 28, 24], 13, 12, Y, Y.light);
}

/** U1: layered rock block with a coal seam and an ammonite. Orange, accent yellow. */
function u1(pic: Pic) {
  pic.box([0, 0, 0], [76, 70, 22], O, 6);
  pic.box([0, 0, 22], [76, 70, 13], G, 4);
  pic.box([0, 0, 35], [76, 70, 22], O, 6);
  pic.box([0, 0, 57], [46, 42, 16], O, 6);
  // ammonite on the front face of the bottom layer
  const c: V3 = [30, 70.2, 11];
  pic.disc(c, XZ[0], XZ[1], 8.5, Y.light);
  const spiral: V3[] = Array.from({ length: 40 }, (_, i) => {
    const t = (i / 39) * Math.PI * 3.6;
    const r = 7 - (i / 39) * 5.6;
    return [c[0] + Math.cos(t) * r, c[1] + 0.1, c[2] + Math.sin(t) * r];
  });
  pic.wire(spiral, Y.deep, 2);
}

/** U2: headframe with its sheave wheel over the shaft collar. Purple, accent yellow. */
function u2(pic: Pic) {
  // back-stay leg, lying in the plane y = 0
  const bs = (o: number): V3[] => [[-14, -o, 90], [-58, -o, 10], [-68, -o, 10], [-24, -o, 90]];
  const back = bs(4), front = bs(-4);
  pic.box([-74, -8, 0], [14, 16, 10], G, 3);
  pic.shape(hullOf(pic, [...back, ...front]), P.deep);
  pic.poly(front, P.mid, 2);
  // collar slab and shaft
  pic.box([-38, -38, 0], [76, 76, 10], G, 5);
  pic.poly([[-16, -16, 10.1], [16, -16, 10.1], [16, 16, 10.1], [-16, 16, 10.1]], G.deep, 2);
  const leg = (x: number, y: number) => pic.box([x - 4, y - 4, 10], [8, 8, 78], P, 2);
  leg(-22, -22);
  leg(22, -22);
  leg(-22, 22);
  pic.box([-22, 19, 46], [44, 6, 7], P, 2);
  pic.box([19, -22, 46], [6, 44, 7], P, 2);
  leg(22, 22);
  pic.box([-28, -28, 86], [56, 56, 8], P, 3);
  // sheave wheel and the winding rope down the shaft
  pic.wire([[13, 0, 106], [13, 0, 12]], G.deep, 2.4, false);
  pic.alongY([0, -3, 108], 15, 6, Y);
  pic.disc([0, 3.1, 108], XZ[0], XZ[1], 10, Y.deep);
  pic.disc([0, 3.2, 108], XZ[0], XZ[1], 4.5, Y.light);
}

function hullOf(pic: Pic, w: V3[]): P2[] {
  const pts = w.map(pic.p);
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [], up: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (const q of p.reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

/** U3: roof bolts with bearing plates in a rock block. Blue, accent yellow. */
function u3(pic: Pic) {
  pic.box([0, 0, 0], [84, 64, 20], B, 6);
  pic.box([0, 0, 20], [84, 64, 20], B, 6);
  for (const x of [15, 42, 69]) {
    // shank seen in section on the front face, under its plate
    pic.poly([[x + 6, 64.2, 6], [x + 14, 64.2, 6], [x + 14, 64.2, 40], [x + 6, 64.2, 40]], G.light, 3);
    pic.box([x - 10, 44, 40], [20, 20, 4], Y, 3);
    pic.upright([x, 54, 44], 6, 7, G);
    pic.upright([x, 54, 51], 3, 7, G);
  }
}

/** U5: dragline bucket on its chains over a bench. Yellow, greys. */
function u5(pic: Pic) {
  pic.box([-40, -36, 0], [80, 36, 26], G, 6);
  pic.box([-40, 0, 0], [80, 42, 10], G, 5);
  // hoist chains (behind the bucket)
  pic.wire([[-4, 4, 64], [5, 21, 104]], G.deep, 3, false);
  // bucket: open top, teeth on the lip
  pic.box([-24, 4, 32], [50, 34, 28], Y, 5);
  pic.poly([[-19, 9, 60.1], [21, 9, 60.1], [21, 33, 60.1], [-19, 33, 60.1]], Y.deep, 3);
  for (const y of [6, 14, 22, 30]) pic.poly([[26, y, 33], [26, y + 6, 33], [35, y + 3, 33]], G.mid, 1);
  pic.wire([[-4, 38, 64], [5, 21, 104]], G.deep, 3, false);
  pic.box([-2, 13, 102], [14, 16, 6], G, 2);
  pic.wire([[5, 21, 108], [5, 21, 124]], G.deep, 3.4, false);
  // drag chains out to the machine
  pic.wire([[26, 8, 50], [44, 17, 55], [56, 21, 58]], G.deep, 3);
  pic.wire([[26, 34, 50], [44, 25, 55], [56, 21, 58]], G.deep, 3);
}

/** U6: longwall shearer drum in front of a powered roof support (chock). Purple, accent yellow. */
function u6(pic: Pic) {
  pic.box([0, -36, 0], [62, 42, 14], G, 5);
  pic.upright([16, -14, 14], 6, 42, Y);
  pic.upright([46, -14, 14], 6, 42, Y);
  pic.box([-6, -46, 54], [74, 66, 10], P, 4);
  // drum: axis towards the viewer, picks round the rim, a vane spiral
  const c: V3 = [8, 22, 26];
  pic.alongY(c, 25, 18, P);
  const f = c[1] + 18 + 0.2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    const tip: V3 = [c[0] + Math.cos(a) * 31, f, c[2] + Math.sin(a) * 31];
    const l: V3 = [c[0] + Math.cos(a - 0.17) * 23, f, c[2] + Math.sin(a - 0.17) * 23];
    const r: V3 = [c[0] + Math.cos(a + 0.17) * 23, f, c[2] + Math.sin(a + 0.17) * 23];
    pic.poly([l, tip, r], G.mid, 1);
  }
  const vane: V3[] = Array.from({ length: 30 }, (_, i) => {
    const t = (i / 29) * Math.PI * 1.6 + 1.2;
    const r = 8 + (i / 29) * 12;
    return [c[0] + Math.cos(t) * r, f + 0.1, c[2] + Math.sin(t) * r];
  });
  pic.wire(vane, P.light, 3.5);
  pic.disc([c[0], f + 0.2, c[2]], XZ[0], XZ[1], 7, P.deep);
}

/** U8: total station on a tripod. Blue, accent yellow. */
function u8(pic: Pic) {
  const head: V3 = [0, 0, 64];
  strut(pic, head, [18, -26, 0], 4.5, 3, Y.deep);
  strut(pic, head, [-30, 4, 0], 4.5, 3.2, Y.mid);
  strut(pic, head, [10, 30, 0], 4.5, 3.2, Y.mid);
  pic.upright([0, 0, 60], 13, 5, G);
  pic.upright([0, 0, 65], 9, 5, G);
  pic.box([-12, -10, 70], [24, 20, 10], B, 3);
  pic.poly([[-7, 10.1, 72.5], [7, 10.1, 72.5], [7, 10.1, 77.5], [-7, 10.1, 77.5]], G.deep, 1.5);
  pic.box([-12, -6, 80], [5, 12, 20], B, 2);
  pic.alongY([0, -16, 93], 6.5, 30, B, B.light);
  pic.box([7, -6, 80], [5, 12, 20], B, 2);
}

/** U9: bar chart on a clipboard. Orange, accent teal. */
function u9(pic: Pic) {
  pic.box([0, 0, 0], [72, 7, 96], O, 6);
  pic.poly([[7, 7.1, 7], [65, 7.1, 7], [65, 7.1, 82], [7, 7.1, 82]], G.light, 3);
  pic.box([24, 4, 84], [24, 6, 15], G, 3);
  const bars: [number, number][] = [[14, 22], [31, 36], [48, 54]];
  for (const [x, h] of bars) pic.box([x, 7, 14], [11, 6, h], T, 2);
}

/** U10: rescue breathing apparatus cylinder and a statute book. Teal, accent purple. */
function u10(pic: Pic) {
  pic.upright([-20, -12, 0], 19, 66, T);
  pic.upright([-20, -12, 66], 7, 9, G);
  pic.alongY([-20, -21, 79], 8, 3.5, G, G.mid);
  // hose
  pic.wire([[-13, -12, 72], [6, -6, 80], [18, 4, 56], [26, 26, 36]], G.deep, 4);
  // book: back cover, pages, spine (front-left), front cover
  pic.box([0, 0, 0], [66, 50, 3], P, 2);
  pic.box([2, 2, 3], [62, 44, 12], { light: G.light, mid: G.light, deep: G.light }, 1);
  for (const z of [6.5, 10.5]) pic.wire([[64.2, 6, z], [64.2, 44, z]], G.mid, 1.2, false);
  pic.box([0, 0, 15], [66, 50, 3.5], P, 2);
  pic.box([0, 45, 0], [66, 5, 18.5], P, 2);
  // ribbon marker
  pic.poly([[66.2, 26, 18.5], [66.2, 32, 18.5], [66.2, 32, 4], [66.2, 29, 7], [66.2, 26, 4]], T.mid, 0.5);
}

const react = (C: typeof U4Blasting) => renderToStaticMarkup(createElement(C, { size: 160 })).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/ role="img"| aria-hidden="true"/g, "");

export const DRAWINGS: Record<string, { subject: string; svg: () => string }> = {
  u0: { subject: "hard hat with cap lamp", svg: () => fit(u0) },
  u1: { subject: "layered rock block, coal seam, ammonite", svg: () => fit(u1) },
  u2: { subject: "headframe and sheave wheel over a shaft", svg: () => fit(u2) },
  u3: { subject: "roof bolts in a rock block", svg: () => fit(u3) },
  u4: { subject: "explosive cartridge and detonator", svg: () => react(U4Blasting) },
  u5: { subject: "dragline bucket over a bench", svg: () => fit(u5) },
  u6: { subject: "shearer drum in front of a chock", svg: () => fit(u6) },
  u7: { subject: "axial fan with airflow arrows", svg: () => react(U7Ventilation) },
  u8: { subject: "total station on a tripod", svg: () => fit(u8) },
  u9: { subject: "bar chart on a clipboard", svg: () => fit(u9) },
  u10: { subject: "breathing apparatus cylinder and statute book", svg: () => fit(u10) },
};
