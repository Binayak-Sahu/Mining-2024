# STRATA — DESIGN.md (v3)

**Changelog**
- **v3 (2026-11-28, Phase 15.5-v3a):** the Brilliant system. Colour per unit family (5 families), illustrations, thick visible ledges, minimal diagram language, KaTeX maths, no monospace in chrome. Merged from `DESIGN_v3.md`; v3 won every conflict. Bink approved 4 contrast fixes the same day (§2.2b). The 15.5f (v2.1) values are superseded (Appendix A). **Rollout:** 15.5-v3b moved the chrome to `:root` (font, neutrals, edges and 6 px ledges, buttons, cards, tiles, stat pills, course-tab style, tab bar, unit-family plumbing, KaTeX formulas, number typography). Home/Path layout (v3c), sims, illustrations and lesson content still follow the v2 layout.
- v2.1 (2026-11-27, Phase 15.5f): dark depth tokens, `--ledge`, stratum colours, the two-theme sim plate. Superseded by v3 (Appendix A).
- v2 (2026-11-26, Phase 15.5a–e): neutral canvas, ledged controls, feedback sheet, node path.

The design system for the whole app: every screen, every phase, every new feature. Any UI change follows this file; where it and older notes (PROJECT_CONTEXT.md §6.5) disagree, this file wins. To change the system, change this file first, then the code.

Reference: Brilliant (Android, dark and light, Nov 2026), measured from screenshots at 390 pt wide. We copy its **system**: sizes, ledges, colour logic, layout, diagram language. We never copy its **assets**: illustrations, Koji, fonts (CoFo Sans and Roobert are commercial), copy text or Rive files.

**New screens and features** (law track, Law Library, exam layout, anything later) are built from the components in §5. If something needed is missing, add it to §5 (tokens, states, spacing) before building it.

Stack facts: Next.js 15 static export, Tailwind v4 (`@theme inline` in `src/app/globals.css`), `framer-motion` 14 (do NOT add `motion`), `lucide-react` icons. Fonts and maths are bundled from npm (§3, §7b); nothing loads from a CDN.

---

## 1. Principles (read these before every change)

1. **The canvas is the page.** Lesson prose, questions and diagrams sit directly on the canvas. Cards are only for things you tap or that must read as one object (course cards, level card, answer tiles, sentence box, popovers, the sim stage).
2. **One idea per screen.** One heading or sentence, one visual, one primary button. Everything else is hidden behind a tap.
3. **Borders and ledges, not shadows.** Depth comes from a 2 px border and a thicker bottom edge (the "ledge"). No glows, no blur, no drop shadows on cards.
4. **Colour per course, plus colour for meaning (v3).** Each unit belongs to one hue family (§2.2). That hue fills the Start button, the "LEVEL n" eyebrow, the selected course tab, the node ring and a faint glow at the top of the page. Neutrals have zero hue. Right/wrong, done and progress keep `success`/`danger`; hearts and streak keep `energy`.
5. **Nothing jumps.** Feedback slides over a reserved space; content never reflows when a verdict appears.

### 1b. What makes Brilliant feel alive (and what v2 got wrong)
1. **Colour per course, not colour by meaning only.** v2 kept every surface grey, so the app looked flat.
2. **An illustration on every course card.** Chunky, flat, 3-tone isometric objects (§5.5). The illustration carries the life; the chrome stays quiet.
3. **Thick, visible ledges.** In dark mode the card border and ledge are *lighter* than the card face, so cards look like physical keys. v2's ledge (`#2E2E2E` on `#1C1C1C`) was nearly invisible.
4. **Diagrams are minimal.** Thin ink lines, small dots, flat fills, real maths typesetting and lots of air. No grid paper, textures or gradients.
5. **One typeface, no monospace in the chrome.** Numbers use tabular figures of the UI font.

---

## 2. Colour

Implement as CSS variables. Sandbox: `.ds3` / `.ds3[data-theme="dark"]` in `src/components/ds/v3/v3.css`. Production: `:root` / `:root.dark` in `src/app/globals.css` once v3 rolls out.

