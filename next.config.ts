import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 82, 85],
    deviceSizes: [640, 768, 1024, 1280, 1440, 1920, 2400],
  },
};

export default nextConfig;
