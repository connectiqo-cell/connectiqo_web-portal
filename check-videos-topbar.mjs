import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (err) => console.log("pageerror:", err.message));

const email = `qa.videostop.${Date.now()}@example.com`;
const password = "TestPass123!";

await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
await page.fill('input[name="name"], input[placeholder="Full Name"]', "QA Videos Topbar");
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
await page.waitForTimeout(1000);
await page.screenshot({ path: "videos-topbar.png", fullPage: true });

const info = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  windowInnerHeight: window.innerHeight,
  headerRect: document.querySelector("header")?.getBoundingClientRect(),
  mainRect: document.querySelector("main")?.getBoundingClientRect(),
}));
console.log(JSON.stringify(info, null, 2));

await browser.close();