### 2.1 Neutrals

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#141414` | page canvas |
| `--surface` | `#FFFFFF` | `#1E1E1E` | card face |
| `--surface-2` | `#F4F4F4` | `#262626` | sheets, active tab pill, track, locked node |
| `--edge` | `#E3E3E3` | `#333333` | card/tile/pill border **and** ledge |
| `--edge-strong` | `#D0D0D0` | `#3D3D3D` | inputs, unselected chips |
| `--text` | `#141414` | `#F5F5F5` | primary |
| `--text-2` | `#5C5C5C` | `#A6A6A6` | secondary, locked lesson title |
| `--text-3` | `#6F6F6F` (v3 draft `#737373`, §2.2b) | `#8C8C8C` | eyebrows ("GR 8–9" style), captions |

Contrast (measured 2026-11-28): `--text-3` is ≥ 4.57:1 on `--bg`, `--surface` and `--surface-2` in light, and ≥ 4.50:1 in dark (`#8C8C8C` on `#262626` is 4.50, the tightest pair; do not darken `--surface-2` dark). `--edge`/`--edge-strong` are for borders only, never text.

The v2 neutral ramp (`--n-50 … --n-950`) and the Tailwind aliases stay as they are in production until rollout; v3 only renames `--line` → `--edge` and `--line-strong` → `--edge-strong`, and drops `--ledge` (the ledge is now `--edge`).

### 2.2 Unit hue families (Brilliant-style course colour)

Five families, each with these tones:
- `face` fills buttons.
- `ledge` is the button's bottom edge.
- `ink` (v3, §2.2b) is unit-hue **text and rings on the canvas**: the "LEVEL n" eyebrow, current-node ring, sim handle ring, selected-tab border and indicator bar, active page dot.
- `deep`/`mid`/`light` are the illustration and diagram tones.
- `glow` is the page-top atmosphere (dark only, fades to `--bg` over 280 px).

| Family | face | ledge | text on face | ink light / dark | deep | mid | light | glow (dark) | tab tint (dark / light) |
|---|---|---|---|---|---|---|---|---|---|
| `blue` | `#4568F5` | `#3451C9` | `#FFFFFF` | `#2E46C2` / `#6B87F7` | `#2E46C2` | `#4C6EF5` | `#AAB9FF` | `#0D1A45` | `#0E1636` / `#EEF1FF` |
| `yellow` | `#F6C22C` | `#C7960C` | `#3A2C00` | `#8E6A08` / `#F6C22C` | `#B88A0A` | `#F6C22C` | `#FCE38A` | `#2E2306` | `#2B2205` / `#FFF7DA` |
| `purple` | `#8E49FF` | `#7136D9` | `#FFFFFF` | `#6A3FD0` / `#A770FF` | `#6A3FD0` | `#9A5CFF` | `#CDB6FF` | `#231340` | `#1F1236` / `#F3EDFF` |
| `orange` | `#F28A2E` | `#C2621A` | `#2E1600` | `#AE5410` / `#F28A2E` | `#C25E12` | `#F28A2E` | `#FFC08A` | `#2E1708` | `#2A1508` / `#FFF1E6` |
| `teal` | `#1FB5A3` | `#13877A` | `#002B26` | `#0E7C6F` / `#1FB5A3` | `#0E7C6F` | `#1FB5A3` | `#8FE3D8` | `#06261F` | `#062521` / `#E6F8F5` |

Unit → family (default; change here, never in code; the sandbox mirrors it in `src/components/ds/v3/tokens.ts`):

| Unit | Family | Unit | Family |
|---|---|---|---|
| U0 Orientation | blue | U6 Underground methods | purple |
| U1 Geology | orange | U7 Ventilation | teal |
| U2 Development | purple | U8 Survey & machinery | blue |
| U3 Rock mechanics | blue | U9 Management | orange |
| U4 Blasting | yellow | U10 Law & rescue | teal |
| U5 Opencast | yellow | | |

### 2.2b Contrast fixes to the v3 draft (Bink, 2026-11-28)

The v3 draft failed the text 4.5:1 / icon-and-handle 3:1 rule in these places. Bink chose these fixes:

| Problem in the draft | Fix | Result |
|---|---|---|
| Unit `face` as text/ring on the light canvas: yellow 1.66, orange 2.49, teal 2.56, purple 3.93, blue 4.32. Dark: blue 4.26 on `#141414` | new `ink` tone per family (table above) | light ink ≥ 4.53 on `--bg`, `--surface-2` and the tab tint; dark ink ≥ 4.62 on `--bg`, `--surface`, `--surface-2`, glow and tab tint |
| White text on blue `#4C6EF5` (4.32) and purple `#9A5CFF` (3.93) | button faces darkened: blue `#4568F5`, purple `#8E49FF` (same hue) | 4.61 / 4.62 |
| White text on `success` `#22C55E` (2.28) and `danger` `#EF4444` (3.76) | text on both faces is `#141414` | 8.08 / 4.90 |
| Green progress fill on the light track (2.07) | light-mode progress fill `#15803D` (the success ledge); dark keeps `#22C55E` | 4.56 / 6.64 |
| `--text-3` light `#737373` on `--surface-2` (4.31) | `#6F6F6F` | 4.57 |

