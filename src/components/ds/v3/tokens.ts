/**
 * DESIGN.md v3 tokens for the /design-system sandbox (Phase 15.5-v3a). DESIGN.md is the source of truth: change a value
 * there first, then here. Production screens do not import this file.
 */

export type Theme = "light" | "dark";
export type Family = "blue" | "yellow" | "purple" | "orange" | "teal";

export interface FamilyTones {
  face: string;
  ledge: string;
  on: string;
  ink: Record<Theme, string>;
  deep: string;
  mid: string;
  light: string;
  glow: string;
  tint: Record<Theme, string>;
}

/** §2.2 unit hue families, with the §2.2b contrast fixes Bink approved on 2026-11-28. */
export const FAMILIES: Record<Family, FamilyTones> = {
  blue: { face: "#4568F5", ledge: "#3451C9", on: "#FFFFFF", ink: { light: "#2E46C2", dark: "#6B87F7" }, deep: "#2E46C2", mid: "#4C6EF5", light: "#AAB9FF", glow: "#0D1A45", tint: { dark: "#0E1636", light: "#EEF1FF" } },
  yellow: { face: "#F6C22C", ledge: "#C7960C", on: "#3A2C00", ink: { light: "#8E6A08", dark: "#F6C22C" }, deep: "#B88A0A", mid: "#F6C22C", light: "#FCE38A", glow: "#2E2306", tint: { dark: "#2B2205", light: "#FFF7DA" } },
  purple: { face: "#8E49FF", ledge: "#7136D9", on: "#FFFFFF", ink: { light: "#6A3FD0", dark: "#A770FF" }, deep: "#6A3FD0", mid: "#9A5CFF", light: "#CDB6FF", glow: "#231340", tint: { dark: "#1F1236", light: "#F3EDFF" } },
  orange: { face: "#F28A2E", ledge: "#C2621A", on: "#2E1600", ink: { light: "#AE5410", dark: "#F28A2E" }, deep: "#C25E12", mid: "#F28A2E", light: "#FFC08A", glow: "#2E1708", tint: { dark: "#2A1508", light: "#FFF1E6" } },
  teal: { face: "#1FB5A3", ledge: "#13877A", on: "#002B26", ink: { light: "#0E7C6F", dark: "#1FB5A3" }, deep: "#0E7C6F", mid: "#1FB5A3", light: "#8FE3D8", glow: "#06261F", tint: { dark: "#062521", light: "#E6F8F5" } },
};

/** §2.2 unit → family. */
export const UNIT_FAMILY: Record<string, Family> = {
  u0: "blue", u1: "orange", u2: "purple", u3: "blue", u4: "yellow", u5: "yellow",
  u6: "purple", u7: "teal", u8: "blue", u9: "orange", u10: "teal",
};

/** §2.1 neutrals. */
export const NEUTRALS: Record<Theme, Record<string, string>> = {
  light: { bg: "#FFFFFF", surface: "#FFFFFF", "surface-2": "#F4F4F4", edge: "#E3E3E3", "edge-strong": "#D0D0D0", text: "#141414", "text-2": "#5C5C5C", "text-3": "#6F6F6F" },
  dark: { bg: "#141414", surface: "#1E1E1E", "surface-2": "#262626", edge: "#333333", "edge-strong": "#3D3D3D", text: "#F5F5F5", "text-2": "#A6A6A6", "text-3": "#8C8C8C" },
};

/** §2.3 state colours. */
export const STATE = {
  success: { face: "#22C55E", ledge: "#15803D", on: "#141414", fill: { light: "#15803D", dark: "#22C55E" } },
  danger: { face: "#EF4444", ledge: "#B91C1C", on: "#141414" },
  energy: { face: "#F5B417", ledge: "#B47F06", on: "#2A1E00" },
} as const;

/** §5.5 illustration greys (metal, rock). */
export const GREYS = { deep: "#5E5E5E", mid: "#9A9A9A", light: "#D9D9D9" } as const;

/** CSS custom properties for one family in one theme (`--u-*`), set on the element that owns the unit colour. */
export function familyVars(f: Family, theme: Theme): Record<string, string> {
  const t = FAMILIES[f];
  return {
    "--u-face": t.face, "--u-ledge": t.ledge, "--u-on": t.on, "--u-ink": t.ink[theme], "--u-deep": t.deep,
    "--u-mid": t.mid, "--u-light": t.light, "--u-glow": t.glow, "--u-tint": t.tint[theme],
  };
}

/** WCAG 2.x contrast of two #RRGGBB colours. */
export function contrast(a: string, b: string): number {
  const lum = (h: string) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Thin no-break space (U+202F) between a number and its unit, and a real minus sign (§3). */
export const NNBSP = " ";
export const num = (v: number, digits: number, unit?: string) => {
  const s = v.toFixed(digits).replace(/^-/, "−");
  return unit ? `${s}${NNBSP}${unit}` : s;
};
