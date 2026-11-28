import Link from "next/link";
import { BookOpen, CircleHelp, type LucideIcon } from "lucide-react";
import type { Unit } from "@/lib/types";
import { unitIcon } from "@/content/unitIcons";
import { unitCounts } from "@/lib/questions";
import { stratumFor } from "./strata";
import { familyOf } from "@/lib/family";

/** §5.11 unit icon tile: --surface-2 face, card border, radius 20, icon in --text at 45 % of the tile size. */
export function UnitIconTile({ Icon, size = 88 }: { Icon: LucideIcon; size?: 88 | 112 }) {
  return (
    <div aria-hidden className="unit-tile shrink-0" style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.45)} strokeWidth={2} />
    </div>
  );
}

/** §5.3 6 px progress bar: track --surface-2, fill success. */
export function ProgressBar({ f, label }: { f: number; label: string }) {
  const pct = Math.round(f * 100);
  return (
    <div className="h-[6px] rounded-full overflow-hidden bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="h-full rounded-full bg-progress" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** §5.3 course card for one unit: icon tile, eyebrow, heading title, rock layer, progress (started units), Next badge. */
export function CourseCard({ unit, progress, badge }: { unit: Unit; progress: number; badge?: "Next" | "New" }) {
  const st = stratumFor(unit.n);
  return (
    <Link href={`/unit/${unit.id}`} data-family={familyOf(unit.id)} className="card course-card relative flex items-center gap-4 p-5 sm:p-6">
      <UnitIconTile Icon={unitIcon(unit.id)} />
      <div className={`min-w-0 flex-1 ${badge ? "pr-16" : ""}`}>
        <div className="t-eyebrow">
          Unit {unit.n} · <span className="readout normal-case tracking-normal">{st.depth}</span>
        </div>
        <div className="t-heading mt-1 text-fg text-balance">{unit.title}</div>
        <div className="t-label mt-1 text-fg-2">{st.name}</div>
        {progress > 0 && (
          <div className="mt-3">
            <ProgressBar f={progress} label={`Unit ${unit.n} progress`} />
          </div>
        )}
      </div>
      {badge && (
        <span className="t-label course-badge absolute top-3 right-3 rounded-full px-3" data-badge={badge} style={{ fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

/** §5.10 unit header: centred icon tile, display title, secondary description, computed lessons/questions row. */
export function UnitHeader({ unit }: { unit: Unit }) {
  const { lessons, questions } = unitCounts(unit);
  return (
    <header className="flex flex-col items-center text-center">
      <UnitIconTile Icon={unitIcon(unit.id)} size={112} />
      <h1 className="t-display mt-6 text-fg text-balance">{unit.title}</h1>
      <p className="t-secondary mt-3 line-clamp-3 max-w-[520px]">{unit.blurb}</p>
      <div className="t-secondary mt-6 flex items-center justify-center gap-6">
        <span className="inline-flex items-center gap-2">
          <BookOpen size={20} aria-hidden /> {lessons} lesson{lessons === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-2">
          <CircleHelp size={20} aria-hidden /> {questions} questions
        </span>
      </div>
    </header>
  );
}

/** §5.3 level header card: action border and ledge, action-tint eyebrow, heading title, centred. */
export function LevelHeader({ eyebrow, title }: { eyebrow: React.ReactNode; title: string }) {
  return (
    <div className="card level-card p-5 sm:p-6 text-center">
      <div className="t-eyebrow text-action-tint-text">{eyebrow}</div>
      <div className="t-heading mt-1 text-fg">{title}</div>
    </div>
  );
}
