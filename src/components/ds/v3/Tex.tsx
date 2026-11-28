"use client";

import katex from "katex";
import "./katex-woff2.css";
import { useMemo } from "react";

/** KaTeX maths (DESIGN.md §3), bundled locally: no CDN. MathML is emitted alongside the HTML for screen readers. */
export function Tex({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, displayMode: display, output: "htmlAndMathml" }), [tex, display]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * KaTeX label inside an SVG diagram (§5.6), via <foreignObject>. `size` is in viewBox units, `anchor` is like SVG
 * text-anchor, and (x, y) is the text baseline-ish centre line, so it lines up with neighbouring <text> labels.
 */
export function SvgTex({ x, y, tex, size = 18, anchor = "start", color }: { x: number; y: number; tex: string; size?: number; anchor?: "start" | "middle" | "end"; color?: string }) {
  // the box never reaches past the 400-wide viewBox, so it cannot widen the page
  const w = Math.max(40, anchor === "start" ? 400 - x : anchor === "end" ? x : 2 * Math.min(x, 400 - x));
  const h = size * 2;
  const left = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
  const justify = anchor === "start" ? "flex-start" : anchor === "middle" ? "center" : "flex-end";
  return (
    <foreignObject x={left} y={y - size * 1.15} width={w} height={h} style={{ overflow: "visible", pointerEvents: "none" }} data-tex="">
      <div className="v3-fo" style={{ fontSize: size, display: "flex", justifyContent: justify, alignItems: "center", height: h, color }}>
        <Tex tex={tex} />
      </div>
    </foreignObject>
  );
}
