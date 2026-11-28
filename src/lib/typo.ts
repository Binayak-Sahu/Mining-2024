/**
 * DESIGN.md v3 §3 number typography, applied when a value is drawn (never to stored or typed values):
 * a thin no-break space (U+202F) between a number and its unit, and a real minus sign (U+2212).
 */
export const NNBSP = " ";
export const MINUS = "−";

/** A leading or operator-position hyphen before a digit becomes a real minus sign ("-40" → "−40", "3 × -2" → "3 × −2"; "12-15" is left alone). */
export function minus(s: string): string {
  return s.replace(/(^|[\s(=<>×·/±,;:])-(?=\.?\d)/g, `$1${MINUS}`);
}

/** Value strings only (readouts, results): minus sign, plus a thin no-break space between a digit and a following unit. */
export function tx(s: string): string {
  return minus(s).replace(/(\d) (?=[°%µΩA-Za-z])/g, `$1${NNBSP}`);
}

/** "42.5" + "m³/s" → "42.5 m³/s" with the thin space; an empty unit gives just the value. */
export function withUnit(value: string, unit?: string): string {
  return unit ? `${minus(value)}${NNBSP}${unit}` : minus(value);
}

/** §5.2 titles as drawn: every ASCII hyphen becomes a non-breaking hyphen (U+2011), so "Room-and-pillar" never splits. */
export const NBHY = "‑";
export function nbh(s: string): string {
  return s.replace(/-/g, NBHY);
}
