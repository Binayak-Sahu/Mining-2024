# Phase 15.5 "before" audit: STRATA vs DESIGN.md

Date: 2026-11-26. Build: `main` at `816942d` (+ the 15.5-setup docs commit). This audit is read-only; no app code was changed.

**Screenshots** (not committed, `.audit/` is gitignored): `.audit/15.5-before/{light,dark}-<name>.png` at 390×844, scale 1, reduced motion, service worker blocked, QA flag and master unlock on.
- Routes: `campaign`, `unit-u7`, `warmup`, `exam`, `lab`, `tools`, `codex`, `profile` (viewport and `-full` page).
- Crops and states: `tabbar`, `lesson-read-briefing` (u3-l1 stage 0, legacy briefing), `lesson-question` (u7-l1 flow screen 1), `lesson-verdict-wrong`, `lesson-verdict-correct`, `lesson-read-flow` (u7-l1 explain screen), `lesson-sim-stage` (u3-l1 stage 1 via the Inspector stage jumper; Inspector strip visible).
- 0 console errors in both themes.
- The script is `/tmp/claude-0/shots.js` in this session. Its logic should be kept for the 15.5a pixel-diff: the same routes, the same steps and `reducedMotion: 'reduce'`.

Slice key: **a** tokens + sandbox · **b** global palette/buttons/tiles/cards/tab bar · **c** lesson player · **d** Campaign/Unit/path · **e** sims + remaining pages + sweep.

## 1. Tokens and global CSS (`src/app/globals.css`)

| File:line | Now | DESIGN.md rule broken | Slice |
|---|---|---|---|
| globals.css:73–139 | Light canvas `#F7F7F5` (warm off-white), `--surface-2 #FBFBF9`; neutrals `--n-*` are Tailwind slate (blue cast: `#0F172A`, `#64748B`…) | §2.1 zero-hue neutrals, `--bg #FFFFFF`; §2.3 "Tailwind slate blue cast" removed | a (scoped) → b (switch) |
| globals.css:141–237 | Dark canvas `#0B0F19`, surfaces `#121826`/`#161D2D` (navy) | §2.3 navy neutrals removed; §2.1 dark `#121212`/`#1C1C1C`/`#242424` | a → b |
| globals.css:78–83, 148–153 | `--shadow-card` / `--shadow-pop` multi-layer shadows | §1.3 borders and ledges, not shadows; §2.3 removed | b |
| globals.css:216–239 | `hairline*` 1 px rgba borders; `surface-sticky` = translucent bg + `backdrop-filter: blur(18px)` | §4 card border 2 px `--line`; §2.3 and §8: no blur or glassmorphism | b |
| globals.css:245–254, layout.tsx:36 | `.studio-bg` dot lattice + blue radial glow on `<body>` | §2.3 removed; §8 no gradients on surfaces, no glows | b |
| globals.css:256–264 | `.card`: radius 1.25 rem, shadow, no border | §5.3: 2 px `--line` border, 5 px bottom ledge, radius 20, no shadow | b |
| globals.css:275–351 | `.btn-3d` radius 0.95 rem (not pill), 15 px text; tones use Tailwind blues/greens (`#2563EB`, `#047857`, `#F59E0B`); `tone-violet` exists; ghost is 1 px hairline | §5.1 pill, 56 px, `button` 18/700; tone map to `action/success/danger/energy/ink`; violet retired; ghost 2 px `--line-strong` | a → b |
| globals.css:304–307 | Disabled button: `--n-200` face with `--n-300` ledge | §5.1 disabled: `--surface-2` face, no ledge, `--text-3` text | b |
| globals.css:308–311 | Focus ring `rgba(59,130,246,0.55)` | §2.2 focus ring 3 px `action` face at 60 % | b |
| globals.css:353–378 | `.tile-3d`: 1 px border, radius 1 rem, 3 px ledge, selected `#3B82F6` + inset ring | §5.2: 2 px `--line-strong`, 4 px ledge, radius 12; selected = `action` face + `action` tint | a → b |
| globals.css:390–418 | `.plate` dark-mode outer drop shadow; `.plate-met` green glow (`0 0 0 4px … , 0 10px 30px`) | §2.3 plate exception: dark 2 px `--line` border, radius 16, no outer shadow; met = 2 px `success` inner ring, no glow | e |
| globals.css:673–693 | `.verdict-ok/.verdict-no` strips; `.flow-body` 17 px, `.flow-q` 19 px | §5.7 feedback sheet; §3 `body` 18/29 replaces both | c |
| globals.css:14–71 | `@theme inline` maps `slate/emerald/red/amber/blue/violet` ramps; no `--line`, `--line-strong`, `--text*` or accent face/ledge/tint tokens exist | §2 tokens missing entirely | a |
| (none) | No `src/lib/motion.ts`; 29 inline `stiffness:` springs in 13 files (e.g. ui.tsx:87, ui.tsx:154, ExpeditionPath.tsx:138, Campaign.tsx:54, TopBar.tsx:162/210) | §6 use the four presets, never inline numbers | a (file) → b–e (replace) |

