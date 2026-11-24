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
- QA flag: `localStorage["strata-qa"]="1"` keeps one heart so automated walkthroughs can traverse lessons.

## Phase checklist
- [x] **Phase 1** — scaffold, store, Codex, Campaign tree, Unit map, Warmup (SRS), Profile, 7 card engines, Orientation unit (U0) exercising every engine. `npm run build` ✓, `tsc --noEmit` ✓, Playwright walkthrough ✓ (0 console errors).
- [ ] **Phase 2** — Units 1 & 2
- [ ] **Phase 3** — Units 3 & 4
- [ ] **Phase 4** — Units 5, 6 & 7
- [ ] **Phase 5** — Units 8, 9 & 10

## Next checkpoint
Phase 2: author `src/content/sims/u1.tsx`, `u2.tsx` and `src/content/units/u1.ts`, `u2.ts`; register in the two index files.
