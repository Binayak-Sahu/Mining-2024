import type { ComponentType } from "react";
import { U4Blasting } from "./U4Blasting";
import { U7Ventilation } from "./U7Ventilation";

/** DESIGN.md §5.5 unit illustrations drawn so far (drafts). Units without one fall back to their lucide icon. */
export const UNIT_ILLUSTRATIONS: Record<string, ComponentType<{ size?: number; title?: string }>> = {
  u4: U4Blasting,
  u7: U7Ventilation,
};
export { U4Blasting, U7Ventilation };
