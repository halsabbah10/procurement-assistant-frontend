import { defineConfig } from "@playwright/test";

// PLAYWRIGHT_BASE_URL lets this suite target the live deployment
// (npm run test:e2e -- won't do it; set the env var explicitly) without
// permanently pointing local dev runs at production. The webServer
// directive is skipped for a remote URL — we don't want Playwright trying
// to boot a local dev server when the target is already live.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const isLocal = baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL },
  webServer: isLocal
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
      }
    : undefined,
});
