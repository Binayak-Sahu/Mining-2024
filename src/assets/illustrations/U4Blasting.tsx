import { upright, r1 } from "./iso";

/**
 * U4 Blasting (DESIGN.md §5.5 draft, Phase 15.5-v3a): an explosive cartridge and a detonator with its leg wires.
 * Main hue yellow (light top, mid front, deep side), accent blue (wires, plug), greys for the aluminium shell.
 * Draft for Bink to refine in Figma; the .svg next to this file is exported from it (scripts/export-illustrations.tsx).
 */
const Y = { light: "#FCE38A", mid: "#F6C22C", deep: "#B88A0A" };
const B = { light: "#AAB9FF", mid: "#4C6EF5", deep: "#2E46C2" };
const G = { light: "#D9D9D9", mid: "#9A9A9A", deep: "#5E5E5E" };

export function U4Blasting({ size = 160, title }: { size?: number; title?: string }) {
  const cart = upright([60, 128], 25, 80);
  const crimp = upright([60, 48], 17, 9);
  const det = upright([106, 140], 8, 52);
  const plug = upright([106, 88], 8.5, 9);
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {/* cartridge */}
      <path d={cart.side} fill={Y.deep} />
      <path d={cart.front} fill={Y.mid} />
      <ellipse cx={cart.top.cx} cy={cart.top.cy} rx={r1(cart.top.rx)} ry={r1(cart.top.ry)} fill={Y.light} />
      {/* crimped end */}
      <path d={crimp.side} fill={Y.deep} />
      <path d={crimp.front} fill={Y.mid} />
      <ellipse cx={crimp.top.cx} cy={crimp.top.cy} rx={r1(crimp.top.rx)} ry={r1(crimp.top.ry)} fill={Y.light} />
      {/* leg wires (behind the detonator) */}
      <path d="M103 80 C 100 56, 124 40, 138 52 S 140 84, 128 96" fill="none" stroke={B.deep} strokeWidth={6} strokeLinecap="round" />
      <path d="M110 80 C 110 62, 130 54, 142 66 S 146 100, 136 112" fill="none" stroke={B.mid} strokeWidth={6} strokeLinecap="round" />
      {/* detonator: aluminium shell + plug */}
      <path d={det.side} fill={G.deep} />
      <path d={det.front} fill={G.mid} />
      <ellipse cx={det.top.cx} cy={det.top.cy} rx={r1(det.top.rx)} ry={r1(det.top.ry)} fill={G.light} />
      <path d={plug.side} fill={B.deep} />
      <path d={plug.front} fill={B.mid} />
      <ellipse cx={plug.top.cx} cy={plug.top.cy} rx={r1(plug.top.rx)} ry={r1(plug.top.ry)} fill={B.light} />
    </svg>
  );
}
