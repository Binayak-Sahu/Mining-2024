# STRATA — Build Progress Log

Lossless state log for multi-session builds. Update at the end of every phase.

## Stack
Next.js 15 (App Router, static SSG) · TypeScript strict · Tailwind CSS v4 · framer-motion · lucide-react · zustand (persist → localStorage key `strata-progress-v1`).
All simulations are hand-built SVG (400×240 viewBox) — no WebGL dependency was needed, so `three` is not installed.

## Architecture
| Concern | Path |
|---|---|
| Domain types (Stage union, SimDef, Unit, Lesson, CodexEntry) | `src/lib/types.ts` |
| Gamification store (XP, streak, hearts lost, lessons, codex, formulas, Leitner SRS, free-roam) | `src/lib/store.ts` |
| Ranks, XP table, hearts per lesson | `src/lib/ranks.ts` |
| Unlock logic (sequential lessons, boss gate) | `src/lib/progress.ts` |
| Safe expression evaluator (scratch calculator, degrees trig) | `src/lib/calc.ts` |
| Date keys / streak maths | `src/lib/date.ts` |
| SVG primitives (Txt, Arrow, Dim, Meter, Plot, sample) | `src/components/sim/svg.tsx` |
| Sim runtime (SimCanvas, Readouts, Controls, SimView) | `src/components/sim/SimView.tsx` |
| 7 card engines | `src/components/cards/*.tsx` |
| Lesson player (hearts, XP, codex unlock, SRS capture, fail/retry) | `src/components/LessonPlayer.tsx` |
| Pages: Campaign skill tree, Unit map, Codex, Warmup, Profile | `src/components/pages/*.tsx`, `src/app/**` |
| Content registry | `src/content/index.ts`, `src/content/units/*.ts`, `src/content/sims/*.tsx` |

### Content authoring contract
- A **SimDef** = params (sliders / segmented options) + `compute(p)` + `outputs` (tone/format) + `render(p, o, t)` SVG.
- Every lesson follows the 5-stage loop: `theory` → `sim` and/or `predict` → `equation` → `numeric` → `crisis` and/or `swipe`.
- Theory stage reuses a sim's render as the layered diagram, with numbered hotspots in viewBox coordinates.
- SRS key = `${lessonId}#${stageIndex}`; formula codex key = `${lessonId}#eq${stageIndex}`.
- `npm run validate` (scripts/validate-content.ts) proves every SimLab goal is reachable by grid search, hotspots are in-bounds, every crisis phase has exactly one correct option, and every sim renders.
- QA flag: `localStorage["strata-qa"]="1"` keeps one heart so automated walkthroughs can traverse lessons.

