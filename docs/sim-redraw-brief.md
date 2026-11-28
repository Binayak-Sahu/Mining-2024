# Sim redraw brief (Phase 15.5-v3e, v3.2) — one sim per subagent

You redraw ONE sim to DESIGN.md §5.6 + §5.6c + §5.6d (v3.2 rules a–h; read them first, `grep -n "5.6" DESIGN.md`). Exemplars of the v3 code style: `u7-coward` in `src/content/sims/u7.tsx`; primitives in `src/components/sim/v3.tsx`, KaTeX labels `SvgTex` in `src/components/sim/Tex.tsx`. The stage chrome (card, grips, value pill, formula line) is `SimStage.tsx`; controls and readouts are shared (`SimControls.tsx`, `SimView.tsx`): you do not touch them.

## You may edit
- Only your sim's `SimDef` in `src/content/sims/<file>.tsx` (render, `v3: { viewH, formula? }` and the top-level `primary: ["keyA","keyB"]` field of the SimDef (NOT inside `v3`), handle `at` / `toValue` geometry, helper consts used only by your sim). Other sims in the same file belong to other agents working in parallel: never touch them, never reformat the file, never rename shared helpers other sims import.
- Nothing else. No tracker, no DESIGN.md, no CSS, no commits, no git commands, no `npm run build`.

## You must not change
- `compute`, params (key/label/min/max/step/unit/default/options), outputs (key/label/format/tone/digits), formulas, goals; lesson content (hotspots, stages, simParams); progress keys; the service worker.
- Handle `key` and `axis`. Handle `at` / `toValue` may move so a grip sits on the redrawn part, but must keep the same param mapping direction and range (the grip still spans min..max).
- Golden values: `npm run test:golden` must pass exactly. If it cannot, STOP and report `BLOCKED: golden` with the diff.

## Redraw rules (summary; DESIGN.md is the authority)
1. Frame `0 0 400 viewH`; default viewH 250 (16:10); taller only if the subject needs it. 24-unit inner padding: nothing (text, shapes, strokes) touches or crosses x<24, x>376, y<24, y>viewH−24, EXCEPT scene fills (rock bands, background context), which fill the stage edge-to-edge but are clipped to an inner radius-12 rect (`<clipPath>` with a unique id per sim; wrap in a `<g clipPath>`). Subject ≥ 60 % of stage width. Always draw context (host rock as a neutral band; labels for key parts: HW/FW, drawpoints, seam, etc.).
2. No title text inside the stage. Labels ≥ 18 units (14 px) via `T`, ≥ 8 px clearance from edges and fills; a label sits inside a band only if the band is ≥ 32 px (≈ 40 units) tall, else outside with a 1.5 px `INK3` leader line. Axis tick numbers count as labels (≥ 18 units).
3. Colour: the unit family (`U.light/mid/deep/ink`) + greys (`GREYS`) + at most ONE accent family (`hue(...)`). `OK/BAD/OK_LIGHT/BAD_LIGHT/BAD_PALE` ONLY on elements (or an ancestor `<g>`) with a `data-state="met|unmet|safe|unsafe"` attribute that reflects computed state. Main subject outline 2.5 px; everything else 1.5 px `INK3` or no outline.
4. No text in the stage equal to a readout value string (look at `outputs[].format` text); readout rows that merely echo the selected chip should not be in `v3.primary` (set the top-level `primary: [...]` listing the 2 most informative readouts).
5. Dots/particles: legend them or remove. Formulas in labels use `SvgTex` (inline KaTeX), not hand-typed maths.
6. Keep `v3.formula` if the sim had one. Keep every lesson hotspot (`npm run` preview draws the pins) landing on the feature its text names. Pin coordinates are lesson content and do not move: if you cannot keep a pin on its feature inside the 24 px inset, finish the redraw as best you can and report `unsure: <which pin>`.
7. Keep animations (`animated`, the `t` clock) as they were.
8. No raw `<input>`/`<button>`, no `<filter>`, no gradients except `HeatRamp` where temperature is the data, no `<pattern>`.

## Verify (in this order), all from the repo root
- `npm run test:golden` → 0 fail (readouts exact in min, default, objective-met).
- `AUDIT_SIM_V32=<id> npm run audit:sim -- <id>` → 0 findings (it checks grid/gradient/text/hue/golden plus v3.2: inset, data-state, controls, echo). Fix real findings; do not edit the audit.
- `npx tsc --noEmit` → clean for your file.
- `NODE_PATH=$(npm root -g) npx tsx --tsconfig scripts/tsconfig.json scripts/preview-sim.tsx <id> .audit/v3e/<id>-preview.png` renders every state (defaults, params min/max, lesson states) light+dark with grip hit rings (magenta) and lesson pins (blue). Read the PNG (the Read tool shows images) and review it against rules a–h: nothing cut, overlapping or touching the edge; labels legible; pins on their features; ≤ 1 accent; dark mode reads. Iterate until clean. `PV_CTX=defaults,min` limits states if the sheet is long.

## Report (final message, ≤ 12 lines)
First line exactly one of: `RESULT: done-v2` · `RESULT: unsure: <reason>` · `BLOCKED: <golden|shared control|other>: <detail>`. Then: golden result, audit result, what you changed in the grips, anything you could not verify.

## Parallel work in the same file
Other agents edit OTHER sims in the same file at the same time. Use small `Edit` calls scoped to your own sim's code; if an Edit fails with "file changed", re-Read the file and retry. Never rewrite the whole file or reformat. A `tsc` / audit / golden failure that names another sim is theirs: ignore it (re-run in a minute if it blocks you).

## Legacy (todo) sims
If your sim has no `v3` yet: add `v3: { viewH: 250 }` (or taller) and replace the legacy `render` with a v3.2 drawing in `0 0 400 viewH` (the legacy frame was `-24 -24 448 288`; its drawing lived in the 0..400 × 0..240 box). Use the v3 primitives, drop legacy defs (`url(#grad-*)`, `pat-*`, `f-shadow`, plate textures). Keep legacy handle keys/axes. Keep the same hotspots landing on the same features where the 24-unit inset allows (otherwise `unsure`). Look at redrawn sims in the same file for style.

## `primary` must list exactly 2 outputs
`npm run validate` fails otherwise (§5.9). If a sim has only one informative readout, list a second output key (a duplicate key such as `["deg","deg"]` selects both outputs that share it).
