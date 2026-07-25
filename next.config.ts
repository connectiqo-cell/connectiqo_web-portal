import path from "node:path";

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project — avoids Next.js misdetecting
    // it as C:\Users\sande because of a stray lockfile in the home directory.
    root: path.resolve(__dirname),
  },

  allowedDevOrigins: ['192.168.163.1'],

};

export default withSentryConfig(nextConfig, {
  // Silent unless SENTRY_AUTH_TOKEN is set (source map upload is then a no-op) —
  // safe to build/deploy without a Sentry project configured yet.
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
