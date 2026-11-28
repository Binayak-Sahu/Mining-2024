/**
 * DESIGN.md v3 §2.2: every unit belongs to one hue family. The family sets `data-family` on <html> for that unit's pages,
 * and the CSS (`[data-family="…"]` in globals.css) turns it into the unit's face, ledge, ink, tint and glow tones.
 * DESIGN.md is the source of truth: change a family there first, then here. The tones themselves live in globals.css.
 */
export type Family = "blue" | "yellow" | "purple" | "orange" | "teal";

/** §2.2 unit → family. */
export const UNIT_FAMILY: Record<string, Family> = {
  u0: "blue",
  u1: "orange",
  u2: "purple",
  u3: "blue",
  u4: "yellow",
  u5: "yellow",
  u6: "purple",
  u7: "teal",
  u8: "blue",
  u9: "orange",
  u10: "teal",
};

/** The family of a unit id ("u4") or lesson id ("u4-l2", "u4-boss"); blue when it is not a unit. */
export function familyOf(id: string | undefined | null): Family {
  const m = /^(u\d+)(?:-|$)/.exec(id ?? "");
  return (m && UNIT_FAMILY[m[1]]) || "blue";
}

/** The family a route belongs to: /unit/u4/ and /lesson/u4-l2/ (any base path). Everything else is the default blue. */
export function familyOfPath(path: string): Family {
  const m = /\/(?:unit|lesson)\/(u\d+(?:-[\w-]+)?)\/?/.exec(path);
  return familyOf(m?.[1]);
}

/** Inline script that sets <html data-family> before first paint, so a static page never flashes the wrong hue. */
export const FAMILY_BOOT = `(function(){try{var m=/\\/(?:unit|lesson)\\/u(\\d+)/.exec(location.pathname);var f=${JSON.stringify(
  Object.fromEntries(Object.entries(UNIT_FAMILY).map(([k, v]) => [k.slice(1), v])),
)};document.documentElement.setAttribute("data-family",(m&&f[m[1]])||"blue")}catch(e){}})();`;
