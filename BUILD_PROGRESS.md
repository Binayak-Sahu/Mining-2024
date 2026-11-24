# STRATA — Build Progress Log

Lossless state log for multi-session builds. Update at the end of every phase.

## Stack
Next.js 15 (App Router, static SSG) · TypeScript strict · Tailwind CSS v4 · framer-motion · lucide-react · zustand (persist → localStorage key `strata-progress-v1`; UI prefs in `strata-prefs`) · self-hosted Plus Jakarta Sans + JetBrains Mono (@fontsource-variable).
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
| Design tokens, light/dark ramps, 3D buttons/tiles, slider, plate, animations | `src/app/globals.css` |
| Theme + sound prefs (device-local), no-flash theme boot | `src/lib/prefs.ts` |
| Web Audio tactile sound + haptics (global listener) | `src/lib/sfx.ts`, `src/components/shell/ClientEffects.tsx` |
| SVG material library (strata hatch patterns, metal/rock gradients, filters) | `src/components/sim/defs.tsx` (`MAT`) |
| Expedition map (strata bands, S-curve path, nodes) | `src/components/pages/ExpeditionPath.tsx`, `strata.ts` |
| Custom slider | `src/components/ui/Slider.tsx` |

### Content authoring contract
- A **SimDef** = params (sliders / segmented options) + `compute(p)` + `outputs` (tone/format) + `render(p, o, t)` SVG.
- Every lesson follows the 5-stage loop: `theory` → `sim` and/or `predict` → `equation` → `numeric` → `crisis` and/or `swipe`.
- Theory stage reuses a sim's render as the layered diagram, with numbered hotspots in viewBox coordinates.
- SRS key = `${lessonId}#${stageIndex}`; formula codex key = `${lessonId}#eq${stageIndex}`.
- `npm run validate` (scripts/validate-content.ts) proves every SimLab goal is reachable by grid search, hotspots are in-bounds, every crisis phase has exactly one correct option, and every sim renders.
- QA flag: `localStorage["strata-qa"]="1"` keeps one heart so automated walkthroughs can traverse lessons.
- Optional `SimDef.handles` add direct-manipulation grips on the canvas: `{ key, axis, at(p,o) → [x,y], toValue(coord,p) }`; the runtime clamps and snaps to the param's range/step. Theory hotspots are placed over the same render, so diorama upgrades must keep geometry (only fills/overlays change).
- Theming: author UI in light-mode semantics with `slate-*`, `bg-surface`, `bg-canvas`; `.dark` on `<html>` remaps the neutral ramp and accent tints. Always-dark instrument panels (telemetry, calculators) use fixed hex colours. Simulation plates stay daylight-lit in both themes.

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

- [x] **Phase 7 — Statutory verification, GitHub Pages, offline PWA**
  - `src/content/statutes.ts`: all 7 previously unconfirmed rules replaced with owner-verified values and citations (`verifiedBy: "owner"`): wet bulb 33.5 °C / ≥ 1.0 m/s above 30.5 °C (CMR 2017 Reg. 153(2)(d)); CO 50 ppm, withdraw at ≥ 50 ppm; air quantity max(6 m³/min per person in largest shift, 2.5 m³/min per t/day) (Reg. 153(2)(a)); pillar centres table (Reg. 111(4), exported as `PILLAR_TABLE` / `minPillarCentres`, used by the Pillar FoS calculator); earth fault 750 mA (250–1100 V UG) / 50 A (1.1–11 kV OC) (CEA Safety Regulations 2023, Reg. 102); illumination UG face 10 / roads 5 / pit bottom 20 lux (Cir. 18/1975), OC 15H/25V, haul roads 10H, dumps 15H/15V (Cir. 02/2017; CMR 2017 Reg. 178(2)(b)); Degree III (Reg. 2(1)(zc)). 0 unconfirmed entries remain. Lesson, Codex and exam text updated; 5 new statute exam questions (bank 379).
  - Static export: `next.config.ts` (`output: "export"`, `trailingSlash`, unoptimised images, `basePath`/`assetPrefix` from `NEXT_PUBLIC_BASE_PATH`), `public/.nojekyll`, `.github/workflows/deploy.yml` (validate → tsc → lint → build → Pages on push to `main`). `npm start` now serves `out/` via `scripts/serve-out.mjs`.
  - PWA: `public/manifest.json`, icons (`scripts/make-icons.mjs` renders `icon.svg` → 192/512/maskable/apple-touch), `public/sw.js` (precaches every exported file listed in `out/precache.json` generated by `scripts/build-sw.mjs`; network-first pages, cache-first assets; versioned caches), registered by `src/components/shell/PwaRegister.tsx`.
  - Mobile: ≥ 44 px tap targets on coarse pointers (global CSS + header/back links, enlarged invisible hotspot hit areas r = 28), 44 px slider tracks with 28 px thumbs, `touch-action` on diagrams/sliders/swipe cards, safe-area viewport.
  - Sync: `src/lib/sync.ts` + `SyncCard` (Profile, header ⇄ icon): export JSON; import with validation, schema migration, and Replace or Merge (union of unlocks, best lesson records, max counters).
  - Verified: validate ✓ · tsc ✓ · lint ✓ · build ✓ (208 files, 3.2 MB precache). Playwright (Pixel 7 / iPhone 13) on the `/Mining-2024` base-path build: assets/manifest resolve, SW controls page with 208 cached entries, 5 never-visited pages load offline, export → reset → import(replace) → merge round-trip correct, malformed file rejected, no undersized tap targets, no horizontal overflow, 0 console errors.

