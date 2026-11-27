# STRATA — Full Project Context

A single document that explains what STRATA is, how it is built, how it is verified and deployed, and the decisions behind it. It is written so a new contributor (or a fresh AI session) can pick up the project without reading the whole history. `BUILD_PROGRESS.md` holds the detailed, phase-by-phase build log; this file is the map.

---

## 1. What STRATA is

STRATA is an interactive study platform for **B.Tech Mining Engineering and the DGMS First-Class / Second-Class Manager's Certificate of Competency** examinations in India. It teaches through simulation and practice rather than text: every lesson runs a five-stage mastery loop, and statutory content (Mines Act 1952, CMR 2017, MMR 1961, CEA Safety Regulations 2023, DGMS circulars) is cited and audited.

- **Repository:** `Binayak-Sahu/Mining-2024` (default branch `main`; working branch `ccr-9d581ac0-v9zwr4`)
- **Live site:** https://binayak-sahu.github.io/Mining-2024/ (GitHub Pages, deployed by GitHub Actions on every push to `main`)
- **Audience:** mining students and engineers preparing for university exams and DGMS competency exams; used on both PC and phone.
- **Form factor:** offline-capable PWA, installable on Android/iOS; progress moves between devices by JSON export/import.

## 2. Content at a glance (must not regress)

| Item | Count |
|---|---|
| Units | 11 (Unit 0 Orientation + Units 1–10) |
| Lessons | 66 = 55 core lessons + 11 Boss Exams |
| Stages | 379 across 7 card types |
| SVG simulations | 61 (29 with on-canvas drag grips, 33 grips in total) |
| Field Codex cheat sheets | 55 (plus verified formulas from every Equation Forge) |
| Statutes register | 19 rules with citations, 0 unconfirmed |
| DGMS Exam Simulator bank | 379 questions |
| Field Calculators | 7 |

**Curriculum:** 0 Orientation (σv = ρgH) · 1 Mining Geology, Exploration & Deposit Modelling · 2 Mine Development (access, shaft sinking, drivage) · 3 Rock Mechanics & Ground Control · 4 Drilling, Blasting & Fragmentation · 5 Opencast Mining & HEMM · 6 Underground Coal & Metalliferous Methods · 7 Ventilation, Thermodynamics & Hazards · 8 Surveying, Mineral Processing & Mine Electricals · 9 Mine Economics, Planning & Digital Mining · 10 Indian Mining Legislation, Safety Management & Rescue.

**Rule:** lesson content and statutory values are not to be edited casually. Statutory figures were verified by the project owner in Phase 7 (e.g. wet bulb 33.5 °C with ≥ 1.0 m/s above 30.5 °C — CMR 2017 Reg. 153(2)(d); CO 50 ppm; air quantity Reg. 153(2)(a); pillar table Reg. 111(4); lighting CMR 2017 Reg. 178(2)(b) with DGMS circulars; restricted-neutral earth fault 750 mA / 50 A — CEA Safety Regulations 2023 Reg. 102; Degree III gassiness Reg. 2(1)(zc)).

## 3. Pedagogy and gamification

**Five-stage mastery loop** (every lesson):
1. **Field Theory** (`TheoryBriefingCard`) — completing it files a cheat sheet to the Field Codex. It comes in two forms:
   - **ConceptFlow** (Phase 13; 3 stages so far: u0-l1, u7-l1, u10-l3) is a Brilliant-style flow with one idea per screen. It opens with a prediction, then explains the mechanism (≤ 45 words a screen), tackles a misconception, and has ≥ 2 checks and an optional sim nudge. Every option carries its own reason, and a wrong pick gets a kind retry with no heart lost (the miss still goes to spaced repetition). Each screen has a Source chip, and the flow ends with a 3-bullet summary. Every claim comes from a source fetched while writing it (see `research/<lessonId>.md`).
   - **Classic briefing** (the other 52 stages): a hook line, short explanation, hotspot diagram, an auto-playing causal chain and "first principles" drawers.
