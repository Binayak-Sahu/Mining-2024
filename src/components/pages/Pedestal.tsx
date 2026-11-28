import { Check, Dumbbell, Lock } from "lucide-react";

export type PedestalState = "locked" | "open" | "current" | "done";

/** §5.8 fixed pedestal greys (both themes, like the §5.5 illustration greys). */
const GREY_TOP = "#9A9A9A";
const GREY_SIDE = "#5E5E5E";
const GREY_MARK = "#3A3A3A";

/**
 * §5.8 pedestal, 120 × 84: an ellipse top face (rx 54, ry 24, centre y 27) over a 30 px side band.
 * Locked: greys with a lock. Open: white top, unit `mid` side. Current: open + 6 px unit-`face` ring.
 * Done: unit `face` top, unit `deep` side, a check in the face's text-on colour. Unit tones come from the nearest `data-family` scope.
 */
export function Pedestal({ state, mark }: { state: PedestalState; mark?: "warmup" }) {
  const top = state === "locked" ? GREY_TOP : state === "done" ? "var(--u-face)" : "#FFFFFF";
  const side = state === "locked" ? GREY_SIDE : state === "done" ? "var(--u-deep)" : "var(--u-mid)";
  // Done mark: the family's text-on-face (white on blue/purple, dark on yellow/orange/teal), since white on those faces is < 3:1.
  const glyph = state === "locked" ? GREY_MARK : state === "done" ? "var(--u-on)" : "var(--u-deep)";
  return (
    <svg width={120} height={84} viewBox="0 0 120 84" aria-hidden className="block" data-pedestal={state}>
      <path d="M6 27 V57 A54 24 0 0 0 114 57 V27 Z" style={{ fill: side }} />
      <ellipse
        cx={60}
        cy={27}
        rx={54}
        ry={24}
        style={{
          fill: top,
          stroke: state === "current" ? "var(--u-face)" : state === "open" ? "var(--edge-strong)" : "none",
          strokeWidth: state === "current" ? 6 : 2,
        }}
      />
      {mark === "warmup" ? (
        <Dumbbell x={46} y={13} size={28} color={glyph} strokeWidth={2.6} />
      ) : state === "locked" ? (
        <Lock x={48} y={15} size={24} color={glyph} strokeWidth={2.6} />
      ) : state === "done" ? (
        <Check x={44} y={11} size={32} color={glyph} strokeWidth={3.2} />
      ) : null}
    </svg>
  );
}
