import { expect, test } from "@playwright/test";

test("empty state shows starter prompts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Ask about California state purchasing.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "What are the top 5 departments by total spending?" }),
  ).toBeVisible();
});

test("asking a question returns a real answer with markdown, chart, and query transparency", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "What are the top 5 departments by total spending?" }).click();

  // Real numbers from the live dataset — not a fixture. Health Care
  // Services dominates total spend by nearly 18x the next department; a
  // regression that broke the aggregation pipeline or the schema fields
  // would change this number, not just the prose around it.
  await expect(page.getByText(/99,759,350,736|99\.8B|\$99\.[78]/).first()).toBeVisible({
    timeout: 45_000,
  });

  // Markdown actually rendered as HTML, not shown as raw "**text**" or
  // "| a | b |" — the model chooses freely between a table and bold prose
  // for a ranked list (both are legitimate), so assert structure was
  // applied at all rather than one specific formatting choice.
  const hasTable = await page.locator("table").count();
  const hasBold = await page.locator("strong").count();
  expect(hasTable + hasBold).toBeGreaterThan(0);
  await expect(page.getByText("**")).toHaveCount(0);
  await expect(page.getByText(/^\|.*\|$/)).toHaveCount(0);

  // Chart auto-generated for this ranked-comparison question
  await expect(page.locator('[role="img"]').first()).toBeVisible();

  // Query transparency panel
  const queryToggle = page.getByText("View generated query");
  await expect(queryToggle).toBeVisible();
  await queryToggle.click();
  await expect(page.getByText(/db\.purchase_orders\.aggregate/)).toBeVisible();

  // Follow-up suggestions
  await expect(page.getByRole("button", { name: /Export CSV/ })).toBeVisible();
});

test("out-of-scope question gets a graceful redirect, not a crash", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask about spending/).fill("What's the weather like today?");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByText(/California state purchase order/i)).toBeVisible({ timeout: 20_000 });
});

test("copy and edit actions are available on messages", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask about spending/).fill("What was total spending in FY2013-2014?");
  await page.getByRole("button", { name: "Ask" }).click();

  // Regenerate only renders once the assistant message has real text, so
  // waiting on it also means streaming has finished — the user message's
  // own Edit button is deliberately hidden while a response is still being
  // generated (editMessage/regenerate would race the in-flight stream).
  await expect(page.getByRole("button", { name: "Regenerate response" })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByRole("button", { name: "Copy message" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit message" })).toBeVisible();
});

test("new conversation clears the thread and starts fresh", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask about spending/).fill("What was total spending in FY2012-2013?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(page.getByText("No. 001")).toBeVisible({ timeout: 45_000 });

  await page.getByRole("button", { name: "+ New conversation" }).click();
  await expect(page.getByText("Ask about California state purchasing.")).toBeVisible();
});
