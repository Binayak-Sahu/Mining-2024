/**
 * The geological column the expedition map descends through — one stratum per unit, from daylight at
 * the surface (Orientation) down to the deep basement where DGMS command lives (Unit 10).
 */
export interface Stratum {
  name: string;
  depth: string;
  /** Base tint mixed into the surface colour (works in both themes via color-mix). */
  tint: string;
  /** Accent for nodes, rings and labels inside this band. */
  accent: string;
  /** Edge colour for 3D node lips. */
  edge: string;
  texture: string;
}

const svgUrl = (body: string, w: number, h: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;

const T = {
  sky: svgUrl("<circle cx='6' cy='6' r='1.2' fill='#ffffff' opacity='.7'/><circle cx='19' cy='17' r='.8' fill='#ffffff' opacity='.5'/>", 26, 26),
  soil: svgUrl("<circle cx='4' cy='5' r='1.4' fill='#8A5527' opacity='.35'/><path d='M14 3l3 4' stroke='#7A4A20' stroke-width='1' opacity='.3'/><circle cx='18' cy='15' r='1' fill='#8A5527' opacity='.3'/>", 24, 20),
  sand: svgUrl("<circle cx='3' cy='3' r='1' fill='#A88A4E' opacity='.45'/><circle cx='11' cy='7' r='.9' fill='#A88A4E' opacity='.4'/><circle cx='6' cy='12' r='1' fill='#A88A4E' opacity='.45'/>", 16, 16),
  shale: svgUrl("<path d='M2 4h10M16 4h8M7 11h12' stroke='#64748B' stroke-width='1.2' stroke-linecap='round' opacity='.35'/>", 28, 14),
  lime: svgUrl("<path d='M0 .5h32M0 10.5h32M8 .5v10M24 10.5v10' stroke='#9C9480' stroke-width='1' opacity='.35'/>", 32, 20),
  laterite: svgUrl("<circle cx='5' cy='5' r='2' fill='#9A3412' opacity='.25'/><circle cx='15' cy='12' r='1.5' fill='#9A3412' opacity='.22'/>", 20, 18),
  coal: svgUrl("<path d='M0 16L16 0' stroke='#94A3B8' stroke-width='1' opacity='.18'/>", 16, 16),
  granite: svgUrl("<path d='M4 5h4M6 3v4M14 13h4M16 11v4' stroke='#64748B' stroke-width='1' stroke-linecap='round' opacity='.35'/>", 22, 18),
  basalt: svgUrl("<path d='M10 2l7 4v8l-7 4-7-4V6z' fill='none' stroke='#94A3B8' stroke-width='.8' opacity='.18'/>", 20, 20),
  deep: svgUrl("<circle cx='4' cy='4' r='.8' fill='#FBBF24' opacity='.35'/><circle cx='18' cy='14' r='.6' fill='#FBBF24' opacity='.25'/>", 24, 20),
};

export const STRATA: Stratum[] = [
  { name: "Surface · Daylight", depth: "0 m", tint: "#93C5FD", accent: "#3B82F6", edge: "#1D4ED8", texture: T.sky },
  { name: "Topsoil & Alluvium", depth: "−40 m", tint: "#D6A56B", accent: "#B45309", edge: "#7C2D12", texture: T.soil },
  { name: "Sandstone", depth: "−120 m", tint: "#E7D29E", accent: "#CA8A04", edge: "#854D0E", texture: T.sand },
  { name: "Shale & Mudstone", depth: "−240 m", tint: "#A8B0BC", accent: "#475569", edge: "#1E293B", texture: T.shale },
  { name: "Limestone", depth: "−360 m", tint: "#CFC8B2", accent: "#0D9488", edge: "#115E59", texture: T.lime },
  { name: "Laterite & Overburden", depth: "−480 m", tint: "#E9A37B", accent: "#EA580C", edge: "#9A3412", texture: T.laterite },
  { name: "Coal Seam", depth: "−600 m", tint: "#4B5563", accent: "#10B981", edge: "#047857", texture: T.coal },
  { name: "Fireclay & Return Airway", depth: "−720 m", tint: "#7DD3FC", accent: "#0284C7", edge: "#075985", texture: T.shale },
  { name: "Metamorphic Schist", depth: "−840 m", tint: "#C4B5FD", accent: "#7C3AED", edge: "#5B21B6", texture: T.granite },
  { name: "Granite Basement", depth: "−960 m", tint: "#F0ABFC", accent: "#C026D3", edge: "#86198F", texture: T.basalt },
  { name: "DGMS Command Level", depth: "−1200 m", tint: "#FCD34D", accent: "#D97706", edge: "#92400E", texture: T.deep },
];

export function stratumFor(n: number): Stratum {
  return STRATA[Math.max(0, Math.min(STRATA.length - 1, n))];
}
