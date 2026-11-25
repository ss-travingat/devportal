import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
  // Internal tool: tell search engines not to index anything served here,
  // including static files the proxy doesn't run on.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    resolveAlias: {
      // Framer code components import this directly from esm.sh (that's how they
      // run inside Framer). We keep that import untouched and just teach the
      // bundler to resolve it to the equivalent npm package instead.
      "https://esm.sh/countries-list@3.4.1": "countries-list",
    },
  },
};

export default nextConfig;
