import { BookOpen, Crown, FlaskConical, Sigma, Siren, Wrench } from "lucide-react";

const KINDS = [
  ["Field theory", BookOpen],
  ["Intuition lab", FlaskConical],
  ["Equation forge", Sigma],
  ["Workbench", Wrench],
  ["Crisis", Siren],
  ["Boss", Crown],
] as const;

/** §5.12 stage-kind labels: neutral eyebrow with a 16 px lucide icon, no per-kind colour. */
export function StageKinds() {
  return (
    <ul className="space-y-4">
      {KINDS.map(([label, Icon]) => (
        <li key={label} className="t-eyebrow flex items-center gap-2">
          <Icon size={16} strokeWidth={2.25} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