2. **Intuition Lab** (`SimLabCard`) or **Predict the Outcome** (`PredictOutcomeCard`) — drive a live simulation to an objective shown inside the diagram frame, or commit to a prediction before the sim reveals the result.
3. **Equation Forge** (`EquationForgeCard`) — proportionality statements first, then tap-to-assemble the governing equation; each failed attempt is diagnosed block by block.
4. **Quantitative Workbench** (`NumericWorkbenchCard`) — multi-step numericals with a scratch calculator; givens and earlier results usable as variables.
5. **Shift Crisis** (`ShiftCrisisCard`) / **Statutory Swipe** (`RapidStatutorySwipeCard`) — timed emergencies requiring diagnosis and the correct DGMS action; rapid true/false statutory drills.

**Feedback quality:** every wrong option in all 66 predict questions has its own field-specific explanation (`optionWhy`). Predict stages use select → Check, and the first miss shows that reason with a heart-free retry. Crisis options and swipe cards each carry their own reason. Verdicts appear as a tinted strip in the bottom action bar. The validator enforces explained options everywhere.

**Content rule (Phase 13 onward):** STRATA writes the wording, never the knowledge. Flow claims must trace to a fetched source in `src/content/references.ts` (tier 1 Indian statutory → tier 2 open academic; tier-3 textbooks are further reading only). Each lesson is fact-checked by an independent reviewer before commit. Statutory numbers come only from `statutes.ts`.

**Gamification:** XP and ranks (Trainee 0 → Overman 600 → Assistant Manager 2000 → Second Class Manager 4500 → First Class Unrestricted Manager 8000), daily streak, 3 safety hearts per lesson, Field Codex unlocks, a Leitner spaced-repetition warmup (intervals 1, 2, 4, 7, 15, 30 days) fed by missed concepts, free-roam mode, and a winding "expedition" home map that descends through eleven geological strata to the "DGMS Command Level" at −1200 m.

## 4. Tech stack

- **Next.js 15.5 (App Router)**, React 19, **TypeScript strict**, **static export** (`output: "export"`, `trailingSlash: true`, unoptimised images, `basePath`/`assetPrefix` from `NEXT_PUBLIC_BASE_PATH`).
- **Tailwind CSS v4** (`@theme inline` tokens, custom `@utility` classes), **framer-motion**, **lucide-react**.
- **zustand** with `persist` for state.
- **sonner** (toasts), **canvas-confetti** (celebrations), **vaul** (bottom sheet), **@radix-ui/react-dialog** and **@radix-ui/react-tooltip**.
- Self-hosted fonts: **Plus Jakarta Sans** (UI) and **JetBrains Mono** (live numbers) via `@fontsource-variable`.
- All simulations are hand-built **SVG** (no WebGL / three.js). All sound is **Web Audio synthesis** (no audio files).

## 5. Repository map

