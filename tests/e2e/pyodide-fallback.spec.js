// Pyodide көздері: ресми CDN қолжетімсіз болса да Python резервтік көзден жүктеледі; барлығы құласа, түсінікті хабар шығады.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");

const PYDIR = path.join(__dirname, "../node_modules/pyodide/");
const serveLocal = (file) => {
  const f = path.join(PYDIR, file);
  const type = file.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(file) ? "application/javascript" : file.endsWith(".json") ? "application/json" : "application/octet-stream";
  return { status: 200, body: fs.readFileSync(f), headers: { "content-type": type, "access-control-allow-origin": "*" } };
};

test("ресми CDN 404 болса, npm көзінен Python жүктеледі @slow", async ({ page, context }) => {
  await blockFonts(context);
  const errs = [];
  const hits = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await context.route(/cdn\.jsdelivr\.net\/pyodide\//, (r) => { hits.push("official"); r.fulfill({ status: 404, body: "not found" }); });
  await context.route(/cdn\.jsdelivr\.net\/npm\/pyodide@0\.26\.4\/([^?]*)/, (r) => {
    hits.push("npm");
    const f = r.request().url().match(/pyodide@0\.26\.4\/([^?]*)/)[1];
    if (!fs.existsSync(path.join(PYDIR, f))) return r.fulfill({ status: 404, body: "" });
    return r.fulfill(serveLocal(f));
  });
  await page.goto("playground.html");
  await page.fill(".pg-editor", "print(6 * 7)");
  await page.click(".pg-run");
  await expect(page.locator(".pg-output")).toContainText("42", { timeout: 90_000 });
  expect(hits[0]).toBe("official"); // алдымен ресми көзді сынайды
  expect(hits).toContain("npm");
  expect(errs).toEqual([]);
});

test("барлық көз қолжетімсіз болса, түсінікті хабар шығады, бет бұзылмайды", async ({ page, context }) => {
  await blockFonts(context);
  await context.route(/cdn\.jsdelivr\.net\/(npm\/)?pyodide|unpkg\.com\/pyodide/, (r) => r.abort());
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("playground.html");
  await page.fill(".pg-editor", "print(1)");
  await page.click(".pg-run");
  await expect(page.locator(".pg-output")).toContainText(/жүктелмеді|интернет/i, { timeout: 60_000 });
  await expect(page.locator(".pg-run")).toBeEnabled();
  expect(errs).toEqual([]);
});
