"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, Zap, Map, BookMarked, Dumbbell, GraduationCap, Calculator, FlaskConical, ArrowLeftRight, Volume2, VolumeX, Sun, Moon, MonitorSmartphone } from "lucide-react";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor } from "@/lib/ranks";
import { useHydrated } from "@/lib/useHydrated";
import { usePrefs, type ThemePref } from "@/lib/prefs";

const NAV = [
  { href: "/", label: "Path", Icon: Map, tint: "#3B82F6" },
  { href: "/warmup", label: "Warmup", Icon: Dumbbell, tint: "#10B981" },
  { href: "/exam", label: "Exam", Icon: GraduationCap, tint: "#EF4444" },
  { href: "/lab", label: "Lab", Icon: FlaskConical, tint: "#8B5CF6" },
  { href: "/tools", label: "Tools", Icon: Calculator, tint: "#F59E0B" },
  { href: "/codex", label: "Codex", Icon: BookMarked, tint: "#0EA5E9" },
];

function isOn(href: string, path: string) {
  return href === "/" ? path === "/" || path.startsWith("/unit") : path.startsWith(href);
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
        <defs>
          <linearGradient id="lg-a" x1="0" x2="1">
            <stop offset="0" stopColor="#60A5FA" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="lg-c" x1="0" x2="1">
            <stop offset="0" stopColor="#34D399" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <rect x="1" y="2" width="28" height="26" rx="8" className="fill-slate-900" />
        <path d="M5 10 C 11 7, 19 12, 25 9 L25 13 C 19 16, 11 11, 5 14 Z" fill="url(#lg-a)" />
        <path d="M5 16 C 11 13, 19 18, 25 15 L25 18 C 19 21, 11 16, 5 19 Z" className="fill-slate-50" opacity="0.9" />
        <path d="M5 21 C 11 18, 19 23, 25 20 L25 24 C 19 26, 11 22, 5 24 Z" fill="url(#lg-c)" />
      </svg>
      {!compact && <span className="font-extrabold tracking-[0.22em] text-[13px] text-slate-900 max-[400px]:hidden">STRATA</span>}
    </span>
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
    <button type="button" onClick={() => setTheme(THEME_NEXT[t])} title={`Theme: ${label}`} aria-label={`Theme: ${label}. Tap to change.`} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100">
      <motion.span key={t} initial={{ rotate: -90, scale: 0.6, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
        <Icon size={18} />
      </motion.span>
    </button>
  );
}

export function MuteToggle() {
  const hydrated = useHydrated();
  const muted = usePrefs((s) => s.muted);
  const toggle = usePrefs((s) => s.toggleMuted);
  const m = hydrated && muted;
  return (
    <button type="button" onClick={toggle} data-silent="1" title={m ? "Sound off" : "Sound on"} aria-label={m ? "Unmute sound effects" : "Mute sound effects"} aria-pressed={m} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100">
      {m ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
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
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-canvas/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 h-16 flex items-center gap-2 sm:gap-4">
        <Link href="/" className="flex items-center shrink-0 min-h-[44px]" aria-label="STRATA home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-0.5 ml-3 rounded-2xl bg-slate-100 p-1">
          {NAV.map(({ href, label, Icon, tint }) => {
            const on = isOn(href, path);
            return (
              <Link key={href} href={href} className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold ${on ? "text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
                {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.08),0_2px_0_var(--n-200)]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                <Icon size={15} className="relative" color={on ? tint : undefined} />
                <span className="relative hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <span className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-orange-500 font-extrabold readout text-sm" title="Daily streak">
            <Flame size={18} className={st > 0 ? "fill-orange-400" : ""} /> {st}
          </span>
          <span className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-blue-500 font-extrabold readout text-sm" title="Experience points">
            <Zap size={18} className="fill-blue-400/40" /> {hydrated ? xp : 0}
          </span>
          <MuteToggle />
          <ThemeToggle />
          <Link href="/profile/#sync" title="Export / import progress" aria-label="Export or import progress" className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100">
            <ArrowLeftRight size={17} />
          </Link>
          <Link href="/profile" title={`Profile · ${rank.title}`} aria-label={`Profile, rank ${rank.title}`} className="ml-0.5 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-[11px] font-black readout shadow-[0_2px_0_rgba(15,23,42,0.25)] ring-2 ring-surface">
            {["T", "OM", "AM", "2C", "1C"][index]}
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Thumb-zone tab bar for phones. */
export function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/lesson")) return null;
  return (
    <>
      <div className="md:hidden h-[calc(76px+env(safe-area-inset-bottom))]" aria-hidden />
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/70 bg-canvas/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
        <div className="grid grid-cols-6 px-1.5 pt-1.5 pb-1">
          {NAV.map(({ href, label, Icon, tint }) => {
            const on = isOn(href, path);
            return (
              <Link key={href} href={href} className="relative flex flex-col items-center gap-0.5 py-1 min-h-[56px]" aria-current={on ? "page" : undefined}>
                <span className="relative flex items-center justify-center w-12 h-8 rounded-xl">
                  {on && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl" style={{ background: `${tint}22`, boxShadow: `inset 0 0 0 1.5px ${tint}55` }} transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
                  <Icon size={20} className="relative" color={on ? tint : "currentColor"} strokeWidth={on ? 2.4 : 2} />
                </span>
                <span className={`text-[10.5px] font-bold ${on ? "text-slate-900" : "text-slate-500"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