```
src/
  app/                    Routes: / (Campaign), unit/[unitId], lesson/[lessonId], warmup, exam,
                          tools, lab, codex, profile, sound-test (dev only); layout.tsx, globals.css
  components/
    LessonPlayer.tsx      Lesson runtime: hearts, XP, stage transitions, Inspector sandbox,
                          Stage Jumper, completion screen; the ONLY writer of progress in a lesson
    cards/                The 7 card engines + ui.tsx (CardFrame, ActionBar, PrimaryButton,
                          Feedback, Lines, optionClass, STAGE_META)
    pages/                Campaign (course cards), course.tsx, ExpeditionPath (path + start popover, strata.ts), UnitMap, CodexLibrary, Exam,
                          Tools, SimLab, Profile, SyncCard, Warmup, SoundTest
    shell/                TopBar + BottomNav, ClientEffects (theme, global sfx, Shift+M),
                          Providers (MotionConfig + Tooltip), AppToaster, PwaRegister
    sim/                  SimView (SimCanvas, Readouts, Controls, objective bar, drag grips),
                          svg.tsx (primitives: Txt, Arrow, Dim, Meter, Plot, Cracks, Stream,
                          HudBadge, heatColor), defs.tsx (SVG material library, MAT)
    ui/                   Slider, AnimatedNumber
  content/
    index.ts              Registry: UNITS, getLesson, getUnit, getSim, allLessons, allCodex
    units/u0.ts … u10.ts  Lesson content (stages, hotspots, codex sheets)
    sims/u0.tsx … u10.tsx, phase6.tsx   The 61 SimDefs; sims/index.ts exports ALL_SIMS
    statutes.ts           19-rule statute register (status, citation, verifiedBy)
  lib/
    types.ts              Domain types (Stage union, SimDef, SimHandle, CodexEntry, …)
    store.ts              Progress store (zustand persist)
    prefs.ts              Device-local prefs store (theme, muted, masterUnlock) + theme boot script
    progress.ts           lessonUnlocked, bossUnlocked, unitProgress, nextLesson, genuinelyOpen
    ranks.ts, date.ts, calc.ts (safe expression evaluator, fmt), exam.ts, sync.ts,
    sfx.ts (audio engine), inspector.ts (toggle + toast), useHydrated.ts
scripts/
  validate-content.ts     Content validator (npm run validate)
  audit-svg.tsx + audit-measure.js   SVG layout audit (npm run audit:svg)
  build-sw.mjs            Writes out/precache.json after next build
  serve-out.mjs           Static server for out/ honouring the base path (npm start)
  make-icons.mjs          Renders PWA icons from icon.svg
public/                   manifest.json, sw.js, icons, .nojekyll
.github/workflows/deploy.yml   CI: validate → tsc → lint → build → GitHub Pages
.agents/skills, .claude/skills  Installed design skills (frontend-design, design-taste-frontend)
BUILD_PROGRESS.md         Phase-by-phase build log and decisions
```

`sources/` (owner documents + `.txt` extracts + `nitr/`) and `coverage/` (syllabus coverage map and its generator) sit beside `src/`; neither ships in the app.

## 6. Architecture

### 6.1 Content model
- A **lesson** is an ordered list of **stages** (union of the 7 card kinds). Theory stages reference a sim and place numbered hotspots in the sim's 400 × 240 coordinate space.
- A **SimDef** is `params` (sliders or segmented options) + `compute(p)` + `outputs` (format/tone) + `render(p, o, t)` returning SVG. Optional `animated` (receives time `t`) and `handles` (on-canvas drag grips: `{ key, axis, at(p,o) → [x,y], toValue(coord,p) }`; the runtime clamps, snaps to step and ignores NaN).
- Canvases use `viewBox="-24 -24 448 288"` — a 24-unit margin round the 400 × 240 drawing — inside a daylight "plate" that stays light in both themes.
- SRS key `${lessonId}#${stageIndex}`; formula key `${lessonId}#eq${stageIndex}`.
- **Concept flows:**
  - `TheoryStage.flow?: FlowScreen[]` and `flowSummary?: string[]`, with flow files in `src/content/flows/<lessonId>.ts`. Screen kinds:
    - `predict` and `check`: `options`, `answer`, a `why` per option, `concept`, optional `hint`
    - `explain`: ≤ 45 words, optional `visual {sim, params, focus}` where `focus` indexes the stage hotspots
    - `reveal`: tap a hotspot
    - `misconception`: `claim` plus `truth`
    - `nudge`: sim, `ask`, `goal(p,o)`, `after`
  - Every screen has `src: string[]` of ids from `REFS` (`src/content/references.ts`: title, author, publisher, url, accessed, tier, licence, where), and the research trail is in `research/<lessonId>.md`.
  - The validator rejects:
    - a screen with no `src`, or a `src` id missing from `REFS`
    - a `why` list that doesn't match the options, or an answer out of range
    - an explain screen over 45 words
    - a flow that doesn't open with a predict, or lacks a misconception or two checks
    - an unreachable nudge goal
  - **Situation screens** (Phase 14): `{ kind: "situation", role, scene (≤ 40 words), claim?, claimBy?, options, answer, why[], concept, visual?, src }`.
    - `role` is one of: Manager, Overman, Sirdar, Shotfirer, Ventilation Officer, Surveyor, Safety Officer, DGMS Inspector, Exam candidate.
    - The scene may be invented framing, but the fact that decides the answer must be sourced.
    - Rendered by `cards/Situation.tsx`: a role badge, an animated vignette or focused sim, and the claim in a speech bubble.
  - Nudge screens may carry `couple(p)` to constrain movement, e.g. O₂ tied to CH₄ along the air-dilution line.
  - Flows never feed the exam pool.
