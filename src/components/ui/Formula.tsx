"use client";

import { useMemo } from "react";
import "./katex-woff2.css";
import { formulaToHtml } from "@/lib/formulaTex";

/**
 * A formula from lesson content (DESIGN.md §3, KaTeX bundled locally, no CDN; MathML is emitted for screen readers).
 * If the string is not valid TeX it is shown as plain text in the UI font, unchanged.
 */
export function Formula({ expr, className, display = false }: { expr: string; className?: string; display?: boolean }) {
  const html = useMemo(() => formulaToHtml(expr), [expr]);
  if (html === null) return <span className={className} data-formula="plain">{expr}</span>;
  return (
    <span
      className={className}
      data-formula="tex"
      style={display ? { display: "block", overflowX: "auto", overflowY: "hidden" } : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
