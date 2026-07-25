import { expect, test } from "@playwright/test";

/**
 * These smoke tests intentionally never submit a real signup/login/booking —
 * this app has no separate staging Supabase project, only the same one the
 * mobile app and production web use. Anything that would create real rows
 * (accounts, bookings, payments) needs a dedicated test project first; see
 * the "Testing" section of the deployment notes. Until then, this suite
 * covers page rendering, client-side validation, and auth gating only.
 */

test.describe("Public pages", () => {
  test("home page renders and links to discover/auth", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "1-on-1 Live Mentorship" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("discover page renders", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover Mentors" })).toBeVisible();
  });

  test("privacy and terms pages render", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
  });

  test("nonexistent mentor profile 404s", async ({ page }) => {
    const response = await page.goto("/mentor/00000000-0000-0000-0000-000000000000");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Auth forms (client-side validation only, no submission)", () => {
  test("login page validates email before calling Supabase", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();

    await page.getByPlaceholder("Email Address").fill("not-an-email");
    await page.getByPlaceholder("Password").fill("whatever");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  });

  test("signup page validates password strength before calling Supabase", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();

    await page.getByPlaceholder("Full Name").fill("Test User");
    await page.getByPlaceholder("Email Address").fill("test@example.com");
    await page.getByPlaceholder("Password", { exact: true }).fill("weak");
    await page.getByPlaceholder("Confirm Password").fill("weak");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText("Must be at least 8 characters")).toBeVisible();
  });
});

test.describe("Auth gating", () => {
  const protectedPaths = ["/bookings", "/settings", "/mentor/profile", "/notifications"];

  for (const path of protectedPaths) {
    test(`${path} redirects signed-out visitors to /login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/login/);
      await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
    });
  }
});