The illustration `mid` tones keep the draft values (they are never text).

### 2.3 State colours (unchanged meaning)

| Tone | Face | Ledge | Text on face | Tint bg (light / dark) | Tint text (light / dark) |
|---|---|---|---|---|---|
| `success` | `#22C55E` | `#15803D` | `#141414` | `#DCFCE7` / `#0F2E1A` | `#15803D` / `#4ADE80` |
| `danger` | `#EF4444` | `#B91C1C` | `#141414` | `#FEE2E2` / `#3A1215` | `#B91C1C` / `#F87171` |
| `energy` | `#F5B417` | `#B47F06` (dark `#9C6E05`) | `#2A1E00` | `#FEF6DC` / `#2E2508` | `#92600A` / `#F5C84A` |
| `ink` (neutral CTA) | light `#141414` / dark `#D4D4D4` | `#000000` / `#949494` | `#FFFFFF` / `#141414` | — | — |

- `success` and `danger` are only for right/wrong, done ticks and the progress fill (light `#15803D`, dark `#22C55E`, §2.2b). Never use them as a unit hue.
- `energy` amber is for streak and hearts only.
- Tints and tint text are unchanged from v2.
- Focus ring: 3 px of the current unit's `ink` at 60 % opacity, 3 px offset. Outside a unit, use blue `ink`.

### 2.4 Removed (v2/v2.1)

- The 11 stratum colours (replaced by the 5 families).
- The light "daylight lightbox" sim plate, the v2.1 two-theme plate and its `--plate-*` / `--mat-*` tokens, grid paper, dot-texture rock fills, gradient strata.
- The JetBrains Mono UI numbers.
- The underlined text links in app chrome.
- The v2 `action` blue as the one "selected" colour: selection now uses the unit `ink`.
- The dark 1 px card top highlight.
- Also removed in v2 and still banned: `.studio-bg`, card shadows, `surface-sticky` blur, navy neutrals.

---

## 3. Typography

**UI font:** chosen by a bake-off in `/design-system` among **Figtree**, **Onest** and the current Plus Jakarta Sans. All three are OFL, installed from `@fontsource-variable/*`, bundled and work offline. Pick the one closest to Brilliant at weight 700–800. No commercial fonts.
- **Winner: Figtree** (the v3a recommendation; applied app-wide in 15.5-v3b). It is one token, `--font-sans` in `globals.css`, so changing the pick is a one-line edit. Onest and Plus Jakarta Sans remain only for the sandbox bake-off.

**Maths:** KaTeX (MIT), bundled locally (`katex` npm package and its CSS/fonts, no CDN). All formulas (`σv = ρgH`, `tan α = tan δ · sin β`) render as typeset maths, never as monospace strings.

**Numbers:** `font-variant-numeric: tabular-nums` of the UI font. Monospace only inside code-like content (none today).

**Units:** a thin no-break space (U+202F) between a number and its unit (`85 °C`, `0 XP`, `−40 m`), and a real minus sign `−` (U+2212). (v2.1 used U+2009; v3 wins.)

Sentence case everywhere; uppercase only for eyebrows.

| Style | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| `hero` | 30 / 36 | 800 | −0.015em | Home unit title ("Solving Equations" size), centred |
| `display` | 28 / 34 | 800 | −0.01em | stage/sim titles, max 2 lines, then `title` |
| `title` | 24 / 30 | 700 | −0.005em | question prompt |
| `card-title` | 19 / 25 | 700 | 0 | course-list card title, node-list current lesson |
| `body` | 18 / 28 | 400 | 0 | lesson prose |
| `body-lg` | 20 / 32 | 500 | 0 | sentence-completion text, tile text (kept from v2) |
| `secondary` | 16 / 24 | 400 | 0 | under-titles, locked lesson title (`--text-2`, weight 500) |
| `eyebrow` | 14 / 18 (v3 draft 13 / 16, §3b) | 800 | 0.06em, caps | "LEVEL 1" (unit `ink`), "UNIT 4 · BLASTING" (`--text-3`) |
| `button` | 18 / 24 | 700 | 0 | buttons |
| `stat` | 20 / 24 | 800 | 0 | top stat pills |
| `label` | 14 / 20 | 600 | 0 | chips, readout labels (kept from v2) |
| `tab` | 13 / 16 | 600, active 800 | 0 | bottom tabs, course tabs |
| `readout` | 17 / 24 | 700 tabular | 0 | live sim values (UI font, not mono) |

