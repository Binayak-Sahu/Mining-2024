"use client";

import { useState } from "react";
import { BookMarked, Calculator, Dumbbell, FlaskConical, GraduationCap, Map } from "lucide-react";

const TABS = [
  ["Path", Map],
  ["Warmup", Dumbbell],
  ["Exam", GraduationCap],
  ["Lab", FlaskConical],
  ["Tools", Calculator],
  ["Codex", BookMarked],
] as const;

/** §5.8 bottom tab bar (drawn in place, not fixed). Tap a tab to move the active pill. */
export function TabBar() {
  const [on, setOn] = useState(0);
  return (
    <nav aria-label="Tab bar demo" className="ds-tabbar -mx-5 sm:mx-0 sm:rounded-b-[20px]">
      {TABS.map(([label, Icon], i) => (
        <button key={label} type="button" onClick={() => setOn(i)} aria-current={i === on ? "page" : undefined} className="ds-tab ds-focus">
          <span className="ds-tab-icon">
            <Icon size={24} strokeWidth={2} aria-hidden />
          </span>
          <span className="t-tab">{label}</span>
        </button>
      ))}
    </nav>
  );
}
