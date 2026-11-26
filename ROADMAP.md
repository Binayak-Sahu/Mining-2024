# STRATA Roadmap

The owner's decisions, the phase plan and a run log. `BUILD_PROGRESS.md` holds the detailed engineering log; `CLAUDE.md` holds the rules every run follows.

## Owner decisions (Bink)
1. **Theory-first mode is on by default.** A lesson counts as complete without its Equation/Numeric stages. Those stages become optional "Bonus maths".
2. **Automated quote verification** (replaces the earlier "owner verifies 5 claims" decision, 2026-11-26).
   - `scripts/verify-quotes.ts` (in `npm run validate`) checks every research excerpt against its source text. NOT FOUND claims are fixed or dropped.
   - Each screen's Source sheet shows its excerpt and location.
   - Owner verification is optional, and only for field or statutory practice he knows.
3. **Phase 16 lesson order** follows the DGMS/NITR coverage map from Phase 15.
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
| 15 | Sources & coverage map | waiting on owner files in `sources/` |
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

### 15 — Sources & coverage map
The owner places these in `sources/`:
- DGMS First Class syllabus / CBT notification
- DGMS circulars compilation
- CMR 2017 and MMR 1961
- Mines Rescue Rules
- NIT Rourkela B.Tech Mining curriculum

Claude then maps every syllabus line to a lesson/screen or a gap and produces a ranked gap list.

### 16 — Deep theory (52 remaining theory stages)
- Follow the coverage-map order. Default order: U3 → U7 → U6 → U4 → U5 → U8 → U9 → U2 → U1.
- Convert 4–5 lessons per run through `.claude/skills/sourced-flow/SKILL.md`.
- Gap lessons are appended at the end of their units, so existing stage indexes are untouched.

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
| 2026-11-25 | Phase 14: trust, pacing, situations | shipped. All gates passed (validate, tsc, lint, base-path build, audit:svg 0 findings, 390×844 light/dark walk, Inspector byte-identical). Skipped: 11-unit label floor (→ 19), stricter situation word caps, compact wrong-answer strip, switch-track toggles, 44 px jumper pills (→ 19). Note: `sources/` is absent, so Phase 15 is waiting on the owner. |
