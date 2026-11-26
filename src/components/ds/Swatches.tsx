"use client";

import { useEffect, useRef, useState } from "react";
import { ratio, toHex } from "./contrast";

const NEUTRALS = ["--bg", "--surface", "--surface-2", "--line", "--line-strong", "--text", "--text-2", "--text-3"];
const ACCENTS = ["action", "success", "danger", "energy"].flatMap((t) => [`--${t}`, `--${t}-ledge`, `--${t}-tint`, `--${t}-tint-text`]).concat(["--ink", "--ink-ledge"]);

/** Text pairs used by §5 components: [text token, background token, where it is used]. */
const PAIRS: [string, string, string][] = [
  ["--text", "--bg", "Primary text on canvas"],
  ["--text", "--surface", "Primary text on card"],
  ["--text", "--surface-2", "Primary text in sheet"],
  ["--text-2", "--bg", "Secondary text on canvas"],
  ["--text-2", "--surface-2", "Secondary text in sheet"],
  ["--text-3", "--bg", "Eyebrow on canvas"],
  ["--text-3", "--surface", "Eyebrow on card"],
  ["--text-3", "--surface-2", "Disabled button, sheet caption"],
  ["--action-on", "--action", "Check / Start / Next badge"],
  ["--success-on", "--success", "Continue / New badge"],
  ["--danger-on", "--danger", "Danger button"],
  ["--energy-on", "--energy", "Fight boss"],
  ["--ink-on", "--ink", "Ink Continue / Try again"],
  ["--action-tint-text", "--action-tint", "Selected tile, Master pill"],
  ["--action-tint-text", "--surface", "Word-bank chip"],
  ["--success-tint-text", "--success-tint", "Correct! sheet"],
  ["--success-tint-text", "--bg", "Objective met"],
  ["--danger-tint-text", "--danger-tint", "Not quite sheet"],
  ["--energy-tint-text", "--energy-tint", "Inspector strip"],
];

function Chip({ token }: { token: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hex, setHex] = useState("");
  useEffect(() => {
    if (ref.current) setHex(toHex(getComputedStyle(ref.current).backgroundColor));
  }, []);
  return (
    <li className="flex items-center gap-3 py-2">
      <span ref={ref} aria-hidden className="w-10 h-10 shrink-0 rounded-[12px]" style={{ background: `var(${token})`, border: "2px solid var(--line-strong)" }} />
      <span className="min-w-0">
        <span className="t-label block truncate">{token}</span>
        <span className="t-readout block" style={{ fontSize: 14, color: "var(--text-2)" }}>
          {hex}
        </span>
      </span>
    </li>
  );
}

function Pair({ fg, bg, use }: { fg: string; bg: string; use: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [r, setR] = useState<number | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    setR(ratio(cs.color, cs.backgroundColor));
  }, []);
  return (
    <li className="py-2">
      <div ref={ref} data-ratio={r?.toFixed(2)} className="rounded-[12px] px-3 py-2 t-label" style={{ color: `var(${fg})`, background: `var(${bg})`, border: "2px solid var(--line)" }}>
        {use}
      </div>
      <div className="flex items-baseline justify-between gap-2 mt-1">
        <span className="t-label truncate" style={{ color: "var(--text-2)" }}>
          {fg.slice(2)} / {bg.slice(2)}
        </span>
        <span className="t-readout shrink-0" style={{ fontSize: 14, color: r !== null && r < 4.5 ? "var(--danger-tint-text)" : "var(--text)" }}>
          {r === null ? "…" : `${r.toFixed(2)}:1`}
        </span>
      </div>
    </li>
  );
}

function Column({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className={`ds2-${theme} rounded-[20px] p-3 sm:p-5 min-w-0`} style={{ border: "2px solid var(--line)" }}>
      <div className="t-eyebrow">{theme === "light" ? "Light" : "Dark"}</div>
      <h3 className="t-label mt-4">Neutrals</h3>
      <ul>{NEUTRALS.map((t) => <Chip key={t} token={t} />)}</ul>
      <h3 className="t-label mt-4">Accents</h3>
      <ul>{ACCENTS.map((t) => <Chip key={t} token={t} />)}</ul>
      <h3 className="t-label mt-4">Text pairs (measured)</h3>
      <ul>{PAIRS.map(([fg, bg, use]) => <Pair key={fg + bg} fg={fg} bg={bg} use={use} />)}</ul>
    </div>
  );
}

/** §2 colour tokens, light and dark side by side; each text pair shows its measured WCAG ratio. */
export function Swatches() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      <Column theme="light" />
      <Column theme="dark" />
    </div>
  );
}
