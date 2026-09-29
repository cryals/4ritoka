import { expect, test } from "@playwright/test";

test("user can register and reach the simulation workspace", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "The full workflow is covered on desktop; mobile has a focused layout test.",
  );
  test.setTimeout(120_000);
  await page.goto("/login");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  const email = `e2e-${Date.now()}@example.test`;
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("Fabriq-test-password-2026");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Производство/ })).toBeVisible();
  const navigation = page.locator(testInfo.project.name === "mobile" ? ".mobile-nav" : ".topbar");
  await navigation.getByRole("link", { name: /Сценарии/ }).click();
  await expect(page.getByRole("heading", { name: /Сценарии/ })).toBeVisible();

  await page.locator('a[href^="/scenarios/new?preset="]').first().click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page).toHaveURL(/\/scenarios\/[0-9a-f-]+/);

  for (let index = 0; index < 2; index += 1) {
    await page.goto("/runs/new");
    await page.getByLabel("Сценарий").selectOption({ index: 0 });
    await page.getByRole("button", { name: "Запустить моделирование" }).click();
    await expect(page).toHaveURL(/\/runs\/[0-9a-f-]+/);
    await expect(page.locator(".status-completed")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Динамика" })).toBeVisible();
  }

  await page.goto("/compare");
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.getByRole("button", { name: /Сравнить \(2\)/ }).click();
  await expect(page.getByRole("heading", { name: "Результат" })).toBeVisible();
});

test("layout remains usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});
