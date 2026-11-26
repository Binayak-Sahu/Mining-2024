import { Pickaxe, Wind, Mountain, Shield, type LucideIcon } from "lucide-react";

/** §5.11 unit icon tile: --surface-2 face, card border, radius 20, icon in --text at 45 % of the tile size. */
export function UnitIconTile({ Icon, size = 88 }: { Icon: LucideIcon; size?: 88 | 112 }) {
  return (
    <div aria-hidden className="shrink-0 flex items-center justify-center rounded-[20px]" style={{ width: size, height: size, background: "var(--surface-2)", border: "2px solid var(--line)", borderBottomWidth: 5, color: "var(--text)" }}>
      <Icon size={Math.round(size * 0.45)} strokeWidth={2} />
    </div>
  );
}

/** §5.3 course/unit card: icon tile, eyebrow, heading title, optional progress, optional Next/New badge. */
export function CourseCard({ Icon, eyebrow, title, progress, badge }: { Icon: LucideIcon; eyebrow: string; title: string; progress?: number; badge?: "Next" | "New" }) {
  return (
    <div className="card relative flex items-center gap-4 p-5 sm:p-6">
      <UnitIconTile Icon={Icon} />
      <div className={`min-w-0 flex-1 ${badge ? "pr-14" : ""}`}>
        <div className="t-eyebrow">{eyebrow}</div>
        <div className="t-heading mt-1">{title}</div>
        {progress !== undefined && (
          <div className="mt-3 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={`${title} progress`}>
            <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: "var(--success)" }} />
          </div>
        )}
      </div>
      {badge && (
        <span
          className="t-label absolute top-3 right-3 rounded-full px-3"
          style={{ fontWeight: 700, color: badge === "Next" ? "var(--action-on)" : "var(--success-on)", background: badge === "Next" ? "var(--action)" : "var(--success)" }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/** §5.3 level header card: action border and ledge, action-tint eyebrow, heading title, centred. */
export function LevelHeader({ level, title }: { level: number; title: string }) {
  return (
    <div className="card p-5 sm:p-6 text-center" style={{ borderColor: "var(--action)" }}>
      <div className="t-eyebrow" style={{ color: "var(--action-tint-text)" }}>
        Level {level}
      </div>
      <div className="t-heading mt-1">{title}</div>
    </div>
  );
}

/** §5.4 course spine: three stacked cards; the 4 px line runs only through the 32 px gaps. */
export function CourseSpine() {
  const cards = [
    { Icon: Mountain, eyebrow: "Unit 3 · Rock mechanics", title: "Stress around openings", progress: 1 },
    { Icon: Wind, eyebrow: "Unit 7 · Ventilation", title: "Mine gases", progress: 0.4, badge: "Next" as const },
    { Icon: Shield, eyebrow: "Unit 9 · Safety", title: "Rescue and recovery", badge: "New" as const },
  ];
  return (
    <div className="ds-spine">
      {cards.map((c, i) => (
        <div key={c.title} className="flex flex-col">
          {i > 0 && <div className="ds-spine-gap" aria-hidden />}
          <CourseCard {...c} />
        </div>
      ))}
    </div>
  );
}

export function CardsDemo() {
  return (
    <div className="space-y-8">
      <div>
        <div className="t-label mb-3" style={{ color: "var(--text-2)" }}>
          Course card with progress and a Next badge
        </div>
        <CourseCard Icon={Wind} eyebrow="Unit 7 · Ventilation" title="Mine gases" progress={0.4} badge="Next" />
      </div>
      <div>
        <div className="t-label mb-3" style={{ color: "var(--text-2)" }}>
          Unit icon tile, 88 px (cards) and 112 px (unit header)
        </div>
        <div className="flex items-end gap-4">
          <UnitIconTile Icon={Pickaxe} />
          <UnitIconTile Icon={Pickaxe} size={112} />
        </div>
      </div>
      <div>
        <div className="t-label mb-3" style={{ color: "var(--text-2)" }}>
          Level header card
        </div>
        <LevelHeader level={1} title="Methane basics" />
      </div>
      <div>
        <div className="t-label mb-3" style={{ color: "var(--text-2)" }}>
          Course spine with three cards
        </div>
        <CourseSpine />
      </div>
    </div>
  );
}