## 2. Buttons and footer (ActionBar, `src/components/cards/ui.tsx`)

| File:line | Now | Rule broken | Slice |
|---|---|---|---|
| ui.tsx:80–95 | Footer bar: `hairline-t surface-sticky` (blur), slides in with inline spring (`stiffness 420`) | §5.7/§8 no blur; §4 footer padding 16/12/16+safe; §6 presets | c |
| ui.tsx PrimaryButton (used by all cards) | Default tone ink/safe chosen per card; "Try again" after a wrong answer (ConceptFlow.tsx:257, PredictOutcomeCard.tsx:60) | §5.1 "which tone when": wrong → `danger`-tint sheet with `ink` "Got it" (see Questions Q2) | c |
| LessonPlayer.tsx:353–370 | Completion footer: two filled buttons side by side ("Unit map" ghost + "Next lesson" safe), `bg-canvas/85 backdrop-blur-xl` | §5.1 one filled button per screen (ghost is fine) but blur breaks §8 | c |
| EquationForgeCard.tsx:81 | `PrimaryButton tone="violet"` | §5.1 violet → `action` | b |

## 3. Lesson player shell (`src/components/LessonPlayer.tsx`)

| File:line | Now | Rule broken | Slice |
|---|---|---|---|
| LessonPlayer.tsx:377 | Top bar `hairline-b surface-sticky` (blur, border), height 56/64 | §5.6 height 56, bg `--bg`, no border, no blur | c |
| LessonPlayer.tsx:379–381 | X is `text-slate-400` | §5.6 X `--text-2` | c |
| LessonPlayer.tsx:382–402 | Progress = one segment per stage, each tinted with its stage-kind colour (`STAGE_META.color`), with a gloss highlight (`bg-white/35`) and inset shadow; completed segments are buttons that open the stage recap | §5.6 one 10 px pill bar, `success` fill, `stageSlide`; §8 no gloss (see Q3: recap tap would be lost) | c |
| LessonPlayer.tsx:27–40, 403–411 | Three separate heart icons with a perpetual pulse; Notes button and Inspector key sit as separate icons in the bar | §5.6 hearts as one pill (Heart + count); Notes/Inspector/Sources behind a ⋯ button; Notes badge → 8 px dot | c |
| LessonPlayer.tsx:415–416 | Stage transition `x: 48, scale: 0.98` with inline spring | §6 screen change x ±24 + opacity with `stageSlide`, no scale | c |
| LessonPlayer.tsx:345 | "✓" text glyph used as a list icon | §8 never emoji/glyphs as icons; use lucide `Check` | c |
| LessonPlayer (inspectorChip) | Inspector strip is an amber chip inside the content column | §5.6 `energy`-tint strip under the top bar, `label` text | c |

## 4. Stage card and lesson content (`ui.tsx` CardFrame, ConceptFlow, briefing cards)

