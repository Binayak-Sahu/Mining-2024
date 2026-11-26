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
        <div className="t-eyebrow">Phase 15.5a · sandbox</div>
        <h1 className="t-display mt-2">Design system v2</h1>
        <p className="t-secondary mt-3">Every DESIGN.md component in one place, built from the v2 tokens. Production screens do not use these yet.</p>
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
