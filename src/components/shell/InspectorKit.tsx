"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";
import { usePrefs } from "@/lib/prefs";
import { BUILD, useReports, useWhere } from "@/lib/reports";
import { useHydrated } from "@/lib/useHydrated";

/** Rolling frames-per-second readout (Inspector Mode toggle). */
function FpsMeter() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const tick = (t: number) => {
      frames++;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const tone = fps >= 55 ? "#34D399" : fps >= 40 ? "#FBBF24" : "#F87171";
  return (
    <div className="fixed left-2 top-[calc(env(safe-area-inset-top)+64px)] z-50 rounded-lg bg-[#0E1424]/90 px-2 py-1 readout text-[12px] font-bold pointer-events-none" style={{ color: tone }} aria-hidden>
      {fps} fps
    </div>
  );
}

/** Floating "Report" button + FPS meter, shown only while Inspector Mode is on. */
export function InspectorKit() {
  const hydrated = useHydrated();
  const on = usePrefs((p) => p.masterUnlock);
  const fps = useReports((r) => r.fps);
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const note = useRef<HTMLTextAreaElement>(null);
  if (!hydrated || !on) return null;
  const inLesson = path.startsWith("/lesson");
  const save = () => {
    const w = useWhere.getState();
    useReports.getState().add({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      lessonId: inLesson ? w.lessonId : null,
      stageIndex: inLesson ? w.stageIndex : null,
      screenIndex: inLesson ? w.screenIndex : null,
      route: path,
      note: note.current?.value.trim() ?? "",
      viewport: `${window.innerWidth}×${window.innerHeight}@${window.devicePixelRatio}`,
      userAgent: navigator.userAgent,
      build: BUILD,
    });
    setOpen(false);
    toast.success("Report saved — export it from Profile");
  };
  return (
    <>
      {fps && <FpsMeter />}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button type="button" aria-label="Report a problem on this screen" className={`fixed right-3 z-40 w-12 h-12 rounded-full bg-amber-500 text-white shadow-[0_3px_0_#B45309,0_8px_20px_-6px_rgba(0,0,0,0.4)] flex items-center justify-center ${inLesson ? "bottom-[calc(env(safe-area-inset-bottom)+96px)]" : "bottom-[calc(env(safe-area-inset-bottom)+88px)] md:bottom-6"}`}>
            <Flag size={20} />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl focus:outline-none" aria-describedby={undefined}>
            <div className="flex items-center justify-between mb-3">
              <Dialog.Title className="text-[19px] font-bold text-slate-900">Report this screen</Dialog.Title>
              <Dialog.Close className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Close">
                <X size={20} />
              </Dialog.Close>
            </div>
            <p className="text-[13px] text-slate-600 mb-2">Saved with the route, lesson/stage/screen, viewport, device and build ({BUILD}).</p>
            <textarea ref={note} rows={4} placeholder="What looks or feels wrong?" className="w-full rounded-xl border border-slate-400 bg-surface p-3 text-[16px] text-slate-900" />
            <button type="button" onClick={save} className="btn-3d tone-ink w-full px-4 py-3.5 min-h-[52px] mt-3">
              Save report
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