## Phase checklist
- [x] **Phase 1** — scaffold, store, Codex, Campaign tree, Unit map, Warmup (SRS), Profile, 7 card engines, Orientation unit (U0) exercising every engine. `npm run build` ✓, `tsc --noEmit` ✓, Playwright walkthrough ✓ (0 console errors).
- [x] **Phase 2** — Unit 1 (6 lessons + boss: coal genesis/rank, ore genesis/supergene, apparent dip, faults, RQD core logging, UNFC & reserves) and Unit 2 (5 lessons + boss: access selection & shaft pillar, sinking cycle & Galloway stage, freezing/cementation, burn-cut drift blasting, roadheader/CM/TBM). 11 new sims in `src/content/sims/u1.tsx`, `u2.tsx`. `npm run validate` ✓ (goal reachability), build ✓.
- [x] **Phase 3** — Unit 3 (7 lessons + boss: Kirsch stresses, Griffith/MC/HB failure, RMR/Q/GSI, roof bolting beam theory, pillar design SM & CMRI, slope stability, subsidence & rockbursts) and Unit 4 (5 lessons + boss: drilling mechanics, explosive thermochemistry/detonation, Kuz-Ram, NONEL delay & misfires, PPV/airblast/flyrock with DGMS TC 7/1997). 12 new sims. Validator upgraded with 1/2/3-parameter subset search. validate ✓ build ✓ walkthrough ✓.
- [x] **Phase 4** — Unit 5 (5 lessons + boss: pit geometry/SR vs BESR, dragline cut-and-cast, truck–shovel match factor, haul-road physics, dump stability), Unit 6 (4 lessons + boss: depillaring goaf/main fall/air blast, longwall abutments & shields, stope dilution, block-cave draw ellipsoids) and Unit 7 (7 lessons + boss: gases & Coward's triangle, Atkinson networks/regulators, fans/stall/NVP, psychrometry & CMR heat limits, spontaneous combustion ratios, coal-dust & stone dusting, pumping & NPSH). 16 new sims. validate ✓ (272 stages) build ✓ walkthrough ✓ (0 runtime errors).
- [x] **Phase 5** — Unit 8 (6 lessons + boss: traverse/Bowditch, Weisbach & gyro, Bond comminution, settling/flotation/washability, restricted-neutral earthing & FLP/IS, Koepe winding & safety devices), Unit 9 (4 lessons + boss: DCF with royalty/DMF/NMET, grade–tonnage/Lane/Gy, Lerchs–Grossmann 2-D DP pit optimiser, slope-radar inverse velocity & telemetry triage), Unit 10 (5 lessons + boss: statutory architecture & duties, gassiness & air standards, SMP/HIRA/WRAC risk matrix, fault trees, rescue BA planning & first aid; boss = sealed-fire recovery). 15 new sims. validate ✓ (373 stages / 11 units) · tsc ✓ · lint ✓ · build ✓ (85 static pages) · Playwright walkthrough of every lesson ✓ (0 runtime errors).

- [x] **Phase 6 — Mega-upgrade**
  - **6 new SimLabs** (`src/content/sims/phase6.tsx`), inserted as stage 3 of their lessons and linked to Codex sheets via `CodexEntry.sims`: three-point dip & strike (u1-l3), plane/wedge/circular(Bishop)/toppling slope modes (u3-l6), longwall DERD/AFC/shield face cycle (u6-l2), BG vs LTCC thick-seam (u6-l1), froth flotation circuit with grade–recovery curve (u8-l4), FLP/IS zoning troubleshooter with event injection (u8-l5).
  - **Store v2 migration** (`migrateState` in `src/lib/store.ts`): SRS and formula keys in the six lessons are re-indexed (+1 at/after index 2). Adds exam history.
  - **Statutory audit** (`src/content/statutes.ts`): 19 rules, each with citation and status (verified / standard / unconfirmed). Verified against CMR 2017 text: Reg. 153 (O₂ ≥ 19 %, CO₂ ≤ 0.5 %, CH₄ 0.75 % return / 1.25 % anywhere), Reg. 166 (gas "detected" at 0.1/0.5/1.25 % by degree → withdraw & fence), Reg. 169 (power cut-off > 1.25 %), Reg. 111/112 (galleries ≤ 4.8 m × 3 m), Reg. 2 degree definitions, Reg. 178 lighting (+ DGMS Cir. Legis. 02/2017 opencast lux). Removed the legacy "withdraw at 2 %" rule everywhere. Flagged as unconfirmed: wet-bulb 30.5/33.5 °C, CO 50 ppm, 6 m³/min & 2.5 m³/min/t air quantity, pillar-size table, 750 mA restricted-neutral clause, underground lux values. Codex has a new **Statutes** tab.
  - **DGMS Exam Simulator** (`/exam`, `src/lib/exam.ts`): 374-question bank from predict/crisis/swipe/numeric stages + statute register; 25-question, 30-minute papers with weighted sampling (numericals ×3, crises ×2.5, boss ×1.5), quotas (≥ 7 numericals, ≥ 8 statutory), ≤ 4 per unit, shuffled options; step-by-step derivation review; per-unit and historical weak-unit analytics; optional weak-unit focus.
  - **Field Calculators** (`/tools`): Atkinson, Pillar FoS (SM + CMRI + Reg. 111 check), Kuz-Ram, PPV/DGMS limit, BESR, three-point dip & strike, pump head/NPSH.
  - **Sim Lab** (`/lab?sim=<id>`): free-play of all 61 simulations; Codex thumbnails deep-link here.
  - Verified: validate ✓ (379 stages, exam bank, tools, statutes) · tsc ✓ · lint ✓ · build ✓ (88 pages) · Playwright: 6 new sims (every option/slider), host lessons, full exam flow, all 7 calculators, Codex statutes — 0 console/runtime errors.

## Totals
55 lessons + 11 boss exams · 379 stages · 61 simulations · 55 Field Codex cheat sheets · 19 cited statutes · 374-question exam bank · 7 field calculators.

## Next checkpoint (optional enhancements)
All five phases are complete. Possible future work: per-unit statutory reference pages, export/import of progress, a teacher dashboard, and periodic re-verification of statutory figures as OSH&WC Code regulations are notified.
