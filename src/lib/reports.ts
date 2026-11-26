"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Phone-testing kit (Inspector Mode). Reports and the FPS toggle live in their own device-local store —
 * never in progress, export or sync.
 */
export interface Report {
  id: string;
  at: string;
  lessonId: string | null;
  stageIndex: number | null;
  screenIndex: number | null;
  route: string;
  note: string;
  viewport: string;
  userAgent: string;
  build: string;
}

interface ReportState {
  reports: Report[];
  fps: boolean;
  add: (r: Report) => void;
  clear: () => void;
  setFps: (v: boolean) => void;
}

export const useReports = create<ReportState>()(
  persist(
    (set) => ({
      reports: [],
      fps: false,
      add: (r) => set((s) => ({ reports: [...s.reports, r].slice(-200) })),
      clear: () => set({ reports: [] }),
      setFps: (fps) => set({ fps }),
    }),
    { name: "strata-reports", version: 1 },
  ),
);

/** Where the learner is right now (not persisted). LessonPlayer and ConceptFlow keep it current. */
interface Where {
  lessonId: string | null;
  stageIndex: number | null;
  screenIndex: number | null;
}
export const useWhere = create<Where>()(() => ({ lessonId: null, stageIndex: null, screenIndex: null }));

export const BUILD = process.env.NEXT_PUBLIC_BUILD ?? "dev";

/** Open state of the Inspector "Report this screen" sheet (triggered from the headers). */
export const useReportUi = create<{ open: boolean; setOpen: (v: boolean) => void }>()((set) => ({ open: false, setOpen: (open) => set({ open }) }));

export function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
