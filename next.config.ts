import type { NextConfig } from "next";

const localBackend = process.env.NODE_ENV === "development" ? " http://localhost:4000" : "";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  partialPrefetching: false,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/api/uploads/r2/**" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com", pathname: "/**" },
      { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 768, 1024, 1280],
    imageSizes: [16, 32, 64, 76, 96, 128, 168, 210],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; img-src 'self' data: https:${localBackend}; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:${localBackend}; font-src 'self' data:;`,
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
