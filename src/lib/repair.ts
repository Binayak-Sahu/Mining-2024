"use client";

/**
 * "Repair app": unregister the service worker and delete STRATA's offline caches, then reload.
 * Never touches localStorage — saved progress, preferences and backups are left exactly as they are.
 */
export async function repairApp(): Promise<{ workers: number; caches: number }> {
  let workers = 0;
  let removed = 0;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) if (await r.unregister()) workers++;
    }
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      for (const k of keys) if (k.startsWith("strata-") && (await caches.delete(k))) removed++;
    }
  } catch {
    /* ignore */
  }
  return { workers, caches: removed };
}

export async function repairAndReload() {
  await repairApp();
  window.location.reload();
}
