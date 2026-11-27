"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, CircleHelp, Check, Play } from "lucide-react";
import { UNITS } from "@/content";
import { unitIcon } from "@/content/unitIcons";
import { stratumFor } from "@/components/pages/strata";
import { fadeQuick, tactilePress } from "@/lib/motion";
import { parseRgb, ratio } from "./contrast";

type Theme = "light" | "dark";
const THIN = " ";

/** Blend the computed face colour over the computed surface at the theme's alpha and measure icon-on-tint. */
function useTintRatio(theme: Theme) {
  const ref = useRef<HTMLDivElement>(null);
  const [r, setR] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const face = parseRgb(cs.color);
    const hex = cs.getPropertyValue("--surface").trim();
    const s = /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) : [255, 255, 255];
    const a = theme === "dark" ? 0.14 : 0.12;
    const tint = [0, 1, 2].map((i) => Math.round(face[i] * a + s[i] * (1 - a)));
    setR(ratio(cs.color, `rgb(${tint.join(",")})`));
  }, [theme]);
  return { ref, r };
}

function StratumTile({ n, theme, size = 88 }: { n: number; theme: Theme; size?: 88 | 112 }) {
  const Icon = unitIcon(`u${n}`);
  const { ref, r } = useTintRatio(theme);
  return (
    <div className="flex flex-col items-center gap-1">
      <div ref={ref} className="ds21-tile" data-ratio={r?.toFixed(2)} style={{ ["--s" as string]: `var(--stratum-${n})`, width: size, height: size }} aria-hidden>
        <Icon size={Math.round(size * 0.45)} strokeWidth={2} />
      </div>
      <span className="t-readout" style={{ fontSize: 14, color: r !== null && r < 3 ? "var(--danger-tint-text)" : "var(--text-2)" }}>
        {r === null ? "…" : `${r.toFixed(2)}:1`}
      </span>
    </div>
  );
}

