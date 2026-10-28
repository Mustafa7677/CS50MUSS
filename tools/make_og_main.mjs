/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// Сайттың негізгі бөлісу суреті (assets/img/og.jpg, 1200×630): AO17 бренді және index.html-дегі нақты сандар.
// Үлгі: tools/og-main.html (NUM_LECT, NUM_TASKS, NUM_QUIZ). Іске қосу: cd tests && node ../tools/make_og_main.mjs
// (build.py-дан кейін, сандар жаңарғанда)
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "tests/package.json"));
const { chromium } = require("@playwright/test");

const idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const n = (k) => idx.match(new RegExp(`<!--n:${k}-->(\\d+)<!--/n-->`))[1];
const html = fs.readFileSync(path.join(ROOT, "tools/og-main.html"), "utf8")
  .replace("NUM_LECT", n("lect")).replace("NUM_TASKS", n("tasks")).replace("NUM_QUIZ", n("quiz"));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(ROOT, "assets/img/og.jpg"), type: "jpeg", quality: 88 });
await browser.close();
console.log("assets/img/og.jpg жазылды");
