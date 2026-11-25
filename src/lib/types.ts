import type { ReactNode } from "react";

/** Semantic tone used for readouts, badges and alarms. */
export type Tone = "ok" | "warn" | "crit" | "info";

/** A map of numeric values (simulation parameters or computed outputs). */
export type Vals = Record<string, number>;

/* ------------------------------------------------------------------ */
/* Simulation definitions                                               */
/* ------------------------------------------------------------------ */

export interface SimParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  default: number;
  /** Optional discrete labels: value -> caption (renders as a segmented picker). */
  options?: { value: number; label: string }[];
}

export interface SimOutput {
  key: string;
  label: string;
  unit?: string;
  digits?: number;
  tone?: (v: number, o: Vals, p: Vals) => Tone;
  /** Map numeric output to a text label (e.g. classification). */
  format?: (v: number, o: Vals, p: Vals) => string;
}

export interface SimDef {
  id: string;
  title: string;
  params: SimParam[];
  compute: (p: Vals) => Vals;
  outputs: SimOutput[];
  /** Render SVG content inside a 400 x 240 viewBox. `t` is elapsed seconds (animated sims). */
  render: (p: Vals, o: Vals, t: number) => ReactNode;
  animated?: boolean;
  /** Optional extra plotted caption below the canvas. */
  caption?: string;
  /** Direct-manipulation grips drawn on the canvas: drag them to change a parameter. */
  handles?: SimHandle[];
}

/** A draggable grip on a simulation canvas bound to one parameter along one axis. */
export interface SimHandle {
  key: string;
  axis: "x" | "y";
  /** Where to draw the grip (viewBox coordinates) for the current state. */
  at: (p: Vals, o: Vals) => [number, number];
  /** Convert the pointer coordinate along `axis` (viewBox units) to a parameter value (clamped + snapped by the runtime). */
  toValue: (coord: number, p: Vals) => number;
  color?: string;
}

/* ------------------------------------------------------------------ */
/* Codex                                                                */
/* ------------------------------------------------------------------ */

export interface Formula {
  expr: string;
  meaning: string;
  vars?: string;
}

export interface CodexEntry {
  id: string;
  title: string;
  bullets: string[];
  formulas?: Formula[];
  tags?: string[];
  /** Extra simulation schematics linked to this cheat sheet (shown as thumbnails in the Codex). */
  sims?: string[];
}

/* ------------------------------------------------------------------ */
/* Stages (the 7 card engines)                                          */
/* ------------------------------------------------------------------ */

export interface Hotspot {
  x: number;
  y: number;
  title: string;
  body: string;
}

export interface Drawer {
  q: string;
  a: string;
}

export interface TheoryStage {
  kind: "theory";
  title: string;
  /** 2–3 crisp sentences. */
  lines: string[];
  sim: string;
  simParams?: Vals;
  hotspots: Hotspot[];
  /** Causal chain, animated step by step. */
  chain?: string[];
  drawers: Drawer[];
  codex: CodexEntry;
  /** Optional Brilliant-style concept flow (one idea per screen). When present it replaces the briefing layout. */
  flow?: FlowScreen[];
  /** ≤ 3 short bullets for the flow's closing summary (only what the flow taught). */
  flowSummary?: string[];
}

/** A visual shown on a flow screen: a sim render with optional parameters and focused hotspot pins (indexes into the stage's hotspots). */
export interface FlowVisual {
  sim?: string;
  params?: Vals;
  focus?: number[];
}

