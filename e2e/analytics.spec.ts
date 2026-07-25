import { expect, test } from "@playwright/test";

test("analytics page renders real live data and supports department drill-down", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Analytics" }).click();

  await expect(page.getByText("Spend by fiscal year")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Quarterly trend")).toBeVisible();
  await expect(page.getByText("Spend by acquisition type")).toBeVisible();
  await expect(page.getByText("Top departments")).toBeVisible();
  await expect(page.getByText("Top suppliers")).toBeVisible();

  // Real data, not a placeholder — same dataset invariant as chat.spec.ts.
  await expect(page.getByText("Health Care Services, Department of")).toBeVisible();

  await page.getByText("Health Care Services, Department of").click();
  await expect(page.getByText("Top categories")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("← All departments")).toBeVisible();

  await page.getByText("← All departments").click();
  await expect(page.getByText("Top departments")).toBeVisible();
});

test("chat and analytics are separate pages with working navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByPlaceholder(/Ask about spending/)).toBeVisible();

  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page).toHaveURL(/\/analytics/);
  await expect(page.getByPlaceholder(/Ask about spending/)).not.toBeVisible();

  await page.getByRole("link", { name: "Chat" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByPlaceholder(/Ask about spending/)).toBeVisible();
});