- **Balanced option order** (`src/lib/shuffle.ts`, Phase 14): content keeps its authored option order. Every multiple-choice item is displayed in a deterministic order derived from its key:
  - `lesson#stage` for legacy predict;
  - `lesson#stage#phase` for each crisis decision;
  - `lesson#stage@screen` for flow predict, check and situation screens.

  Within each unit the correct option goes to the least-used slot. The validator prints the per-unit balance and fails if any slot holds more than 40 %, or if the correct option is the longest in more than 40 % of a unit's situation and check screens.
- **Quote verification** (`scripts/verify-quotes.ts`, part of `npm run validate`): every quoted excerpt in `research/*.md` must be found in `research/cache/*.txt` (public domain), `research/cache/private/*.txt` (copyrighted, gitignored; `npm run fetch:sources`) or `sources/*.txt`. It also generates `src/content/excerpts.gen.ts` for the Source sheet.
- **Validator flow rules** now also require ≥ 1 situation per flow, matching `why`/options counts on situations, and a scene of ≤ 40 words.

### 6.2 State and persistence
- **Progress store** — `localStorage["strata-progress-v1"]`, zustand `persist` **version 2** with `migrateState` (re-indexes SRS/formula keys for six lessons that gained a stage in Phase 6). Holds xp, xpByDay, streak, longestStreak, lastActiveDay, heartsLost, lessons, attempts, codex, formulas, srs, warmupDoneDay, exams (last 30), freeRoam.
- **Prefs store** — `localStorage["strata-prefs"]` (version 1): `theme` (system/light/dark), `muted`, `masterUnlock`, `theoryFirst` (default **on**). Device-local; **never exported**.
- **Other device-local stores (Phase 14; never in progress, export or sync):**
  - `strata-resume`: `{ at: { [lessonId]: { index, t } } }`, the last stage per lesson, which powers "Continue from stage N".
  - `strata-reports`: Inspector phone-testing reports plus the FPS toggle.
  - `strata-storage-persist` and `strata-backup-nudge`: flag keys for `navigator.storage.persist()` and the weekly backup toast.
- **Per-screen review:**
  - A ConceptFlow miss is queued as `lesson#stage@screen`, using an optional `SrsItem.screen` field (additive, no version bump).
  - Warmup renders only that screen (`StageRenderer screen=`).
  - Older whole-stage entries for a flow stage open its first check screen.
- **Export/import** (`src/lib/sync.ts`, Profile → Sync card or header ⇄): file `{ app: "strata", schema: 2, exportedAt, data }`; import validates, migrates and either **replaces** or **merges** (union of unlocks, best lesson records, max counters); malformed files are rejected with a toast.
- **QA flag:** `localStorage["strata-qa"] = "1"` keeps one heart so automated walkthroughs can traverse lessons.

### 6.3 Unlocks and Inspector Mode
- Normal rules: lessons unlock sequentially; the first lesson of every unit is always open; a Boss Exam opens when every lesson in its unit is done; free-roam opens everything (and counts as genuine).
- **Inspector Mode** (`masterUnlock`; Profile switch, `Shift+M`, or header key icon): every node becomes playable with an amber **MASTER** badge; Codex shows everything; the lesson player gets a **Stage Jumper** and **Refill Hearts**.
- **Sandbox rule:** a run writes nothing to progress if the lesson is open only because of Inspector Mode, or once the Stage Jumper is used. A lesson's attempt is recorded on the first real answer, never on open. Verified: progress stays byte-identical after Inspector play.

