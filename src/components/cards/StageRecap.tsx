"use client";

import type { ReactNode } from "react";
import type { Stage } from "@/lib/types";
import { fmt } from "@/lib/calc";
import { withUnit } from "@/lib/typo";
import { Formula } from "@/components/ui/Formula";
import { STAGE_META } from "./ui";

/** Read-only recap of a completed stage: the facts, answers and explanations, with nothing to score. */
export function StageRecap({ stage }: { stage: Stage }) {
  const m = STAGE_META[stage.kind];
  const P = ({ children }: { children: ReactNode }) => <p className="flow-body text-slate-800">{children}</p>;
  const H = ({ children }: { children: ReactNode }) => <div className="text-[14px] font-bold text-slate-600 mt-3">{children}</div>;
  let body: ReactNode = null;
  switch (stage.kind) {
    case "theory":
      body = stage.flow ? (
        <>
          {stage.flow.map((f, k) => {
            if (f.kind === "explain") return <P key={k}>{f.text}</P>;
            if (f.kind === "reveal")
              return (
                <P key={k}>
                  <b>{f.hotspot.title}.</b> {f.hotspot.body}
                </P>
              );
            if (f.kind === "misconception")
              return (
                <P key={k}>
                  <b>Common trap:</b> {f.truth}
                </P>
              );
            if (f.kind === "predict" || f.kind === "check" || f.kind === "situation")
              return (
                <P key={k}>
                  <b>{f.kind === "situation" ? `As ${f.role}: ` : ""}</b>
                  {f.kind === "situation" ? f.scene : f.q} <span className="text-emerald-800 font-semibold">→ {f.options[f.answer]}</span>
                </P>
              );
            return null;
          })}
          <H>Summary</H>
          {(stage.flowSummary ?? stage.codex.bullets).map((b, k) => (
            <P key={`s${k}`}>• {b}</P>
          ))}
        </>
      ) : (
        <>
          {stage.lines.map((l, k) => (
            <P key={k}>{l}</P>
          ))}
          {stage.hotspots.map((h, k) => (
            <P key={`h${k}`}>
              <b>{h.title}.</b> {h.body}
            </P>
          ))}
          {stage.drawers.map((d, k) => (
            <P key={`d${k}`}>
              <b>{d.q}</b> {d.a}
            </P>
          ))}
        </>
      );
      break;
    case "sim":
      body = (
        <>
          <P>{stage.brief}</P>
          <H>Objective</H>
          <P>{stage.goal.text}</P>
          <H>Insight</H>
          <P>{stage.insight}</P>
        </>
      );
      break;
    case "predict":
      body = (
        <>
          <P>{stage.scenario}</P>
          <P>
            <b>{stage.question}</b> <span className="text-emerald-800 font-semibold">→ {stage.options[stage.answer]}</span>
          </P>
          <P>{stage.explain}</P>
        </>
      );
      break;
    case "equation":
      body = (
        <>
          {stage.intuition.map((l, k) => (
            <P key={k}>{l}</P>
          ))}
          <P>
            <b className="readout"><Formula expr={stage.formula.expr} /></b> — {stage.formula.meaning}
          </P>
        </>
      );
      break;
    case "numeric":
      body = (
        <>
          <P>{stage.problem}</P>
          {stage.steps.map((s, k) => (
            <P key={k}>
              {k + 1}. {s.prompt} <b className="readout">→ {withUnit(fmt(s.answer, 3), s.unit)}</b>. {s.explain}
            </P>
          ))}
        </>
      );
      break;
    case "crisis":
      body = (
        <>
          <P>{stage.scenario}</P>
          {stage.phases.map((ph, k) => {
            const c = ph.options.find((o) => o.correct);
            return (
              <P key={k}>
                <b>{ph.prompt}</b> <span className="text-emerald-800 font-semibold">→ {c?.text}</span>
              </P>
            );
          })}
          <H>Debrief</H>
          <P>{stage.debrief}</P>
        </>
      );
      break;
    case "swipe":
      body = stage.cards.map((c, k) => (
        <P key={k}>
          <b>{c.truth ? "True" : "False"}:</b> {c.text} — {c.why}
        </P>
      ));
      break;
  }
  return (
    <div className="space-y-3">
      <div className="t-eyebrow">
        {m.label} · read-only
      </div>
      <h3 className="text-[20px] font-bold text-slate-900">{stage.title}</h3>
      {body}
    </div>
  );
}
