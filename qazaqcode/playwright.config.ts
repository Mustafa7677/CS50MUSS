import { defineConfig } from "@playwright/test";

// E2E: әдепкіде `next start` өзі іске қосылады (алдын ала `next build` керек, DATABASE_URL орнатылған).
// Дайын серверге қарсы жүргізу: E2E_BASE_URL=http://127.0.0.1:3101 npx playwright test
const port = Number(process.env.PORT || 3100);
const base = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: base, trace: "retain-on-failure", locale: "kk-KZ", launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined } },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npx next start -p ${port}`,
    url: `http://127.0.0.1:${port}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ...(process.env as Record<string, string>), PORT: String(port) },
  },
});
