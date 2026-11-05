import type { NextConfig } from "next";

/**
 * The Surreal API (surreal-diamonds-api) on the private network, for example
 * http://127.0.0.1:4000. When it is set, /api/v1/* on this site is forwarded to
 * it, so the browser only ever talks to this origin. Rewrites are fixed at
 * build time: set it in the server's environment before `next build`. Without
 * it nothing is forwarded, so the site can ship before the API does.
 */
const apiInternalUrl = process.env.API_INTERNAL_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 82, 85],
    deviceSizes: [640, 768, 1024, 1280, 1440, 1920, 2400],
  },
  async rewrites() {
    if (!apiInternalUrl) return [];
    return [{ source: "/api/v1/:path*", destination: `${apiInternalUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
