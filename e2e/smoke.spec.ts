import { test, expect } from "@playwright/test";

test.describe("Public pages render", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Chuyên Biên Hòa/i);
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: /Về diễn đàn học sinh Chuyên Biên Hòa/i })
    ).toBeVisible();
  });

  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/policy/privacy");
    await expect(page).toHaveURL(/\/policy\/privacy/);
  });
});

test.describe("Login flow", () => {
  test("login form renders and accepts input", async ({ page }) => {
    await page.goto("/login");

    const identifierInput = page.getByPlaceholder("Tên người dùng hoặc email");
    const passwordInput = page.getByPlaceholder("Mật khẩu");

    await expect(identifierInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await identifierInput.fill("testuser@example.com");
    await passwordInput.fill("hunter2");

    await expect(identifierInput).toHaveValue("testuser@example.com");
    await expect(passwordInput).toHaveValue("hunter2");
  });
});

test.describe("Register flow", () => {
  test("register form renders and accepts input", async ({ page }) => {
    await page.goto("/register");

    const usernameInput = page.getByPlaceholder("Tên đăng nhập");
    const emailInput = page.getByPlaceholder("Địa chỉ email");

    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();

    await usernameInput.fill("newuser");
    await emailInput.fill("newuser@example.com");

    await expect(usernameInput).toHaveValue("newuser");
    await expect(emailInput).toHaveValue("newuser@example.com");
  });
});