/** One screen of a concept flow. Every screen cites reference ids from src/content/references.ts. */
export type FlowScreen =
  | { kind: "predict"; q: string; options: string[]; answer: number; why: string[]; concept: string; visual?: FlowVisual; src: string[] }
  | { kind: "explain"; text: string; visual?: FlowVisual; src: string[] }
  | { kind: "reveal"; prompt: string; hotspot: Hotspot; visual?: FlowVisual; src: string[] }
  | { kind: "check"; q: string; options: string[]; answer: number; why: string[]; hint?: string; concept: string; src: string[] }
  | { kind: "misconception"; claim: string; truth: string; visual?: { sim: string; params?: Vals }; src: string[] }
  /** `couple` maps every change to a constrained state (e.g. O₂ tied to CH₄ along the air-dilution line). */
  | { kind: "nudge"; sim: string; start?: Vals; ask: string; goal: (p: Vals, o: Vals) => boolean; couple?: (p: Vals) => Vals; after: string; src: string[] }
  /**
   * Role-based situation: you are someone on the job, a scene (≤ 40 words, framing may be invented) and
   * optionally someone's claim (often the wrong belief). The fact that decides the answer must be sourced.
   */
  | { kind: "situation"; role: SituationRole; scene: string; claim?: string; claimBy?: string; options: string[]; answer: number; why: string[]; concept: string; visual?: FlowVisual; src: string[] };

export type SituationRole = "Manager" | "Overman" | "Sirdar" | "Shotfirer" | "Ventilation Officer" | "Surveyor" | "Safety Officer" | "DGMS Inspector" | "Exam candidate";

export type FlowKind = FlowScreen["kind"];

export interface Reference {
  title: string;
  author: string;
  publisher: string;
  url: string;
  accessed: "2026-11-25";
  tier: 1 | 2 | 3;
  licence: "public-domain" | "govt-India" | "free-personal-use" | "copyright";
  /** Where in the source the cited material sits. */
  where?: string;
}

export interface SimStage {
  kind: "sim";
  title: string;
  brief: string;
  sim: string;
  start?: Vals;
  goal: { text: string; test: (p: Vals, o: Vals) => boolean };
  insight: string;
  concept: string;
}

export interface PredictStage {
  kind: "predict";
  title: string;
  scenario: string;
  sim?: string;
  /** Parameters shown before the reveal. */
  before?: Vals;
  /** Parameters shown after the reveal. */
  after?: Vals;
  question: string;
  options: string[];
  answer: number;
  explain: string;
  /** Why each wrong option fails in the field (same order as options; the correct entry is ""). */
  optionWhy?: string[];
  concept: string;
}

export interface EquationStage {
  kind: "equation";
  title: string;
  /** Proportionality statements shown before assembly. */
  intuition: string[];
  /** Ordered tokens of the equation. */
  target: string[];
  distractors: string[];
  /** Alternative accepted orderings (e.g. commuted factors). */
  accept?: string[][];
  formula: Formula;
  concept: string;
}

export interface NumericStep {
  prompt: string;
  answer: number;
  unit: string;
  /** Relative tolerance, default 0.02 (2 %). */
  tol?: number;
  hint: string;
  explain: string;
}

export interface NumericStage {
  kind: "numeric";
  title: string;
  problem: string;
  givens: { sym: string; label: string; value: number; unit: string }[];
  steps: NumericStep[];
  sim?: string;
  params?: Vals;
  concept: string;
}

export interface CrisisOption {
  text: string;
  correct?: boolean;
  why: string;
}

export interface CrisisStage {
  kind: "crisis";
  title: string;
  alarm: string;
  scenario: string;
  seconds: number;
  telemetry?: { label: string; value: string; tone: Tone }[];
  phases: { label: string; prompt: string; options: CrisisOption[] }[];
  debrief: string;
  concept: string;
}

export interface SwipeCardItem {
  text: string;
  truth: boolean;
  why: string;
}

export interface SwipeStage {
  kind: "swipe";
  title: string;
  seconds: number;
  cards: SwipeCardItem[];
  concept: string;
}

export type Stage =
  | TheoryStage
  | SimStage
  | PredictStage
  | EquationStage
  | NumericStage
  | CrisisStage
  | SwipeStage;

export type StageKind = Stage["kind"];

/* ------------------------------------------------------------------ */
/* Curriculum                                                           */
/* ------------------------------------------------------------------ */

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  subtitle: string;
  boss?: boolean;
  stages: Stage[];
}

export interface Unit {
  id: string;
  n: number;
  title: string;
  short: string;
  blurb: string;
  lessons: Lesson[];
  boss: Lesson;
}