| File:line | Now | Rule broken | Slice |
|---|---|---|---|
| ui.tsx:32 | Every stage (prose, questions, diagrams) is wrapped in `.card p-5 sm:p-8` | §1.1 the canvas is the page; §8 never put lesson prose inside a card | c |
| ui.tsx:33 | 4 px coloured gradient bar across the card top (`linear-gradient(m.color → m.color55)`) | §8 no gradients on surfaces | c |
| ui.tsx:34–40 | Stage-kind pill: 12.5 px label, colour from `STAGE_META` (blue/green/violet/amber/red per kind) | §3 min 14 px; §2.2 colour only for meaning, no kind colours (see Q4) | c |
| ui.tsx:44 | Title 24/30 px 700, tracking -0.015em | §3 `display` 32/38 800 (stage title) or `title` 26/32 for prompts | c |
| ConceptFlow.tsx:198–293 | `.flow-body` 17 px and `.flow-q` 19 px; option letters A–D in small boxes; "Predict first · 1/15" 13 px meta | §3 `body` 18/29; §5.2 tile text `body-lg`; min 14 px | c |
| ui.tsx:150–180, 245–260 | Verdict = strip portalled into the footer (`verdict-ok/no`), amber for wrong, ✓/✗ icon spin-in, "Why?" link, spring `600/14` | §5.7 feedback sheet: `success`/`danger` tint, `title` 800 verdict, ghost "Why?", full-width button; §6 `feedbackSheet` | c |
| ui.tsx (Feedback) | Footer grows when the verdict appears; content above may shift | §1.5/§5.7 reserve the tallest footer state once (verify in 15.5c) | c |
| TheoryBriefingCard.tsx | 4 shadow uses, 7 hex colours, hotspot drawers in cards | §1.1, §1.3 | c |
| Situation.tsx | 18 hard-coded hex colours (role colours) | §8 never invent colours; add tokens first | c |
| BonusCard.tsx:18 | violet→amber gradient bar | §8 gradients; violet retired | c |
| NumericWorkbenchCard.tsx, ShiftCrisisCard.tsx:112, RapidStatutorySwipeCard.tsx:26 | 11/5/2 sub-14 px texts; amber→red gradient timer; radial-gradient swipe card | §3 min size; §8 gradients | c |
| EquationForgeCard.tsx:82–165 | violet text/borders/chips (`text-violet-600`, `bg-violet-500`) | §5.1 violet retired | c |
| StageRecap.tsx, LessonSheets.tsx:16–50 | Sheets use `rounded-t-3xl` + shadow classes, 1 px hairline list items | §5.7 sheet face `--surface-2`, 2 px `--line` border, the single allowed shadow | c |
| ConceptFlow.tsx:32 | Source sheet: same sheet style as above | §5.7 | c |

## 5. Answer tiles and word bank

| File:line | Now | Rule broken | Slice |
|---|---|---|---|
| ConceptFlow / PredictOutcomeCard options | `.tile-3d` with letter badges A–D; wrong pick shown struck through in grey, not `danger` | §5.2 correct → `success` face border + tint, wrong → `danger` | b (CSS) + c (states) |
| (none) | There is no word-bank / sentence-completion component | §5.2 word bank + blank slot (new component; sandbox in 15.5a, real use is new content) | a, c |

## 6. Bottom tab bar (`src/components/shell/TopBar.tsx`)

| File:line | Now | Rule broken | Slice |
|---|---|---|---|
| TopBar.tsx:202–203 | Bar `hairline-t surface-sticky` (blur), 76 px spacer | §5.8 height 64 + safe area, bg `--bg`, 1 px `--line` top border, no blur | b |
| TopBar.tsx:17–25, 209–212 | Each tab has its own tint colour (`#10B981` etc.); active pill = tint at 13 % with tinted inset ring; icon 20 px | §5.8 active = 56×32 `--surface-2` pill, `--text` icon/label; inactive `--text-3`; icon 24 px; no per-tab colours | b |
| TopBar.tsx:213 | Labels 10.5 px, `text-slate-500` inactive | §3 `tab` 12/16 600 (700 active) | b |
| TopBar.tsx:152, 162 | Top header also blurred (`surface-sticky`); desktop nav pill with shadow | §8 blur; §1.3 shadows | b |
| TopBar.tsx:50, 61 | Wordmark 13 px tracking 0.22em; tooltip bg `#0E1424` hex, 12 px | §3, §8 invented colours | b |

## 7. Campaign, unit page, path (`Campaign.tsx`, `UnitMap.tsx`, `ExpeditionPath.tsx`)

