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
| 1–13 | Platform, content, design system, ConceptFlow, first 3 sourced flows | done (see BUILD_PROGRESS.md) |
| 14 | Trust, pacing & situations | done (14.5 partial, see below) |
| 15 | Sources & coverage map | done 2026-11-26 (DGMS First Class syllabus source missing, see below) |
| 16 | Deep theory for the 52 remaining theory stages | planned |
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
- `coverage/MAP.md` + `coverage/map.json` (built by `coverage/build_map.py` from the real lesson/stage ids in `coverage/inventory.json`). 252 DGMS proxy lines (CMR 2017 regulations) and 198 unique NITR theory lines. Every screen id was checked against the content tree by the script. The ranked gap list is at the top of `MAP.md`.
- Mapping is by topic rules, so "covered" means a lesson's subject matches, not that its depth is enough. Only u0-l1, u7-l1 (stage 0) and u10-l3 (stage 0) are sourced flows.

**Syllabus source missing (DGMS First Class Manager).**
- The syllabus is in the bye-laws G.S.R. 910(E) of 14-09-2018. No official copy was found. `egazette.gov.in`/`egazette.nic.in` and `www.dgms.gov.in` refused connections from this session (egazette is not on the allowlist and the owner's brief only named nitrkl.ac.in), and a web search returned no copy.
- `sources/AMENDMENTS IN EARLIER BYE-LAWS NOTIFIED UNDER CMR, 2017.pdf` holds only the 2021 amendments (G.S.R. 555(E)–559(E)) to 910(E) and 911(E). The 2025 CBT notification names no papers.
- So the DGMS side of the map uses CMR 2017 regulation headings as proxy syllabus lines. Per-paper weights are unknown, so the gap rank uses the number of CMR regulations touching a topic.
- **Owner action:** place the G.S.R. 910(E) text (egazette PDF, or the DGMS "Gazette Notification of Exam Bye Laws") in `sources/`, or allow `egazette.gov.in` and `www.dgms.gov.in`, and the map's DGMS side can be rebuilt against the real syllabus.

**Top gaps (full list in `coverage/MAP.md`).** DGMS-first rank:
1. Officials, returns, certificates and duties (CMR Ch II–V, XVII; 85 regs): new lesson in u10. Phase 17's law books may supersede it, and statutory numbers go through the statute gate.
2. Mining machinery and haulage (23 regs; 13 NITR lines): new lesson in u8.
3. Statutory provisions for mine working (19 regs): new screens in u6-l1.
4. Methane drainage / CBM (18 regs; 5 NITR): new lesson in u7.
5. Winding in shafts, statutory (17 regs): new screens in u8-l6.
6. Safety lamps and lighting (12 regs): new lesson in u7.
7. Mine plans and sections (7 regs; 6 NITR): new lesson in u8.
8. Inrush and inundation (5 regs): new lesson in u7.
9. Tailings and mine closure, environment (NITR 21 lines each): new lessons in u5.
10. NITR-only: numerical modelling (19), levelling/tacheometry/GPS (17), mine planning (14), ground instrumentation (11), data analytics (8), special mining (7), geostatistics, sustainability, mine finance.

### 16 — Deep theory (52 remaining theory stages)
- **Order (from the Phase 15 map, DGMS proxy count first, NITR lines as tie-break):** U7 → U4 → U8 → U2 → U6 → U10 → U5 → U3 → U1 → U9. Lines mapped per unit (DGMS regs / NITR lines): U7 34/16, U4 27/17, U8 10/10, U2 8/12, U6 7/17, U10 7/11, U5 4/27, U3 3/38, U1 3/11, U9 0/16.
- This moves U3 (the old default first) down, because CMR regulations mention it least. U3 carries the most NITR lines, so move it up if the owner prefers university weight. The order rests on the CMR proxy, not on published paper weights.
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
- **Not in any source here:** the list of First Class Manager papers, marks or question counts per paper, negative marking, and syllabus per paper. A search snippet mentioned subject codes such as FCR-W and FCU-L from a DGMS 2021 notice, but that page was never fetched, so it is only a lead and must not be built on.
- Phase 18 needs the original G.S.R. 910(E) (see "Syllabus source missing" under Phase 15) before it fixes paper names and counts.

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

## Run log
| date (UTC) | run | outcome |
|---|---|---|
| 2026-11-25 | Phase 13: ConceptFlow + 3 sourced flows | shipped to main (`d1c3d51`) |
| 2026-11-26 | Phase 14.5 hotfix: real-phone bugs (slider scroll-steal, stuck Sim Lab picker, sim-stage declutter, back navigation + Notes, quote verification, sources policy) | see BUILD_PROGRESS; SW change approved and applied; touch regression suite added; deferred: SVG label size (19), predict-with-sim layout |
| 2026-11-26 | Phase 15: sources & coverage map | OCR + text for all `sources/` PDFs; NITR curriculum (64 syllabi, 29 "not found" on site); `coverage/MAP.md` + `map.json`; gap list; Phase 16 order and Phase 18 paper facts recorded. DGMS First Class syllabus source missing (G.S.R. 910(E) not obtainable). Task 1 (reviewer agents: sonnet, medium, design review once per run) was already committed in `5b1d3e2`. Gates: validate 0 errors, tsc, lint, base-path build, touch suite 49/49, 390×844 light+dark smoke (5 routes: 0 console errors, no overflow) all passed. audit:svg and Inspector acceptance not re-run: no `src/` code changed. Caution: `npm run validate` regenerates `src/content/excerpts.gen.ts` and drops the private-source excerpts when `research/cache/private/` is empty. Run `npm run fetch:sources` first, or `git checkout` that file before committing. |
| 2026-11-25 | Phase 14: trust, pacing, situations | shipped. All gates passed (validate, tsc, lint, base-path build, audit:svg 0 findings, 390×844 light/dark walk, Inspector byte-identical). Skipped: 11-unit label floor (→ 19), stricter situation word caps, compact wrong-answer strip, switch-track toggles, 44 px jumper pills (→ 19). Note: `sources/` was absent then; the owner added it for Phase 15. |
