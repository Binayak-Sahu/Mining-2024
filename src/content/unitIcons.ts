import { Bomb, Compass, Gem, Mountain, Pickaxe, Scale, Shovel, Signpost, TrendingUp, Truck, Wind, type LucideIcon } from "lucide-react";

/**
 * Unit → lucide icon (DESIGN.md §5.11), shown in the unit icon tile on course cards and the unit header.
 * Pending Bink's review (ROADMAP Phase 15.5d): swap any icon with a one-line change here.
 */
export const UNIT_ICONS: Record<string, LucideIcon> = {
  u0: Signpost, // Field orientation
  u1: Gem, // Mining geology, exploration & deposit modelling
  u2: Shovel, // Mine development: access, shaft sinking & drivage
  u3: Mountain, // Rock mechanics & ground control
  u4: Bomb, // Drilling, blasting & rock fragmentation
  u5: Truck, // Opencast mining & HEMM
  u6: Pickaxe, // Underground coal & metalliferous methods
  u7: Wind, // Ventilation, thermodynamics & subsurface hazards
  u8: Compass, // Surveying, mineral processing & electricals
  u9: TrendingUp, // Economics, planning & digital mining
  u10: Scale, // Legislation, safety management & rescue
};

export function unitIcon(unitId: string): LucideIcon {
  return UNIT_ICONS[unitId] ?? Pickaxe;
}
