# STRATA — Interactive B.Tech Mining & DGMS Field Mastery

A gamified, simulation-first study platform for Indian mining engineers: deep first-principles theory plus DGMS statutory field practice, taught through a five-stage mastery loop instead of walls of text.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (live reload)
npm run build      # static export to out/ + offline precache manifest
npm start          # serve out/ locally (http://localhost:3000)
npm run validate   # proves every lesson, exam question, calculator and statute is well-formed
npm run typecheck && npm run lint
```

### Deploy (GitHub Pages)
`.github/workflows/deploy.yml` builds with `NEXT_PUBLIC_BASE_PATH=/<repo-name>` and publishes `out/` on every push to `main`.
One-time setup: **repo Settings → Pages → Build and deployment → Source: GitHub Actions**. The site is then served at `https://<user>.github.io/<repo-name>/`.

### Install on a phone (offline PWA)
Open the site, then *Add to Home Screen* (iOS Safari) or *Install app* (Android Chrome). The service worker precaches the whole app (~3 MB), so lessons, simulations, the exam simulator and calculators all work offline. Use **Profile → Export / Import progress** (or the ⇄ icon in the header) to move progress between PC and phone.

Progress (XP, streak, hearts, Field Codex, spaced-repetition queue) is stored in the browser's `localStorage`.

## What's inside

| | |
|---|---|
| Units | Orientation + 10 curriculum units, each with a Unit Boss Exam |
| Lessons | 55 lessons, 379 interactive stages |
| Simulations | 61 live SVG physics/engineering simulators (free-play in the Sim Lab) |
| DGMS Exam Simulator | 374-question bank, timed 25-question papers, derivations, weak-unit analytics |
| Field Calculators | Atkinson, pillar FoS, Kuz-Ram, PPV, BESR, dip & strike, pump/NPSH |
| Statute register | 19 rules with citations and verification status |
| Field Codex | 55 Swiss-style cheat sheets + verified formulas, searchable |

### The five-stage loop (every lesson)
1. **Field Theory** — 2–3 sentences, an interactive hotspot schematic, causal-chain animation and "first principles" drawers. Completing it files a cheat sheet to the Codex.
2. **Intuition Lab / Predict** — move sliders on a live simulation to hit an objective; commit to a prediction before the sim reveals the outcome.
3. **Equation Forge** — physical proportionality first, then tap-to-assemble the governing equation.
4. **Quantitative Workbench** — multi-step numericals with a built-in scratch calculator (givens and previous results as variables).
5. **Shift Crisis / Statutory Swipe** — timed emergencies needing root-cause diagnosis and the correct DGMS statutory action; rapid true/false statutory drills.

### Gamification
XP and ranks (Trainee → Overman → Assistant Manager → Second Class Manager → First Class Unrestricted Manager), daily streak, 3 safety hearts per lesson, a Leitner spaced-repetition warmup fed by missed concepts, and an optional free-roam mode for exam revision.

## Curriculum
0. Orientation (σv = ρgH through all five stages)
1. Mining Geology, Exploration & Deposit Modelling
2. Mine Development: Access, Shaft Sinking & Drivage
3. Rock Mechanics & Ground Control
4. Drilling, Blasting & Rock Fragmentation
5. Opencast Mining & HEMM Engineering
6. Underground Coal & Metalliferous Mining Methods
7. Mine Ventilation, Thermodynamics & Subsurface Hazards
8. Mine Surveying, Mineral Processing & Mine Electricals
9. Mine Economics, Planning & Digital Mining
10. Indian Mining Legislation, Safety Management & Rescue

## Disclaimer
STRATA is a study aid. Statutory figures reflect commonly examined provisions of the Mines Act 1952, Mines Rules 1955, CMR 2017, MMR 1961, Mines Rescue Rules 1985, CEA safety regulations and DGMS circulars, and the transition to the OSH&WC Code 2020. Several simulations use simplified, clearly labelled teaching models. Always verify against the current gazette text, DGMS circulars and your mine's approved Safety Management Plan before acting in the field.

See `BUILD_PROGRESS.md` for architecture and the content-authoring contract.