**Minimum on-screen text:** 14 px. The only exception is `tab` at 13 px. SVG text in sims follows §5.6 (≥ 14 px as rendered at 390 px wide).

**Long titles:** a sim or lesson title that would wrap past 2 lines at 390 px uses `title`, not `display`.

### 3b. Change to the v3 draft
The draft eyebrow was 13 / 16, but the draft's own Never List bans text under 14 px except tabs. The eyebrow stays at **14 / 18**, as v2 raised it in 15.5b.

---

## 4. Shape, spacing, depth

- 4 px grid; steps 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Screen side padding 24 px. Max content width 640 px, centred.
- **Card:** radius 28, border 2 px `--edge`, **bottom ledge 6 px `--edge`** (`border-bottom-width: 6px`), padding 24. No shadow, no inner highlight.
- **Tile / course tab:** radius 18, border 2 px `--edge`, ledge 4 px.
- **Pill (stat, chip):** radius 9999, border 2 px `--edge`, height 48.
- **Button:** pill, height 56, face = unit `face` (or `success`, or `ink` for neutral), `box-shadow: 0 5px 0 <ledge>`. Press: `translateY(5px)`, shadow 0, `tactilePress`.
- **Pressable cards** press the same way: translateY(4px) and ledge 6→2 px (the outer box keeps its height, so nothing below moves).
- **Spine:** 4 px `--edge` vertical line centred between stacked course cards, 24 px gap.
- **Page glow (dark only):** `linear-gradient(to bottom, <glow> 0, var(--bg) 280px)` behind the top of Path and unit pages, in the current unit's family.
- Vertical rhythm (kept from v2): top bar → first heading 32; heading → visual 32; visual → next text 32; paragraph gap 16.
- Footer padding: 16 px sides, 12 px top, 16 px + `env(safe-area-inset-bottom)` bottom.
- Touch targets ≥ 44×44 px on coarse pointers.

---

## 5. Components

### 5.1 Buttons (`.btn-3d`, keep the class, restyle)
- Size and press: §4. Full width in the footer.
- Tone map:

| Tone | Face | Use |
|---|---|---|
| `unit` | current unit `face` | primary actions on Home/Path/unit screens; inside a lesson, "Check" when an answer is ready |
| `success` | `success` | "Continue" after correct |
| `ink` | `ink` | read-only "Continue", "Try again" |
| `ghost` | `--surface`, 2 px `--edge-strong` border, ledge `--edge-strong`, text `--text` | secondary actions ("Why?", "Hint") |

- `tone-tech` maps to `unit`. `tone-safe` maps to `success`, `tone-crit` to `danger`, `tone-hazard` to `energy`.
- Disabled: face `--surface-2`, ledge none, text `--text-3`.
- Which tone when:

| State | Button |
|---|---|
| Read-only screen | `ink` "Continue" |
| Answer pending | disabled "Check" |
| Answer ready | `unit` "Check" |
| After correct | `success` "Continue" |
| After wrong | `danger`-tint sheet with `ink` "Try again" (clears the pick; the miss still goes to Warmup review) |
| Start a lesson or level | `unit` "Start" |

- One filled button per screen. Secondary actions are `ghost` pills.

### 5.1b Top stat bar (v3)
- Height 56, no border.
- Left: the streak pill (number + flame icon in `energy`). Right: the XP pill and the hearts pill. Each is a 48 px pill (§4).
- Icons are lucide, 24 px, filled where Brilliant's are solid.
- Keep the existing key/flag/sound/avatar controls. All but sound move into the avatar menu.

### 5.2 Home: "current unit" screen (v3, Brilliant Home)
Top to bottom:
1. The stat bar.
2. Unit title (`hero`, centred, 32 px below the bar).
3. `LEVEL n` eyebrow in the unit `ink`, centred, 24 px below. In STRATA a level is a group of 4–6 lessons inside a unit.
4. A unit illustration carousel:
   - a 200×200 illustration, with neighbours peeking at ±70 % off-screen;
   - 5 page dots (8 px, active = unit `ink`);
   - swipe between units.
