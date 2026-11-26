"use client";

import Link from "next/link";
import { RepairButton } from "@/components/shell/RepairButton";

/** Route error boundary: offer a retry and the safe "Repair app" (offline cache only, never progress). */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-4">
      <div className="card p-5 sm:p-8 space-y-4">
        <h1 className="text-[24px] font-bold text-slate-900">Something went wrong</h1>
        <p className="flow-body text-slate-700">Try again. If the screen keeps failing, repair the app: it refreshes the offline files and keeps your progress.</p>
        <button type="button" onClick={reset} className="btn-3d tone-ink w-full px-4 py-3.5 min-h-[52px]">
          Try again
        </button>
        <RepairButton />
        <Link href="/" className="block text-center min-h-[44px] leading-[44px] text-[15px] font-semibold text-slate-600 underline underline-offset-4">
          Back to the expedition
        </Link>
      </div>
    </div>
  );
}
