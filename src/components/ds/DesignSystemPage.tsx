"use client";

import { Section } from "./Section";
import { Swatches } from "./Swatches";
import { TypeScale } from "./TypeScale";
import { Buttons } from "./Buttons";
import { AnswerTiles } from "./AnswerTiles";
import { CardsDemo } from "./Cards";
import { PathNodes } from "./PathNodes";
import { LessonTopBar } from "./LessonTopBar";
import { TabBar } from "./TabBar";
import { FeedbackSheet } from "./FeedbackSheet";
import { StageKinds } from "./StageKinds";
import { Readouts } from "./Readouts";
import { StrataColours, CardDepth } from "./V21";
import { PlatePilot } from "./PlatePilot";

const SECTIONS = [
  ["colours", "Colour tokens", "Light and dark side by side. Each text pair shows its contrast, measured live on this device.", Swatches],
  ["type", "Type scale", undefined, TypeScale],
  ["buttons", "Buttons", "Every tone, disabled, and a press demo.", Buttons],
  ["tiles", "Answer tiles and word bank", undefined, AnswerTiles],
  ["cards", "Cards", undefined, CardsDemo],
  ["nodes", "Path nodes", undefined, PathNodes],
  ["topbar", "Lesson top bar", "With and without the Inspector strip.", TopBars],
  ["tabbar", "Bottom tab bar", "Drawn in place here; in the app it sits at the bottom of the screen.", TabBar],
  ["feedback", "Feedback sheet", "Opened by the buttons; it slides up over the footer.", FeedbackSheet],
  ["kinds", "Stage-kind labels", undefined, StageKinds],
  ["readouts", "Sim readouts", undefined, Readouts],
  ["strata", "v2.1 · Stratum colours", "One colour per unit, only on the icon tile, the eyebrow dot and the unit header band. The number under each tile is the icon-on-tint contrast, measured live (rule: at least 3:1).", StrataColours],
  ["depth", "v2.1 · Card depth", "Dark surfaces #1E1E1E / #282828, the --ledge token, the 1 px top highlight (dark only) and button-style pressing.", CardDepth],
  ["plate", "v2.1 · Sim plate pilot", "Three sims on the §2.3b plate. Production sims are unchanged: this sandbox re-colours its own copy with the token rules. The caption under each plate is measured live.", PlatePilot],
] as const;

function TopBars() {
  return (
    <div className="space-y-8">
      <LessonTopBar />
      <LessonTopBar inspector />
    </div>
  );
}

/** /design-system: design system v2 sandbox (DESIGN.md §2–§6). Nothing here is used by production screens. */
export function DesignSystemPage() {
  return (
    <div className="ds2 min-h-screen">
      <div className="max-w-[640px] mx-auto px-5 sm:px-6 pt-8 pb-32">
        <div className="t-eyebrow">Phase 15.5f · sandbox</div>
        <h1 className="t-display mt-2">Design system v2.1</h1>
        <p className="t-secondary mt-3">Every DESIGN.md component in one place. Sections marked v2.1 preview the 15.5f rules; production screens do not use them yet.</p>
        <nav aria-label="Sections" className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map(([id, title]) => (
            <a key={id} href={`#${id}`} className="t-label ds-focus inline-flex items-center min-h-11 px-3 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
              {title}
            </a>
          ))}
        </nav>
        <div className="mt-16 space-y-16">
          {SECTIONS.map(([id, title, note, Body], i) => (
            <Section key={id} id={id} n={i + 1} title={title} note={note}>
              <Body />
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}
