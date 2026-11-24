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
- [ ] **Phase 5** — Units 8, 9 & 10

## Next checkpoint
Phase 5: author `src/content/sims/u8.tsx`, `u9.tsx`, `u10.tsx` and `src/content/units/u8.ts`, `u9.ts`, `u10.ts`; register in the two index files; run validate + build.
