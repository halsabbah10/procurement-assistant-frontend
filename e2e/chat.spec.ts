import { expect, test } from "@playwright/test";

test("user can ask a question and receive an answer with the dashboard visible", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/most frequently ordered/i)).toBeVisible();

  const input = page.getByPlaceholder("Ask a question...");
  await input.fill("How many purchase orders were created in fiscal year 2013-2014?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText(/120,?636/)).toBeVisible({ timeout: 30_000 });

  await expect(page.getByText("Spend by fiscal year")).toBeVisible();
  await expect(page.getByText("Top departments")).toBeVisible();
});

test("out-of-scope question gets a graceful redirect, not a crash", async ({ page }) => {
  await page.goto("/");

  const input = page.getByPlaceholder("Ask a question...");
  await input.fill("What's the weather like today?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText(/California state purchase order/i)).toBeVisible({ timeout: 15_000 });
});
