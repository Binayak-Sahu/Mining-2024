# STRATA Roadmap

The owner's decisions, the phase plan and a run log. `BUILD_PROGRESS.md` holds the detailed engineering log; `CLAUDE.md` holds the rules every run follows.

## Owner decisions (Bink)
1. **Theory-first mode is on by default.** A lesson counts as complete without its Equation/Numeric stages. Those stages become optional "Bonus maths".
2. **Owner verification.** The owner personally verifies 5 claims per sourced lesson. Verified claims are marked "Verified by Bink" in that lesson's `research/<id>.md`.
3. **Phase 16 lesson order** follows the DGMS/NITR coverage map from Phase 15.
4. **Code Underground law books** use STRATA's map language, but every stop must be highly interactive and animated, not static cards.
5. **The Management book** is re-sourced through the sourced-flow pipeline.
6. **After the merge, Unit 10 becomes an overview** that links into the law books.
7. **Every concept flow includes role-based situation screens.** Roles vary across a unit. The correct option must not be predictable by position or length.

## Statute gate: pending
_(none. Proposed statutory changes are listed here as old → new, source, location, and are applied only after owner approval.)_

## Phases

| # | Phase | Status |
|---|---|---|
| 1–13 | Platform, content, design system, ConceptFlow, first 3 sourced flows | done (see BUILD_PROGRESS.md) |
| 14 | Trust, pacing & situations | **this run** (see run log) |
| 15 | Sources & coverage map | waiting on owner files in `sources/` |
| 16 | Deep theory for the 52 remaining theory stages | planned |
| 17 | Code Underground merge | planned |
| 18 | Exam realism | planned |
| 19 | Real-phone polish | planned |
| 20 | Maintenance | planned |

### 14 — Trust, pacing & situations
- 14.0 CLAUDE.md, ROADMAP, reviewer agents, sourced-flow skill.
- 14.1 Answer shuffling for predict and crisis stages (deterministic seed), a slot-balance validator rule, and per-screen Warmup review for ConceptFlow misses.
- 14.2 Situation screens (role badge, scene, speech-bubble claim) with validator rules; one situation each in u7-l1, u0-l1 and u10-l3.
- 14.3 Theory-first mode (Bonus maths) and lesson resume.
- 14.4 Phone-testing kit (Report button, FPS meter, build version, Sound test in production), `navigator.storage.persist()` and a weekly backup nudge.
- 14.5 (optional) Deferred sim fixes: label font floor, two-line readouts, O₂ coupled to CH₄ in the Coward nudge, elimination → near-zero residual in `u10-risk`, u0 predict rule-of-thumb hidden until reveal.

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
| 2026-11-25 | Phase 14: trust, pacing, situations | in progress |
