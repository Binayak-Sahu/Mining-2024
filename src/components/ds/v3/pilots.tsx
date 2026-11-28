"use client";

import type { SimDef, Vals } from "@/lib/types";
import { UNITS } from "@/content";
import { overburden } from "@/content/sims/u0";
import { coalRank, apparentDip } from "@/content/sims/u1";
import type { Family } from "./tokens";

/**
 * The three v3a pilot sims. Promoted to production in Phase 15.5-v3e: the drawing, grips and viewBox now live in the
 * production SimDefs (`def.v3`), so the sandbox shows exactly what lessons show. This file only adds the sandbox extras
 * (family, objective lookup, KaTeX formulas under the stage).
 */

export interface PilotDef extends SimDef {
  family: Family;
  /** viewBox height (width is always 400). */
  viewH: number;
  goal?: { text: string; test: (p: Vals, o: Vals) => boolean };
  start?: Vals;
  where?: string;
  formulas: { tex: string; caption: string }[];
  work?: (p: Vals, o: Vals) => string | null;
  note?: (p: Vals) => string | null;
}

function goalFor(simId: string): { goal?: PilotDef["goal"]; start?: Vals; where?: string } {
  for (const u of UNITS)
    for (const [li, l] of u.lessons.entries())
      for (const s of l.stages)
        if (s.kind === "sim" && s.sim === simId) return { goal: s.goal, start: s.start, where: `Lesson ${u.n}.${li + 1} · ${s.title}` };
  return {};
}

export const overburdenV3: PilotDef = {
  ...overburden,
  ...goalFor(overburden.id),
  family: "blue",
  viewH: overburden.v3!.viewH,
  formulas: [{ tex: "\\sigma_v = \\rho\\, g\\, H", caption: "Vertical stress from overburden weight" }],
};

export const coalRankV3: PilotDef = {
  ...coalRank,
  ...goalFor(coalRank.id),
  family: "orange",
  viewH: coalRank.v3!.viewH,
  formulas: [
    { tex: "k = A \\exp(-E_a/RT)", caption: "Arrhenius kinetics: why temperature dominates rank, and why time only adds logarithmically." },
    { tex: "X_{\\text{daf}} = X_{\\text{ad}} \\times \\dfrac{100}{100 - M - A}", caption: "Convert air-dried analysis to dry-ash-free basis" },
  ],
};

export const apparentDipV3: PilotDef = {
  ...apparentDip,
  ...goalFor(apparentDip.id),
  family: "orange",
  viewH: apparentDip.v3!.viewH,
  formulas: [{ tex: "\\tan\\alpha = \\tan\\delta \\cdot \\sin\\beta", caption: "Apparent dip α for a section at β from strike · δ true dip" }],
};

export const PILOTS: { def: PilotDef; name: string }[] = [
  { def: coalRankV3, name: "Coalification furnace" },
  { def: overburdenV3, name: "Virgin vertical stress" },
  { def: apparentDipV3, name: "Dip and strike" },
];
