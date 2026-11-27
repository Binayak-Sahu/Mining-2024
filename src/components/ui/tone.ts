/**
 * Status tone → text colour (DESIGN.md §2.2 tint-text tokens). Used for live values in sim readouts, the Tools output
 * card and anywhere a number carries ok / warn / crit meaning. Every pair is ≥ 4.8:1 on --bg, --surface and --surface-2.
 */
export function toneText(tone?: string): string {
  if (tone === "crit") return "text-danger-tint-text";
  if (tone === "warn") return "text-energy-tint-text";
  if (tone === "ok") return "text-success-tint-text";
  return "text-fg";
}