| File:line | Now | Rule broken | Slice |
|---|---|---|---|
| Campaign.tsx:54–70 | Hero card "Begin your descent": dark navy rounded-28 block with an SVG strata illustration, hex colours, inline spring | §8 gradients/invented colours; §5.3 card spec; §5.10 header | d |
| Campaign.tsx (15 instances) | 11–13 px eyebrows/meta | §3 eyebrow 13/16 700 0.08em; min 14 px otherwise | d |
| UnitMap.tsx:55–60 | Unit header = tinted gradient card (`linear-gradient(135deg, color-mix(...))`) + shadow, with a % progress ring | §5.10 centred header on canvas: 112 px unit icon, `display` title, stats row (lessons / exercises) | d |
| UnitMap.tsx:86 | Boss node gradient `#EF4444 → #F59E0B` | §8 gradients | d |
| ExpeditionPath.tsx:120–145 | Nodes 66/80 px, faces from stratum accent colours / `#3B82F6` / boss red-amber; gloss highlight `bg-white/25`; ledge + drop shadow `0 12px 18px -8px` | §5.5 72 px face + 10 px rim; done `success`, current `action`, locked `--surface-2`/`--line-strong`; no shadow or gloss | d |
| ExpeditionPath.tsx:133 | Icons: Play (current), Check/Star (done, Star when perfect), Crown (boss), Lock | §5.5 Check / Lock only (see Q5 for boss, perfect, Inspector "MASTER") | d |
| ExpeditionPath.tsx:160–170 | "START" bobbing callout 12 px black-weight, shadowed; pulsing ring `rgba(59,130,246,0.45)` 4 px | §5.5 3 px `action` ring 8 px outside, pulse 1→1.08 2 s; tap → popover (§5.7) with "Start" | d |
| ExpeditionPath.tsx:160 | "MASTER" badge 9 px | §3 min 14 px | d |
| ExpeditionPath.tsx:180 | Node label 11.5 px bold on `bg-surface/75 backdrop-blur-sm` | §5.5 label `heading` 600, 20 px gap; §8 no blur | d |
| ExpeditionPath (strata bands) | Background strata bands with hue-tinted fills | §8 hue-tinted neutrals / gradients (keep the map layout, restyle only) | d |

## 8. Sim stage (`src/components/sim/SimView.tsx`, `SimLabCard.tsx`)

| File:line | Now | Rule broken | Slice |
|---|---|---|---|
| SimView.tsx:275–300 | Readouts = always-dark telemetry tile grid (`#0E1424`), 11 px labels, 14 px values, glowing dots (`boxShadow 0 0 8px`) | §5.9 plain rows, `label` + `readout` 17 px mono, 1 px dividers, no tile backgrounds, no glow | e |
| SimView.tsx:251–270, 365–368 | KeyReadouts chips under the pinned plate duplicate values shown in the readout grid | §5.9 remove duplicate chips | e |
| SimView.tsx:279 / all outputs | Every output shown at once (u3-l1: 4 tiles + 2 chips) | §5.9 first 2 readouts, rest under "All readouts (n)" | e (see Q6) |
| SimView.tsx:372–377 | Control panels `bg-slate-50` + inset shadow ring | §4 borders, §1.3 no shadows | e |
| SimView.tsx:150 | Uppercase overlay chip on the plate | §3 uppercase only for eyebrows | e |
| SimView.tsx:45 | Param colours include `text-violet-600` | violet retired | e |
| SimLabCard / objective row | Objective in a dark navy pill with Target icon | §5.9 one line, `Target` 18 px + `label`, `success` tint when met | e |
| ui/Slider.tsx:76, 105 | Slider fill gradient; value pill with shadow | §8 gradients; §1.3 | e |

## 9. Other pages (slice e)

| File | Now | Rule broken |
|---|---|---|
| Exam.tsx:93–98, 267 | Radial-gradient hero, `#FECACA` text, emerald→blue progress gradient, 24 sub-14 px texts | §8 gradients/invented colours; §3 |
| Profile.tsx | 27 sub-14 px texts, 14 hex, 3 gradients, dialog overlay `backdrop-blur-[2px]` | §3, §8 |
| CodexLibrary.tsx | 21 sub-14 px texts, 8 shadows | §3, §1.3 |
| Tools.tsx | 26 hex colours (calculator panels always dark), 6 shadows | §8 invented colours |
| Warmup.tsx, SimLab.tsx | shadows, small text | §1.3, §3 |
| InspectorKit.tsx, InspectorMenu.tsx | sheet styles, 4 hex | §5.7 (UI only; sandbox logic untouched) |

## Questions for Bink

1. **Three DESIGN.md colour pairs fail the 4.5:1 text contrast that DESIGN.md §7 itself requires** (computed with the WCAG formula):
   - Dark `success` face `#16A34A` with white text: **3.30:1**. That covers the "Continue" button and the "New" badge. 18 px bold is just under the WCAG "large text" size (18.66 px bold), so 4.5:1 applies.
   - Dark `action` face `#4B6BFB` with white text: **4.38:1**. That covers "Check", "Start" and the "Next" badge.
   - Light `--text-3 #737373` on `--surface-2 #F5F5F5`: **4.35:1**. That covers disabled button text, and any caption inside a sheet or popover. (Dark is exactly 4.50.)
   - Option A: darken the two dark faces (e.g. success `#15803D`, action `#3B5BF6`, which pass at 5.0 and 5.2).
   - Option B: put dark text on them.
   - Option C: accept, since the buttons are bold 18 px.
   - 15.5a is told to stop on a failing token, so this needs your decision before 15.5a runs.
