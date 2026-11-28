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
import { DesignSystemV3 } from "./v3/DesignSystemV3";

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

/**
 * /design-system: the v3 sandbox (Phase 15.5-v3a) first, then the v2 components production uses today, folded away.
 * The v2.1 (15.5f) previews were removed: DESIGN.md v3 supersedes them (Appendix A). Nothing here is used by production.
 */
export function DesignSystemPage() {
  return (
    <>
      <DesignSystemV3 />
      <div className="ds2 min-h-screen">
        <div className="max-w-[640px] mx-auto px-5 sm:px-6 pt-8 pb-32">
          <details>
            <summary className="btn-3d tone-ghost list-none cursor-pointer select-none w-full [&::-webkit-details-marker]:hidden">v2 components (production today)</summary>
            <div className="mt-16 space-y-16">
              {SECTIONS.map(([id, title, note, Body], i) => (
                <Section key={id} id={id} n={i + 1} title={title} note={note}>
                  <Body />
                </Section>
              ))}
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
