import type { NextConfig } from "next";

// GitHub Pages export is enabled via BUILD_FOR_PAGES=1 env var. The dev
// server and standalone production build keep the default `standalone` output.
// The CI workflow for Pages sets BUILD_FOR_PAGES=1 and `next build` emits
// static HTML/CSS/JS into ./out — that's what gets pushed to the gh-pages branch.
const nextConfig: NextConfig = {
  output: process.env.BUILD_FOR_PAGES ? "export" : "standalone",
  // GitHub Pages serves from /webscan-website/ (project pages) — base path must
  // match. For a custom domain (webscan.lutzashl290788-cell.dev) this becomes "/".
  basePath: process.env.BUILD_FOR_PAGES && !process.env.CUSTOM_DOMAIN ? "/webscan-website" : "",
  assetPrefix: process.env.BUILD_FOR_PAGES && !process.env.CUSTOM_DOMAIN ? "/webscan-website/" : undefined,
  images: {
    // Static export can't use the Next.js image optimisation server.
    unoptimized: !!process.env.BUILD_FOR_PAGES,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  trailingSlash: !!process.env.BUILD_FOR_PAGES,
};

export default nextConfig;
