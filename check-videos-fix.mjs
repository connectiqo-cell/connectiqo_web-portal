import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

// logged-out check
await page.goto("http://localhost:3000/videos", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
let info = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  windowInnerHeight: window.innerHeight,
}));
console.log("logged-out:", JSON.stringify(info));

const email = `qa.videosfix.${Date.now()}@example.com`;
const password = "TestPass123!";
await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
await page.fill('input[name="name"], input[placeholder="Full Name"]', "QA Videos Fix");
await page.fill('input[type="email"], input[placeholder="Email Address"]', email);
const pwFields = page.locator('input[type="password"]');
await pwFields.nth(0).fill(password);
await pwFields.nth(1).fill(password);
await page.click('button:has-text("Create Account")');
await page.waitForTimeout(1500);
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill('input[type="email"], input[placeholder="Email Address"]', email);
await page.fill('input[type="password"]', password);
await page.click('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');
await page.waitForTimeout(2000);

await page.goto("http://localhost:3000/videos", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
info = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  windowInnerHeight: window.innerHeight,
}));
console.log("logged-in:", JSON.stringify(info));
await page.screenshot({ path: "videos-fixed.png" });

await browser.close();
