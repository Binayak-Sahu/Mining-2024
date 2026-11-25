# STRATA — instructions for Claude

STRATA is a Next.js 15 static-export PWA for B.Tech Mining / DGMS First Class exam prep. The owner is Bink, a mining engineer at MCL.

Read first:
- `PROJECT_CONTEXT.md`: architecture, stores, design system, conventions.
- `ROADMAP.md`: owner decisions, phase plan and status, run log.
- `BUILD_PROGRESS.md`: detailed log of every shipped phase.

## CONTENT RULE (non-negotiable)
AI writes the wording, never the knowledge.
- Every factual claim must come from a source fetched in-session (WebFetch/WebSearch/curl) or from a file in `sources/`.
- No source means no claim: drop it. Never fill gaps from memory.
- A situation screen's scene may be invented framing, but the fact that decides its answer must be sourced.
- Each sourced lesson has `research/<lessonId>.md` (claim → ref → URL → excerpt < 15 words → location; disagreements; dropped claims), and its refs live in `src/content/references.ts`.
- Precedence when sources disagree: statute > academic > everything else.
- Pipeline: `.claude/skills/sourced-flow/SKILL.md`. Reviewers: `.claude/agents/fact-checker.md`, `.claude/agents/design-reviewer.md`.

## STATUTE GATE
Never apply a change to a statutory value or citation directly. That covers `src/content/statutes.ts` and any statutory number or citation in lesson text. Write it up as a diff list (old → new, source, location) under "Statute gate: pending" in `ROADMAP.md` for the owner to approve. Flows may only state statutory numbers that already appear in `statutes.ts`.

## COPYRIGHT
- Paraphrase fully. At most one quote per source per lesson, under 15 words. Copy no figures; our SVG sims are the visuals.
- Never commit copyrighted PDFs (Hoek, McPherson, textbooks, journal articles).
- NIOSH (US public domain), Indian Gazettes and DGMS documents may be committed in `sources/`.

## Do not touch
- Stage order or count in `src/content/units/*.ts` (SRS keys depend on it).
- `statutes.ts` values (use the statute gate).
- Progress store version and persist names (`strata-progress-v1` v2, `strata-prefs` v1). New, separate stores are allowed.
- Sync/export schema 2.
- `public/sw.js` caching logic and `scripts/build-sw.mjs`.
- `basePath` / `NEXT_PUBLIC_BASE_PATH` handling.
- Sim geometry and hotspot x/y, unless a roadmap step explicitly allows it (then re-run audit:svg).
- Progress writes outside `LessonPlayer` (plus Warmup/Exam store actions), and the Inspector sandbox logic.
- Dependencies: add none without the owner's approval.

## Gates before any push to `main`
1. `npm run validate` (0 errors)
2. `npx tsc --noEmit`
3. `npm run lint`
4. `NEXT_PUBLIC_BASE_PATH=/Mining-2024 npm run build`
5. `NODE_PATH=$(npm root -g) npm run audit:svg` if any sim render changed (0 clip/overlap/occlude/pin)
6. Headless Playwright at 390×844, light + dark: 0 console errors, no horizontal overflow, CTA visible
7. Inspector acceptance: saved progress byte-identical after sandbox play

If any gate fails, push only the working branch and record what is broken in `ROADMAP.md`.

## Working style
- Run `date` at the start and at each checkpoint.
- Commit at every checkpoint. Commit messages end with the session attribution lines.
- Open no PRs unless asked.
- Playwright is preinstalled globally: `NODE_PATH=$(npm root -g) node script.js`.
- QA flag: `localStorage["strata-qa"] = "1"` keeps one heart during automated walks.
