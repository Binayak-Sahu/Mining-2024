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

- [x] **Phase 9 — Mobile UI fixes + upgrade of the remaining 54 simulations** (checkpoints pushed every two units)
  - Part 1 (done): every simulation canvas now uses a padded `viewBox="-24 -24 448 288"` (24-unit margin round the 400 × 240 drawing) and bleeds to the card edge on phones; dark-mode neutral ramp raised so secondary text is ≥ `#94A3B8` and active text `#F1F5F9`; light `slate-400` darkened to `#7B8799`; causal-chain steps use colour instead of 25 % opacity; dimmed answer tiles keep full-opacity text; compact mobile lesson chrome (56 px header, 20 px titles, story copy clamped to three lines with "Read more"); telemetry strip is a single swipeable row on phones; live numeric readouts spring between values (`AnimatedNumber`, exact value at rest, reduced-motion aware); card labels in sentence case. `Dim` callouts sit on a paper pill and can be placed in a left gutter (`side="left"`); the overburden column moved right to give its depth callout a gutter, and its redundant σv badge (rounded to 0.1) was removed so the diagram shows one value.
  - `npm run audit:svg` (`scripts/audit-svg.tsx` + `scripts/audit-measure.js`): renders every sim in 843 contexts (defaults, each parameter at min/max, every lesson stage's parameters and theory hotspots), measures real text boxes with the app fonts in headless Chromium and reports clipped labels, overlapping labels and hotspot pins covering text/arrowheads/thick strokes. Needs Playwright (`NODE_PATH=$(npm root -g)` in this environment).
  - Part 2 progress: Units 0–3 upgraded — coal-rank column (strata overlay, glowing rank band, drag the burial depth), supergene profile (soil/ore/rock textures, animated percolation and water table, drag cap and blanket thickness), apparent dip (textured plan and section, drag the section line), faults (textured walls, glowing fault plane, drag the throw), RQD core tray (timber tray, shaded core cylinders), UNFC (raised chips, glass result card), access selection (textures, headframe, drag the seam depth), shaft sinking (rock walls, hatched lining, metal stage decks, animated kibble), freezing (ice wall, glowing freeze pipes), burn cut (rock face, glowing fired holes), roadheader/CM/TBM (spinning cutter drum, moving TBM cutters, tracked chassis, drag the rock UCS), failure criteria (stable/failed envelope shading, drag σ3), RMR (glossy rating stack), subsidence (strata, houses riding the trough, goaf panel, drag panel width). Units 4–5 upgraded — drilling (textured strata, rotating drill string and tricone, flying cuttings, drag hole depth), explosives (rock-hosted borehole, glowing detonation front with shock arcs, rising fume plume), Kuz-Ram (textured bench, stemming and glowing charges, toe fragments, drag bench height), delay timing (expanding blast rings per hole), PPV (curve fill; label flips side near the edge), pit section (strata, coal seam, animated haul truck on the ramp), dragline (textures, steel boom, swinging bucket; rehandle warning moved clear of the cut label), truck–shovel (haul-road loop with centre line, steel shovel, spoil dump), haul road (textured ramp, moving road markings and spinning wheels scaled by speed, drag the ramp grade), dump stability (loose-spoil texture, slump shake and cracks below FoS 1, animated phreatic line). Units 6–7 upgraded — depillaring goaf (shale/sandstone/goaf textures, dark open goaf, main-roof cracks + shake and animated air blast at the main fall, drag the goaf span), longwall (stress-abutment fill, rubble goaf, steel shield legs, spinning shearer drum with picks, moving AFC chain), stope dilution (rock and ore textures, hatched slough, drag ore width), block caving (ore texture, waste cap, ore particles drawing into each drawpoint, drag height of draw), Coward triangle (glow when explosive, crosshair guides, drag CH₄ on the x-axis and O₂ on the y-axis), fan curve (hatched stall zone, spinning impeller that slows in stall, operating-point halo), psychrometry (glass thermometers with scales, wet wick, flowing air streams, drag dry-bulb and air velocity), spontaneous combustion (glossy bars, labels inside long bars so they never clip, smouldering heap with rising smoke when heating), stone dusting (roadway arch, steel sets, lamp glow, drifting airborne dust), pumping (rock backdrop, rippling sump, steel suction pipe, spinning impeller, animated rising-main flow, rising cavitation bubbles, drag suction lift). Units 8–9 upgraded — Bowditch traverse (contoured survey plan, station pegs), Weisbach triangle (rock plan, hatched shaft lining, dark shaft, animated laser sight lines, glowing plumb wires, drag the instrument distance), Bond comminution (steel ball-mill shell with lifters, tumbling charge, drag F80 and P80 on the log scale), washability (target-ash zone, yield area, point halo), restricted-neutral earthing (transformer coils, animated fault-current loop that stops when the ELR trips, glossy motor frame), Koepe winding (steel headframe, spinning wheel that races when the rope slips, counter-moving skips and tail rope), DCF/NPV (glossy bars, payback-year marker), grade–tonnage (ore-above-cut-off area, drag the cut-off grade; break-even label moved clear of the axis title), Lerchs–Grossmann (rock-textured waste blocks, shaded pit shell), slope radar (scanning radar mast, pulsing latest reading, drag the failure time; label flips side near the edge). Unit 10 and the Phase-6 sims upgraded — statutory hierarchy (glossy law pyramid, accented duty card), gassiness (glossy degree scale, live gas-body fill, rising gas bubbles in the degree panel, drag emission rate and general-body %), HIRA risk matrix (glossy cells, animated control arrow from inherent to residual, drag consequence and likelihood), fault tree (steel gates, leaves tinted by probability, glowing top event when above tolerance), SCBA (steel cylinder and valve, rising bubbles, rescuer walking the mission timeline, drag travel time), three-point problem (contoured plan, borehole halos, textured section with seam; contour labels kept inside the map and clear of boreholes), slope modes (sky, rock, dump and shale textures, crest cracks when FoS < 1), longwall cycle (coal, goaf, roof and floor textures), thick seam (shale/coal/sand/goaf textures; roof-shale label kept below the title), flotation (slurry-tinted cell), FLP/IS zones (rock backdrop, steel cable tray).
  - Layout fixes from the audit: label clips and overlaps in fault, subsidence, PPV, dragline, goaf, sponcom, grade–tonnage, radar, three-point, thick-seam, slope-modes and drilling sims fixed in the renderers; 47 hotspot pins moved to the nearest collision-free spot by the audit's pin solver (`AUDIT_SUGGEST=1 npm run audit:svg` writes `.audit/pin-suggestions.json`; coordinates applied to the unit files). Audit result: 843 renders · clip 0 · overlap 0 · pin 0. Later an occlusion check was added (a small opaque shape painted over > 30 % of a label); it found and fixed the pump impeller over the stage label, the solid residual marker hiding risk-matrix scores (now a ring), the dragline spoil over the CUT label (label painted last) and the ignition flash over equipment labels (translucent with a rim). Final: 843 renders · clip 0 · overlap 0 · occlude 0 · pin 0.
- [x] **Phase 10 — Final visual QA & interactive polish**
  - 390 × 844 headless sweep (`isMobile`, touch) of all 61 Sim Lab simulations and the first stage of all 66 lessons, in light and dark, on the `/Mining-2024` export: runtime errors, horizontal overflow, WCAG-AA contrast of every visible HTML text node (colours resolved through a canvas so `oklch()`/`color-mix()` tokens are measured exactly) and whether the lesson diagram ends above the action bar. First run: 0 errors, 0 overflow, 0 fold problems, and real contrast failures that were fixed — light secondary grey darkened (`slate-500` → `#536074`, `slate-400` → `#657083`), slider value read-outs and stage chips now use AA text shades per theme instead of raw accent colours, 3D button faces darkened (safe `#047857`, crit `#DC2626`, tech `#2563EB`, violet `#7C3AED`; amber buttons use dark text), Sim Lab selection darkened, inactive causal-chain numbers use theme greys. Final run: 0 errors · 0 overflow · 0 contrast failures · 0 fold problems in both themes.
  - Field Codex as a visual encyclopedia: unlocked sheets keep their live diagram thumbnails; locked sheets now show a greyed, static preview of their diagram under a lock in a two-column grid. Animated dioramas pause while off-screen (IntersectionObserver), so long Codex pages stay light on CPU/battery.
  - Re-verified: validate ✓ (379 stages) · tsc ✓ · lint ✓ · build ✓ (root and `/Mining-2024`; precache 222 files, 6.1 MB) · PWA regression ✓ (service worker caches every file, 5 unvisited pages offline, export → reset → import → merge round-trip, malformed file rejected, 0 console errors).

- [x] **Phase 11 — Deep UX, content flow & tactile polish (no new features)**
  - Storytelling: every one of the 55 Field Theory briefings now opens with a concrete hook — a physical puzzle or shift consequence (e.g. "every square metre of roof is holding up a stack of rock heavier than 500 cars"; "move the blast twice as far from the village and you can fire roughly four times the charge per delay") — ahead of the existing explanation, which is kept intact. On phones the three-line preview leads with the hook.
  - Wrong-answer feedback: all 66 Predict-the-Outcome stages carry a field-specific explanation for every wrong option (`optionWhy`, 198 explanations), shown as "Why “…” fails" followed by "What actually happens"; the validator now fails any predict stage whose wrong options are not all explained. The DGMS exam review shows the same "Why that fails" line for predict and shift-crisis questions. Equation Forge diagnoses each attempt: which block does not belong, how many are missing, or — when every block is right — which position is wrong. Shift Crisis options and Statutory Swipe cards already carried a specific reason per choice/card. Verdicts scroll themselves into view above the action drawer.
  - Canvas-first objectives: every lesson Intuition-lab goal (61) now sits inside the diagram frame as an objective bar; the whole frame and bar light up emerald (with a check pop) the moment the goal is met. The Sim Lab turns those same goals into chained challenges for whichever simulation is open ("Challenge 1/2", chime on success, "Next challenge"), so free play has a target.
  - Drag grips: a floating value pill ("Depth of working: 610 m") follows the grip while dragging; the pulsing halo stays until first use.
  - Micro-delight: XP in the header counts up with a spring, the streak flame pops when the streak grows, the Codex/formula unlock toast bursts sparks, verdict icons spring in.
  - Mobile header: the theme toggle moved off the phone top bar (it lives in Profile → Appearance), leaving logo, streak, XP, mute and avatar — 5 items, none overlapping, all inside 378 px of a 390 px screen. Streak/XP numbers use AA text shades.
  - Verified: audit:svg 843 renders · 0 clip/overlap/occlude/pin · validate ✓ (incl. per-option explanations) · tsc ✓ · lint ✓ · build ✓ (root and `/Mining-2024`) · 390×844 sweep of all 61 sims and 66 lessons in light and dark: 0 runtime errors, 0 horizontal overflow, 0 WCAG-AA contrast failures, every lesson diagram above the action drawer · interaction checks (both themes): challenge bar met → frame/bar emerald, drag tooltip shows live value, wrong predict answer shows its specific reason and scrolls into view · PWA regression ✓ (222 cached files, offline pages, export/import/merge).

- [x] **Phase 12 — Inspector Mode, studio audio, UI craft** (shipped section by section)
  - Architecture notes (read first): progress lives in one zustand store (`strata-progress-v1`, version 2, `migrateState`); device-local UI prefs live in a separate persisted store (`strata-prefs`: theme, muted) that `sync.ts` never exports; unlock logic is `lessonUnlocked`/`bossUnlocked` (`src/lib/progress.ts`) used by the Campaign, expedition path and unit map; `LessonPlayer` is the only writer of progress during a lesson (cards report through `onMistake`/`onDone`); audio is `src/lib/sfx.ts` (`sfx.*` API + one global listener for taps/slider ticks); the service worker precaches `out/precache.json`, whose version is a hash of the exported files, so every build gets a new cache name.
  - **§1 Inspector Mode (shipped).** `masterUnlock` is a device-local pref in `strata-prefs` (no change to the progress store or its version; export/import untouched — verified a fresh export has no `masterUnlock`). Toggle in Profile ("Inspector Mode" switch), with `Shift+M` (ignored in inputs, textareas, selects and contenteditable), and with the key icon in the header (always on desktop; on phones it only appears while the mode is on, to keep the bar uncluttered); each toggle confirms with a sonner toast. When on: every unit, lesson and Boss Exam on the expedition map and unit map is playable, Inspector-only nodes are slate with an amber `MASTER` badge (distinct from completed nodes); the Field Codex shows all 55 sheets and every formula in full (view only); the lesson player gets a Stage Jumper pill bar (one pill per actual stage, current highlighted; every jump remounts the card, so re-jumping to the current stage restarts it) and, in sandbox runs, a "Refill" hearts button. Sandbox rule: a run is a sandbox when the lesson is open only because of Inspector Mode, or once the Stage Jumper has been used (decision: skipping stages must never earn real progress); sandbox runs show an "INSPECTOR · progress not saved" chip and write nothing — no XP, hearts lost, streak, completion, attempts, review queue, Codex or formula unlocks. Genuinely unlocked lessons behave normally with Inspector on; their attempt counter is now recorded on the first real answer instead of on open, so opening a lesson never touches saved data. Field Calculators and the Exam Simulator ignore Inspector Mode.
    - Acceptance (headless, 390×844 and 1366×900): seeded progress snapshot → Inspector on (Profile switch, then Shift+M off/on; Shift+M ignored while typing in the Codex search) → 3 locked lessons played through the Stage Jumper (u3-l2, u5-l2, u7-l3), a locked Boss Exam won (u1-boss) and a locked Boss Exam lost to zero hearts (u2-boss) → Inspector off → progress string byte-identical; MASTER badges 54 → 0; Stage Jumper reached all 7 card types across one lesson per unit plus a boss (theory, sim lab, predict, equation, workbench, shift crisis, statutory swipe); 0 console errors.
  - **§2 Studio audio (shipped).** `src/lib/sfx.ts` rebuilt as layered Web Audio synthesis with the same public API (`sfx.tap/tick/correct/wrong/heart/unlock/fanfare`, `installGlobalSfx`), so no call site changed. Decision: synthesis only — no samples, so no third-party audio licences or extra precache entries are needed and sounds work offline by construction. Signal path: every layer has its own ADSR gain; each sound's layers share a low-pass filter; all sounds go through one bus → gentle compressor (−20 dB, 3:1) → dry 88 % + convolution reverb from a generated, darkened 0.9 s impulse response at 12 % wet → master. One AudioContext is created lazily on the first gesture and resumed on later gestures. Palette: tick = band-passed noise burst + tiny resonant triangle click (≈ 13 ms dry, throttled to ≤ 25/s, ±8 % pitch and ±15 % level jitter; now also fired by on-canvas drag grips); tap = low pitch-dropping switch thud (≈ 35 ms, quiet); correct = two marimba bars a rising fifth apart (fundamental + inharmonic 3.93× and 9.2× modes with faster decay + felt-mallet transient); wrong / heart lost = low muted wooden thump (pitch-dropping body + dark knock; heart quieter); unlock = marimba grace figure; fanfare = three-note marimba arpeggio (≈ 0.7 s with tail). Global persistent mute (`strata-prefs.muted`) silences all sound and haptics. Dev-only audition page at `/sound-test` (production builds show a notice). Verified by rendering each sound through an OfflineAudioContext in headless Chromium: peaks tick 0.038, tap 0.071, wrong 0.12, correct 0.37, fanfare 0.37 — no clipping, 0 console errors.
  - **§3 UI craft (shipped).**
    - Libraries: `sonner` (all transient feedback — Codex/formula unlock toasts in the lesson player, import/export results, progress reset, Inspector toggles — via one themed `<AppToaster>`; inline lesson verdicts stay inline because they are explanations, not alerts), `canvas-confetti` (lesson finish: a small emerald + amber burst; Boss Exam victory = unit cleared: two-sided burst for ~1.5 s; `disableForReducedMotion`), `vaul` (Sim Lab on phones: "Browse all 61 simulations" opens a drag-to-dismiss bottom sheet instead of a long list under the canvas), Radix Dialog (destructive "Erase all progress?" confirmation in Profile, replacing an inline confirm), Radix Tooltip (header icon buttons). Decision: no Radix Toggle — the existing switches are native buttons with `role="switch"`/`aria-pressed` and a Radix dependency would add nothing. Framer springs on drawers and stage/card transitions are `stiffness 420, damping 32`; a global `MotionConfig reducedMotion="user"` turns transform springs into fades for users who prefer reduced motion.
    - Surface system: new tokens `--hairline`, `--hairline-strong`, `--sticky-bg` (light/dark) and Tailwind utilities `hairline`, `hairline-b`, `hairline-t`, `surface-sticky` (translucent + saturate/blur). Answer tiles and ghost buttons now use 1 px hairlines instead of 2 px borders (selected state keeps a 2 px look via an inset ring, so nothing shifts); dark-mode cards carry `inset 0 1px 0 rgba(255,255,255,0.08)`; the top bar, phone tab bar, lesson header and action drawer all use `surface-sticky`. Form inputs keep a visible 1 px `slate-400` border (WCAG 1.4.11 non-text contrast).
    - Mobile Workbench & Crisis: the bottom action drawer is now safe-area aware and its spacer tracks the drawer's real height (ResizeObserver). Quantitative Workbench: the step indicator ("Step 1/3" + prompt), the answer field with its unit and the Check / Next step button live in the sticky drawer, so all three are always on screen; the card keeps the givens, calculator, completed steps and the step's feedback. Shift Crisis: the drawer shows "Decision k/n", the live clock and the primary action ("Choose an action above" until an option is picked, then Next decision / Stand down); the scenario is clamped to three lines on phones and each new decision scrolls its prompt to the top.
    - Verified: fold test at 390×844 in light and dark across workbench and crisis stages in Units 0, 3, 5, 7, 8 and 10 (reached with the Stage Jumper) — step indicator, active input/first option and primary action all inside the viewport, 0 failures (screenshots saved); audit:svg 843 renders · 0 clip/overlap/occlude/pin; 390×844 sweep of all 61 sims and 66 lessons in both themes — 0 runtime errors, 0 overflow, 0 WCAG-AA contrast failures, every lesson diagram above the drawer; Inspector acceptance re-run at 390×844 and 1366×900 (progress byte-identical); a progress file exported by the §1 build imports unchanged (14/14 fields identical, no `masterUnlock`); service-worker cache version changed with the build (`strata-7cf3a55c604a`, 232 files), five unvisited pages load offline, export → reset → import → merge round-trip and malformed-file rejection all work (toasts), 0 lesson tap targets < 44 px, 0 console errors. Sounds are synthesized at runtime, so they need no network or cache entries.
  - Deferred: real-device 60 fps profiling (only headless checks were possible here); `/sound-test` stays development-only as requested, so it cannot be auditioned on the live site.

- [x] **Phase 13 — ConceptFlow: Brilliant-style, sourced theory** (13.1 engine → 13.2 polish → 13.3 three sourced lessons)
  - **Content rule followed:** STRATA writes the wording, never the knowledge. Every flow screen carries `src` ids from `src/content/references.ts`, and every claim traces to `research/<lessonId>.md` (claim → ref → URL → < 15-word excerpt → location, plus disagreements and dropped claims). Network setup: the default environment blocked every source host, so a personal `Mining-2024` cloud environment was created that allows only the source hosts (CDC Stacks/cdc.gov, DGMS, Rocscience incl. `static.rocscience.cloud`, MVS, NPTEL, India Code, OSHA). `www.mvsengineering.com` did not resolve and `dgms.gov.in` PDFs timed out (connection opened, no data in 400 s), so McPherson and the DGMS circulars were **not** used.
  - **13.1 ConceptFlow engine (shipped).**
    - `TheoryStage.flow?: FlowScreen[]` (+ optional `flowSummary`). Screen kinds: predict, explain, reveal, check, misconception, nudge. `TheoryBriefingCard` renders `ConceptFlow` when a flow exists; otherwise the old briefing stays as it was (52 stages unchanged).
    - One idea per screen, with AnimatePresence slides and one ActionBar CTA. Predict/check use select → Check. A wrong pick shows that option's own reason and allows a retry; `onMistake(concept, { heart: false })` fires once per screen, so the miss reaches spaced repetition but no heart is lost.
    - A Source chip opens a Radix sheet (title, author, publisher, location, link). An auto summary ends the flow, with "File to Codex" calling `onDone`.
    - `onSubProgress(f)` fills the active lesson segment (visual only; it was a static 40 %).
    - `SimCanvas.focus` gives a feathered, fading dim except around the listed pins. The Codex sheet gains a "Sources" list built from the flow's refs.
    - Validator: fails on screens without `src`, unknown ref ids, `why`/options mismatch, out-of-range answers, blank reasons, explain screens over 45 words, flows that don't open with predict, flows without a misconception or with fewer than 2 checks, unreachable nudges, and out-of-bounds reveal pins.
    - Flows stay out of the exam pool (`buildPool` never reads `flow`), and stage `hotspots` are kept, so audit:svg is unchanged. Stage order and count, statutes, store version, sync schema, SW and basePath are untouched; progress writes stay in `LessonPlayer`.
  - **13.2 Brilliant feedback & type (shipped).**
    - Feedback is now a tinted verdict strip inside the bottom ActionBar: verdict, reason, "Why?" only when the reason is long, and the bar's own action. It is portalled from `Feedback`, so all 7 card types got it with no per-card changes, and `scrollIntoView` is gone.
    - Predict stages: select → Check. The first wrong pick shows the option's reason with a heart-free retry; the second miss costs the heart and reveals the outcome.
    - Type and spacing: `.btn-3d` is sentence case, 700, 15 px, letter-spacing 0. Titles 24/30 px at 700; body 17 px/1.55; cards p-5/sm:p-8 with space-y-5/6. The hook clamp is removed.
    - Lesson player: duplicate meta row removed. The causal chain autoplays when 50 % visible (instant under reduced motion), with timers and the observer cleared on unmount, and no Play button.
    - Sim lab: Reset is an icon in the canvas corner, and the CTA reads "Continue" once the goal is met.
  - **13.3 Sourced flows (shipped, 3 lessons):**
    | lesson | screens | sources (fetched) | fact-check |
    |---|---|---|---|
    | u7-l1 Mine gases & Coward's triangle | 13 + summary | NIOSH IC 9486 ch. 1 & ch. 10; Zlochower & Green 2009; Zipf et al. 2013; CMR 2017 Reg. 153(2)(c) value from `statutes.ts` (5 refs) | 0 unsupported; PARTLY items fixed (UEL mechanism reframed as the fuel/oxygen ratio; cell-size data attributed correctly; nose 10.7–12 % for N₂; 2 copy-close lines rephrased) |
    | u0-l1 σv = ρgH, k, redistribution, tributary area | 12 + summary | Hoek *Practical Rock Engineering* ch. 6; Zipf ch. 59; Esterhuizen 2008; Mark (4 refs) | 0 unsupported; PARTLY items fixed (circular-tunnel scope for "three radii", C1×C2, nudge mechanism corrected, Hoek wording de-paraphrased) |
    | u10-l3 Hierarchy of controls | 9 + summary | NIOSH "Hierarchy of Controls" (1 ref; DGMS SMP circulars unreachable, so no SMP claims) | 0 unsupported; 5 PARTLY items reworded |
  - **Reviewer summaries.**
    - DESIGN REVIEWER: 14 ranked fixes, all of the top 10 applied.
      1. Every correct answer was B: options are now shuffled deterministically per screen.
      2. Explanation came before prediction: a predict now comes before the stoichiometry screens, and the nudge comes before the "rich gas is safe" trap.
      3. The summary listed untaught codex bullets: replaced by 3-bullet `flowSummary`s.
      4. Label and footer switched before the body: both are now inside keyed transitions with an 0.18 s slide.
      5. Reveal had a competing ghost CTA and a pre-lit target: the CTA is disabled until found, the hit radius is 30, and the answer scrolls into view.
      6. The focus mask was hard-edged with no fade: it is now feathered and fades to 0.35.
      7. Retry text gave the answer away: rewritten. Only the reason shows; the hint appears from the second miss.
      8. Over-long title: the title collapses after screen 1.
      9. White-on-emerald option keys were 2.47:1: now #047857 / #B91C1C / #1D4ED8, with a selected state.
      10. Verdict titles were near the AA limit (4.59 / 4.97): now emerald/amber-800, with a stronger dark-mode verdict tint.

      Not done (next checkpoint): sim label font floor of 11 units (sim geometry is frozen this phase), two-line readouts on narrow screens, coupling O₂ to CH₄ in the Coward nudge, and the u0 predict diagram showing the rule of thumb before the reveal.
    - FACT-CHECKERS (one per lesson, independent): 76 claims checked in total.
      - 0 UNSUPPORTED. Every PARTLY verdict was reworded with the checker's replacement text before its lesson was committed.
      - The only statutory number used (1.25 %) is in `statutes.ts`.
      - Flagged for later: in the `u10-risk` sim, elimination scores Medium (residual 1×5); the model should zero the hazard.
  - **Verified:**
    - validate (382 stages, 3 flows, 0 errors), tsc, lint (0), root build, and `NEXT_PUBLIC_BASE_PATH=/Mining-2024` build.
    - audit:svg: 843 renders, 0 clip/overlap/occlude/pin.
    - Headless 390×844 light + dark end-to-end walk of u7-l1 on the base-path build: 14 screens, 8 wrong-then-retry picks, 0 hearts lost, misses recorded to spaced repetition, Source sheet opens, progress segment fills 12 % → 94 %, CTA always on screen, 0 horizontal overflow, Codex filed, 0 console errors.
    - Inspector acceptance: locked u10-l3 flow played with retries plus a Stage Jumper jump, progress string byte-identical, 0 errors.
    - SW cache version changed with the build (`e7909d44712b`).
  - **What's left:** 52 theory stages still use the old briefing (see the plan below); DGMS circulars and McPherson are still unfetched; the design-review items listed above.

- [x] **Phase 14 — Trust, pacing & situations** (plan and owner decisions in `ROADMAP.md`; standing rules in `CLAUDE.md`)
  - **14.0 Scaffolding.**
    - `CLAUDE.md`: the content rule, statute gate, copyright, do-not-touch list and push gates.
    - `ROADMAP.md`: owner decisions 1–7, Phases 14–20 and a run log.
    - `.claude/agents/fact-checker.md` (opus, high) and `.claude/agents/design-reviewer.md` (sonnet, high).
    - `.claude/skills/sourced-flow/SKILL.md`: the 7-step pipeline.
  - **14.1 Trust.**
    - Audit finding: the correct answer sat at index 1 in 57/66 legacy predicts and first in 92/92 crisis phases.
    - Fix (`src/lib/shuffle.ts`): every multiple-choice item is displayed in a deterministic order keyed `lesson#stage`, `lesson#stage#phase` or `lesson#stage@screen`. Within each unit the correct option goes to the least-used slot, so balance holds by construction. Content files keep their authored order, and the reasons follow their options.
    - Validator: prints per-unit A/B/C/D balance (max 33 % now) and fails above 40 %.
    - Warmup: ConceptFlow misses are queued per screen (`SrsItem.screen`, additive, no version bump). Warmup renders that single screen with a Done button. Older whole-stage entries for a flow stage open its first check.
  - **14.2 Situation screens.**
    - New `situation` FlowScreen: role badge with an icon per role, optional focused sim, scene, the claim in a speech bubble, and "What do you do?". Options are balanced; the first miss shows that option's reason, allows a retry with no heart lost, and is reviewed per screen.
    - Validator: ≥ 1 situation per flow, scene ≤ 40 words, `why`/options aligned, and the correct option may be the longest in at most 40 % of a unit's situation and check screens. Current worst: 1/5.
    - Content: one sourced situation each.
      - u7-l1: Ventilation Officer vs the Sirdar's "under 5 %, carry on". The answer turns on CMR 1.25 %, already in `statutes.ts`.
      - u0-l1: Manager vs "same depth, same margin" (tributary area, FOS).
      - u10-l3: Safety Officer. The section manager's claim is correct here, so "always disagree" doesn't win.
    - Check options were rebalanced so length gives nothing away.
    - Fact-checks: 0 unsupported; 9 partly-supported items reworded.
  - **14.3 Pacing.**
    - Theory-first preference (device-local, on by default, Profile "Lesson pace").
    - Equation/Numeric stages show as collapsed "Bonus maths · optional" with "Skip for now". A lesson completes once the non-bonus stages are done; bonus stages still earn XP, still file formulas and still feed the exam pool.
    - Resume: a separate `strata-resume` store (never in progress, export or sync) offers "Continue from stage N" or "Start over instead". Jumper and sandbox runs never write it.
  - **14.4 Phone kit and data safety.**
    - Inspector Mode adds a floating Report button. It saves {lessonId, stageIndex, screenIndex, route, note, viewport, userAgent, build} to `strata-reports`, exported as JSON from Profile.
    - FPS meter toggle.
    - Build stamp (git short hash + date, via `next.config.ts` env) shown in Profile.
    - The Sound test is now available in production, linked from Profile in Inspector Mode.
    - `navigator.storage.persist()` runs once after the first saved progress, and a weekly "Back up your progress" toast opens the export.
  - **14.5 Deferred sim fixes.**
    - `u10-risk`: elimination now takes residual risk to the floor (1, Low).
    - Coward nudge: O₂ coupled to CH₄ along the air-dilution line (new `couple()` on nudges, also used by the validator).
    - u0 predict: the σv working and rule of thumb stay hidden until the reveal (`__predicting`).
    - Readouts wrap to two lines on phones, with AA tints for warn/crit text.
    - **Not done:** the 11-unit label floor. It produced 277 clipped labels (60 even at 9), so it moves to Phase 19.
  - **Design review** (steps 1–3, independent agent): 14 ranked findings. Fixed:
    - dark-mode AA on role and Bonus badges, and ≥ 3:1 role icon discs;
    - compact situation header, so options stay above the fold;
    - the u7 situation now comes after the screen that teaches the 1.25 % limit;
    - claim-is-always-wrong pattern broken (the u10 speaker is right) and stance punctuation made consistent;
    - no-break spaces before %/units;
    - leading "Right." removed;
    - resume prompt reworked (single action-bar CTA, keyed transition).

    Deferred to Phase 19: a stricter word cap on whole situation screens and `why` text (≤ 25 words), a compact wrong-answer strip without the Try again tap, a switch-track visual for Profile toggles, and 44 px Stage Jumper pills.
  - **Verified (FINISH):**
    - Gates: validate (393 stages, 3 flows, 0 errors, balance printed), tsc, lint, base-path build (232 files, 7.0 MB), audit:svg (843 renders, 0 findings).
    - Headless 390×844 walk, light + dark, on the base-path build:
      - u7-l1 end to end in theory-first mode: situation badge and bubble shown; wrong-then-retry worked on the situation and 11 other picks; 2 Bonus maths stages collapsed and skipped; lesson completed and saved.
      - Predict and crisis correct answers landed in varied slots.
      - Resume prompt offered stage 2 and continued there; the resume store is separate from progress.
      - Warmup showed a single flow screen ("Review", 4 choices).
      - 0 overflow, CTA always visible, 0 console errors.
    - Inspector acceptance: progress byte-identical.
  - **Owner to-do:** verify 5 claims per sourced lesson and mark them "Verified by Bink" in `research/*.md` (owner decision 2). Put the Phase 15 source files in `sources/`.

- [x] **Phase 14.5 hotfix — real-phone bugs (owner, Android Chrome PWA)**. Each bug was reproduced first with real CDP touch input at 390×844 (`Input.dispatchTouchEvent`, so the browser's own touch-action and scroll arbitration apply) and now has a regression test in `scripts/touch-tests.cjs` + `scripts/touch-tests-more.cjs` (`npm run test:touch -- <url>`).
  1. **Slider / grip scroll-steal.**
     - Repro: a ~52° thumb drag dropped every slider and scrolled the page by 80 px. Vertical-axis grips scrolled the page by 36–47 px, because Chrome ignores `touch-action` on SVG children.
     - Fix: sliders get a 48 px thumb grab zone (`touch-action: none`, pointer capture, value from the pointer x), and the track keeps `pan-y`, so vertical swipes over a slider still scroll.
     - Grips claim the gesture with a non-passive `touchstart`, and their hit circle grows to r 28.
     - Tests: diagonal drags on every slider and grip in 4 sims, plus page scroll over a track.
  2. **Sim Lab picker stuck.**
     - Repro: with the service worker on, after a deploy every drawer pick fell back to the default sim (0/5). Picks went through `router.replace`, which fetched an RSC payload that the SW serves cache-first from the old build; the sim state also ignored URL changes.
     - Fix: picks update local state plus a shallow `history.replaceState` (no navigation, no RSC fetch), and the lab follows `?sim` when the URL changes. Re-run of the same repro: 5/5.
     - Added **Repair app** (Profile → Troubleshooting, and the new route error boundary). It unregisters the SW and deletes only `strata-*` caches, never localStorage.
     - Home shows **Restore from backup** while progress is empty.
     - **Service worker (owner-approved 2026-11-26):** RSC `*.txt` payloads are now network-first, with the cache as the offline fallback.
       - Verified with two builds that both carry the new worker: client navigation after a "deploy" shows the new build; picker 3/3.
       - Offline: client navigation to a visited page and an offline reload both render from cache. 0 errors.
     - Tests: 5 drawer switches by touch, `?sim` deep links via Codex thumbnails, Repair keeps progress byte-identical, restore-link visibility.
  3. **Sim stage declutter** (owner screenshot: u7-l1 Coward intuition lab).
     - On phones the diagram is sticky under the header, carrying key status chips, while the controls scroll beneath.
     - Grips are the primary control. At most 2 sliders are open; the rest, plus grip fine-tuning, sit in one collapsed row.
     - The grip hint shows once, above the objective bar, and fades after the first drag.
     - Readouts sit in a wrapping 2-column grid: no truncation, long verdicts span both columns, and `fmt` never prints -0.0.
     - `Plot` moves axis text off grip tracks. Coward's O₂ axis is cropped to 10–22 % (lower readings pin to the edge with their value), with its hotspots re-mapped. audit:svg: 0 findings.
     - The sim success strip is a one-line verdict with "Why?" plus Continue (130 px).
     - Inspector: Report is a header flag (nothing floats over content), and the stage jumper + refill moved into a header Inspector menu with 44 px pills. The pills were Inspector-only already.
     - Design review on every sim stage type: the top 7 fixes applied (hint z-order, slim progress segments, max-2-open sliders, status chips in the sticky block, long-readout spanning, a sticky surface with soft shadow, 13 px Sim Lab text).
     - Deferred: SVG label size (geometry, Phase 19), predict-with-sim first-viewport layout.
  4. **Back navigation.**
     - ConceptFlow has a Back button and swipe-right. Answered screens reopen in a review state: answer shown, no re-scoring, no hearts.
     - Completed progress segments open that stage read-only (`StageRecap`, every stage kind).
     - A lesson-header **Notes** sheet lists every explanation, reveal, trap and briefing seen this run (session-only).
     - Tests: back, review state, hearts unchanged, swipe back, Notes, recap.
  5. **Verification.**
     - `scripts/verify-quotes.ts` runs in `npm run validate`: 46/46 research excerpts FOUND in their source text.
       - Public-domain texts: `research/cache/`.
       - Copyrighted texts: gitignored `research/cache/private/`, filled by `npm run fetch:sources`.
     - Source sheets show each reference's verified excerpt + location (one quote per copyrighted source per lesson).
     - Owner decision 2 is now automated verification; owner checks are optional.
  6. **Sources policy.**
     - The OSH (Central) Rules 2026 supersede the Mines Rules 1955, Mines Rescue Rules 1985 and MVTR 1966 (historical only).
     - The owner's private library is Tier 2, kept outside this repo (`sources/private/` gitignored).
     - Recorded in CLAUDE.md, the sourced-flow skill and ROADMAP.
  - **Housekeeping.**
    - The owner's `sources/` upload commit is on main.
    - `sources/650059fbb8f1a9.98699174.pdf` was renamed to `sources/OSH Code 2020.pdf`.
    - The Code Underground app is stored at `sources/code-underground/` as Phase 17 input (not processed).

## Totals
55 lessons + 11 boss exams · 379 stages (3 theory stages now run sourced ConceptFlows)  · 61 textured simulations (29 with on-canvas drag grips, 33 grips in all) · 55 Field Codex cheat sheets · 19 cited statutes (0 unconfirmed) · 379-question exam bank · 7 field calculators · light + dark themes · synthesised sound & haptics.

## Next checkpoint
**Convert the remaining 52 theory stages with the Phase 13 pipeline**, in batches of 3–4 lessons per session, one commit per lesson:
1. Read the stage and its sim, then list the concepts the stage must teach.
2. Fetch sources (tier 1 statutory → tier 2 open academic), write `research/<lessonId>.md` (claim → ref → URL → excerpt → location, disagreements, dropped claims), and add the refs to `references.ts`.
3. Write the flow in `src/content/flows/<lessonId>.ts` (predict first, mechanism, misconception, ≥ 2 checks, nudge where a sim fits, ≤ 45 words per explain) and a 3-bullet `flowSummary`.
4. `npm run validate`, then an independent fact-checker subagent. Fix every PARTLY/UNSUPPORTED before committing.
5. Every few lessons: design-reviewer pass and the 390×844 walk script.

Suggested order, by learner value (weak-theory topics first): U3 rock mechanics (Kirsch, failure criteria, RMR, bolting, pillars, slopes, subsidence) → U7 ventilation (Atkinson, fans, natural ventilation, heat, dust) → U4 blasting → U6 methods → U5 opencast/HEMM → U8 → U9 → U2 → U1 → remaining U10.

Source prerequisites:
- `dgms.gov.in` downloads must work (they timed out this session). The DGMS circular compilation, CMR 2017, MMR 1961 and the Mines Rescue Rules are needed for U10 and statutory screens. Retry, or ask the user for local copies.
- `www.mvsengineering.com` did not resolve. Find the current host of McPherson's web edition.
- NPTEL course PDFs (123106002, 113105001, 123105006) for U6/U7.

Also carried over: sim label font floor (11 units) with an audit:svg re-run; two-line readouts on phones; O₂ coupled to CH₄ in the Coward nudge; elimination → zero residual in `u10-risk`; hide the u0 predict "rule of thumb" annotation until reveal.

**Coverage-gap map: done in Phase 15** (see `coverage/MAP.md` and the Phase 15 entry below). The syllabus table that stood here is replaced by that map.

Run `npm run audit:svg` after any diagram change.

## Phase 15 — Sources & coverage map (2026-11-26)
- **Text extraction.** Tesseract 5.3 was installed with apt (tooling only, no project dependency). `pdftotext -layout` handles native pages and OCR (200 dpi, `--psm 6`) handles any page that returns under 40 characters. Only `DGMScircularsfrom20182024_06122024.pdf` was scanned (135 of 155 pages). `.txt` files sit next to the PDFs; `sources/README.md` lists scanned files and the OCR caveat.
- **NITR.** `www.nitrkl.ac.in` was added to the environment allowlist. `sources/nitr/` holds `curriculum-id18.txt` and 64 MN syllabus pages. 29 MN subject links return "Course Syllabus Not Found" on the site (listed in `sources/README.md`).
- **DGMS syllabus: missing.** G.S.R. 910(E) (14-09-2018) was not obtainable. The map uses CMR 2017 regulation headings as proxy lines. Only the 2021 amendments are in `sources/`.
- **Map.** `coverage/build_map.py` reads `coverage/inventory.json` (lesson and stage ids dumped from `src/content`; 66 lessons, 379 stages), `coverage/_cmr_regs.json` and `sources/nitr/`, then writes `coverage/MAP.md` and `coverage/map.json`. Rules are regex topics; the script asserts that every `lesson#stage` id exists. 252 CMR regulations and 198 unique NITR theory lines are mapped, with 25 ranked gaps.
- **`.gitignore`.** The `/coverage` line was removed, because `coverage/` is now a tracked deliverable.
- **Docs.** `ROADMAP.md` records the Phase 16 order (U7 → U4 → U8 → U2 → U6 → U10 → U5 → U3 → U1 → U9), the Phase 18 exam facts (only what the documents state) and the syllabus-source-missing flag.
- **No app code changed.** Gates are recorded in the ROADMAP run log.

## Phase 15.5b — Global switch to design system v2 (2026-11-26)
- **Tokens.** `globals.css` now declares DESIGN.md §2 on `:root` / `:root.dark`, replacing the old warm-white / navy palette and the slate blue cast. Tailwind ramps resolve to tokens: `slate` → `--n-*`, `emerald` → success, `red` → danger, `amber` → energy, `blue` → action, `violet` → action (retired); each ramp's `-500` is the tone's face. New utilities: `border-line`, `text-fg(-2|-3)`, `bg-action`, `bg-*-tint`, `text-*-tint-text`. Old names (`--hairline`, `--sticky-bg`, `--shadow-card`, `--shadow-pop`, `--edge-neutral`, `--bg-deep`) point at v2 tokens; `--shadow-card` is `none`.
- **Base components.** `.card`, `.btn-3d` (56 px pill, 18/700, `.btn-sm` 44 px), `.tile-3d` (borders, ledge, radius, `data-state` states; size stays per component until 15.5c) and `.t-*` type are global. `.ds2` remains as an alias so `/design-system` renders; `.ds2-light`/`.ds2-dark` force a theme on a sub-tree.
- **Removed.** `.studio-bg` (lattice and glow), the blur in `surface-sticky` (solid `--bg`), card shadows, the lesson card's gradient top bar and coloured stage pill (now a neutral §5.12 eyebrow with the kind's icon), the Profile dialog blur.
- **Plate.** 2 px `--line` inner ring drawn by `::after` (so the plate's inner size and all sim geometry are unchanged), radius 16, no outer shadow; met = 2 px `success` ring. audit:svg 843 renders, 0 findings.
- **Type.** `.flow-body` and `.flow-q` are §3 `body` (18/29, 400). `eyebrow` raised to 14/18 to meet the 14 px floor (DESIGN.md updated). Shared components (StageRecap, Inspector menu/kit, Repair button, option letters) no longer set text under 14 px; the Notes count badge (10 px) becomes a dot in 15.5c.
- **Tab bar.** §5.8: `ds-tabbar`/`ds-tab`, solid `--bg`, 1 px `--line` top border, 64 px + safe area, 24 px icons, one active style (56×32 `--surface-2` pill, `--text`), 12 px labels, no per-tab colours. The action-bar lift above it is 64 px.
- **Shell.** TopBar: tokens for streak/XP, avatar, tooltip, desktop nav, logo; 44 px icon targets. Sheets use `.sheet-face`; the toaster uses `--surface-2`. Verdict strips use success / danger tints. Theme-color meta: `#FFFFFF` / `#121212`.
- **Fixes found by the sweeps.** Path current-node opacity pulse kept running under reduced motion (stopped); the crisis alarm strip had no base colour, so under reduced motion its white text sat on white (base `#7F1D1D` added); `dark:text-*-300` overrides in StageRecap and Situation became dark-on-dark with the v2 ramps (removed: the `-700/-800` steps are already light in dark); the Bonus maths pill used violet-300 in dark (now the neutral eyebrow).
- **Sandbox.** Filled `Play` on the current node, `#2A1E00` star on the perfect badge. Profile shows the sandbox link to everyone until 15.5e.
- **Tooling.** `scripts/contrast-sweep.mjs` reports every visible text element under 4.5:1 (and text under 14 px) on every exported route in both themes.
