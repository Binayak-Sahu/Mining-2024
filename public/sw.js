/* STRATA service worker — full offline support.
 * On install it precaches every file of the static export listed in precache.json (written by
 * scripts/build-sw.mjs after `next build`). Paths are relative to the worker scope, so the same
 * worker works locally ("/") and on GitHub Pages ("/<repo>/").
 */
const SCOPE = self.registration.scope;
let CACHE = "strata-runtime";

async function loadManifest() {
  const res = await fetch(new URL("precache.json", SCOPE), { cache: "no-store" });
  if (!res.ok) throw new Error("precache.json missing");
  return res.json();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const m = await loadManifest();
      CACHE = `strata-${m.version}`;
      const cache = await caches.open(CACHE);
      const urls = m.files.map((f) => new URL(f, SCOPE).toString());
      // Add in batches so one slow request does not stall the whole install.
      for (let i = 0; i < urls.length; i += 40) {
        await Promise.all(
          urls.slice(i, i + 40).map((u) =>
            cache.add(new Request(u, { cache: "reload" })).catch(() => undefined),
          ),
        );
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const m = await loadManifest().catch(() => null);
      if (m) CACHE = `strata-${m.version}`;
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("strata-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function currentCache() {
  const keys = await caches.keys();
  const name = keys.filter((k) => k.startsWith("strata-") && k !== "strata-runtime").sort().pop() || CACHE;
  return caches.open(name);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;
  if (url.pathname.endsWith("/sw.js") || url.pathname.endsWith("/precache.json")) return;

  if (req.mode === "navigate") {
    // Network first for pages (fresh content when online), cache when offline.
    event.respondWith(
      (async () => {
        const cache = await currentCache();
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          const hit = (await cache.match(req, { ignoreSearch: true })) || (await cache.match(new URL("./", SCOPE).toString()));
          return hit || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  // Cache first for static assets and RSC payloads; fall back to network and store.
  event.respondWith(
    (async () => {
      const cache = await currentCache();
      const hit = await cache.match(req, { ignoreSearch: url.pathname.endsWith(".txt") });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return new Response("", { status: 504 });
      }
    })(),
  );
});
