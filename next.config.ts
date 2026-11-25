import type { NextConfig } from "next";
import { execSync } from "node:child_process";

/** Build stamp shown in Profile: git short hash + UTC date (falls back to "dev" outside a git checkout). */
function buildStamp(): string {
  let hash = "dev";
  try {
    hash = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "dev";
  } catch {
    /* not a git checkout */
  }
  return `${hash} · ${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Static export for GitHub Pages.
 * NEXT_PUBLIC_BASE_PATH is "" locally and "/<repo-name>" in the GitHub Actions deploy workflow.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  env: { NEXT_PUBLIC_BUILD: buildStamp() },
};

export default nextConfig;