### 6.4 Lesson runtime
`LessonPlayer` owns hearts, local XP, transitions (framer spring 420/32), the XP burst, sonner unlock toasts, out-of-hearts drawer, completion screen (canvas-confetti; full two-sided burst for Boss Exams) and all progress writes. Cards are pure:
- They call `onMistake(concept, {heart?, screen?})`. `heart: false` records the miss without costing a heart; `screen` makes it a per-screen review item.
- They call `onDone()` and the optional, visual-only `onSubProgress(f)`.
- They receive `seed` (`lesson#stage`) for the balanced option order.

**Theory-first mode** (on by default):
- Equation and Numeric stages render as a collapsed `BonusCard` ("Bonus maths · optional", open or "Skip for now"). Skipping never blocks completion; doing them still earns XP and files formulas.
- The exam pool is unchanged.
- Reopening a lesson mid-way offers to resume.

**Back navigation and recap (14.5; 15.5c: tap a finished section of the one notched bar):** ConceptFlow has Back and swipe-right, and answered screens reopen in a review state. Tapping a completed progress segment opens it read-only (`StageRecap`). The header Notes sheet (`src/lib/notes.ts`, session-only) lists the explanations seen so far.

**Inspector phone kit:** a header Report flag (it used to float), an Inspector menu with the stage jumper and refill (in lessons it opens from the ⋯ menu since 15.5c), a (saves route, lesson/stage/screen, viewport, user agent and build) and an FPS meter. Profile can export reports as JSON, open the Sound test (now available in production) and shows the build stamp (`NEXT_PUBLIC_BUILD`, git short hash + date, injected in `next.config.ts`). Each card's footer renders in a sticky, safe-area-aware **ActionBar** whose spacer tracks the bar's real height; the Workbench and Crisis cards put their step indicator, active input and primary action in that bar so they never fall below the fold on a 390 × 844 phone.

### 6.5 Design system
**`DESIGN.md` is the design system** for every screen (tokens, type, spacing, components §5, motion §6, checks §7, Never List §8). Change it first, then the code. Phase 15.5 (done 2026-11-27) moved the whole app onto it. Where the code lives:
- Tokens and base styles: `src/app/globals.css` (§2 tokens on `:root` / `:root.dark`; Tailwind `slate/emerald/red/amber/blue/violet-*` resolve to them; utilities such as `bg-canvas`, `bg-surface-2`, `text-fg-2`, `text-success-tint-text`). Shared classes: `.card`, `.btn-3d` (+ tones, `.btn-sm`), `.tile-3d`, `.t-display … .t-readout`, `.sheet-face`, `.ds-pop`, `.ds-progress`, `.ds-readout-row`, `.unit-tile`, `.field-input`, `.plate` (+ `.plate-chip`, `.plate-btn`, the fixed-light sim surface).
- Motion presets: `src/lib/motion.ts` (no inline spring numbers anywhere). Status tone → text colour: `src/components/ui/tone.ts`.
- Sim stage (§5.9): `src/components/sim/SimView.tsx` (objective line above the plate, 2 readout rows + "All readouts (n)", controls on the canvas). Sims list their objective outputs first with an optional `primary` field. Slider: `src/components/ui/Slider.tsx`.
- Sandbox of every component: `/design-system` (noindex, not linked from the app; `src/components/ds/`).
- Checks: `scripts/shots.mjs` (fixed screenshot set + pixel diff), `scripts/contrast-sweep.mjs` (text contrast per route), `scripts/sweep.mjs` (every route, every sim stage and the interaction states at 390×844 and 1440×900, light and dark, reduced motion, confetti off).
- Kept behaviours: sticky plate + 2 readouts on phones; grips first, at most 2 sliders open; 48 px slider thumb zone; Profile → **Repair app** (`src/lib/repair.ts`); Sim Lab browser in a vaul sheet.

