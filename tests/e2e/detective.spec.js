const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

test("SQL детектив №2: SQL арқылы ұрыны табу және жауап", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto("detective.html#baikonur");
  await expect(page.locator(".dt-schema summary")).toHaveCount(10);
  await page.fill(".dt-code", `SELECT name FROM employees WHERE id IN (SELECT e.id FROM employees e JOIN badge_scans i ON i.badge_id = e.badge_id JOIN badge_scans o ON o.badge_id = e.badge_id
    WHERE i.door='archive' AND i.direction='in' AND i.time BETWEEN '2026-04-12 14:00' AND '2026-04-12 15:00' AND o.door='archive' AND o.direction='out' AND o.time BETWEEN '2026-04-12 14:00' AND '2026-04-12 16:00')
    AND id IN (SELECT employee_id FROM printer_jobs WHERE printer='B-2' AND time LIKE '2026-04-12%' GROUP BY employee_id HAVING SUM(pages) > 50)
    AND email IN (SELECT sender FROM emails WHERE time LIKE '2026-04-12%' AND size_kb > 5000 AND recipient NOT LIKE '%@baikonur.kz')
    AND passport_number IN (SELECT passport_number FROM tickets WHERE train_id = (SELECT t.id FROM trains t JOIN stations s ON s.id = t.from_station_id WHERE s.name='Toretam' AND t.departure LIKE '2026-04-13%' ORDER BY t.departure LIMIT 1));`);
  await page.click(".dt-run");
  await expect(page.locator(".dt-out")).toContainText("1 жол");
  const thief = (await page.locator(".dt-out td").first().innerText()).trim();
  const q = async (sql) => { await page.fill(".dt-code", sql); await page.click(".dt-run"); await page.waitForTimeout(150); return (await page.locator(".dt-out td").first().innerText()).trim(); };
  const city = await q("SELECT s.city FROM trains t JOIN stations s ON s.id = t.to_station_id WHERE t.from_station_id = 1 AND t.departure LIKE '2026-04-13%' ORDER BY t.departure LIMIT 1;");
  const acc = await q(`SELECT p.name FROM people p JOIN emails m ON m.recipient = p.email JOIN employees e ON e.email = m.sender WHERE e.name = '${thief}' AND m.size_kb > 5000;`);
  await page.fill(".dt-thief", thief); await page.fill(".dt-city", city); await page.fill(".dt-acc", acc);
  await page.click(".dt-check");
  await expect(page.locator(".dt-verdict")).toContainText("Құпия ашылды");
  await page.click('.dt-cases a[data-case="domb"]');
  await expect(page.locator(".dt-code")).toHaveValue(/crime_scene_reports/);
  expect(errs).toEqual([]);
});
