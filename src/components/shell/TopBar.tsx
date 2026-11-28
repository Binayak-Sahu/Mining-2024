"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Flame, Zap, Map, BookMarked, Dumbbell, GraduationCap, Calculator, FlaskConical, KeyRound, Volume2, VolumeX, Sun, Moon, MonitorSmartphone } from "lucide-react";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor } from "@/lib/ranks";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs, type ThemePref } from "@/lib/prefs";
import { setInspector } from "@/lib/inspector";
import { ProfileMenu } from "./ProfileMenu";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { tactilePress } from "@/lib/motion";

const NAV = [
  { href: "/", label: "Path", Icon: Map },
  { href: "/warmup", label: "Warmup", Icon: Dumbbell },
  { href: "/exam", label: "Exam", Icon: GraduationCap },
  { href: "/lab", label: "Lab", Icon: FlaskConical },
  { href: "/tools", label: "Tools", Icon: Calculator },
  { href: "/codex", label: "Codex", Icon: BookMarked },
];

function isOn(href: string, path: string) {
  return href === "/" ? path === "/" || path.startsWith("/unit") : path.startsWith(href);
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        <rect x="1" y="2" width="28" height="26" rx="8" className="fill-slate-900" />
        <path d="M5 10 C 11 7, 19 12, 25 9 L25 13 C 19 16, 11 11, 5 14 Z" fill="var(--action)" />
        <path d="M5 16 C 11 13, 19 18, 25 15 L25 18 C 19 21, 11 16, 5 19 Z" className="fill-slate-50" opacity="0.9" />
        <path d="M5 21 C 11 18, 19 23, 25 20 L25 24 C 19 26, 11 22, 5 24 Z" fill="var(--success)" />
      </svg>
      {!compact && <span className="font-extrabold tracking-[0.16em] text-[14px] text-slate-900 max-[400px]:hidden">STRATA</span>}
    </span>
  );
}

/** Radix tooltip for icon-only header buttons (hover/focus on desktop). */
function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} className="z-50 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[14px] font-semibold text-slate-50">
          {label}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

const THEME_NEXT: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };

export function ThemeToggle() {
  const hydrated = useHydrated();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const t = hydrated ? theme : "system";
  const Icon = t === "light" ? Sun : t === "dark" ? Moon : MonitorSmartphone;
  const label = t === "light" ? "Crisp Daylight" : t === "dark" ? "Underground Shift Mode" : "Match device theme";
  return (
    <Tip label={`Theme: ${label}`}>
      <button type="button" onClick={() => setTheme(THEME_NEXT[t])} aria-label={`Theme: ${label}. Tap to change.`} className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100">
      <motion.span key={t} initial={{ rotate: -90, scale: 0.6, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={tactilePress}>
        <Icon size={18} />
      </motion.span>
    </button>
    </Tip>
  );
}

/** Subtle key icon: toggles Inspector Mode on desktop; on phones it only appears while the mode is on. */
export function InspectorBadge() {
  const hydrated = useHydrated();
  const on = usePrefs((s) => s.masterUnlock);
  if (!hydrated) return null;
  if (!on)
    return (
      <Tip label={"Inspector Mode (Shift+M)"}>
      <button type="button" onClick={() => setInspector(true)} aria-label="Turn on Inspector Mode" className="hidden sm:flex w-11 h-11 rounded-xl items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">
        <KeyRound size={17} />
      </button>
    </Tip>
    );
  return (
    <Tip label={"Inspector Mode is on — turn off (Shift+M)"}>
      <button type="button" onClick={() => setInspector(false)} aria-label="Inspector Mode on. Turn off" className="w-11 h-11 rounded-xl flex items-center justify-center text-energy-tint-text bg-energy-tint">
      <KeyRound size={18} />
    </button>
    </Tip>
  );
}

export function MuteToggle() {
  const hydrated = useHydrated();
  const muted = usePrefs((s) => s.muted);
  const toggle = usePrefs((s) => s.toggleMuted);
  const m = hydrated && muted;
  return (
    <Tip label={m ? "Sound off" : "Sound on"}>
      <button type="button" onClick={toggle} data-silent="1" aria-label={m ? "Unmute sound effects" : "Mute sound effects"} aria-pressed={m} className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100">
      {m ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
    </Tip>
  );
}

/** Streak flame that pops (and plays the unlock arpeggio) the moment the streak grows. */
function StreakFlame({ n }: { n: number }) {
  const controls = useAnimationControls();
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current) void controls.start({ scale: [1, 1.5, 0.9, 1.1, 1], rotate: [0, -12, 10, 0], transition: { duration: 0.7 } });
    prev.current = n;
  }, [n, controls]);
  return (
    <motion.span animate={controls} className="inline-flex">
      <Flame size={22} className={n > 0 ? "fill-energy" : ""} />
    </motion.span>
  );
}

export function TopBar() {
  const hydrated = useHydrated();
  const path = usePathname();
  const xp = useStrata((s) => s.xp);
  const streak = useStrata((s) => s.streak);
  const last = useStrata((s) => s.lastActiveDay);
  if (path.startsWith("/lesson")) return null;
  const { rank, index } = rankFor(hydrated ? xp : 0);
  const st = hydrated ? liveStreak(streak, last) : 0;

  return (
    <header className="chrome sticky top-0 z-30 bg-canvas pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center gap-1 sm:gap-4">
        <Link href="/" className="hidden md:flex items-center shrink-0 min-h-[44px] min-w-[44px]" aria-label="STRATA home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-0.5 ml-3 rounded-2xl bg-surface-2 p-1">
          {NAV.map(({ href, label, Icon }) => {
            const on = isOn(href, path);
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[14px] font-bold ${on ? "text-fg" : "text-fg-3 hover:text-fg"}`}>
                {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-surface border-2 border-line" transition={tactilePress} />}
                <Icon size={16} className="relative" />
                <span className="relative hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        {/* §5.1b: streak pill left; XP pill, sound and avatar right. Key, flag and theme live in the avatar menu. */}
        <span className="stat-pill !px-2.5 !gap-1 text-fg md:ml-auto" title="Daily streak" aria-label={`Daily streak ${st}`} data-testid="stat-streak">
          <span className="text-energy-tint-text inline-flex"><StreakFlame n={st} /></span> {st}
        </span>
        <div className="ml-auto md:ml-0 flex items-center gap-1 sm:gap-1.5">
          <span className="stat-pill !px-2.5 !gap-1 text-fg" title="Experience points" aria-label={`Experience points ${hydrated ? xp : 0}`} data-testid="stat-xp">
            <Zap size={20} className="text-fg fill-current" aria-hidden /> <AnimatedNumber value={hydrated ? xp : 0} digits={0} />
          </span>
          <MuteToggle />
          <ProfileMenu badge={["T", "OM", "AM", "2C", "1C"][index]} rankTitle={rank.title} />
        </div>
      </div>
    </header>
  );
}

/** Thumb-zone tab bar for phones (DESIGN.md §5.8): solid --bg, one active style, 12 px labels. */
export function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/lesson")) return null;
  return (
    <>
      <div className="md:hidden h-[calc(64px+env(safe-area-inset-bottom))]" aria-hidden />
      <nav className="chrome md:hidden fixed bottom-0 inset-x-0 z-30 ds-tabbar" aria-label="Primary">
        {NAV.map(({ href, label, Icon }) => {
          const on = isOn(href, path);
          return (
            <Link key={href} href={href} className="ds-tab" aria-current={on ? "page" : undefined}>
              <span className="ds-tab-icon">
                <Icon size={24} strokeWidth={2} aria-hidden />
              </span>
              <span className="t-tab">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
