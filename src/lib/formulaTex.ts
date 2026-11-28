import katex from "katex";

/**
 * DESIGN.md §3: formulas render as typeset maths. The lesson content stores each formula as one plain-text string
 * ("σv = ρgH", "L = √(2tσt / γ)"), and that text is fed to KaTeX unchanged: nothing is rewritten.
 * A string is typeset only if KaTeX accepts it in strict mode, with no warnings. Anything else (an unsupported character
 * such as the √ sign, or TeX control characters that would silently cut or garble the text) returns null, the caller
 * shows the original text, and `scripts/formula-report.ts` lists it.
 */
const TEX_CONTROL = /[\\%$#&{}~]/;

export function formulaToHtml(expr: string): string | null {
  if (TEX_CONTROL.test(expr)) return null;
  try {
    return katex.renderToString(expr, { throwOnError: true, strict: "error", output: "htmlAndMathml" });
  } catch {
    return null;
  }
}
