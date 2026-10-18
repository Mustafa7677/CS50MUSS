const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors, ownLectures } = require("../support/helpers");

// Әр курстың өз қорытынды емтиханы: сұрақтар сол курстан, нәтиже өз кілтінде, сертификатта көрінеді.
test.describe.configure({ retries: 2 }); // толық жүктемеде сирек кездесетін уақыт жарысынан сақтайды
for (const [c, code, lecs] of [["python", "CS50P", 10], ["sql", "CS50 SQL", 7], ["ai", "CS50 AI", 7], ["web", "CS50 Web", 9], ["cpp", "C++", ownLectures("cpp").length], ["java", "Java", ownLectures("java").length]]) {
  test(`емтихан: ${code}`, async ({ page, context }) => {
    test.skip(lecs === 0, "курстың лекциялары әлі жазылмаған");
    test.setTimeout(90_000);
    await blockFonts(context);
    const errs = collectErrors(page);
    await page.goto(`exam.html?course=${c}`);
    await expect(page.locator(".ex-title")).toContainText(code);
    await expect(page.locator(`.ex-switch a[data-c="${c}"]`)).toHaveClass(/on/);
    await page.click(".ex-start");
    await expect(page.locator(".ex-opts button").first()).toBeVisible();
    const n = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).qs.length, `cs50kz:exam-run:${c}`);
    expect(n).toBe(lecs * 2);
    // сұрақтардың бәрі осы курстан
    const bad = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).qs.filter((q) => q.c !== k.split(":")[2]).length, `cs50kz:exam-run:${c}`);
    expect(bad).toBe(0);
    for (let i = 0; i < n; i++) {
      await expect(page.locator(".ex-meta span").first()).toHaveText(`Сұрақ ${i + 1} / ${n}`);
      const a = await page.evaluate(([k, i]) => JSON.parse(localStorage.getItem(k)).qs[i].a, [`cs50kz:exam-run:${c}`, i]);
      await page.locator(".ex-opts button").nth(a).click();
      await expect.poll(() => page.evaluate(([k, i]) => JSON.parse(localStorage.getItem(k)).ans[i], [`cs50kz:exam-run:${c}`, i])).toBe(a);
      if (i < n - 1) await page.click(".ex-next");
    }
    await page.click(".ex-next");
    await expect(page.locator(".ex-ring b"), "нәтиже").toBeVisible({ timeout: 15000 });
    await expect(page.locator(".ex-ring b")).toHaveText("100%");
    const res = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), `cs50kz:exam:${c}`);
    expect(res.best).toBe(100);
    expect(await page.evaluate(() => localStorage.getItem("cs50kz:exam"))).toBeNull(); // CS50x кілті қозғалмайды
    await page.goto(`certificate.html?course=${c}`);
    await expect(page.locator(".cg-exam")).toContainText("100%");
    expect(errs).toEqual([]);
  });
}
