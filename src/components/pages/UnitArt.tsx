import { UNIT_ILLUSTRATIONS, UnitIllustration } from "@/assets/illustrations";
import { unitIcon } from "@/content/unitIcons";
import { familyOf } from "@/lib/family";

/**
 * A unit's §5.5 illustration, or the §5.5 placeholder when a unit has none: a rounded tile (72 % of the box) in the
 * family `light` tone with a `mid` bottom edge, and the unit's lucide icon in `deep`, outline only, stroke scaled with size.
 */
export function UnitArt({ unitId, size, title }: { unitId: string; size: number; title?: string }) {
  if (UNIT_ILLUSTRATIONS[unitId]) return <UnitIllustration unitId={unitId} size={size} title={title} />;
  const Icon = unitIcon(unitId);
  const tile = Math.round(size * 0.72);
  return (
    <span data-family={familyOf(unitId)} className="inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} data-placeholder-art="">
      <span className="inline-flex items-center justify-center" style={{ width: tile, height: tile, borderRadius: tile * 0.28, background: "var(--u-light)", boxShadow: `inset 0 ${-Math.max(2, Math.round(size * 0.04))}px 0 var(--u-mid)` }}>
        <Icon size={Math.round(size * 0.4)} color="var(--u-deep)" strokeWidth={2.25} />
      </span>
    </span>
  );
}
