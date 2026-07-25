import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests against pages that don't require live Razorpay/VideoSDK
 * interaction (public marketing/discovery pages, auth form validation).
 * A full "signup -> browse -> book -> pay -> join call" run needs real
 * payment/video infra and is intentionally out of scope here — see
 * README notes in this file's directory for manual QA steps instead.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
