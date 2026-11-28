import Image, { type StaticImageData } from "next/image";
import u0 from "./u0.svg";
import u1 from "./u1.svg";
import u2 from "./u2.svg";
import u3 from "./u3.svg";
import u4 from "./u4.svg";
import u5 from "./u5.svg";
import u6 from "./u6.svg";
import u7 from "./u7.svg";
import u8 from "./u8.svg";
import u9 from "./u9.svg";
import u10 from "./u10.svg";

/**
 * DESIGN.md §5.5 unit illustrations. The .svg files in this folder are the source of truth: edit them in Figma and
 * export over the same file name (160 × 160). `npm run audit:illus` checks them; scripts/draw-illustrations.ts made
 * the first drafts and never overwrites a file edited elsewhere.
 */
export const UNIT_ILLUSTRATIONS: Record<string, StaticImageData> = { u0, u1, u2, u3, u4, u5, u6, u7, u8, u9, u10 };

/** A unit's illustration at `size` px (decorative unless `title` is given). Same art in both themes. */
export function UnitIllustration({ unitId, size = 160, title, eager = false }: { unitId: string; size?: number; title?: string; eager?: boolean }) {
  const src = UNIT_ILLUSTRATIONS[unitId];
  if (!src) return null;
  return <Image src={src} width={size} height={size} alt={title ?? ""} aria-hidden={title ? undefined : true} unoptimized draggable={false} loading={eager ? "eager" : undefined} className="shrink-0 select-none" />;
}
