"use client";

import "./v3.css";
import { useEffect, useState, type ReactNode } from "react";
import { HomeMock, PathMock } from "./Mocks";
import { UnitIllustration } from "@/assets/illustrations";
import { UNITS } from "@/content";
import { Neutrals, Families, ButtonsV3, SurfacesV3 } from "./TokensDemo";
import { PilotStage } from "./PilotStage";
import { PILOTS } from "./pilots";
import { Tex } from "./Tex";
import type { Theme } from "./tokens";

type Font = "figtree" | "onest" | "jakarta";
const FONTS: [Font, string][] = [
  ["figtree", "Figtree"],
  ["onest", "Onest"],
  ["jakarta", "Plus Jakarta Sans"],
];

/** Formulas of the three pilot lessons (from the lesson content), typeset with KaTeX. */
const LESSON_FORMULAS: [string, string, string][] = [
  ["Virgin vertical stress", "\\sigma_v = \\rho\\, g\\, H", "Vertical stress from overburden weight"],
  ["Coalification", "k = A \\exp(-E_a/RT)", "Arrhenius kinetics: why temperature dominates rank, and why time only adds logarithmically."],
  ["Coalification", "X_{\\text{daf}} = X_{\\text{ad}} \\times \\dfrac{100}{100 - M - A}", "Convert air-dried analysis to dry-ash-free basis"],
  ["Dip and strike", "\\tan\\alpha = \\tan\\delta \\cdot \\sin\\beta", "Apparent dip α for a section at β from strike · δ true dip"],
];

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-1 gap-1 rounded-full" style={{ background: "var(--surface-2)" }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className="v3-focus v3-label rounded-full px-4"
          style={{ minHeight: 44, background: value === v ? "var(--surface)" : "transparent", color: value === v ? "var(--text)" : "var(--text-2)", fontWeight: value === v ? 800 : 600, border: value === v ? "2px solid var(--edge)" : "2px solid transparent" }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Sec({ id, n, title, note, children }: { id: string; n: number; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6">
      <div className="v3-eyebrow">Section {n}</div>
      <h2 id={`${id}-h`} className="v3-title mt-2">
        {title}
      </h2>
      {note && <p className="v3-secondary mt-2">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A screen-sized mock: full bleed (390 px) on phones, a bordered frame on wider screens. */
function Frame({ children, label, font }: { children: ReactNode; label?: string; font?: Font }) {
  return (
    <figure className="min-w-0">
      {label && <figcaption className="v3-eyebrow mb-3 px-6 sm:px-0">{label}</figcaption>}
      <div data-font={font} className="overflow-hidden sm:rounded-[28px] border-y-2 sm:border-2" style={{ borderColor: "var(--edge)", background: "var(--bg)" }}>
        {children}
      </div>
    </figure>
  );
}

/** /design-system v3 (Phase 15.5-v3a): DESIGN.md v3 previewed in a `.ds3` scope. Production screens do not use it. */
export function DesignSystemV3() {
  const [theme, setTheme] = useState<Theme>("light");
  const [font, setFont] = useState<Font>("figtree");
  // Start in the app's theme; the toggle then overrides it for the sandbox only (nothing is saved).
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const SECTIONS: [string, string, string | undefined, ReactNode][] = [
    [
      "v3-fonts",
      "Font bake-off",
      "The same Home screen (§5.2, Unit 4) in each candidate. Swipe sideways. Pick the one closest to Brilliant at 700–800.",
      <div key="f" className="v3-scroller -mx-6 sm:mx-0">
        {FONTS.map(([f, name]) => (
          <div key={f} style={{ width: "min(390px, 100vw)" }}>
            <Frame label={name} font={f}>
              <HomeMock startUnit="u4" theme={theme} />
            </Frame>
          </div>
        ))}
      </div>,
    ],
    ["v3-neutrals", "Neutrals", "Light and dark side by side, with measured contrast. ✗ marks a pair under the rule.", <Neutrals key="n" />],
    ["v3-families", "Unit families", "Each family's tones, its units, and the contrast of text on the face, ink on the canvas and tab tint, and rings on cards.", <Families key="fa" />],
    ["v3-buttons", "Buttons", "Pill, 56 px, 5 px ledge; press moves down 5 px. Text on green and red is #141414 (§2.2b).", <ButtonsV3 key="b" />],
    ["v3-surfaces", "Cards, stat pills, course tabs", "Cards (radius 28, 6 px ledge), the stat bar's 48 px pills and the selected / unselected course tab.", <SurfacesV3 key="s" />],
    [
      "v3-home",
      "Home · Unit 4 Blasting",
      "§5.2. Swipe the illustration, or tap a dot or a neighbour, to move between units: the colours follow the unit's family.",
      <div key="h" className="-mx-6 sm:mx-0">
        <Frame font={font}>
          <HomeMock startUnit="u4" theme={theme} />
        </Frame>
      </div>,
    ],
    [
      "v3-path",
      "Path · Unit 7 Ventilation",
      "§5.3. Tap a unit tab to switch. Lesson cards press like buttons and show the lesson number until lessons have their own art. Progress is a fixed mock value.",
      <div key="p" className="-mx-6 sm:mx-0">
        <Frame font={font}>
          <PathMock unitId="u7" theme={theme} />
        </Frame>
      </div>,
    ],
    [
      "v3-art",
      "Illustrations",
      "§5.5: all 11 unit illustrations (Phase 15.5-v3d drafts) at 200 px and 56 px, on light and dark. The same art in both themes. Source files: src/assets/illustrations/u0.svg … u10.svg (edit in Figma, export at 160 × 160 over the same name); npm run audit:illus checks them.",
      <div key="a" className="space-y-6" data-testid="illus-gallery">
        {(["light", "dark"] as const).map((t) => (
          <div key={t} data-theme={t} className="rounded-[28px] p-4" style={{ border: "2px solid var(--edge)", background: "var(--bg)" }}>
            <div className="v3-eyebrow mb-2">{t === "light" ? "Light" : "Dark"}</div>
            <ul className="grid gap-8">
              {UNITS.map((u) => (
                <li key={u.id} className="flex items-end gap-4">
                  <UnitIllustration unitId={u.id} size={200} title={`Unit ${u.n} ${u.short}`} />
                  <div className="flex flex-col items-start gap-2 min-w-0">
                    <UnitIllustration unitId={u.id} size={56} />
                    <span className="v3-label" style={{ color: "var(--text-2)" }}>
                      U{u.n}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>,
    ],
    [
      "v3-sims",
      "Pilot sims",
      "§5.6, redrawn sandbox copies. The objective, grips, readouts and sliders are the production ones (same params, maths and lesson objective). Production sim files are unchanged.",
      <div key="si" className="space-y-12">
        {PILOTS.map(({ def, name }) => (
          <div key={def.id}>
            <h3 className="v3-card-title">{name}</h3>
            <p className="v3-label mb-4" style={{ color: "var(--text-3)" }}>
              {def.where}
            </p>
            <PilotStage def={def} theme={theme} />
          </div>
        ))}
      </div>,
    ],
    [
      "v3-maths",
      "Formulas (KaTeX)",
      "Every formula from the three pilot lessons, typeset by KaTeX from the bundled package (no CDN).",
      <div key="m" className="v3-card space-y-6">
        {LESSON_FORMULAS.map(([lesson, tex, cap]) => (
          <div key={tex}>
            <div className="v3-eyebrow">{lesson}</div>
            <Tex tex={tex} display className="v3-math block" />
            <div className="v3-label" style={{ color: "var(--text-2)", fontWeight: 400 }}>
              {cap}
            </div>
          </div>
        ))}
      </div>,
    ],
  ];

  return (
    <div className="ds3 min-h-screen" data-theme={theme} data-font={font} data-testid="ds3">
      <div className="max-w-[640px] mx-auto px-6 pt-8 pb-16">
        <div className="v3-eyebrow">Phase 15.5-v3a · sandbox</div>
        <h1 className="v3-display mt-2">Design system v3</h1>
        <p className="v3-secondary mt-3">DESIGN.md v3, previewed here only. Production screens still use v2. The theme and font switches below change this page only and are not saved.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Seg label="Theme" value={theme} options={[["light", "Light"], ["dark", "Dark"]]} onChange={setTheme} />
          <Seg label="Font" value={font} options={FONTS} onChange={setFont} />
        </div>
        <nav aria-label="Sections" className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map(([id, title]) => (
            <a key={id} href={`#${id}`} className="v3-focus v3-label inline-flex items-center px-4 rounded-full" style={{ minHeight: 44, background: "var(--surface-2)", color: "var(--text)" }}>
              {title}
            </a>
          ))}
        </nav>
        <div className="mt-12 space-y-16">
          {SECTIONS.map(([id, title, note, body], i) => (
            <Sec key={id} id={id} n={i + 1} title={title} note={note}>
              {body}
            </Sec>
          ))}
        </div>
      </div>
    </div>
  );
}
