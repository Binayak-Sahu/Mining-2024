# STRATA Roadmap

The owner's decisions, the phase plan and a run log. `BUILD_PROGRESS.md` holds the detailed engineering log; `CLAUDE.md` holds the rules every run follows.

## Owner decisions (Bink)
1. **Theory-first mode is on by default.** A lesson counts as complete without its Equation/Numeric stages. Those stages become optional "Bonus maths".
2. **Automated quote verification** (replaces the earlier "owner verifies 5 claims" decision, 2026-11-26).
   - `scripts/verify-quotes.ts` (in `npm run validate`) checks every research excerpt against its source text. NOT FOUND claims are fixed or dropped.
   - Each screen's Source sheet shows its excerpt and location.
   - Owner verification is optional, and only for field or statutory practice he knows.
3. **Phase 16 lesson order** follows the DGMS/NITR coverage map from Phase 15 (order set below).
4. **Code Underground law books** use STRATA's map language, but every stop must be highly interactive and animated, not static cards.
5. **The Management book** is re-sourced through the sourced-flow pipeline.
6. **After the merge, Unit 10 becomes an overview** that links into the law books.
7. **Every concept flow includes role-based situation screens.** Roles vary across a unit. The correct option must not be predictable by position or length.

## Statute gate: pending
_(none. Proposed statutory changes are listed here as old → new, source, location, and are applied only after owner approval.)_

## Service-worker change (do-not-touch exception): APPROVED by the owner 2026-11-26, applied in the 14.5 hotfix
- **Found (Phase 14.5 hotfix, real repro):** `public/sw.js` serves RSC payloads (`*.txt`) cache-first with `ignoreSearch`. After a deploy, the new app can be fed payloads from the old build.
  - The Sim Lab symptom is fixed without touching the SW: the picker no longer navigates.
  - Other client navigations stay exposed until the SW changes.
- **Proposed one-line change:** treat `url.pathname.endsWith(".txt")` like navigations (network-first, cache as offline fallback).
- **Status:** approved and applied: `.txt` RSC payloads are now network-first, with the cache as the offline fallback. Verified with the stale-deploy repro and the offline check. Profile → Troubleshooting → **Repair app** remains for devices that are already stuck.

## Sources policy (2026-11-26)
- The OSH (Central) Rules 2026 (G.S.R. 345(E), 08-05-2026) supersede the Mines Rules 1955, the Mines Rescue Rules 1985 and the MVTR 1966. Those three are historical only.
- A new Tier 2 source, the owner's private library: books stay in the private repo `Binayak-Sahu/strata-library` or outside this repo, never here. `sources/private/` is gitignored.
  - Cite title + page; paraphrase only.
  - At most one quote under 15 words per book per lesson.

## Phases

| # | Phase | Status |
|---|---|---|
| 2026-11-27 | Phase 15.5f: DESIGN.md v2.1, sandbox preview, Restore → profile menu, dark-plate pilot | Shipped (see Phase 15.5f). Pilot built after Bink chose the three extra plate rules; re-ran validate, base-path build, audit:svg (0/0/0/0), touch suite 50/50, sandbox + Path shots. Inspector acceptance before merge: u7-l2 in Inspector Mode, 5 stage-jumper jumps with taps, Check and slider moves, progress byte-identical at 390×844 and 1366×900, 0 page errors. Merged to `main` at Bink's request. Gates: validate 0 errors (404 stages; quotes 25 found, 0 not found; `excerpts.gen.ts` restored), tsc, lint, build, base-path build, audit:svg 843 renders 0/0/0/0 (no sim changed), touch suite 50/50 (new check: profile menu rows; hero has no restore link). Restore end to end: export from a seeded device via the menu, restore on a fresh device via the menu → 40 XP and u0-l1 back, keys unchanged. /design-system and Path at 390×844 light+dark: 0 console errors, 0 overflow; shots in `.audit/15.5f/`. Design review not run this time. |
| 1–13 | Platform, content, design system, ConceptFlow, first 3 sourced flows | done (see BUILD_PROGRESS.md) |
| 14 | Trust, pacing & situations | done (14.5 partial, see below) |
| 15 | Sources & coverage map | done 2026-11-26; DGMS side rebuilt on the G.S.R. 910(E) syllabus 2026-11-27 |
| 15.5 | Design overhaul (DESIGN.md v2) | done 2026-11-27 (15.5-setup, 15.5a–f; v2.1 rollout and sim conversion still to plan) |
| 15.5-v3 | Design system v3 (the Brilliant system) | 15.5-v3a sandbox done 2026-11-28; font pick, illustration refine and rollout next |
| 16 | Deep theory for the 52 remaining theory stages | **next** |
| 17 | Code Underground merge | planned |
| 18 | Exam realism | planned |
| 19 | Real-phone polish | planned (+ carried-over items from 14) |
| 20 | Maintenance | planned |

### 14 — Trust, pacing & situations
- [x] 14.0 CLAUDE.md, ROADMAP, reviewer agents, sourced-flow skill.
- [x] 14.1 Answer shuffling. Predict stages, every crisis phase and every flow screen use a balanced, deterministic order. The validator rule allows at most 40 % of correct answers in one slot per unit; current max is 33 %. Warmup reviews ConceptFlow misses one screen at a time.
- [x] 14.2 Situation screens with validator rules; one situation each in u7-l1 (Ventilation Officer), u0-l1 (Manager) and u10-l3 (Safety Officer). Fact-checked: 0 unsupported, 5 partly-supported whys rewritten.
- [x] 14.3 Theory-first mode (Bonus maths) and lesson resume.
- [x] 14.4 Phone-testing kit (Report button, FPS meter, build version, Sound test in production), `navigator.storage.persist()` and a weekly backup nudge.
- [~] 14.5 Deferred sim fixes.
  - Done: two-line readouts, O₂ coupled to CH₄ in the Coward nudge, elimination → floor residual in `u10-risk`, u0 predict working hidden until reveal.
  - **Not done:** the 11-unit label font floor. Tried and reverted: 277 clipped labels, and still 60 at a 9-unit floor. It needs per-sim layout work, so it moves to Phase 19.

