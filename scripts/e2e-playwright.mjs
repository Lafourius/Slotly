import fs from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const OUT = "artifacts";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
});
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(String(error)));

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` — ${detail}`}`);
}

// ---------------------------------------------------------------------------
// Owner sign in
// ---------------------------------------------------------------------------
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[type="email"]', "demo@slotly.app");
await page.fill('input[type="password"]', "SlotlyDemo2026");
await Promise.all([
  page.waitForURL("**/dashboard", { timeout: 30000 }),
  page.click('button[type="submit"]'),
]);
check("Owner can sign in with email and password", page.url().includes("/dashboard"));
await page.waitForSelector("main h1");

// ---------------------------------------------------------------------------
// Automatic confirmation booking
// ---------------------------------------------------------------------------
await page.goto(`${BASE}/book/bright-tuition`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("form");
await page.getByRole("button", { name: /^Saturday, 7 November 2026$/ }).click();
await page.getByRole("button", { name: "10:00 am" }).click();
await page.fill('input[name="name"]', "Meera Iyer");
await page.fill('input[name="email"]', "meera.iyer@example.com");
await page.fill('input[name="phone"]', "+91 90000 22222");
await page.fill('textarea[name="notes"]', "Looking for help with calculus before term exams.");
await page.getByRole("button", { name: "Confirm booking", exact: true }).first().click();
await page.waitForSelector("text=Booking confirmed", { timeout: 30000 });
check("Auto mode confirms a public booking immediately", true);
await page.screenshot({ path: `${OUT}/booking-confirmed-390.png`, fullPage: true });

// ---------------------------------------------------------------------------
// Remaining owner screens
// ---------------------------------------------------------------------------
for (const [path, expected] of [
  ["/customers", "Customers"],
  ["/calendar", "Calendar"],
  ["/appointments", "Appointments"],
  ["/services", "Services"],
]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  const heading = await page.locator("main h1").first().innerText().catch(() => "");
  check(`${expected} screen loads`, heading.includes(expected), heading);
}
await page.goto(`${BASE}/customers`, { waitUntil: "domcontentloaded" });
const customerText = await page.locator("main").innerText();
check(
  "Customers list shows both the manual and auto-confirmed customers",
  customerText.includes("Rohan Mehta") && customerText.includes("Meera Iyer"),
  customerText.slice(0, 200),
);

// ---------------------------------------------------------------------------
// Responsive checks
// ---------------------------------------------------------------------------
const widths = [360, 390, 768, 1024, 1440];
const paths = [
  "/dashboard",
  "/appointments",
  "/services",
  "/availability",
  "/book/bright-tuition",
  "/settings/profile",
];

for (const width of widths) {
  await page.setViewportSize({ width, height: 900 });
  for (const path of paths) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    const layout = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = Math.max(0, doc.scrollWidth - doc.clientWidth);
      const offenders = [];
      for (const el of document.querySelectorAll("body *")) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > window.innerWidth + 1) {
          offenders.push({
            tag: el.tagName,
            cls: String(el.className).slice(0, 48),
            right: Math.round(rect.right),
          });
          if (offenders.length >= 2) break;
        }
      }
      const aside = document.querySelector("aside");
      return {
        overflow,
        offenders,
        sidebarVisible: aside ? getComputedStyle(aside).display !== "none" && aside.getBoundingClientRect().width > 0 : false,
        mobileNavVisible: Array.from(document.querySelectorAll("nav")).some(
          (nav) => nav.getBoundingClientRect().left >= 0 && nav.getBoundingClientRect().bottom > window.innerHeight - 100,
        ),
        title: document.title,
      };
    });
    check(
      `${path} fits ${width}px without horizontal scroll`,
      layout.overflow === 0,
      `overflow=${layout.overflow} ${JSON.stringify(layout.offenders)}`,
    );
    if (width === 360 && path === "/dashboard") {
      check("Sidebar is hidden on mobile", !layout.sidebarVisible);
    }
    if (width === 1440 && path === "/dashboard") {
      check("Sidebar is visible on desktop", layout.sidebarVisible);
    }
  }
}

// ---------------------------------------------------------------------------
// Screenshots for review
// ---------------------------------------------------------------------------
await page.setViewportSize({ width: 1440, height: 960 });
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-1440.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dashboard-390.png`, fullPage: true });

await page.goto(`${BASE}/book/bright-tuition`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/booking-390.png`, fullPage: true });

await browser.close();

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (consoleErrors.length) {
  console.log("Console errors:", JSON.stringify(consoleErrors.slice(0, 8), null, 2));
}
process.exit(failed.length ? 1 : 0);