- [x] **Phase 7.1** — Citations corrected: lighting → CMR 2017 Reg. 178(2)(b); earth-fault limit → CEA Safety Regulations 2023, Reg. 102. Discrepancy notes removed.

- [x] **Phase 8 — "Tactile Engineering Studio" redesign**
  - **Audit findings:** flat list home with no sense of journey; uniform white boxes on a navy grid; raw browser sliders and flat buttons with no press feedback; wireframe-flat diagrams that could only be driven from sliders below them; 7-item top nav out of thumb reach on phones; no sound, spring or reward feedback in lessons.
  - **Design system:** warm alabaster `#F7F7F5` (Crisp Daylight) / obsidian `#0B0F19` (Underground Shift Mode) with a token-remapped slate ramp, multi-layer card shadows, Plus Jakarta Sans + JetBrains Mono for telemetry, chunky 3D buttons (`.btn-3d` tones) and answer tiles (`.tile-3d`), Brilliant-style slider with gradient fill, 3D thumb and floating value pill (native range input kept on top for keyboard/a11y/touch). Theme toggle (device / light / dark, no-flash boot script) and mute toggle in the header; Profile has an Appearance & sound card.
  - **Sound & haptics:** Web Audio-synthesised tap clicks, slider detent ticks, correct triad chime, wrong thud, unlock arpeggio, completion fanfare, heart-loss blip; `navigator.vibrate` on phones; all silenced by the mute toggle. Works offline (no audio files).
  - **Expedition map (home):** each unit is a geological stratum band (surface daylight → topsoil → sandstone → shale → … → granite basement → DGMS Command Level at −1200 m) with texture, depth label and progress ring; every lesson/boss sits on a winding S-curve trail with 3D nodes (done/current/open/locked, perfect-hearts star, boss crown), a bobbing START callout and pulsing halo on the current node. Hero "Continue your expedition" card, rank/streak-week/warmup/codex/exam bento sidebar. Unit pages reuse the path beside shift-briefing cards with stage icons.
  - **Shell:** glass header with sliding nav pill; phones get a 6-tab bottom bar in the thumb zone (Path, Warmup, Exam, Lab, Tools, Codex) and a rank avatar → Profile.
  - **Dioramas:** global `SvgDefs` material library; diorama plate with blueprint grid, LIVE badge on animated sims; dark instrument-cluster telemetry strip; `Cracks`, `Stream`, `HudBadge`, `heatColor` primitives. Upgraded sims: overburden column (textured strata, lamp glow, σv HUD, drag the gallery to change depth), Kirsch (full σθ(r,θ) stress heatmap + spalling/roof cracks at failure), pillar (coal texture, drag pillar width, animated pillar cracks and shaking core pillar when FoS < 1), plane-failure slope (rock texture, drag the crest to change face angle, tension cracks and shaking block when FoS < 1), roof bolting (drag span, roof cracks when beam tension ≥ strength), ventilation network (roadway walls, animated airflow streamlines scaled by Q, spinning fan), PPV (drag distance along the attenuation curve).
  - **Immersive lesson player:** no outer nav; X exit, chunky segmented progress bar per stage colour, pulsing hearts that shake and burst on loss; spring slide transitions between stages; stage cards with a coloured stage chip; every card footer lifted into a bottom action drawer (lifted above the tab bar on Warmup); +XP burst particles; codex/formula toasts; red stand-down drawer; completion screen with confetti, medallion and XP / accuracy / hearts tiles.
  - **Cards:** 3D answer tiles with A–D keys and green/red states, dark swipe cards with drag tilt and TRUE/FALSE stamps, violet equation blocks, always-dark scratch calculator, amber workbench panel, dark hotspot explanations.
  - **Pages:** Codex (stat tiles, sliding tab control, unit chip rail, statute cards with citation pills), Exam (hero, dark timer bar, question rail, answer tiles, scorecard), Tools (icon tile picker + dark live-output panel), Sim Lab (sim first on phones, searchable list), Profile (rank hero, stat bento, 28-day heatmap, ladder, appearance), Warmup (Leitner boxes, segmented progress, slide transitions).
  - **Fix:** the theme boot script moved from `<head>` to the start of `<body>` (with `suppressHydrationWarning`) after the head placement produced intermittent React #418 hydration errors in production; Kirsch ring coordinates rounded to avoid float-precision hydration mismatch.
  - Verified: validate ✓ (379 stages, 379-question bank) · tsc ✓ · lint ✓ · build ✓ (root and `NEXT_PUBLIC_BASE_PATH=/Mining-2024`; 87 pages; precache 221 files, 5.5 MB). Playwright on the base-path build: SW controls page with 221 cached entries, 5 never-visited pages load offline, export → reset → import (replace) → merge round-trip, malformed file rejected, 0 lesson tap targets < 44 px; 12 pages × desktop 1366 + Pixel 7 × light + dark → no horizontal overflow, 0 console/page errors (7 consecutive sweeps); full lesson walkthrough (all 7 engines + completion) in both themes; drag grips change parameters (depth 300 → 650 m) and pillar failure draws 9 cracks; exam paper start → answer 25 → submit → review; theme cycle + persistence; mute persistence.

## Totals
55 lessons + 11 boss exams · 379 stages · 61 simulations (7 with on-canvas drag grips) · 55 Field Codex cheat sheets · 19 cited statutes (0 unconfirmed) · 379-question exam bank · 7 field calculators · light + dark themes · synthesised sound & haptics.

## Next checkpoint (optional enhancements)
All phases are complete. Possible future work: drag grips and diorama textures for the remaining simulations, per-unit statutory reference pages, a teacher dashboard, and periodic re-verification of statutory figures as OSH&WC Code regulations are notified.
