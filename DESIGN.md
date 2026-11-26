# STRATA — DESIGN.md

The design system for the whole app: every screen, every phase, every new feature. Any UI change follows this file; where it and older notes (PROJECT_CONTEXT.md §6.5) disagree, this file wins. To change the system, change this file first, then the code.

Reference: Brilliant (iOS/Android, Nov 2026). We take its **system** (calm neutral canvas, one idea per screen, chunky ledged controls, bottom feedback sheet, node path). We never take its **assets** (see Never List).

**New screens and features** (law track, Law Library, exam layout, anything later) are built from the components in §5. If something needed is missing, add it to §5 (tokens, states, spacing) before building it.

Stack facts this file assumes: Next.js 15 static export, Tailwind v4 (`@theme inline` in `src/app/globals.css`), `framer-motion` 14 (already installed — do NOT add `motion`), `lucide-react` icons, Plus Jakarta Sans + JetBrains Mono (already installed). No new dependencies.

---

## 1. Principles (read these before every change)

1. **The canvas is the page.** Lesson prose, questions and diagrams sit directly on the canvas. Cards are only for things you tap or that must read as one object (course cards, level header, answer tiles, sentence box, popovers).
2. **One idea per screen.** One heading or sentence, one visual, one primary button. Everything else is hidden behind a tap.
3. **Borders and ledges, not shadows.** Depth comes from a 2 px border and a thicker bottom edge (the "ledge"). No glows, no blur, no drop shadows on cards.
4. **Neutral grey, not navy.** Neutrals have zero hue. Colour is reserved for meaning: blue = action/selected, green = progress/correct, red = wrong/danger, amber = hearts/energy.
5. **Nothing jumps.** Feedback slides over a reserved space; content never reflows when a verdict appears.

---

## 2. Colour tokens

