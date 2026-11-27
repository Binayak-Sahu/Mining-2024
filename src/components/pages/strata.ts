/**
 * The geological column the expedition descends through — one stratum per unit, from daylight at the surface
 * (Orientation) down to the deep basement where DGMS command lives (Unit 10). Shown as text only (course cards,
 * level header): stratum colours and textures were removed in Phase 15.5d (DESIGN.md §8, no hue-tinted surfaces).
 */
export interface Stratum {
  name: string;
  depth: string;
}

export const STRATA: Stratum[] = [
  { name: "Surface · Daylight", depth: "0 m" },
  { name: "Topsoil & Alluvium", depth: "−40 m" },
  { name: "Sandstone", depth: "−120 m" },
  { name: "Shale & Mudstone", depth: "−240 m" },
  { name: "Limestone", depth: "−360 m" },
  { name: "Laterite & Overburden", depth: "−480 m" },
  { name: "Coal Seam", depth: "−600 m" },
  { name: "Fireclay & Return Airway", depth: "−720 m" },
  { name: "Metamorphic Schist", depth: "−840 m" },
  { name: "Granite Basement", depth: "−960 m" },
  { name: "DGMS Command Level", depth: "−1200 m" },
];

export function stratumFor(n: number): Stratum {
  return STRATA[Math.max(0, Math.min(STRATA.length - 1, n))];
}
