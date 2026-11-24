import type { NextConfig } from "next";

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
};

export default nextConfig;
