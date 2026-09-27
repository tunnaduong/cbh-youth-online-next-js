import { test, expect, type Page } from "@playwright/test";

/**
 * Every static (no dynamic segment) route in src/app. Kept as one flat list
 * so a new page.js added under src/app shows up here as a reminder to add it.
 */
const STATIC_ROUTES: string[] = [
  "/",
  "/about",
  "/admin",
  "/admin/comments",
  "/admin/deposits",
  "/admin/login",
  "/admin/messages",
  "/admin/moderation",
  "/admin/notifications",
  "/admin/posts",
  "/admin/reports",
  "/admin/shop/categories",
  "/admin/shop/orders",
  "/admin/shop/products",
  "/admin/student-verifications",
  "/admin/study-materials",
  "/admin/users",
  "/admin/withdrawals",
  "/ads",
  "/auth/complete",
  "/auth/set-token",
  "/chat",
  "/composer",
  "/contact",
  "/egg",
  "/explore",
  "/explore/games",
  "/explore/quiz",
  "/explore/quiz/custom",
  "/explore/study-materials",
  "/explore/study-materials/upload",
  "/explore/universities",
  "/feed",
  "/guide/points",
  "/help",
  "/jobs",
  "/login",
  "/lookup",
  "/lookup/grades",
  "/password/reset",
  "/policy/forum-rules",
  "/policy/privacy",
  "/policy/terms",
  "/register",
  "/saved",
  "/search",
  "/settings",
  "/shop",
  "/unsubscribe",
  "/users/ranking",
  "/wallet",
  "/wallet/deposit",
  "/wallet/withdraw",
  "/youth-news",
];

/**
 * Routes with a dynamic segment, exercised with a placeholder value that is
 * expected NOT to exist. These should resolve to a graceful "not found" /
 * error state rather than crashing — we don't assert on the exact copy since
 * that's content, not routing behavior.
 */
const DYNAMIC_ROUTES: string[] = [
  "/nonexistent-user-e2e",
  "/nonexistent-user-e2e/posts",
  "/nonexistent-user-e2e/posts/999999999",
  "/email/verify/invalid-token-e2e",
  "/explore/games/invalid-slug-e2e",
  "/explore/study-materials/999999999",
  "/explore/study-materials/999999999/view",
  "/forum/999999999",
  "/forum/999999999/999999999",
  "/help/invalid-category-e2e/invalid-article-e2e",
  "/invite/invalid-token-e2e",
  "/password/reset/invalid-token-e2e",
];

const CLIENT_CRASH_MARKERS = [
  "Application error: a client-side exception has occurred",
  "Unhandled Runtime Error",
];

async function expectNoCrash(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "networkidle" });

  expect(response, `no response for ${path}`).not.toBeNull();
  expect(
    response!.status(),
    `${path} responded with a server error`
  ).toBeLessThan(500);

  const bodyText = await page.locator("body").innerText();
  for (const marker of CLIENT_CRASH_MARKERS) {
    expect(bodyText, `${path} rendered a client-side crash`).not.toContain(
      marker
    );
  }
}

test.describe("Every static route renders without crashing", () => {
  for (const path of STATIC_ROUTES) {
    test(`route ${path}`, async ({ page }) => {
      await expectNoCrash(page, path);
    });
  }
});

test.describe("Dynamic routes handle unknown params gracefully", () => {
  for (const path of DYNAMIC_ROUTES) {
    test(`route ${path}`, async ({ page }) => {
      await expectNoCrash(page, path);
    });
  }
});
