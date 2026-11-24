// Minimal static server for the exported site (out/), honouring NEXT_PUBLIC_BASE_PATH.
// Usage: npm start  → http://localhost:3000
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PORT = Number(process.env.PORT ?? 3000);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain", ".ico": "image/x-icon", ".woff2": "font/woff2" };

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length) || "/";
  let file = normalize(join("out", path));
  if (!file.startsWith("out")) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    file = join("out", "404.html");
  }
  try {
    const body = await readFile(file);
    res.writeHead(file.endsWith("404.html") && !path.endsWith("404.html") ? 404 : 200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(PORT, () => console.log(`STRATA static build at http://localhost:${PORT}${BASE}/`));
