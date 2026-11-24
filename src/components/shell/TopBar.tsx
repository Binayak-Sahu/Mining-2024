"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Zap, Map, BookMarked, Dumbbell, User, GraduationCap, Calculator, FlaskConical, ArrowLeftRight } from "lucide-react";
import { useStrata, liveStreak } from "@/lib/store";
import { rankFor } from "@/lib/ranks";
import { useHydrated } from "@/lib/useHydrated";

const NAV = [
  { href: "/", label: "Campaign", Icon: Map },
  { href: "/warmup", label: "Warmup", Icon: Dumbbell },
  { href: "/exam", label: "Exam", Icon: GraduationCap },
  { href: "/tools", label: "Tools", Icon: Calculator },
  { href: "/lab", label: "Lab", Icon: FlaskConical },
  { href: "/codex", label: "Codex", Icon: BookMarked },
  { href: "/profile", label: "Profile", Icon: User },
];

export function TopBar() {
  const hydrated = useHydrated();
  const path = usePathname();
  const xp = useStrata((s) => s.xp);
  const streak = useStrata((s) => s.streak);
  const last = useStrata((s) => s.lastActiveDay);
  if (path.startsWith("/lesson")) return null;
  const { rank } = rankFor(hydrated ? xp : 0);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0F172A]/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 min-h-[44px]">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
            <rect x="1" y="3" width="24" height="5" rx="1" fill="#3B82F6" />
            <rect x="1" y="10.5" width="24" height="5" rx="1" fill="#F8FAFC" />
            <rect x="1" y="18" width="24" height="5" rx="1" fill="#10B981" />
          </svg>
          <span className="font-extrabold tracking-[0.2em] text-sm">STRATA</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-1 ml-2">
          {NAV.map(({ href, label, Icon }) => {
            const on = href === "/" ? path === "/" || path.startsWith("/unit") : path.startsWith(href);
            return (
              <Link key={href} href={href} title={label} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider ${on ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}>
                <Icon size={14} /> <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 readout text-sm">
          <Link href="/profile/#sync" title="Export / import progress" aria-label="Export or import progress" className="text-slate-400 hover:text-white flex items-center justify-center w-11 h-11">
            <ArrowLeftRight size={16} />
          </Link>
          <span className="hidden md:inline text-[11px] uppercase tracking-wider text-slate-400 font-sans font-semibold">{hydrated ? rank.title : "—"}</span>
          <span className="flex items-center gap-1 text-amber-400 font-bold" title="Daily streak">
            <Flame size={16} /> {hydrated ? liveStreak(streak, last) : 0}
          </span>
          <span className="flex items-center gap-1 text-blue-400 font-bold" title="Experience">
            <Zap size={16} /> {hydrated ? xp : 0}
          </span>
        </div>
      </div>
      <nav className="sm:hidden flex border-t border-slate-800 overflow-x-auto">
        {NAV.map(({ href, label, Icon }) => {
          const on = href === "/" ? path === "/" || path.startsWith("/unit") : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex-1 min-w-[56px] flex flex-col items-center py-1.5 text-[10px] font-bold uppercase ${on ? "text-white" : "text-slate-500"}`}>
              <Icon size={16} /> {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
