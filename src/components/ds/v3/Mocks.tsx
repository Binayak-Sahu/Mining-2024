"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Flame, Gem, Heart, Lock } from "lucide-react";
import { UNITS } from "@/content";
import { unitIcon } from "@/content/unitIcons";
import { unitCounts } from "@/lib/questions";
import { stageSlide } from "@/lib/motion";
import { UNIT_ILLUSTRATIONS } from "@/assets/illustrations";
import { FAMILIES, UNIT_FAMILY, familyVars, NNBSP, type Theme } from "./tokens";

/**
 * Static v3 screen mocks for /design-system (DESIGN.md §5.1b–§5.3). They read unit and lesson titles from content but
 * never read or write progress: streak, XP, hearts and lesson progress are fixed mock values.
 */

const MOCK = { streak: 3, xp: 120, hearts: 5 };

/** A unit's illustration, or its lucide icon in the family tones until it has one (§5.5). */
export function UnitArt({ unitId, size }: { unitId: string; size: number }) {
  const Art = UNIT_ILLUSTRATIONS[unitId];
  if (Art) return <Art size={size} />;
  const Icon = unitIcon(unitId);
  const f = FAMILIES[UNIT_FAMILY[unitId] ?? "blue"];
  return (
    <span className="inline-flex items-center justify-center" style={{ width: size, height: size }} aria-hidden>
      <Icon size={size * 0.62} color={f.deep} fill={f.light} strokeWidth={1.75} />
    </span>
  );
}

/** §5.1b top stat bar: streak left; XP and hearts right; 48 px pills. */
export function StatBar() {
  return (
    <div className="flex items-center justify-between h-14" aria-label="Stats (mock)">
      <span className="v3-pill v3-stat">
        <Flame size={24} fill="var(--energy)" color="var(--energy-ledge)" aria-hidden />
        {MOCK.streak}
      </span>
      <div className="flex gap-2">
        <span className="v3-pill v3-stat">
          <Gem size={24} fill="var(--u-light)" color="var(--u-ink)" aria-hidden />
          {MOCK.xp}
        </span>
        <span className="v3-pill v3-stat">
          <Heart size={24} fill="var(--danger)" color="var(--danger)" aria-hidden />
          {MOCK.hearts}
        </span>
      </div>
    </div>
  );
}

/** §5.2 pedestal node: 64 px, white disc on a grey ring; current = 4 px unit-ink ring with the unit icon. */
function Pedestal({ unitId, current }: { unitId: string; current: boolean }) {
  const Icon = unitIcon(unitId);
  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0 rounded-full"
      style={{ width: 64, height: 64, background: current ? "var(--u-ink)" : "var(--surface-2)" }}
      aria-hidden
    >
      <span
        className="inline-flex items-center justify-center rounded-full"
        style={{ width: current ? 56 : 52, height: current ? 56 : 52, background: current ? "var(--surface)" : "var(--surface)", borderBottom: "4px solid var(--edge)" }}
      >
        {current ? <Icon size={26} color="var(--u-ink)" strokeWidth={2.4} /> : <Lock size={20} color="var(--text-3)" strokeWidth={2.4} />}
      </span>
    </span>
  );
}

const ORDER = UNITS.map((u) => u.id);

