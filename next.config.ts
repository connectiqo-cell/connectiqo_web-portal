import path from "node:path";

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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

  allowedDevOrigins: ['192.168.163.1', '192.168.1.7', '172.31.32.1', '172.20.32.1'],

};

export default withSentryConfig(nextConfig, {
  // Silent unless SENTRY_AUTH_TOKEN is set (source map upload is then a no-op) —
  // safe to build/deploy without a Sentry project configured yet.
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