/** §2.4: the 11 stratum colours on unit icon tiles, with icon-on-tint contrast measured live. */
function StrataGrid({ theme }: { theme: Theme }) {
  return (
    <div className={`ds2-${theme} ds21-${theme} rounded-[20px] p-4 min-w-0`} style={{ background: "var(--bg)", border: "2px solid var(--line)" }}>
      <div className="t-eyebrow">{theme === "light" ? "Light" : "Dark"}</div>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5">
        {UNITS.map((u) => (
          <li key={u.id} className="flex flex-col items-center text-center min-w-0">
            <StratumTile n={u.n} theme={theme} />
            <span className="t-label mt-1 flex items-center gap-2 min-w-0" style={{ color: "var(--text)" }}>
              <span className="ds21-dot shrink-0" style={{ ["--s" as string]: `var(--stratum-${u.n})` }} aria-hidden />
              <span className="truncate">Unit {u.n}</span>
            </span>
            <span className="t-label" style={{ color: "var(--text-2)", fontWeight: 400 }}>
              {stratumFor(u.n).name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** §5.3 v2.1 pressable card: face moves 3 px, ledge 5 → 2 px; margin keeps the outer box height so nothing moves. */
function PressCard({ n }: { n: number }) {
  const reduce = useReducedMotion();
  const u = UNITS[n];
  const Icon = unitIcon(u.id);
  const [down, setDown] = useState(false);
  const st = stratumFor(n);
  return (
    <motion.button
      type="button"
      className="ds21-card ds-focus w-full flex items-center gap-4 p-5 text-left"
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      animate={down ? { y: 3, borderBottomWidth: 2, marginBottom: 3 } : { y: 0, borderBottomWidth: 5, marginBottom: 0 }}
      transition={reduce ? fadeQuick : tactilePress}
    >
      <span className="ds21-tile shrink-0" style={{ ["--s" as string]: `var(--stratum-${n})`, width: 88, height: 88 }} aria-hidden>
        <Icon size={40} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="t-eyebrow flex items-start gap-2">
          <span className="ds21-dot shrink-0 mt-[5px]" style={{ ["--s" as string]: `var(--stratum-${n})` }} aria-hidden />
          Unit {n} · {st.name}
        </span>
        <span className="t-heading block mt-1" style={{ color: "var(--text)" }}>
          {u.title}
        </span>
        <span className="mt-3 block h-[6px] rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }} aria-hidden>
          <span className="block h-full rounded-full" style={{ width: "40%", background: "var(--success)" }} />
        </span>
      </span>
    </motion.button>
  );
}

/** §5.5 node pressing like a button in v2.1: the face sinks 3 px. */
function PressNode({ kind }: { kind: "done" | "current" }) {
  const reduce = useReducedMotion();
  return (
    <button type="button" className="ds-node ds-focus" data-state={kind} aria-label={kind === "done" ? "Done lesson (press demo)" : "Current lesson (press demo)"}>
      <span className="ds-node-rim" aria-hidden />
      <motion.span className="ds-node-face" aria-hidden whileTap={reduce ? undefined : { y: 3 }} transition={reduce ? fadeQuick : tactilePress}>
        {kind === "done" ? <Check size={28} strokeWidth={3} /> : <Play size={26} fill="currentColor" strokeWidth={0} />}
      </motion.span>
    </button>
  );
}

/** §5.10 v2.1 unit page header on the stratum band, with text contrast on the band measured live. */
function HeaderBand({ n }: { n: number }) {
  const u = UNITS[n];
  const ref = useRef<HTMLParagraphElement>(null);
  const [r, setR] = useState<number | null>(null);
  useEffect(() => {
    const p = ref.current;
    const band = p?.closest(".ds21-band") as HTMLElement | null;
    const dot = band?.querySelector(".ds21-dot") as HTMLElement | null;
    if (!p || !band || !dot) return;
    // color-mix() computes to a color() string, so blend the stratum face over --surface here, as the CSS does.
    const cs = getComputedStyle(band);
    const face = parseRgb(getComputedStyle(dot).backgroundColor);
    const hex = cs.getPropertyValue("--surface").trim();
    const s = /^#[0-9a-f]{6}$/i.test(hex) ? [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) : [255, 255, 255];
    const a = parseFloat(cs.getPropertyValue("--stratum-alpha")) / 100 || 0.12;
    const tint = [0, 1, 2].map((i) => Math.round(face[i] * a + s[i] * (1 - a)));
    setR(ratio(getComputedStyle(p).color, `rgb(${tint.join(",")})`));
  }, []);
  const Icon = unitIcon(u.id);
  const lessons = u.lessons.length;
  const title = u.title;
  return (
    <div className="ds21-band text-center" style={{ ["--s" as string]: `var(--stratum-${n})` }}>
      <div className="flex justify-center">
        <span className="ds21-tile" style={{ ["--s" as string]: `var(--stratum-${n})`, width: 112, height: 112 }} aria-hidden>
          <Icon size={50} strokeWidth={2} />
        </span>
      </div>
      <div className="t-eyebrow mt-6 flex items-center justify-center gap-2">
        <span className="ds21-dot" style={{ ["--s" as string]: `var(--stratum-${n})` }} aria-hidden />
        Unit {n} · {stratumFor(n).name}
      </div>
      {/* §3 v2.1: a title that would wrap past 2 lines at 390 px uses `title`, not `display` */}
      <h3 className={title.length > 34 ? "t-title mt-2" : "t-display mt-2"} style={{ color: "var(--text)" }}>
        {title}
      </h3>
      <p ref={ref} className="t-secondary mt-3" data-ratio={r?.toFixed(2)}>
        Secondary text on the band: {r === null ? "…" : `${r.toFixed(2)}:1`}
      </p>
      <div className="mt-6 flex justify-center gap-6 t-secondary">
        <span className="inline-flex items-center gap-2">
          <BookOpen size={18} aria-hidden /> {lessons}{THIN}lessons
        </span>
        <span className="inline-flex items-center gap-2">
          <CircleHelp size={18} aria-hidden /> 0{THIN}XP
        </span>
      </div>
    </div>
  );
}

function DepthColumn({ theme }: { theme: Theme }) {
  return (
    <div className={`ds2-${theme} ds21-${theme} rounded-[20px] p-4 space-y-8 min-w-0`} style={{ background: "var(--bg)", border: "2px solid var(--line)" }}>
      <div className="t-eyebrow">{theme === "light" ? "Light" : "Dark"} · press the card and the nodes</div>
      <PressCard n={7} />
      <div className="flex items-center justify-center gap-10 py-2">
        <PressNode kind="done" />
        <PressNode kind="current" />
      </div>
      <HeaderBand n={7} />
      <HeaderBand n={1} />
    </div>
  );
}

/** Phase 15.5f: DESIGN.md v2.1 preview — stratum colours, dark depth, pressable cards, header band. */
export function StrataColours() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StrataGrid theme="light" />
      <StrataGrid theme="dark" />
    </div>
  );
}

export function CardDepth() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DepthColumn theme="light" />
      <DepthColumn theme="dark" />
    </div>
  );
}
