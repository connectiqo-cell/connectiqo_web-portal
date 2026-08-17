import path from "node:path";

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Bundles a minimal self-contained server (.next/standalone) with only the
  // production deps actually used, traced via webpack. The Docker production
  // stage copies that instead of running a second `npm ci --only=production`
  // — avoids the whole class of "works in the builder, fails in prod install"
  // Docker issues from re-installing with a different flag/environment.
  output: "standalone",
  // VideoSDK's MeetingProvider joins a live WebRTC session (grabs the
  // camera/mic, opens a signaling socket) from a plain mount effect that
  // isn't idempotent. Strict Mode's intentional dev-only double-invoke of
  // mount effects makes it join twice in a row, racing itself for the
  // webcam and throwing ERROR_OPERATION_IN_PROGRESS / ERROR_WEBCAM_PRODUCE_FAILED.
  // Real users never hit this — Strict Mode's double-invoke only happens in
  // development, not in production builds.
  reactStrictMode: false,
  turbopack: {
    // Pin the workspace root to this project — avoids Next.js misdetecting
    // it as C:\Users\sande because of a stray lockfile in the home directory.
    root: path.resolve(__dirname),
  },

  // Image optimization: allow common external hosts (Supabase storage, VideoSDK CDN,
  // and common Google storage hosts). This enables `next/image` optimizations
  // (responsive sizes, caching, and automatic lazy-loading).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "cdn.videosdk.live", pathname: "/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
  // WSL2/Hyper-V's vEthernet adapter (172.16-172.31.x.x) and typical home-router
  // LANs (192.168.x.x) hand out a new IP on every restart, so pin wildcards
  // instead of chasing individual addresses each time dev access breaks.
  allowedDevOrigins: ['172.*.*.*', '192.168.*.*'],

};

export default withSentryConfig(nextConfig, {
  // Silent unless SENTRY_AUTH_TOKEN is set (source map upload is then a no-op) —
  // safe to build/deploy without a Sentry project configured yet.
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