### 6.6 Simulations
61 dioramas built from a shared SVG material library (`MAT`: soil, sand, shale, coal, rock, lime, ore, goaf, hatch, metal, steel, wood, glass, sky, water, heat; shadow/glow filters). Motion where it carries meaning (airflow streamlines scaled by Q, spinning drums/impellers/fans/Koepe wheel, blast fronts and shock rings, rising gas and smoke, tumbling mill charge), animated fracture cracks and shaking when factors of safety drop below 1, live readout rows with springing numbers, an objective line that turns green when a goal is met, and drag grips with a floating value tooltip. Animated sims pause when off-screen. The Sim Lab turns every lesson goal into chained challenges.

### 6.7 Audio
`src/lib/sfx.ts`: one lazily created AudioContext; every layer has an ADSR envelope; each sound has a low-pass filter; all sounds pass a shared bus → compressor → dry + generated-impulse convolution reverb (12 % wet). Palette: tick (noise burst + resonant click, ≤ 25/s, jittered), tap (soft low thud), correct (marimba rising fifth), wrong/heart (muted wooden thump), unlock (grace figure), fanfare (three-note marimba arpeggio). One global listener gives every button its tap and every slider its tick. Global persistent mute. `/sound-test` audition page in development builds.

### 6.8 PWA and offline
`public/sw.js` precaches every exported file listed in `out/precache.json` (written by `scripts/build-sw.mjs`; ~232 files, ~7.5 MB); the cache name is a hash of the build, so each deploy gets a new cache version and old caches are deleted on activate. Pages are network-first, assets cache-first. `PwaRegister` registers the worker in production. Manifest and icons support "Add to Home Screen" / "Install app".

## 7. Tooling and quality gates

| Command | What it proves |
|---|---|
| `npm run validate` | Every sim exists and computes; every Intuition-lab goal is reachable (subset + grid search); hotspots in bounds; crisis phases have exactly one correct option; every predict wrong option is explained; equation targets buildable; exam bank papers meet quotas; tools and statutes well-formed |
| `NODE_PATH=$(npm root -g) npm run audit:svg` | Renders all 61 sims in 843 contexts (defaults, every parameter at min/max, every lesson stage, theory hotspots) and measures real text boxes with the app fonts in headless Chromium: clipped labels, overlapping labels, labels occluded by shapes, hotspot-pin collisions. Current result: 0 / 0 / 0 / 0. `AUDIT_SUGGEST=1` writes collision-free pin positions |
| `npx tsc --noEmit` | Type safety |
| `npm run lint` | ESLint (agent skill folders and `.audit/` are ignored) |
| `npm run build` and `NEXT_PUBLIC_BASE_PATH=/Mining-2024 npm run build` | Static export at root and under the GitHub Pages base path |

Headless Playwright checks used during development (scripts kept outside the repo): 390 × 844 light/dark sweep of every sim and lesson (runtime errors, overflow, WCAG AA contrast, diagram above the drawer), Inspector acceptance (progress byte-identical), Workbench/Crisis fold test, offline + export/import round-trip, previous-build export import. Playwright is preinstalled globally in the dev environment.