5. A level card (§4 card) with node rows for the next 2 lessons:
   - each row has a 64 px pedestal node (white disc on a grey ring; current: 4 px unit `ink` ring);
   - the title is `card-title` when current, `secondary` when locked;
   - a 32 px grey status dot sits on the right.
6. The full-width Start button in the unit `face`.

**No mascot.** The current node shows the unit icon on its pedestal instead of Koji.

### 5.3 Path: course list (v3, Brilliant Courses)
- **Unit tabs:** a horizontal scroller of 140×96 tiles (§4 tile), each with a 56 px illustration and a `tab` label under it. Selected: 3 px border in the unit `ink`, background = tab tint, and a 4×56 px indicator bar under the label in the unit `ink`.
- **Header:**
  - the selected unit's page glow;
  - an eyebrow (`--text-3`, e.g. "DGMS 1ST CLASS · PAPER B");
  - the unit title (`hero`, left-aligned) and a one-line subtitle (`secondary`);
  - the unit illustration, 120 px, on the right.
- **Lesson cards** (§4 card), joined by the spine:
  - a 96 px illustration on the left;
  - an eyebrow ("LESSON 4.2 · ~6 MIN") and a `card-title`;
  - a 6 px progress bar (`success` progress fill, §2.3) when started.

### 5.4 Answer tiles and word-bank chips (`.tile-3d`)
- **Face:** `--surface`, §4 tile shape, padding 12×20.
- **Text:** `body-lg` 600, in `--text`.
- **Selected:** border and ledge in the unit `ink`, background = tab tint.
- **After check:** correct uses `success` face border and ledge on the `success` tint; wrong uses the `danger` equivalents.
- **Word bank:** a `--surface-2` well, radius 28, padding 24. Chips wrap with 16 px gaps, centred.
- **Blank slot** inside a sentence: 2 px dashed `--text-3`, radius 8, min 96×44, inline with the text baseline.

