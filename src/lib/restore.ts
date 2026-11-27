"use client";

import { toast } from "sonner";
import { importProgress } from "@/lib/sync";

/**
 * Restore progress from an export file (the one restore path, shared by Profile › Move progress and the
 * profile menu's Backup & restore). "replace" asks first. Storage keys and the export schema are unchanged.
 */
export async function restoreFromFile(f: File | undefined, mode: "merge" | "replace"): Promise<void> {
  if (!f) return;
  try {
    const text = await f.text();
    if (mode === "replace" && !window.confirm("Replace ALL progress on this device with the imported file?")) return;
    const r = importProgress(text, mode);
    toast.success(`Imported (${mode}): ${r.xp} XP, ${r.lessons} lessons, ${r.codex} Codex sheets.`);
  } catch (e) {
    toast.error((e as Error).message);
  }
}