2. **Wrong answer: "Try again" vs "Got it".** Today a wrong answer offers "Try again", which clears the pick and lets you answer the same screen again. In concept flows the miss goes to Warmup review and no heart is lost (`ConceptFlow.tsx:184`). DESIGN.md §5.1 says the sheet's button is `ink` "Got it". Should "Got it" keep the retry behaviour (only the label changes), or move on to the next screen? Moving on changes how lessons score, so it is a behaviour change, not just styling.
3. **Lesson progress bar.** Today it has one segment per stage, and tapping a finished segment re-opens that stage's recap (the "re-read" feature). DESIGN.md §5.6 wants a single bar. Where should "re-read a stage" live afterwards? It could go in the ⋯ menu, or stay as taps on an unsegmented bar.
4. **Stage-kind colours.** Each stage type has its own colour today (Field theory blue, Intuition lab green, Equation forge violet, Workbench amber, Crisis red). DESIGN.md reserves colour for meaning and retires violet. Should stage kinds become one neutral `--text-3` eyebrow with their lucide icon, or keep a colour per kind? Keeping colours would need new tokens added to §2 first.
5. **Path nodes not covered by §5.5.**
   - Boss nodes (today red, or amber with a Crown).
   - "Perfect" lessons (today a Star).
   - Inspector-sandbox nodes (today grey with a "MASTER" badge).
   - The "START" callout (DESIGN.md has a popover on tap instead).
   - Which tokens and icons should these use? Today a node tap opens the lesson directly, so the popover adds one tap.
6. **"First 2 readouts = the lesson's objective variables" (§5.9).**
   - Sim definitions have no marker for which outputs are the objective variables.
   - Today's order is the order in `src/content/sims/*`. Is "the first 2 in the current order" acceptable?
   - Otherwise 15.5e must add an optional field to the sim definitions. That is content data, but not geometry or hotspots.
7. **"Existing unit icon" (§5.3, §5.10) does not exist.** Units have no icon today: the unit page shows a % progress ring, and the path uses stratum colours. Should 15.5d draw one lucide icon per unit (my suggestion), or add original SVG unit art, which would need its own design step?
8. **"N exercises" (§5.10).** Does an exercise mean a stage (379 across the app), a question screen (flow screens + checks), or something else? DESIGN.md says counts are computed, never typed, so the rule must be exact.
9. **Always-dark instrument panels.** Calculators in Tools, the sim telemetry strip and the Exam hero are deliberately always dark (PROJECT_CONTEXT §10). DESIGN.md §5.9 turns sim readouts into plain rows. Should the Tools calculators also follow the theme? DESIGN.md wins on conflict, so I would assume yes unless you say no.

No DESIGN.md rule requires touching a CLAUDE.md "Do not touch" item. The Inspector restyle (§5.6) moves only the button into ⋯; the stage-jumper and sandbox logic stay as they are. Removing the plate's chips (§5.9) is SimView UI, not sim geometry, but audit:svg will be re-run in 15.5e anyway.

## Answers from Bink (2026-11-26)

All nine questions are answered in DESIGN.md (commit after `600c3ea`):

1. Contrast: Option A. Dark `success` and `action` faces now match the light ones (`#15803D`, `#3B5BF6`); `--text-3` is `#6B6B6B` light / `#949494` dark. Every text pair is ≥ 4.8:1.
2. Wrong answer: keep retry. The sheet button is `ink` "Try again" with today's behaviour (§5.1, §5.7).
3. Progress bar: one bar with 2 px stage notches; tapping a finished section still opens its recap (§5.6).
4. Stage kinds: neutral eyebrow + lucide icon, no per-kind colour (§5.12).
5. Special nodes and tap: boss, perfect, master nodes and the Start popover are in §5.5b. Tap shows the popover first.
6. Readouts: first 2 in current order, unless the sim gets an optional `primary` list (§5.9).
7. Unit icons: one lucide icon per unit in a tile; mapping proposed in ROADMAP for approval (§5.11).
8. Counts: "N questions" = answerable screens, computed by one helper (§5.10).
9. Instrument panels follow the theme; only the sim plate stays light (§5.13).