/** §5.2 Home: the current-unit screen. Swipe the carousel (or tap a dot) to move between units; colours follow. */
export function HomeMock({ startUnit, theme }: { startUnit: string; theme: Theme }) {
  const [i, setI] = useState(Math.max(0, ORDER.indexOf(startUnit)));
  const unit = UNITS[i];
  const fam = UNIT_FAMILY[unit.id] ?? "blue";
  const go = (d: number) => setI((v) => Math.min(ORDER.length - 1, Math.max(0, v + d)));
  const onEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -48 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 48 || info.velocity.x > 400) go(-1);
  };
  // 5 page dots: a window around the current unit
  const first = Math.min(Math.max(0, i - 2), ORDER.length - 5);
  const dots = ORDER.slice(first, first + 5);
  const [a, b] = unit.lessons;
  return (
    <div className="v3-glow pb-8" style={familyVars(fam, theme) as CSSProperties}>
      <div className="px-6">
        <StatBar />
        <h3 className="v3-hero text-center mt-8">{unit.title}</h3>
        <div className="v3-eyebrow text-center mt-6" style={{ color: "var(--u-ink)" }}>
          Level 1
        </div>
      </div>
      {/* carousel: 200 × 200 art, neighbours peek 30 % in from the edges (70 % off-screen) */}
      <div className="relative mt-4 overflow-hidden" style={{ height: 200 }} aria-roledescription="carousel" aria-label="Units">
        {[-1, 0, 1].map((d) => {
          const u = UNITS[i + d];
          if (!u) return null;
          const left = d === 0 ? "calc(50% - 100px)" : d < 0 ? "-140px" : "calc(100% - 60px)";
          return (
            <motion.div
              key={u.id}
              className="absolute top-0"
              style={{ left, width: 200, height: 200, touchAction: d === 0 ? "pan-y" : undefined, cursor: d === 0 ? "grab" : "pointer", opacity: d === 0 ? 1 : 0.9 }}
              drag={d === 0 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={d === 0 ? onEnd : undefined}
              onClick={d !== 0 ? () => go(d) : undefined}
              layout
              transition={stageSlide}
            >
              <UnitArt unitId={u.id} size={200} />
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-center gap-2 mt-3" role="tablist" aria-label="Unit pages">
        {dots.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === unit.id}
            aria-label={`Unit ${ORDER.indexOf(id)}`}
            onClick={() => setI(ORDER.indexOf(id))}
            className="v3-focus inline-flex items-center justify-center"
            style={{ width: 24, height: 44 }}
          >
            <span className="block rounded-full" style={{ width: 8, height: 8, background: id === unit.id ? "var(--u-ink)" : "var(--edge-strong)" }} />
          </button>
        ))}
      </div>
      <div className="px-6 mt-4">
        <div className="v3-card">
          {[a, b].filter(Boolean).map((l, k) => (
            <div key={l.id} className={`flex items-center gap-4 ${k ? "mt-4" : ""}`}>
              <Pedestal unitId={unit.id} current={k === 0} />
              <div className={`min-w-0 flex-1 ${k === 0 ? "v3-card-title" : "v3-secondary"}`} style={{ fontWeight: k ? 500 : undefined, overflowWrap: "anywhere", hyphens: "auto" }} lang="en">
                {l.title}
              </div>
              <span className="shrink-0 rounded-full" style={{ width: 32, height: 32, background: "var(--surface-2)" }} aria-hidden />
            </div>
          ))}
          <button type="button" className="v3-btn w-full mt-6">
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

/** §5.3 Path: course list for one unit (tabs, header, lesson cards on the spine). */
export function PathMock({ unitId, theme }: { unitId: string; theme: Theme }) {
  const [sel, setSel] = useState(unitId);
  const unit = UNITS.find((u) => u.id === sel) ?? UNITS[0];
  const fam = UNIT_FAMILY[unit.id] ?? "blue";
  const counts = unitCounts(unit);
  const tabs = useRef<HTMLDivElement>(null);
  // keep the selected tab in view (horizontal only: never scrolls the page)
  useEffect(() => {
    const box = tabs.current;
    const tab = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (box && tab) box.scrollTo({ left: tab.offsetLeft - box.offsetLeft - 24 });
  }, [sel]);
  return (
    <div className="v3-glow pb-8" style={familyVars(fam, theme) as CSSProperties}>
      <div className="px-6">
        <StatBar />
      </div>
      <div ref={tabs} className="v3-scroller mt-4 px-6" style={{ scrollPaddingLeft: 24 }} role="tablist" aria-label="Units">
        {UNITS.map((u) => {
          const on = u.id === unit.id;
          const fv = familyVars(UNIT_FAMILY[u.id] ?? "blue", theme) as CSSProperties;
          return (
            <button
              key={u.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSel(u.id)}
              className="v3-tile v3-focus flex flex-col items-center justify-center gap-1"
              data-selected={on}
              style={{ ...fv, width: 140, height: 96 }}
            >
              <UnitArt unitId={u.id} size={56} />
              <span className="v3-tab" style={{ fontWeight: on ? 800 : 600, color: on ? "var(--text)" : "var(--text-2)" }}>
                {u.short}
              </span>
              <span className="block rounded-full" style={{ width: 56, height: 4, background: on ? "var(--u-ink)" : "transparent" }} aria-hidden />
            </button>
          );
        })}
      </div>
      <div className="px-6 mt-8 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="v3-eyebrow">
            Unit {unit.n} · {unit.short}
          </div>
          <h3 className="v3-hero mt-2">{unit.short}</h3>
          <p className="v3-secondary mt-2 truncate">
            {counts.lessons}
            {NNBSP}lessons · {counts.questions}
            {NNBSP}questions
          </p>
        </div>
        <UnitArt unitId={unit.id} size={120} />
      </div>
      <div className="px-6 mt-8">
        {unit.lessons.slice(0, 3).map((l, k) => (
          <div key={l.id}>
            {k > 0 && <div className="v3-spine" aria-hidden />}
            <div className="v3-card v3-press flex items-center gap-4" role="button" tabIndex={0}>
              <UnitArt unitId={unit.id} size={96} />
              <div className="min-w-0 flex-1">
                <div className="v3-eyebrow">
                  Lesson {unit.n}.{k + 1} · {l.stages.length}
                  {NNBSP}stages
                </div>
                <div className="v3-card-title mt-1" style={{ overflowWrap: "anywhere", hyphens: "auto" }} lang="en">{l.title}</div>
                {k === 0 && (
                  <div className="v3-bar mt-3" role="progressbar" aria-label="Progress (mock)" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: "60%" }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