Implement as CSS variables in `src/app/globals.css`. Existing Tailwind names (`slate-*`, `emerald-*`, …) keep working because they resolve to these variables. (Rollout note: during Phase 15.5 these values live under a `.ds2` class until the switch-over; after that they are the app's only palette.)

### 2.1 Neutrals

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | page canvas | `#FFFFFF` | `#121212` |
| `--surface` | card face | `#FFFFFF` | `#1C1C1C` |
| `--surface-2` | sheets, popovers, track | `#F5F5F5` | `#242424` |
| `--line` | card border, ledge, dividers | `#E5E5E5` | `#2E2E2E` |
| `--line-strong` | tile border, inputs | `#D4D4D4` | `#3A3A3A` |
| `--text` (`--n-900`) | primary text | `#141414` | `#F5F5F5` |
| `--text-2` (`--n-500`) | secondary text | `#5C5C5C` | `#A3A3A3` |
| `--text-3` (`--n-400`) | eyebrows, captions, locked labels | `#6B6B6B` | `#949494` |

Neutral ramp remap (`--n-50 … --n-950`):

| | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Light | `#FAFAFA` | `#F5F5F5` | `#E5E5E5` | `#D4D4D4` | `#6B6B6B` | `#5C5C5C` | `#525252` | `#404040` | `#262626` | `#141414` | `#0A0A0A` |
| Dark | `#1C1C1C` | `#242424` | `#2E2E2E` | `#3A3A3A` | `#949494` | `#A3A3A3` | `#BDBDBD` | `#D4D4D4` | `#E5E5E5` | `#F5F5F5` | `#FFFFFF` |

Contrast check (WCAG, verified 2026-11-26): `--text-3` is ≥ 4.8:1 on `--bg`, `--surface` and `--surface-2` in both themes, so it may carry small text. Every accent face carries its text-on colour at ≥ 4.8:1. `--line`/`--line-strong` are for borders only, never text.

### 2.2 Accents (face / ledge / text-on / tint)

| Tone | Light face · ledge | Dark face · ledge | Text on face | Tint bg (light / dark) | Tint text (light / dark) |
|---|---|---|---|---|---|
| `action` (blue) | `#3B5BF6` · `#2A43C2` | `#3B5BF6` · `#2A43C2` | `#FFFFFF` | `#EEF1FF` / `#1A2040` | `#2A43C2` / `#9DAEFF` |
| `success` (green) | `#15803D` · `#0F5E2C` | `#15803D` · `#0F5E2C` | `#FFFFFF` | `#DCFCE7` / `#0F2E1A` | `#15803D` / `#4ADE80` |
| `danger` (red) | `#DC2626` · `#991B1B` | `#DC2626` · `#8F1D1D` | `#FFFFFF` | `#FEE2E2` / `#3A1215` | `#B91C1C` / `#F87171` |
| `energy` (amber) | `#F5B417` · `#B47F06` | `#F5B417` · `#9C6E05` | `#2A1E00` | `#FEF6DC` / `#2E2508` | `#92600A` / `#F5C84A` |
| `ink` (neutral CTA) | `#141414` · `#000000` | `#D4D4D4` · `#949494` | light `#FFFFFF` / dark `#141414` | — | — |

Progress fill (bars, done nodes): `success` face. Selected ring/border: `action` face. Focus ring: 3 px `action` face at 60 % opacity, 3 px offset.

### 2.3 Removed

`.studio-bg` dot lattice and radial glow, all `--shadow-card` layers, `surface-sticky` blur, navy neutrals (`#0B0F19`, `#121826`, `#161D2D`), the Tailwind `slate` blue cast.

**Exception, the sim plate:** `.plate` stays a light "daylight lightbox" in both themes (61 sims are drawn for it; a dark plate would be its own future phase). In dark mode give it a 2 px `--line` border and radius 16, and no outer shadow. Plate-met: 2 px `success` inner ring, no glow.

---

## 3. Typography

Font: Plus Jakarta Sans Variable (UI), JetBrains Mono Variable (numbers in readouts only). Sentence case everywhere; uppercase only for eyebrows.

| Style | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 32 / 38 | 800 | -0.01em | course/unit title, stage title ("Finding half" style) |
| `title` | 26 / 32 | 700 | -0.005em | screen prompt ("Complete the sentence.") |
| `heading` | 21 / 28 | 700 | 0 | card titles, popover titles |
| `body` | 18 / 29 (1.6) | 400 | 0 | lesson prose, questions (replaces `.flow-body` 17 and `.flow-q` 19) |
| `body-lg` | 20 / 32 | 500 | 0 | sentence-completion text, tile text |
| `secondary` | 16 / 24 | 400 | 0 | descriptions, under-titles (`--text-2`) |
| `eyebrow` | 13 / 16 | 700 | 0.08em, uppercase | "UNIT 7 · VENTILATION", "LEVEL 1" (`--text-3`, or `action` tint text for LEVEL) |
| `button` | 18 / 24 | 700 | 0 | all primary/secondary buttons |
| `label` | 14 / 20 | 600 | 0 | chips, pills, readout labels |
| `tab` | 12 / 16 | 600 (active 700) | 0 | bottom tab labels |
| `readout` | 17 / 24 | 600 mono | 0 | live numbers, always `tabular-nums` |

Minimum on-screen text: 14 px (tab labels 12 px are the only exception).

---

## 4. Spacing, radius, borders

4 px grid. Use only these steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

| Token | Value |
|---|---|
| Screen side padding | 20 px (24 px ≥ 640 px wide) |
| Top bar → first heading | 32 px |
| Heading → visual | 32 px |
| Visual → next text | 32 px |
| Paragraph gap | 16 px |
| Card padding | 20 px (24 px ≥ 640) |
| Stacked cards gap | 32 px (spine runs through the gap) |
| Footer padding | 16 px sides, 12 px top, 16 px + `env(safe-area-inset-bottom)` bottom |
| Card radius | 20 px |
| Tile / chip radius | 12 px |
| Button radius | 9999 px (pill) |
| Card border | 2 px `--line`, bottom 5 px (`border-bottom-width: 5px`) |
| Tile border | 2 px `--line-strong`, bottom 4 px |
| Max content width | 640 px, centred |

Touch targets ≥ 44×44 px on coarse pointers; primary buttons 56 px tall.

---

## 5. Components

### 5.1 Buttons (`.btn-3d`, keep the class, restyle)
- Height 56, pill, full width in the footer. Face `--c`, ledge `box-shadow: 0 4px 0 var(--e)`. Press: `translateY(4px)` + ledge 0 (existing behaviour, keep).
- Tones map: `tone-tech` → `action`, `tone-safe` → `success`, `tone-crit` → `danger`, `tone-hazard` → `energy`, `tone-ink` → `ink`, `tone-ghost` → face `--surface`, 2 px `--line-strong` border, ledge `--line-strong`, text `--text`. `tone-violet` → map to `action` (violet retired).
- Disabled: face `--surface-2`, ledge none, text `--text-3`. (Brilliant's dark "Check".)
- Which tone when: read-only screen → `ink` "Continue"; answer pending → disabled "Check"; answer ready → `action` "Check"; after correct → `success` "Continue"; after wrong → `danger`-tint sheet with `ink` "Try again" (clears the pick so the learner re-answers the same screen; the miss still goes to Warmup review, as today); start a lesson/level → `action` "Start".
- One filled button per screen. Secondary actions are `ghost` pills ("Why?", "Hint").

### 5.2 Answer tiles and word-bank chips (`.tile-3d`)
- Face `--surface`, 2 px `--line-strong` border, 4 px bottom ledge in the same colour, radius 12, padding 12×20, text `body-lg` 600 in `action` tint text (word bank) or `--text` (multiple choice).
- Selected: border + ledge `action` face, bg `action` tint.
- Correct after check: border + ledge `success` face, bg `success` tint. Wrong: `danger` equivalents.
- Word bank sits in a `--surface-2` well, radius 20, padding 24, chips wrap with 16 px gaps, centred.
- Blank slot inside a sentence: 2 px dashed `--text-3`, radius 8, min 96×44, inline with the text baseline.

### 5.3 Cards (`.card`)
- Face `--surface`, card border (§4), radius 20, no shadow.
- Course/unit card: 88×88 unit icon tile left (§5.11), 16 px gap, eyebrow, `heading` title, optional 6 px progress bar (track `--surface-2`, fill `success`) 12 px under the title. Badge top-right 12 px inset: "Next" (`action` face) or "New" (`success` face), pill, `label` 700, white.
- Level header card: 2 px `action` border, 5 px `action` ledge, eyebrow in `action` tint text, `heading` title, centred.

### 5.4 Course spine
Vertical 4 px line in `--line`, centred horizontally, drawn behind the 32 px gaps between stacked cards (not over them).

### 5.5 Path nodes ("pedestals") — restyle only, keep STRATA's map layout
- Node = circle 72 px top face + 10 px rim below it (ledge), drawn in SVG/CSS.
- States: done → face `success`, rim `success` ledge, lucide `Check` 28 px white. Current → face `action`, rim `action` ledge, lucide `Play` 26 px white (filled), plus a 3 px `action` ring 8 px outside, pulsing scale 1 → 1.08 (2 s, ease-in-out, off under reduced motion). Locked → face `--surface-2`, rim `--line-strong`, lucide `Lock` 22 px `--text-3`.
- Label 20 px from node: `heading` weight 600; locked label `--text-3`.
- Tap a node → popover card (§5.7) with lesson title + `action` "Start" (or "Review" for done).

### 5.5b Special nodes and tapping
- Boss node: face `energy`, rim `energy` ledge, lucide `Crown` 26 px in `energy` text-on. Locked boss: locked style with a small `Crown` in `--text-3`.
- Perfect lesson: done node plus a 22 px `energy` circle badge with a `Star` in `energy` text-on (`#2A1E00`, 8.9:1) at the top-right of the face.
- Inspector-sandbox (master) node: locked-style face, label followed by an `action`-tint "Master" pill (`label` 700).
- Tap any unlocked node → popover card above/below it (`feedbackSheet` spring): lesson title (`heading`), stage count (`secondary`), button `action` "Start" (current), `ghost` "Review" (done) or `energy` "Fight boss" (boss). Tapping a locked node shows the popover with "Finish the previous lesson first" and no button. The old "START" callout is removed.

### 5.6 Lesson top bar
- Height 56, bg `--bg`, no border, no blur.
- Left: `X` (lucide, 24 px, 44 px target, `--text-2`). Centre: one progress bar, 10 px tall, pill, track `--surface-2`, fill `success`, animated width with `stageSlide`. It reads as one bar, with 2 px notches (gaps in `--bg`) at stage boundaries. Tapping a finished section re-opens that stage's recap (today's re-read feature, unchanged); give each finished section a ≥ 44 px tall invisible hit area. Right: hearts as one pill — lucide `Heart` filled `danger` face 20 px + count `label` 700.
- Notes, Inspector and Sources move into a `MoreHorizontal` (⋯) button left of the hearts pill, opening the existing sheets. The Notes badge becomes a 8 px `action` dot on the ⋯ icon.
- Inspector mode keeps its banner, restyled as an `energy`-tint strip under the top bar, `label` text.

### 5.7 Sheets, popovers, feedback
- Sheets/popovers: face `--surface-2`, radius 24 top (sheets) or 20 (popovers), 2 px `--line` border, the only element allowed a shadow: `0 -8px 24px rgba(0,0,0,0.25)` dark / `0 -8px 24px rgba(0,0,0,0.08)` light.
- **Feedback sheet** (replaces the verdict strip): rises from the bottom over the footer area, full width, radius 24 top, bg `success` tint or `danger` tint, padding 20/24. Row 1: verdict `title` 800 in tint text ("Correct!" / "Not quite") left; ghost pill "Why?" right (opens the existing explanation). Row 2: full-width button (`success` "Continue" / `ink` "Try again", which keeps today's retry behaviour).
- No layout shift: the scroll area always reserves bottom padding equal to the tallest footer state (footer + sheet), measured once.

### 5.8 Bottom tab bar
- Height 64 + safe area, bg `--bg`, top border 1 px `--line`, no blur.
- Each tab: lucide outline icon 24 px over `tab` label. Active: icon sits in a 56×32 pill of `--surface-2`, icon and label `--text`, label 700. Inactive: `--text-3`.
- Six tabs stay (Path, Warmup, Exam, Lab, Tools, Codex).

### 5.9 Sim stage
- Objective: one line above the plate — lucide `Target` 18 px + objective text `label`; turns `success` tint text when met.
- Plate: full content width, rules in §2.3.
- Readouts: plain rows, no tile backgrounds. Label `label` `--text-2` left, value `readout` right, 12 px row gap, 1 px `--line` divider. Show 2 readouts; the rest sit under a ghost "All readouts (n)" disclosure. Which 2: the sim's optional `primary` list if it has one, otherwise the first 2 in the sim's current order. `primary` is added only to sims whose first 2 are not the stage's objective variables (content data, not geometry). Colour dot (8 px) only where the diagram uses the same colour.
- Remove duplicate value chips under the plate when the same value is already in readouts.

### 5.10 Course / unit header
Centred: unit icon tile (§5.11) at 112 px, 24 px gap, `display` title, 12 px gap, `secondary` description (max 3 lines, centred allowed here only), 24 px gap, stats row: lucide `BookOpen` + "N lessons", lucide `CircleHelp` + "N questions" (`secondary`, 24 px apart). Both are computed from content, never typed: lessons = lessons in the unit; questions = every answerable screen in it (flow check and situation screens, predict/choice/equation/hotspot answers, boss items). One helper in `src/lib` does the count so every screen agrees.

### 5.11 Unit icons
Each unit has one lucide icon, shown in a rounded-square tile: `--surface-2` face, card border, radius 20, icon in `--text` at 45 % of the tile size (88 px tile on cards, 112 px on the unit header). The unit → icon mapping lives in one content file. The run that adds it lists the mapping in ROADMAP as "pending Bink's review"; Bink approves or swaps icons after seeing them on his phone (a one-line change each). Original unit artwork may replace the icons in a later phase (Bink designs it); it must keep the same tile size.


### 5.12 Stage-kind label
Stage types are not colour-coded. Each shows an `eyebrow` in `--text-3` with a 16 px lucide icon before it: Field theory `BookOpen`, Intuition lab `FlaskConical`, Equation forge `Sigma`, Workbench `Wrench`, Crisis `Siren`, Boss `Crown`. Colour stays reserved for meaning (§1.4).

### 5.13 Instrument panels follow the theme
Tools calculators, the sim telemetry strip and the Exam hero are no longer always-dark: they use `--surface`, card border and `readout` type like everything else. The sim plate (§2.3) is the only fixed-light surface.

---

## 6. Motion (framer-motion 14)

Put these in `src/lib/motion.ts` and import them; never inline spring numbers.

```ts
export const tactilePress  = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const; // tiles, chips, nodes
export const stageSlide    = { type: "spring", stiffness: 300, damping: 32, mass: 1 } as const;   // screen-to-screen, progress bar
export const feedbackSheet = { type: "spring", stiffness: 400, damping: 36, mass: 0.9 } as const; // verdict sheet, popovers
export const fadeQuick     = { duration: 0.16, ease: "easeOut" } as const;                         // reduced-motion fallback
```

- Screen change: outgoing x 0 → -24 + opacity → 0; incoming x 24 → 0 + opacity 0 → 1, `stageSlide`.
- Feedback sheet: y 100 % → 0, `feedbackSheet`. Correct also scales the verdict word 0.9 → 1.
- Word chip to blank: shared `layoutId` fly with `tactilePress`.
- `MotionConfig reducedMotion="user"` already exists: under reduced motion every transition becomes `fadeQuick`, the node pulse stops and confetti stays off.

---

## 7. Viewports and checks

- Phone 390×844 (primary), desktop 1440×900 (content stays in the 640 px column).
- Every screen is checked in light and dark: 0 console errors, no horizontal overflow, primary button fully visible without scrolling on lesson screens, all text ≥ 4.5:1 (≥ 3:1 for 24 px+ or 19 px+ bold).

---

## 7b. Approved UI dependencies

Approved by Bink on 2026-11-26 (installed in package.json). Nothing else may be added without his approval (CLAUDE.md).

| Package | Use it for | Rules |
|---|---|---|
| `@radix-ui/react-popover` | Path-node start card (§5.5b) and any small anchored card | Style it only with §5 tokens (no Radix default styles exist). Keep its focus handling, Escape-to-close and collision padding 16 px so it never leaves the screen. |
| `@rive-app/react-canvas` | Original interactive animations: unit art, a future mascot, celebration moments | **Offline rule:** Rive downloads its engine (`rive.wasm`) from a CDN by default, which breaks offline use. Copy `node_modules/@rive-app/canvas/rive.wasm` into `public/` at build time and call `RuntimeLoader.setWasmUrl()` with the basePath-aware URL before any Rive mounts, so the service worker precaches it. Load Rive only on screens that show a `.riv` file (dynamic import). Every Rive animation needs a static fallback and stops under reduced motion. Only original art made by or for Bink; never Brilliant's or anyone else's. |

Already in the app and still approved: `framer-motion`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`, `vaul`, `sonner`, `lucide-react`, `canvas-confetti`, the two font packages.

## 8. Never List

- Never use Brilliant's mascot (Koji), illustrations, icons, course art, wordmark or wording. STRATA uses its own unit icons and lucide. A STRATA mascot, if ever, is an original design in a later phase.
- Never use hue-tinted neutrals, gradients on surfaces, glows, card drop shadows, glassmorphism or backdrop blur.
- Never put lesson prose inside a card, centre a paragraph longer than 2 lines, or show more than one filled button per screen.
- Never use emoji as icons.
- Never let a verdict, hint or toast push content up or down.
- Never inline spring numbers or invent new colours: add a token here first.
- Never change sim geometry, hotspot x/y, stage order/count, store names/versions, sync schema, `public/sw.js` logic or basePath handling for design reasons (see `CLAUDE.md` "Do not touch").
