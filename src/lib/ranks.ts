export interface Rank {
  title: string;
  min: number;
  badge: string;
}

export const RANKS: Rank[] = [
  { title: "Trainee", min: 0, badge: "T" },
  { title: "Overman", min: 600, badge: "OM" },
  { title: "Assistant Manager", min: 2000, badge: "AM" },
  { title: "Second Class Manager", min: 4500, badge: "2C" },
  { title: "First Class Unrestricted Manager", min: 8000, badge: "1C" },
];

export function rankFor(xp: number): { rank: Rank; next: Rank | null; progress: number; index: number } {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) index = i;
  const rank = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const progress = next ? (xp - rank.min) / (next.min - rank.min) : 1;
  return { rank, next, progress: Math.max(0, Math.min(1, progress)), index };
}

/** XP awarded per stage kind on first-try success. */
export const STAGE_XP: Record<string, number> = {
  theory: 10,
  sim: 20,
  predict: 15,
  equation: 20,
  numeric: 30,
  crisis: 35,
  swipe: 25,
};

export const LESSON_BONUS = 50;
export const BOSS_BONUS = 200;
export const HEARTS_PER_LESSON = 3;
