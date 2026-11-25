"use client";

import { toast } from "sonner";
import { usePrefs } from "./prefs";

/** Toggle Inspector Mode (device-local) and confirm with a toast. */
export function setInspector(on: boolean) {
  usePrefs.getState().setMasterUnlock(on);
  if (on) toast("Inspector Mode on", { description: "Every lesson is playable as a sandbox — progress is not saved in unlocked-by-Inspector runs.", id: "inspector" });
  else toast("Inspector Mode off", { description: "Your real locks and progress are back.", id: "inspector" });
}

export function toggleInspector() {
  setInspector(!usePrefs.getState().masterUnlock);
}