### 5.5 Illustrations (v3; replaces "unit icons")
Every unit, and later every lesson, has an SVG illustration in **one** style:
- Flat isometric-ish (30°), 2–3 objects at most, chunky shapes, corner radius ≥ 6.
- **Three tones per hue:** light = top face, mid = front, deep = side/shadow. The light comes from the top-left.
- One main hue (the unit's family) plus **one** accent hue from another family (Brilliant pairs blue with yellow). Greys `#5E5E5E / #9A9A9A / #D9D9D9` for metal and rock.
- No outlines, no gradients, no text, no faces or people.
- Size: `viewBox 0 0 160 160`, transparent background, reads well at 56 px.
- The same art in both themes.
- Draft subjects:

| Unit | Subject | Unit | Subject |
|---|---|---|---|
| U0 | hard hat + lamp | U6 | longwall shearer drum on a chock |
| U1 | layered rock block with fossil/coal seam | U7 | axial fan with airflow arrows |
| U2 | headframe over a shaft | U8 | total station on a tripod |
| U3 | roof bolts in a rock block | U9 | bar chart on a clipboard |
| U4 | cartridge + detonator | U10 | rescue breathing apparatus + statute book |
| U5 | dragline bucket over a bench | | |

- Claude Code draws a first set to this spec; Bink refines them in Figma. Files live in `src/assets/illustrations/`. Each illustration is a `.tsx` component plus an exported `.svg` for Figma, made by `scripts/export-illustrations.tsx`.
- Drafts so far: U4, U7 (15.5-v3a).
- **Placeholder until a unit has its illustration** (Bink, 2026-11-28: the raw lucide icons looked uneven and their fills broke):
  - it takes the same footprint as a drawn illustration, a rounded tile 72 % of the box in the family `light` tone with a `mid` bottom edge;
  - the unit's lucide icon (`src/content/unitIcons.ts`) sits on it at 40 % of the box, in `deep`, outline only (never filled);
  - the stroke scales with the size, so every unit looks the same weight at 56, 96, 120 and 200 px.
- **Lesson cards until lessons have art:** a 96 px tile with the lesson number ("7.1") in the unit `ink` on the tab tint. The card eyebrow then drops the repeated "LESSON n.m" and shows "6 STAGES". Never repeat the unit illustration on every lesson card.
- **Home carousel:** one strip of every unit's art, moved as a whole. The slot pitch is half the screen width + 40 px, so the centre art is 200 px and each neighbour shows 60 px at the edge. Drag moves the strip with the finger; release snaps one unit with `stageSlide`.

### 5.6 Sim stage (v3, rewritten)
The Brilliant diagram language:
- **Stage:** a §4 card (`--surface`, 2 px edge, 6 px ledge). No separate plate, no grid paper, no textures. Inner padding 12 (v3 draft: the card's 24, see §5.6b). When the objective is met, the border and ledge turn `success` face.
- **Ink:** main lines are 2.5 px `--text` with round caps and joins. Secondary lines are 1.5 px `--text-3`. Axes are thin with small arrowheads.
- **Fills:** the unit family's `light`/`mid`/`deep` plus the three neutral greys.
  - At most **two hue families** per sim, plus `success`/`danger` for state.
  - Rock layers are flat bands of greys and the unit tones.
  - A heat ramp is allowed only when temperature *is* the data.
  - In dark mode, fills keep their light-theme values: flat tones read on `#1E1E1E`, and labels sit outside shapes.
- **Handles:**
  - a 28 px disc with a `--surface` face, a 3 px unit-`ink` ring and a 3 px ledge;
  - the hit area is ≥ 44 px;
  - dragging grows the disc to 32 px (`tactilePress`);
  - while dragging, a value pill (`--text` face, `--bg` text, UI font tabular) shows the parameter.
- **Points:** 8 px dots in `--text`. Highlights get a unit-`ink` ring.
- **Labels:** UI font, ≥ 14 px rendered at 390 px wide, placed outside shapes where possible, `--text-2`.
  - Maths labels use KaTeX (inside `<foreignObject>`).
  - No monospace, and no text below 14 px.
  - Text and lines that must sit on a fill use a fixed `#141414` on `light` tones and `#FFFFFF` on `deep` tones in both themes (≥ 4.5:1). Where a label would hang off a fill, put it inside the fill or use a legend under the diagram in `--text-2`.
- **Objective line** above the stage: lucide `Target` 18 px + `label` text, `success` tint text when met.
- **Readouts** below the stage: plain rows (label `label` `--text-2` left, value `readout` right, 12 px row gap, 1 px `--edge` divider).
  - Show 2 readouts; the rest sit under a ghost "All readouts (n)" disclosure.
  - Which 2: the sim's optional `primary` list, otherwise the first 2.
  - Remove duplicate value chips under the stage when the same value is already in the readouts.
- **Formula:** the stage's formula renders under the stage in KaTeX, `body` size, centred.
- **Codex thumbnails** render the sim with labels hidden (`data-thumb`), never shrunk.

### 5.6b Changes to the v3 draft
- **Stage padding 12, not 24.** At 390 px wide the stage is 342 px. 24 px padding would leave 290 px for the diagram, and 14 px labels would then need 19 viewBox units in a 400-wide sim. 12 px leaves 314 px.
- **viewBox per sim.** Redrawn sims may use their own viewBox (the pilots use 400 wide and 260–300 tall) instead of the fixed 400×240. The production `SimDef.render` contract changes only when a sim is converted.

### 5.7 Lesson top bar (kept from v2)
- **Bar:** height 56, bg `--bg`, no border, no blur.
- **Left:** `X` (lucide, 24 px, 44 px target, `--text-2`).
- **Centre:** one progress bar.
  - 10 px tall, pill, track `--surface-2`, `success` progress fill (§2.3), width animated with `stageSlide`.
  - It reads as one bar, with 2 px notches (gaps in `--bg`) at stage boundaries.
  - Tapping a finished section re-opens that stage's recap; each finished section gets a ≥ 44 px tall invisible hit area.
- **Right:** hearts as one pill: lucide `Heart` filled `danger` face 20 px + count `label` 700.
- **⋯ menu:** Notes, Inspector and Sources live in a `MoreHorizontal` button left of the hearts pill, opening the existing sheets. The Notes badge is an 8 px unit-`ink` dot on the ⋯ icon.
- **Inspector mode** keeps its banner: an `energy`-tint strip under the top bar, `label` text.

### 5.8 Sheets, popovers, feedback (kept from v2)
- **Sheets and popovers:**
  - face `--surface-2`, 2 px `--edge` border;
  - radius 28 top on sheets, 28 on popovers;
  - the only elements allowed a shadow: `0 -8px 24px rgba(0,0,0,0.25)` dark / `0 -8px 24px rgba(0,0,0,0.08)` light.
- **Feedback sheet:** it rises from the bottom over the footer area.
  - Full width, radius 28 top, padding 20/24, background `success` tint or `danger` tint.
  - Row 1: the verdict (`title` 800 in tint text) on the left; a ghost "Why?" pill on the right.
  - Row 2: a full-width button (`success` "Continue" / `ink` "Try again").
- **No layout shift:** the scroll area always reserves bottom padding equal to the tallest footer state (footer + sheet), measured once.

### 5.9 Path nodes (kept from v2 for the unit map; colours from v3)
- **Node:** a 72 px circle face with a 10 px rim below it (the ledge).
- **States:**

| State | Face and rim | Icon |
|---|---|---|
| Done | `success` face, `success` ledge | lucide `Check` 28 px in `#141414` |
| Current | unit `face`, unit `ledge` | lucide `Play` 26 px in the unit text-on |

  - Current also gets a 3 px unit-`ink` ring 8 px outside, pulsing scale 1 → 1.08 (2 s, off under reduced motion).
  - Locked → face `--surface-2`, rim `--edge-strong`, lucide `Lock` 22 px `--text-3`.
- **Special nodes:**
  - Boss: `energy` face and ledge, lucide `Crown`.
  - Perfect lesson: an `energy` star badge.
  - Inspector master node: locked-style, with a "Master" pill in the unit tab tint.
- **Popover:** tap a node to open a popover card (§5.8) with the lesson title and the unit "Start" (or ghost "Review").
- The Home level card uses the v3 pedestal rows (§5.2) instead.

### 5.10 Bottom tab bar
- Height 64 + safe area, bg `--bg`, top border 1 px `--edge`, no blur.
- Six tabs stay (Path, Warmup, Exam, Lab, Tools, Codex).
- Each tab: a lucide outline icon (24 px) over its `tab` label.
- Active: the icon sits in a 64×40 `--surface-2` pill (v2 56×32), with icon and label in `--text`, label 800.
- Inactive: `--text-3`.

### 5.11 Stage-kind label (kept from v2)
- Stage types are not colour-coded.
- Each shows an `eyebrow` in `--text-3` with a 16 px lucide icon before it.
- Icons: Field theory `BookOpen`, Intuition lab `FlaskConical`, Equation forge `Sigma`, Workbench `Wrench`, Crisis `Siren`, Boss `Crown`.

### 5.12 Instrument panels follow the theme (kept from v2)
- Tools calculators, the sim telemetry strip and the Exam hero use `--surface`, card border and `readout` type.

### 5.13 Backup & restore (v3)
These live in the avatar menu as "Backup & restore" rows (Export, Restore, Repair app). Never put them as a link in a screen.

### 5.14 Course / unit header (v2 §5.10, re-coloured)
- Unit pages use the §5.3 header (glow, eyebrow, `hero`, subtitle, illustration).
- The lesson and question counts stay computed from content by the one `src/lib` helper: lucide `BookOpen` + "N lessons", lucide `CircleHelp` + "N questions".

---

## 6. Motion (framer-motion 14)

Put these in `src/lib/motion.ts` and import them; never inline spring numbers.

```ts
export const tactilePress  = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const; // tiles, chips, nodes, handles
export const stageSlide    = { type: "spring", stiffness: 300, damping: 32, mass: 1 } as const;   // screen-to-screen, progress bar
export const feedbackSheet = { type: "spring", stiffness: 400, damping: 36, mass: 0.9 } as const; // verdict sheet, popovers
export const fadeQuick     = { duration: 0.16, ease: "easeOut" } as const;                         // reduced-motion fallback
```

- **Screen change:** the outgoing screen moves x 0 → −24 and fades out. The incoming one moves x 24 → 0 and fades in, with `stageSlide`.
- **Feedback sheet:** y 100 % → 0 with `feedbackSheet`. A correct answer also scales the verdict word 0.9 → 1.
- **Word chip to blank:** a shared `layoutId` fly with `tactilePress`.
- **Carousel:** swiping between units uses `stageSlide`.
- **Reduced motion:** `MotionConfig reducedMotion="user"` already exists. Under it, every transition becomes `fadeQuick`, the node pulse stops and confetti stays off.

---

## 7. Viewports and checks

- Phone 390×844 (primary), desktop 1440×900 (content stays in the 640 px column).
- Every screen is checked in light and dark:
  - 0 console errors;
  - no horizontal overflow;
  - the primary button fully visible without scrolling on lesson screens;
  - all text ≥ 4.5:1;
  - icons, handles, rings and the progress fill ≥ 3:1 against what they sit on.

---

## 7b. Approved UI dependencies

Approved by Bink (installed in package.json). Nothing else may be added without his approval (CLAUDE.md).

| Package | Approved | Use it for | Rules |
|---|---|---|---|
| `@radix-ui/react-popover` | 2026-11-26 | path-node start card and any small anchored card | Style only with §5 tokens. Keep focus handling, Escape-to-close and 16 px collision padding. |
| `@rive-app/react-canvas` | 2026-11-26 | original interactive animations | **Offline rule:** self-host `rive.wasm` (copy it into `public/`, `RuntimeLoader.setWasmUrl()` with the basePath-aware URL). Load it only on screens with a `.riv` (dynamic import). Every animation needs a static fallback and stops under reduced motion. Original art only. |
| `@fontsource-variable/figtree`, `@fontsource-variable/onest` | 2026-11-28 | the §3 font bake-off | Bundled. The loser(s) are removed when the winner rolls out. |
| `katex` | 2026-11-28 | §3 maths | Import `katex/dist/katex.min.css` (fonts bundled by the build; no CDN). Render with `katex.renderToString(…, { throwOnError: false, output: "htmlAndMathml" })` so screen readers get MathML. |

Already in the app and still approved: `framer-motion`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`, `vaul`, `sonner`, `lucide-react`, `canvas-confetti`, `@fontsource-variable/plus-jakarta-sans`. `@fontsource-variable/jetbrains-mono` is retired by v3 (no monospace in chrome) and is removed at rollout.

## 8. Never List

- **Brilliant assets.** Never copy any Brilliant illustration, Koji, icon, course art, wordmark, font file, Rive file or UI copy. STRATA uses its own illustrations (§5.5) and lucide.
- **Colour.**
  - No grey-only screens: every Path/Home screen shows its unit hue in at least the eyebrow, the button and the glow.
  - No hue-tinted neutrals.
  - No gradients on surfaces, except the dark page glow (§4).
  - No glows, card drop shadows, glassmorphism or backdrop blur.
- **Type.** No monospace in chrome. No text below 14 px (tabs 13).
- **Chrome.** No text links in app chrome (top bar, tab bar, menus, heroes, cards): actions are buttons or menu rows. Inline links belong only inside lesson prose and Sources.
- **Sims and illustrations.**
  - No grid paper, dot textures or decorative gradients inside sims.
  - No more than two hue families in one sim or one illustration.
- **Screens.** Never put lesson prose inside a card, centre a paragraph longer than 2 lines, or show more than one filled button per screen.
- **Icons.** No emoji as icons.
- **Layout.** Never let a verdict, hint or toast push content up or down.
- **Tokens.** Never inline spring numbers or invent new colours: add a token here first.
- **Protected areas.** Never change sim geometry, hotspot x/y, stage order/count, store names/versions, sync schema, `public/sw.js` logic or basePath handling for design reasons (see `CLAUDE.md` "Do not touch").

---

## Appendix A. Superseded values (v2.1, Phase 15.5f)

**Superseded by v3 (2026-11-28); kept only so old commits make sense.** These were live only in the sandbox (`.ds21`); production never used them. Do not build with them.

| v2.1 value | Replaced by |
|---|---|
| Dark `--surface` `#1E1E1E`, `--surface-2` `#282828`, `--line` `#333333` | v3 §2.1 (`--surface-2` `#262626`, `--edge` `#333333`) |
| `--ledge` `#D4D4D4` / `#3A3A3A`, card ledge 5 px | `--edge` as border and ledge, card ledge 6 px (§4) |
| Dark 1 px card top highlight | removed (§2.4) |
| Pressable card `translateY(3px)`, ledge 5 → 2 | `translateY(4px)`, ledge 6 → 2 (§4) |
| §2.3b sim plate `--plate-*` / `--mat-*` (+ dark-material lightness floor, `--mat-ink`, outlines) | §5.6 stage card, unit tones and greys |
| §2.4 stratum colours `--stratum-0…10`, stratum tint tiles, eyebrow dot, header band | §2.2 unit families, glow, tab tint |
| Number–unit thin space U+2009 | U+202F (§3) |
| SVG text ≥ 12 px rendered | ≥ 14 px rendered (§5.6) |
