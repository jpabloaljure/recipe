import { defineConfig, devices } from "@playwright/test";

// End-to-end tests (ADR 0006). Rules: AGENTS.md "End-to-end (E2E) test rules".
const isCI = !!process.env.CI;
const port = 3000;
// Set BASE_URL to test a deployed site (e.g. the production smoke check);
// then no local server is started.
const baseURL = process.env.BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  // A test that sometimes fails is a bug, not something to retry (rule 10).
  retries: 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : [["list"], ["html", { open: "on-failure" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "phone-portrait",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "phone-landscape",
      use: { ...devices["Pixel 7 landscape"] },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  // Always the production build: CI builds in an earlier step, so it only starts.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: isCI ? "pnpm start" : "pnpm build && pnpm start",
        url: `http://localhost:${port}`,
        reuseExistingServer: !isCI,
        timeout: 180_000,
      },
});
