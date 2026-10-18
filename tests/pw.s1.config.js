const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({ testDir: "./e2e", timeout: 90000, expect: { timeout: 10000 }, fullyParallel: true, workers: 3, retries: 0, reporter: "line",
  use: { baseURL: "http://127.0.0.1:8140/", trace: "off" } });
