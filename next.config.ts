import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually reached — the whole deploy becomes three folders.
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2200],
    imageSizes: [64, 96, 128, 200, 300, 420],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ctqloznxfmqjhzgleima.supabase.co",
        pathname: "/storage/v1/object/public/project-images/**",
      },
    ],
  },
  // node:sqlite is a Node builtin used only on the server.
  serverExternalPackages: [],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/projects/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    // Keep every public URL on the apex production hostname. Locale routing
    // and unauthenticated admin access remain handled in middleware.ts.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.imranalasr.sa" }],
        destination: "https://imranalasr.sa/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
