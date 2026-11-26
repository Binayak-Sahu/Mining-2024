---
name: sourced-flow
description: Convert a STRATA theory stage into a sourced, fact-checked ConceptFlow (research file, references, flow file, situation screens, validation, reviewers, commit). Use for every Phase 16+ lesson conversion.
---

# Sourced-flow pipeline

Follow CLAUDE.md's CONTENT RULE, STATUTE GATE and COPYRIGHT sections throughout.

1. **Read the stage and its sim.** Open the theory stage in `src/content/units/<unit>.ts`, its sim in `src/content/sims/`, and the lesson's other stages. List the concepts the stage must teach, the hotspots (x/y are frozen) and the sim parameters and outputs usable for nudges.
2. **Fetch sources by tier.**
   - Tier 1 (Indian statutory): dgms.gov.in, indiacode.nic.in, cea.nic.in, labour.gov.in, and files in `sources/`.
     - The OSH (Central) Rules 2026 (G.S.R. 345(E), 08-05-2026) supersede the Mines Rules 1955, the Mines Rescue Rules 1985 and the MVTR 1966. Cite those three as historical only.
   - Tier 2 (owner's private library): books in the private repo `Binayak-Sahu/strata-library` or outside this repo, never committed here (`sources/private/` is gitignored).
     - Cite title + page; paraphrase only; at most one quote under 15 words per book per lesson.
   - Tier 2 (open academic): NIOSH/CDC (stacks.cdc.gov), Hoek's Corner (rocscience), NPTEL, open-access papers.
   - Tier 3: textbooks, listed only as "Further reading" and never cited for a claim.
   - Never use Scribd, SlideShare, blogs or coaching sites.
   - If a host is unreachable, drop those claims. If the host is blocked by the environment, propose adding it.
3. **Write `research/<lessonId>.md`.**
   - A sources table (id, document, URL, tier, licence).
   - A claims table (claim → ref → URL → verbatim excerpt < 15 words → page/section).
   - Derived arithmetic.
   - Disagreements and how they were resolved (statute beats academic, and academic beats everything else).
   - Dropped claims, and further reading.
   - Add every ref to `src/content/references.ts` (accessed date, tier, licence, where).
4. **Write the flow in `src/content/flows/<lessonId>.ts`** and attach it via `flow:` and `flowSummary:` on the stage, without reordering stages.
   - Open with a predict screen.
   - Explain the mechanism (WHY), ≤ 45 words per explain screen.
   - Include one misconception screen.
   - Include ≥ 1 situation screen. Vary the role across the unit. The scene (≤ 40 words) is framing; someone's `claim` is the wrong belief, and the deciding fact is sourced. Distractors match the correct option's length and tone.
   - Include ≥ 2 check screens, each option with its own `why`. Wrong-option `why`s must not reveal the right answer.
   - Add a nudge where a sim fits.
   - Add a 3-bullet `flowSummary` covering only what the flow taught.
   - Every screen carries `src` ids.
5. **Validate, then fact-check.**
   - Cache the source text:
     - public domain → `research/cache/<id>.txt`, committed;
     - copyrighted → `research/cache/private/<id>.txt`, gitignored; add the URL to `scripts/fetch-sources.mjs`.
   - Run `npm run validate`. It includes `verify-quotes`: every excerpt must be FOUND, and the run needs 0 errors. Then run the `fact-checker` agent on the lesson. Fix every PARTLY/UNSUPPORTED claim with sourced wording, or drop it. Append a fact-check summary to the research file.
6. **Every 2 lessons, run the `design-reviewer` agent** and apply its top fixes.
7. **Commit** "sourced flow <lessonId>" with the session attribution lines. Add a row to the ROADMAP run log.