## 8. Build, run and deploy

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to out/ + precache manifest
npm start            # serve out/ locally (respects NEXT_PUBLIC_BASE_PATH)
```

**Deploy:** `.github/workflows/deploy.yml` runs on push to `main` (and manually): `npm ci` → validate → tsc → lint → build with `NEXT_PUBLIC_BASE_PATH=/<repo-name>` → upload `out/` → `deploy-pages`. One-time setting: **Settings → Pages → Source: GitHub Actions** (done; an earlier "Deploy from a branch" setting served the README via Jekyll until the site was unpublished and redeployed). `public/.nojekyll` is shipped.

## 9. History (phases)

| Phase | Delivered |
|---|---|
| 1 | Scaffold, store, Codex, Campaign, Unit map, Warmup (SRS), Profile, 7 card engines, Orientation unit |
| 2–5 | Units 1–10 content (lessons, bosses, sims), validator with reachability search |
| 6 | 6 new sims (three-point dip, slope modes, longwall cycle, BG vs LTCC, flotation, FLP/IS zones), statute audit, DGMS Exam Simulator, Field Calculators, Sim Lab, store v2 migration |
| 7 / 7.1 | Owner-verified statutes and citations, static export + GitHub Pages, PWA/offline, mobile ergonomics, export/import |
| 8 | Design-system redesign: themes, fonts, 3D controls, sound, expedition map, immersive lesson player, first 7 dioramas |
| 9 | Mobile fixes (padding, contrast, compact layout, animated readouts), all 61 sims upgraded, SVG audit tool, pin solver |
| 10 | 390 × 844 light/dark QA sweep, AA contrast fixes, Codex visual previews, off-screen animation pause |
| 11 | Story hooks for all 55 briefings, 198 per-option explanations, equation diagnosis, in-canvas objectives + Sim Lab challenges, drag tooltip, header declutter, micro-delight |
| 12 | Inspector Mode (sandboxed master unlock), studio Web Audio engine, UI craft (sonner, canvas-confetti, vaul, Radix, hairline surface tokens, sticky Workbench/Crisis bars) |
| 13 | ConceptFlow engine + source registry, Brilliant-style feedback and type, 3 sourced and fact-checked theory flows (u7-l1, u0-l1, u10-l3) |
| 14 | Trust, pacing & situations: balanced answer order, per-screen review, situation screens, theory-first mode + resume, phone-testing kit, storage persistence, deferred sim fixes. Plan in `ROADMAP.md`; rules in `CLAUDE.md` |
| 15 | Sources & coverage map: text/OCR for every PDF in `sources/`, NITR syllabi in `sources/nitr/`, `coverage/MAP.md` + `map.json` (rebuild: `python3 -I coverage/build_map.py`), ranked gap list, Phase 16 order. DGMS side rebuilt 2026-11-27 on the First Class syllabus, G.S.R. 910(E) Annexure I. |

## 10. Key decisions and conventions

- **No new tabs or exam modes without a reason;** recent phases favour polish over feature count.
- **Device-local vs progress:** anything that should not travel between devices (theme, mute, Inspector) lives in `strata-prefs`, never in the progress store or export files.
- **Never write progress outside `LessonPlayer`** (Warmup and Exam record through their own store actions); cards stay pure.
- **Sandbox runs must be side-effect free** (verified byte-for-byte).
- **Diagram edits keep geometry** where theory hotspots point; run `audit:svg` after any render change, and `validate` after any content change.
- **Sims stay light ("daylight plates") in dark mode;** everything else, including the sim readouts, the Tools calculators and the Exam strip, follows the theme (DESIGN.md §5.13).
- **Accessibility floor:** AA contrast, 44 px targets, reduced motion, keyboard-reachable controls, inputs with visible 1 px borders.
- **Violet is retired** (DESIGN.md §5.1, §5.12); stage kinds are neutral eyebrows with a lucide icon.
- **Commit attribution and pushes:** feature work is committed on the working branch and pushed to `main` (which deploys); each Phase 12 section shipped as its own commit.

## 11. Known limitations and open items

- 60 fps has only been checked in headless Chromium, not profiled on a real phone.
- Some Workbench and Crisis stages are long by nature; their primary controls are pinned on screen, but the card body can still scroll.
- 32 of 61 simulations have no on-canvas grip because no parameter maps cleanly to a position; they use sliders.
- The offline precache is ~7.5 MB.
- `/sound-test` is development-only, so sounds cannot be auditioned on the live site.
- Statutory figures should be re-verified periodically, especially as OSH&WC Code 2020 regulations are notified. STRATA is a study aid, not a legal reference.
- The syllabus coverage map is topical (rule-based), and its DGMS side is the G.S.R. 910(E) Annexure I syllabus (one line per `;`-separated item). Re-run `coverage/build_map.py` after adding lessons.
- Possible future work: per-unit statutory reference pages, a teacher dashboard.