### 15 — Sources & coverage map (done 2026-11-26)
Delivered:
- `sources/*.txt` next to every PDF. Only `DGMScircularsfrom20182024_06122024.pdf` was scanned: 135 of its 155 pages had no text layer (the owner's 137 of 156 was a near miss) and were OCRed with Tesseract. Listed in `sources/README.md`, which also warns that OCR numbers need checking against the PDF.
- `sources/nitr/`: the curriculum page and 64 MN-coded syllabus pages. 29 of the 93 MN subject links say "Course Syllabus Not Found" on the NITR site; they are listed in `sources/README.md`. `nitrkl.ac.in` was added to the environment allowlist (owner-authorised in the brief).
- `coverage/MAP.md` + `coverage/map.json` (built by `coverage/build_map.py` from the real lesson/stage ids in `coverage/inventory.json`). Since 2026-11-27 the DGMS side is the official syllabus (324 lines, below); the NITR side is unchanged (198 unique theory lines). Every screen id was checked against the content tree by the script. The ranked gap list is at the top of `MAP.md`.
- Mapping is by topic rules, so "covered" means a lesson's subject matches, not that its depth is enough. Only u0-l1, u7-l1 (stage 0) and u10-l3 (stage 0) are sourced flows.

**DGMS syllabus source: G.S.R. 910(E) (rebuilt 2026-11-27).**
- `sources/Gazette_Notification_of_Exam_Bye_Laws_Under_CMR_2017.pdf` (+ `.txt`, native text layer on all 105 pages, no OCR). The notification is dated **Dhanbad, 14 September 2018** and was published in the **Gazette of India Extraordinary No. 672, Monday 24 September 2018**. Both dates are printed, so the 14-09 vs 24-09 disagreement is notification date vs publication date. §12: the bye-laws commence on publication.
- Annexure I (gazette pp. 41–45) is the First Class Manager's syllabus: (a) Mine Management, Legislation and General Safety; (b) Winning and Working; (c) Mine Ventilation. The map takes each `;`-separated item as one line: 324 lines under 62 topic headings (99 / 137 / 88).
- §11.1: a mining **degree** holder sits only paper (a); a mining **diploma** holder or other candidate sits (a), (b) and (c).
- No conflict with the 2021 amendment: G.S.R. 555(E) substitutes §1.3, 1.6, 1.8, 2.0–2.6, 4.2, 8.0 and 10.0–10.2 only. §11 and Annexure I are unchanged.
- The Legislation item names the Mines Act 1952, Mines Rules 1955, CMR 2017, Mines Rescue Rules 1985, CEA Regulations 2010 and MVTR 1966. Three of those are now historical (CLAUDE.md, OSH Rules 2026). The map keeps the line as printed; lessons teach current law.
- Limits: Legislation is one paragraph (3 lines), so line counts understate the law syllabus (Phase 17 law books cover it). No source gives marks per topic, so lines are unweighted. `coverage/_cmr_regs.json` (the old CMR-heading stand-in) is no longer read.

**Top gaps (full list in `coverage/MAP.md`).** Rank = syllabus lines, then NITR lines:
1. Mine management: organisation, leadership, conflict, motivation (27 lines, paper a): new lesson in u9.
2. Accidents, investigation, safety audit and training (21 lines; 10 NITR): new lesson in u10.
3. Thick-seam, multi-seam and special methods (16 lines; 6 NITR): new lesson in u6.
4. Inrush and inundation (13 lines): new lesson in u7.
5. Occupational health and hazards: diseases, dust sampling, heights, weather (13 lines, paper a): new lesson in u10.
6. Rippers, surface miners, BWE, in-pit crushing, dispatch (13 lines, paper b): new lesson in u5.
7. Methane drainage / CBM (10 lines; 5 NITR): new lesson in u7.
8. Safety lamps, cap lamps, illumination, gas detectors (8 lines): new lesson in u7.
9. Mining machinery and haulage (7 lines; 13 NITR): new lesson in u8.
10. Production and materials management (7 lines, paper a): new lesson in u9.
- Fell out of the top: officials and duties (was #1 on 85 CMR regs; 1 syllabus line), winding statutory (0 lines) and mine plans (0 lines). The First Class syllabus has no surveying or machinery paper (those are Second Class subjects, §11.2), so these now rank on NITR only.

### 15.5 — Design overhaul (DESIGN.md v2)
`DESIGN.md` (root) is the app-wide design system; this phase brings existing screens up to it. Violations found before the work: `docs/design-audit-15.5.md`. Phase 16 waits until 15.5 is done. The owner checks the deployed app on a phone after each slice.
- [x] 15.5-setup: DESIGN.md wired into PROJECT_CONTEXT §6.5 and the design-reviewer agent; slice plan; "before" audit (2026-11-26).
- [x] 15.5a tokens + /design-system sandbox (production screens untouched): done 2026-11-26. DESIGN.md §2 tokens and §3/§5 styles live under `.ds2` in globals.css; `src/lib/motion.ts` presets; sandbox at `/design-system` (components in `src/components/ds/`), linked from Profile only when `localStorage["strata-qa"]="1"`. `scripts/shots.mjs` takes the fixed before/after screenshot set and pixel-diffs folders; every later slice reuses it.
  - Questions for Bink (15.5a): **answered** in DESIGN.md (`3686974`), applied to the sandbox in 15.5b. (1) Perfect-lesson badge: dark Star `#2A1E00` (8.9:1) on the `energy` badge. (2) Current node: filled lucide `Play`, 26 px white. (3) Hearts pill: `--surface-2` (as in the sandbox).
- [x] 15.5b global switch: palette, buttons, tiles, cards, tab bar, remove studio-bg: done 2026-11-26. §2 tokens on `:root`/`:root.dark` (`.ds2` kept as a sandbox alias); global v2 `.card`, `.btn-3d`, `.tile-3d`, `.t-*`; `.studio-bg`, `surface-sticky` blur and card shadows removed; `.plate` per §2.3; `.flow-body`/`.flow-q` → §3 `body`; §5.8 tab bar; TopBar, `cards/ui.tsx`, sheets (`.sheet-face`) and toaster on tokens; `tone-violet` and the `violet-*` ramp → action. Sandbox: filled Play on the current node, dark star on the perfect badge.
  - DESIGN.md change: `eyebrow` is 14/18 (was 13/16), so no shared class sets text under 14 px except tab labels.
  - Text still under 4.5:1 after the switch (`scripts/contrast-sweep.mjs`, every route, 390×844, light+dark; 180 → 82 instances, none in shared components). Ratios for gradient backgrounds are worst-stop estimates.
    - 15.5d: Campaign stratum labels on the path cards ("COAL SEAM" etc., 10.5 px, 1.3–3.0); unit header eyebrow and depth ("UNIT 7 · FIRECLAY…", "−720 m", 11 px, 1.1–2.0 worst stop) and description (13.5 px, 2.9–4.2 dark); Campaign dark path-card description (12.5 px, 4.45).
    - 15.5e: Warmup SRS interval chips "1d/2d/4d" (11 px, 2.5–4.3, opacity-faded); Codex "0/55"/"19" stat numerals (inline colours, 2.8–4.2); Profile rank badge "T" on a blue→violet gradient (24 px, 2.6).
  - **Remove in 15.5e:** the Profile "Design system sandbox" link, shown to everyone during Phase 15.5 (`QaDesignLink` in `Profile.tsx`).
- [x] 15.5c lesson player: top bar, prose on canvas, footer CTA, feedback sheet, word bank: done 2026-11-26. Stages on the canvas with the §5.12 eyebrow; top bar = X, one notched progress bar (finished sections still open the recap), hearts pill, ⋯ menu (Notes, Sources, Inspector; notes dot), `energy`-tint Inspector strip; footer = §5.7 feedback sheet with "Why?" and tone per state; §5.2 tiles; Equation forge as word bank + dashed tray with `layoutId` fly-in; all lesson-player springs from `src/lib/motion.ts`. What is saved, scoring, hearts, SRS and the Inspector sandbox are unchanged (Inspector acceptance on a played fixture: byte-identical).
  - Looks or works differently, by design: the explanation after Check sits behind "Why?" (it used to show two lines at once); Sources moved from the inline chip to the ⋯ menu; the Notes count became a dot; hearts show as one pill with a number; the Situation role badge is neutral (no role colours); an equation block placed in the tray leaves an empty gap in the bank instead of a faded copy; some button labels lost their dashes ("Debrief complete: continue"); Shift crisis reasons moved from inside the tiles into the sheet ("Correct!" / "Not the right call", Why?); the crisis alarm is a static `danger`-tint strip (no flashing); Statutory swipe TRUE/FALSE are ghost pills (one filled button per screen); finished-lesson stats show XP and accuracy in neutral text.
  - Design review (once): applied 1–6, 9–11 (swipe buttons, crisis reasons in the sheet, alarm strip, left-aligned swipe card, 232 px reserved bottom space, 44 px equation chips at 20 px, Bonus eyebrow names its stage kind, neutral stats, "Choose an action"). Not applied: 7 (recap hit areas are 32 px wide at 6 stages; §5.6 only needs 44 px tall), 8 (verdict wording "That's it" / "Good prediction" kept: content copy, not a §5.7 rule), 12 (`STAGE_META` hex colours still feed the unit page until 15.5d). Later slices: sim objective pill, readouts and slider panel (15.5e).
- [x] 15.5d Campaign, unit pages, path nodes, start popover: done 2026-11-27.
  - Campaign: the continue section sits on the canvas (eyebrow, display title, one `action` button, overall progress bar); the 11 units are §5.3 course cards (icon tile, "Unit n · depth" eyebrow, title, rock layer, progress bar once started) on the §5.4 spine; "Next" badge on the unit holding the recommended lesson (today's logic). No unit gets "New": nothing in today's logic marks one. The path itself now lives only on unit pages; the Campaign no longer repeats every unit's nodes.
  - Unit page: §5.10 header (112 px tile, display title, description, computed "N lessons · N questions"), §5.3 level card ("Level −720 m" / rock layer), path, shift-briefing list on tokens (§5.12 neutral stage icons, Next badge).
  - Path: §5.5/§5.5b pedestals (done, current with pulse ring, open, locked, boss, locked boss, perfect star, Master pill). Positions unchanged (same S-curve, ROW 112, % of width). Labels sit 20 px beside the node on the roomier side (`heading` 600). Trail: `--line-strong` dashes, `success` after finished nodes. Stratum colours/textures removed (§8).
  - Tapping: every node opens the Radix start popover (Start / Review / Fight boss; Master nodes say "Inspector sandbox, progress not saved"; locked: "Finish the previous lesson first", boss: "Finish every lesson in this unit first", no button). Start goes to the same `/lesson/<id>` as the old tap, with the same single history entry. Escape, tap-outside and the phone Back button close it. The START callout is gone. Unlock and resume logic untouched.
  - Question counts: `src/lib/questions.ts` (`unitCounts`), checked for determinism in `npm run validate`.
  - **Unit icons, pending Bink's review** (`src/content/unitIcons.ts`, one line each): u0 Orientation → `Signpost`; u1 Geology → `Gem`; u2 Development → `Shovel`; u3 Rock mechanics → `Mountain`; u4 Drilling & blasting → `Bomb`; u5 Opencast & HEMM → `Truck`; u6 UG methods → `Pickaxe`; u7 Ventilation → `Wind`; u8 Survey, processing & electricals → `Compass` (survey only; the unit has three subjects); u9 Economics & planning → `TrendingUp`; u10 Legislation & rescue → `Scale`.
- [x] 15.5e sim stages, remaining pages, whole-app sweep: done 2026-11-27. Phase 15.5 is closed.
  - Sim stage (§5.9): the objective is one line above the plate (lucide `Target` + `label`, green when met; the plate keeps its 2 px met ring). Readouts are plain rows (label left, mono value right, 1 px dividers, value coloured only by its ok/warn/crit tone); 2 show, the rest sit under a ghost "All readouts (n)" (n = all outputs). The duplicate status chips under the plate are gone. On phones only the plate stays pinned (as before); the objective line, readout rows and controls scroll under it. Pinning the 2 rows as well made the pinned block 343–487 px tall and left 200–345 px for the controls, and the touch suite caught a slider landing under it. **Behaviour change:** the status chips that used to ride along under the pinned plate are gone (§5.9 duplicates), so values scroll with the controls; the plate's green met ring and the footer still show success. A word-valued readout reserves the height of its longest value, so a class name changing mid-drag never makes the page jump (§1.5). Controls sit on the canvas (no grey panel); "More controls" is a ghost pill. Plate chips ("Drag the grips", "Live") are sentence case, 14 px, on the fixed-light plate colours. Sim render changes are colour only: the drag tooltip, the focus dim and `HudBadge` lost their navy (`#0E1424`/`#0B0F19` → `#141414`); no geometry or hotspot moved.
  - **`primary` lists (content data, display order only; `npm run validate` checks every key is an output and that there are exactly 2).** 31 sims: u2-access [best, shaft], u2-sinking [perMonth, cycle], u2-freeze [e, pr], u3-kirsch [p, roof], u3-failure [diff, mc], u3-pillar [fos, sp] (u3-l5 needs FOS; the u0-l1 try-it needs σp), u3-slope [fos, daylight], u4-drill [th, pr], u4-kuzram [K, over], u5-dragline [reh, Rreq], u5-match [mf, prod], u5-haul [v, gr], u5-dump [Ht, fos], u6-goaf [state, Lm], u6-longwall [util, req], u6-lwcycle [prod, shears], u7-network [Q1, Q2], u7-fan [Q, stall], u7-psychro [status, rh], u7-sponcom [gr, jtr], u7-pump [margin, npsha], u8-bowditch [prec, angMis], u8-weisbach [err, beta], u8-earth [If, tripped], u8-koepe [margin, ratio], u9-cutoff [gbe, profit], u9-pit [maxDepth, value], u9-radar [errPct, lead], u10-risk [res, br] (u10-l3 stage needs residual; its try-it needs the band), u10-fta [gas, top], u10-scba [workTime, dur]. The other 30 already led with their objective's outputs.
  - Instrument panels follow the theme (§5.13): sim readouts, the Tools output card (eyebrow, formula, readout rows) and the Exam hero and timer strip (card, no gradient; Submit is a ghost pill so Next stays the one filled button).
  - Warmup, Exam, Tools, Codex, Profile, Sim Lab (and Sync card, Sound test): §3 type (nothing under 14 px but tab labels), tokens instead of hex, no gradients or shadows, §5.3 cards, §5.1 buttons (Start = `action`), tile-3d selectable chips with `aria-pressed`. Codex section switch and unit filter are tile chips (the sliding segmented control is gone). Sim Lab's lesson view sits on the canvas; the browser's selected sim is `action` tint (was violet). Text inputs use `.field-input` (2 px `--line-strong`, radius 12, `action` border on focus).
  - Sliders: flat `--surface-2` track, `action` fill, 28 px `--surface` thumb with a 2 px `--line-strong` border and a 3 px ledge, value pill on `action` at 14 px with no shadow. The 30 px native-thumb geometry, the 48 px grab zone and every handler are unchanged (touch suite green). Parameter colours (`PARAM_COLORS`, incl. violet) are gone from controls.
  - 15.5b contrast leftovers fixed: Warmup interval chips (14 px, `--text-2` on `--surface-2`, no opacity fade), Codex stat numbers (neutral `--text`), Profile rank badge (neutral §5.11 tile, no gradient).
  - Springs: the last inline one (`AnimatedNumber`) uses `stageSlide`; every page transition uses `src/lib/motion.ts`.
  - The Profile "Design system sandbox" link is removed; `/design-system` stays (noindex).
  - Leftover search: no navy hex, `shadow-card`, backdrop blur, gradients, emoji icons or violet left in app UI. Kept on purpose: the sim art palette in `src/components/sim/svg.tsx` / `defs.tsx` and `src/content/sims/*` still uses Tailwind slate hexes (`#0F172A`, `#64748B`, …) because it is drawing on the fixed-light plate (§2.3); recolouring 61 diagrams belongs with a future plate phase. The Inspector-only FPS meter stays a dark HUD (`#34D399`/`#FBBF24`/`#F87171` on black). `tone-violet` and the `violet-*` aliases still exist in CSS as mappings to `action` (no screen uses violet colour). `.plate`'s grid lines are a CSS `linear-gradient` pattern (the plate exception).
  - New checks: `scripts/sweep.mjs` (every route, every sim stage and try-it screen before and after a slider move + "All readouts", 23 interaction states incl. exam results, boss rounds, seeded Warmup and the reset dialog, at 390×844 and 1440×900, light and dark, reduced motion; end-of-lesson confetti off under reduced motion and on without it; node pulse stopped). `scripts/list-sim-stages.ts` feeds it. The contrast scan moved to `scripts/lib/contrast-scan.mjs`, the states to `scripts/lib/sweep-states.mjs`.
  - Design review (once, whole app, 390×844 light+dark). Applied:
    - (1) Readout rows align on the baseline, and a number keeps its unit on the same line.
    - (2) Word values (classes, verdicts) use the UI font, not mono (§3). Values longer than ~18 characters sit under their label. Every value reserves the space of its longest state, so rows never rewrap mid-drag.
    - (3) Plate chips no longer cover the diagram: "Live" is gone, and the one-time grip hint sits under the plate.
    - (4) The pinned plate now sits under the real header height, including the Inspector strip.
    - (6) Warmup counters are neutral; "due" turns red only when something is due. No centred paragraphs over 2 lines.
    - (7) Exam: Start moved up into the hero card, and the explanatory bullets moved onto the canvas.
    - (8) No divider under the last readout row.
  - Not applied:
    - (5) The footer covering "All readouts": the lesson's bottom spacer already lets it scroll clear, and `sweep.mjs` finds the CTA on screen everywhere.
    - (9) "Two filled buttons" on Profile: Import is already a ghost pill.
    - (10–12) Observations, no rule broken.
    - Taste notes (one combined disclosure, a smaller Sim Lab title, Warmup copy length).
  - The touch suite caught two regressions in this round, both fixed: a hint that appeared after mount re-parented the plate and dropped the grips' touch claim; and number widths rewrapped the labels mid-drag.
  - Proposed for DESIGN.md (not applied, needs Bink): §5.14 "Text inputs" to record the `.field-input` style the Tools, Exam and search fields now use (§2.1 already names `--line-strong` for inputs, so no new tokens).

### 16 — Deep theory (52 remaining theory stages): next
- **Order (rebuilt 2026-11-27 on the G.S.R. 910(E) syllabus; syllabus lines with a covered lesson first, NITR lines as tie-break):** U7 → U6 → U5 → U10 → U4 → U3 → U2 → U1 → U9 → U8. Lines per unit (syllabus / NITR): U7 85/16, U6 30/17, U5 28/27, U10 21/11, U4 17/17, U3 15/38, U2 13/12, U1 7/11, U9 6/16, U8 1/10. Per-paper split in `coverage/MAP.md`.
- Old order (CMR-regulation proxy, 2026-11-26): U7 → U4 → U8 → U2 → U6 → U10 → U5 → U3 → U1 → U9.
- **Owner choice open:** a degree holder sits only paper (a). Counting paper (a) alone gives U10 → U7 → U9 → U5 → U8 → U6 → U4 → U3 → U2 → U1. The order above counts all three papers (the diploma route, and the whole syllabus). Pick one; the default is all three papers.
- Convert 4–5 lessons per run through `.claude/skills/sourced-flow/SKILL.md`.
- Gap lessons from the ranked list are appended at the end of their units (each unit keeps its separate boss; stage indexes untouched). "Screens in an existing lesson" gaps become new stages appended at the end of that lesson's stage list.

### 17 — Code Underground merge
Input: the owner's app, `sources/code-underground/code-underground.html` (uploaded 2026-11-26; single-file app; progress key `osh-tour-v2`). Not processed yet.
- **A. Data.** The 4 books become lazy-loaded JSON:
  - situation → situation screen;
  - cards → explain screens, split at sentence boundaries without rewording (law cap 60 words);
  - qs → checks.

  Law flows are exempt from the misconception rule.
- **B. UX.**
  - A Law track on the map, with animated, interactive stops.
  - A Codex Law Library: exact Gazette text, search, tap-to-define glossary.
  - Reg 111 / Reg 30 calculators merged into Tools.
  - The numbers drill feeds SRS.
  - A Legislation paper mode in the exam simulator.
  - An importer for `osh-tour-v2` progress.
- **C. Statutes.**
  - Reconcile `statutes.ts`.
  - Re-point the 10 Mines Act citations to the OSH Code 2020 (in force since 21-11-2025) and the OSH (Central) Rules 2026, via the statute gate.
  - Unit 10 becomes an overview.

### 18 — Exam realism
Restructure the exam simulator to the DGMS First Class paper layout from `sources/`, with per-syllabus analytics.

**What the documents state (and nothing more):**
- `FinalNotificationCBT_02022025.pdf` (notified 02-02-2025): DGMS holds Computer Based Examinations for Manager's, Overman's, Foreman's, Surveyor's, Sirdar's, Mate's, Blaster's and Gas Testing certificates, 03–07 June 2025, with an online-only application (last date 02-04-2025). First Class Manager's fees: ₹100 (MMR), ₹1200 (CMR). Certificates: First/Second Class Manager's, Unrestricted or Restricted, under the CMR 2017 or the MMR 1961. **It names no papers, subjects, marks or durations.**
- `AMENDMENTS…CMR, 2017.pdf`, G.S.R. 555(E) (11-08-2021), amending the Manager's bye-laws G.S.R. 910(E):
  - each subject is one Computer Based Test of **three hours**;
  - every subject carries a maximum of **150 marks**;
  - the pass mark is **at least 50 % in each subject (75 of 150)**;
  - question banks are objective multiple-choice questions;
  - the amended clause 4.2 is omitted, and the original does not say what it held.
- `Gazette_Notification_of_Exam_Bye_Laws_Under_CMR_2017.pdf`, G.S.R. 910(E) (14-09-2018, published 24-09-2018), the Manager's bye-laws themselves:
  - **Papers (§11.1, First Class Manager's Certificate):** (a) Mine Management, Legislation and General Safety; (b) Winning and Working; (c) Mine Ventilation. Degree in mining: (a) only. Diploma in mining, or other qualifications: all three. Syllabus per paper: Annexure I.
  - Restricted to opencast workings (§11.3): (a) and (b), syllabus Annexure III.
  - **Marks as first notified (§2.1, 2.4–2.6):** per subject a 2-hour CBT (80 marks) plus an oral test (20 marks), 100 in all; pass = 40/80 CBT, 6/20 oral and 50/100 overall. **Superseded** by G.S.R. 555(E) above (3 hours, 150 marks, 75 to pass, no oral). The exam simulator uses the 2021 figures.
  - Other unchanged clauses: no candidate may leave the CBT hall within one hour of the start (§9.6); at most seven attempts for a certificate from the notification of CMR 2017 (§3.2; 555(E) does not amend §3). The fee of ₹1200 (§11.5) matches the 2025 CBT notice.
- **Still not in any source here:** question counts per paper, marks per topic, negative marking. A search snippet mentioned subject codes such as FCR-W and FCU-L from a DGMS 2021 notice, but that page was never fetched, so it is only a lead and must not be built on.

### 19 — Real-phone polish
- Fixes from the owner's Report exports.
- Sim label font floor (11 viewBox units) via per-sim layout work, carried over from 14.5; audit:svg must stay at 0.
- From the Phase 14 design review:
  - word caps on whole situation screens (scene ≤ 25 words, screen ≤ 65) and `why` ≤ 25 words, with trims;
  - a compact wrong-answer strip so the learner taps another option directly, with no Try again tap;
  - a switch-track visual for Profile toggles;
  - 44 px Stage Jumper/Refill pills;
  - a validator rule for role variety once a unit has ≥ 2 situations.
- Performance budget: precache ≤ 10 MB.
- Sound decision: keep the synth or move to a CC0 pack.
- Final reviewer sweep.

### 20 — Maintenance
- A reference link checker.
- Re-verify all CMR content when the OSH (Coal Mines) Regulations 2026 are notified.
- Optional: Logic Lab as a "Mine Automation" unit.

- [x] 15.5f depth, stratum colours, Restore placement, dark-plate pilot (sandbox): done 2026-11-27.
  - DESIGN.md → v2.1: dark `--surface #1E1E1E` / `--surface-2 #282828` / `--line #333333`, new `--ledge` (`#D4D4D4` / `#3A3A3A`), dark card top highlight, cards and nodes press like buttons (3 px, ledge 5 → 2, `tactilePress`); §2.4 stratum colours; §2.3b sim plate in both themes (`--plate-*`, `--mat-*`, SVG text ≥ 12 px rendered); long titles use `title`; thin space before units; Never List: no text links in chrome. v2.1 values live only in the sandbox (`.ds21-light` / `.ds21-dark`); production still runs v2.
  - Stratum colours (icon on tint, light / dark): u0 `#3C87AC` 3.49/3.53 · u1 `#977C44` 3.47/3.54 · u2 `#8A812E` 3.49/3.52 · u3 `#8678A8` 3.49/3.51 · u4 `#748544` 3.53/3.49 · u5 `#BC6A2C` 3.48/3.53 · u6 `#9174A2` 3.51/3.51 · u7 `#368C80` 3.49/3.54 · u8 `#5F8A4A` 3.51/3.51 · u9 `#BD5E91` 3.52/3.51 · u10 `#AC65AA` 3.52/3.50. **Pending Bink's review on his phone.**
  - Sandbox `/design-system`: §12 stratum tiles (11 × light/dark, contrast measured live), §13 card depth (pressable card, pressing nodes, unit header band; secondary text on the band 5.58–5.84:1).
  - Production: "Restore from backup" text link removed from the Path hero. The rank button (T) in the top bar opens a menu: Profile and settings, then "Backup & restore" (Export progress, Restore from backup = merge, Repair app). Restore uses the same `importProgress` as Profile › Move progress (shared `src/lib/restore.ts`); same storage keys, schema 2 unchanged. The desktop-only export/import icon in the top bar is folded into the menu.
  - Sim colours: the 61 sims use 72 distinct hard-coded colours in `src/content/sims/*` (115 counting the shared `C` palette in `svg.tsx` and the patterns in `defs.tsx`, plus `"white"` 70×). Three groups did not map to the first §2.3b rules (near-black coal, text on materials, semantic markers); Bink chose three extra rules (now in DESIGN §2.3b): dark-material lightness floor + outline, `--mat-ink`, markers on the accent faces.
  - Dark-plate pilot (`src/components/ds/PlatePilot.tsx`, sandbox §14): Coalification (`u1-coalrank`), Virgin vertical stress (`u0-overburden`), Ore genesis (`u1-supergene`) in light and dark. Production sim files untouched; the sandbox re-colours its own copy. Measured live at 390 px: lowest text contrast light / dark: coal 5.98 / 6.30, overburden 6.18 / 6.91, supergene 4.57 / **4.49** (one label on a mid-tone material just under 4.5). Smallest SVG text 5.6–6.4 px rendered (rule ≥ 12 px): every converted sim needs a label re-layout, a geometry change for its own roadmap step. Seen in the shots: faded (inactive) anthracite ranks are still very dark on the dark plate; the `Dim` label box stays light ("paper" in `svg.tsx` not mapped in the pilot).

### 15.5-v3 — Design system v3 (DESIGN.md v3, the Brilliant system)
- [x] 15.5-v3a sandbox only: done 2026-11-28.
  - **Docs.** `DESIGN_v3.md` merged into `DESIGN.md` (v3 won every conflict; v2 sections it doesn't mention kept), then deleted. Changelog at the top; 15.5f/v2.1 values listed as superseded in Appendix A.
  - **Contrast fixes** Bink approved (DESIGN §2.2b):
    - new per-family `ink` tone for unit-hue text and rings;
    - blue and purple button faces `#4568F5` / `#8E49FF`;
    - `#141414` text on the success and danger faces;
    - light progress fill `#15803D`;
    - light `--text-3` `#6F6F6F`.
  - **Other spec changes**, recorded in DESIGN:
    - eyebrow stays 14 / 18 (the draft's 13 broke its own 14 px floor);
    - sim stage padding 12 (not 24), so 14 px labels fit at 390 px;
    - per-sim viewBox for redrawn sims;
    - number–unit space U+202F.
  - **Packages** (approved in the request): `@fontsource-variable/figtree`, `@fontsource-variable/onest`, `katex`.
    - KaTeX uses a woff2-only copy of its CSS (`src/components/ds/v3/katex-woff2.css`; regenerate with `node scripts/katex-css.mjs` after a katex update).
    - Service-worker precache: 239 → 270 files, 7.2 → 8.0 MB. All fonts are precached even though only the sandbox uses them. `public/sw.js` and `build-sw.mjs` are untouched.
  - **Sandbox** (`/design-system`, `.ds3` scope; code in `src/components/ds/v3/`). Theme and font switches change the page only and are not saved.
    - font bake-off (the same U4 Home in Figtree, Onest and Plus Jakarta Sans);
    - neutrals and the 5 families with measured contrast;
    - buttons with ledges, cards, stat pills, course tabs;
    - Home mock (U4) with a swipeable unit carousel;
    - Path mock (U7);
    - KaTeX formulas.
    - The v2 sections are folded under "v2 components (production today)". The v2.1 previews (`V21.tsx`, `PlatePilot.tsx`) were removed; the dead `.ds21` CSS is still in `globals.css` for the rollout slice to delete.
  - **Illustrations** (drafts for Figma): `src/assets/illustrations/` U4 cartridge + detonator, U7 axial fan. Each is a `.tsx` component plus an `.svg` exported by `scripts/export-illustrations.tsx`.
  - **Pilot sims** (`src/components/ds/v3/pilots.tsx`): Coalification, Virgin vertical stress, Dip and strike.
    - They spread the production SimDefs, so params, maths, readouts and the lesson objective are the production ones. Drawing and grip positions are new.
    - Teaching check: dragging each grip meets its lesson objective (D 2 → 4.8 km, H 300 → 800 m, β 80 → 25°), and readouts update.
    - Production sim files are unchanged (audit:svg 843 renders 0/0/0/0). audit:svg does not cover the pilot copies; they were checked by the sandbox text-size scan (0 text under 14 px except the 13 px tabs) and by screenshots.
  - **Open for Bink:**
    1. Pick the font after the phone check (recommendation: Figtree, the roundest and closest to Brilliant at 800).
    2. Refine the two illustrations in Figma.
    3. Judge the pilot sims in dark. Their fills keep light values (light greys and orange on `#1E1E1E`).
- **Known bug (pre-existing, found during the 15.5-v3a merge check):** intermittent React #418 hydration mismatch on a fresh profile with `masterUnlock` on, seen on `/lesson/u7-l2/` and `/`. Not yet traced.
- [ ] 15.5-v3b rollout: v3 tokens to `:root`, chosen font, remove JetBrains Mono and the losing font, Home/Path rebuilt to §5.2/§5.3, remaining illustrations, sims converted one unit at a time (geometry changes need a roadmap step + audit:svg).

## Run log
| date (UTC) | run | outcome |
|---|---|---|
| 2026-11-28 | Phase 15.5-v3a: design system v3, sandbox only | Shipped on the working branch (see Phase 15.5-v3). Stopped once to ask about 8 failing v3 contrast pairs; Bink chose the 4 recommended fixes. Gates: validate 0 errors (404 stages; quotes 25 found, 0 not found; `excerpts.gen.ts` restored), tsc, lint, build, base-path build, audit:svg 843 renders 0/0/0/0 (no production sim changed), touch suite 50/50. Sandbox at 390×844 light and dark: 0 console errors, 0 horizontal overflow, no text under 14 px except 13 px tabs. Pilot grips meet their objectives (mouse and touch contexts). Shots in `.audit/v3a/` (local). Inspector acceptance before merge: seeded progress (653 bytes: 2 lessons done, XP, codex, an SRS item), u7-l2 in Inspector Mode, 5 stage-jumper jumps with slider, tile and Check taps → progress byte-identical at 390×844 and 1366×900. Design review not run. Merged to `main` at Bink's request. **Known, pre-existing:** an intermittent React #418 hydration error on a fresh profile with Inspector unlocked (`/lesson/u7-l2/`, sometimes `/`): 2 of 5 runs on the `main` build before this merge, so it is not caused by v3a; logged for Phase 19. |
| 2026-11-27 | Phase 15 rebuild: coverage map on the G.S.R. 910(E) syllabus | DGMS side of `coverage/build_map.py` now parses Annexure I of G.S.R. 910(E) (3 papers, 62 topics, 324 lines; native text, no OCR) instead of CMR regulation headings; NITR rows byte-identical to before; id-existence asserts pass. Dates: notified 14-09-2018, gazetted 24-09-2018 (both printed). No conflict with G.S.R. 555(E). Gaps re-ranked (management, accidents, thick-seam on top); Phase 16 order U7 → U6 → U5 → U10 → U4 → U3 → U2 → U1 → U9 → U8 (was U7 → U4 → U8 → U2 → U6 → U10 → U5 → U3 → U1 → U9); paper-(a)-only order left for the owner. Phase 18 paper names and original/2021 marks recorded. No `src/` change. Gates: validate 0 errors (404 stages; quotes 25 found, 0 not found; `excerpts.gen.ts` restored), tsc, lint. Build, audit:svg, touch suite and Inspector check not run: no `src/` change. |
| 2026-11-27 | Phase 15.5e: sim stages, remaining pages, whole-app sweep (closes 15.5) | Shipped (see Phase 15.5). `scripts/sweep.mjs` on the final build: every route (86), every sim stage (61) and try-it screen (3) before and after a slider move + "All readouts", 25 interaction states (node popovers, feedback sheets, menus, Sources/Inspector sheets, predict/crisis, exam question/results/analytics, Profile reset dialog, Codex tabs, Tools, Sim Lab sheet, boss rounds, seeded Warmup) at 390×844 and 1440×900, light and dark, reduced motion: 968 checks, 0 failures (0 console errors, 0 overflow, CTA on screen, 0 text under 4.5:1). End-of-lesson confetti: 0 canvases under reduced motion, 1 without (control); path-node pulse animation none under reduced motion. Text < 14 px: only the 12 px tab labels (and the sandbox). Gates: validate 0 errors (excerpts.gen.ts restored after each run), tsc, lint, base-path build, audit:svg 843 renders 0/0/0/0, touch suite 49/49, Inspector acceptance byte-identical at 390×844 and 1366×900 (Master popover start, 5 jumper stages with slider, wrong-answer and crisis input). Before/after shots: `.audit/15.5e-before/`, `.audit/15.5e-after/` (diff: only Exam, Profile, Tools and the sim stage changed; the lesson flow screen differs by ≤ 4/255 from the neutral focus dim; Campaign, unit page and question screens identical). |
| 2026-11-27 | Phase 15.5d: Campaign, unit pages, path, start popover | Shipped (see Phase 15.5). Contrast sweep Campaign + 11 unit pages light+dark: 71 → 0 sub-4.5:1 (rock-layer labels, unit eyebrow/depth, header description all fixed); node popover states 0; text < 14 px on these pages: only the 12 px tab labels. Popover check at 390×844 light+dark, fresh and mid-progress profiles (146/146): every node, centred and at the bottom edge, popover fully on screen (x 105–285 node centres); Escape, Back and tap-outside close it; Start opens the right lesson; Back from the lesson returns to the unit page and a second Back leaves it (no stray entry). Gates: validate 0 errors, tsc, lint, base-path build, touch suite 49/49, Inspector acceptance (lesson started from a Master popover, 6/6 jumper stages, hearts lost, progress byte-identical at 390×844 and 1366×900). audit:svg not run: no sim render changed. Lesson screenshots pixel-identical to before. Design review: applied popover side by node position, 4-line labels, Next badge instead of a second action-border card, badge padding; not applied: focus ring solid (DESIGN §2.2 says 60 %), text-3 contrast worry (measured 0 failures). |
| 2026-11-25 | Phase 13: ConceptFlow + 3 sourced flows | shipped to main (`d1c3d51`) |
| 2026-11-26 | Phase 14.5 hotfix: real-phone bugs (slider scroll-steal, stuck Sim Lab picker, sim-stage declutter, back navigation + Notes, quote verification, sources policy) | see BUILD_PROGRESS; SW change approved and applied; touch regression suite added; deferred: SVG label size (19), predict-with-sim layout |
| 2026-11-26 | Dependencies approved | Bink approved `@radix-ui/react-popover` (path-node start card, 15.5d) and `@rive-app/react-canvas` (original unit art/mascot, later art phase). Installed only; no code uses them yet. Rules in DESIGN.md §7b (Rive wasm must be self-hosted for offline). Gates: validate 0 errors, tsc, lint, base-path build (precache unchanged, 233 files). Touch suite/Playwright/Inspector not run: no src/ change. |
| 2026-11-26 | Phase 15.5-setup: DESIGN.md wired in, slice plan, before-audit | Docs only: PROJECT_CONTEXT §6.5 pointer, design-reviewer reviews against DESIGN.md, Phase 15.5 slices in ROADMAP, `docs/design-audit-15.5.md` (9 questions for the owner, incl. 3 failing DESIGN.md contrast pairs). Screenshots in `.audit/15.5-before/` (local, not committed). G.S.R. 910(E): not in sources/. Gates: validate, tsc, lint. audit:svg, touch suite and Inspector check skipped (no src/ change). |
| 2026-11-26 | Phase 15.5c: lesson player redesign | Shipped (see Phase 15.5). Realistic fixture by playing (u0-l1 with misses, u0-boss, u1-l1 finished; u1-l2 left at stage 3), exported from Profile and imported for the Inspector check: 16/16 Stage Jumper taps landed, progress byte-identical. Stage-kind walk at 390×844 light+dark (flow, briefing, sim, predict, equation, numeric, crisis, swipe): sheet never covers the question, question y unchanged when the sheet opens, CTA always visible, Try again retries, recap opens from a finished section. Contrast: 0 failures in 16 interaction states (`contrast-sweep.mjs … states`); route sweep unchanged at 82 (all 15.5d/e); lesson sub-14 px text 372 → 44 (sim "LIVE" chip, 15.5e). Reduced motion: fades only, no confetti. Gates: validate 0 errors, tsc, lint, base-path build, audit:svg 0, touch suite (selectors moved to the ⋯ menu), Inspector acceptance. |
| 2026-11-26 | Phase 15.5b: global switch to design system v2 | Palette, base components, tab bar, plate, removals (see Phase 15.5). Contrast sweep of all 86 routes × 2 themes: 180 → 82 sub-4.5:1 text instances, 0 in shared components (rest listed under 15.5b for 15.5d/e); 0 console errors, 0 overflow. Reduced motion (app + /design-system): fades only after stopping the path-node opacity pulse. Gates: validate 0 errors (excerpts.gen.ts restored), tsc, lint, base-path build, audit:svg 843 renders 0 findings, touch suite 49/49, Inspector acceptance byte-identical. Design review: 3 fixes applied (44 px top-bar targets, Situation caption, toast size). |
| 2026-11-26 | Phase 15.5a: design tokens v2 + /design-system sandbox | `.ds2`-scoped tokens/styles, motion presets, 11-section sandbox, QA-only Profile link, `scripts/shots.mjs`. Pixel-diff vs `.audit/15.5a-before/`: all production shots identical except known path-node animation noise (same boxes, ≤ 4/255 per channel; the before build alone shows ≤ 3/255 there between two runs) and Profile full-page +63 px for the QA link (rows above it identical). Sandbox: 0 console errors, no overflow at 390/1440 light+dark, lowest text contrast 4.57:1. Gates: validate 0 errors, tsc, lint, base-path build, touch suite 49/49. audit:svg and Inspector acceptance not needed (no sim, store or LessonPlayer change). |
| 2026-11-26 | Phase 15: sources & coverage map | OCR + text for all `sources/` PDFs; NITR curriculum (64 syllabi, 29 "not found" on site); `coverage/MAP.md` + `map.json`; gap list; Phase 16 order and Phase 18 paper facts recorded. DGMS First Class syllabus source missing (G.S.R. 910(E) not obtainable). Task 1 (reviewer agents: sonnet, medium, design review once per run) was already committed in `5b1d3e2`. Gates: validate 0 errors, tsc, lint, base-path build, touch suite 49/49, 390×844 light+dark smoke (5 routes: 0 console errors, no overflow) all passed. audit:svg and Inspector acceptance not re-run: no `src/` code changed. Caution: `npm run validate` regenerates `src/content/excerpts.gen.ts` and drops the private-source excerpts when `research/cache/private/` is empty. Run `npm run fetch:sources` first, or `git checkout` that file before committing. |
| 2026-11-25 | Phase 14: trust, pacing, situations | shipped. All gates passed (validate, tsc, lint, base-path build, audit:svg 0 findings, 390×844 light/dark walk, Inspector byte-identical). Skipped: 11-unit label floor (→ 19), stricter situation word caps, compact wrong-answer strip, switch-track toggles, 44 px jumper pills (→ 19). Note: `sources/` was absent then; the owner added it for Phase 15. |
