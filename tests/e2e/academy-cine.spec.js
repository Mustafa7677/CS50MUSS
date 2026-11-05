// © 2026 Sagid Mustafa. AO17 Кино-түсіндіру: әр сабақтың басындағы мультфильм.
// Тексереміз: постер -> ойнату, Болжа кезінде фильм өзі тоқтап, жауап күтеді (Predict-Observe-Explain),
// тараулар мен ← → кез келген көрініске апарады, соңы Түйін картасы; телефонда жылжу жоқ, a11y екі режимде.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

test("авторлық фильм: Болжада тоқтайды, жауаптан кейін жалғасады, Түйінмен аяқталады", async ({ page }) => {
  test.setTimeout(90_000);
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/m05/l01.html");
  const film = page.locator("[data-cine]");
  await expect(film.locator(".cn-poster h3")).toHaveText("Ақпарат және бит");
  await expect(film.locator(".cn-tabs button")).toHaveText([/Сұрақ/, /Бейне/, /Болжа/, /Көр/, /Түйін/]);
  await film.locator("[data-a=start]").click();
  await expect(film).toHaveClass(/cn-started/);
  // Болжа: автоплей өзі жетеді де тоқтайды
  const opts = film.locator(".cn-opts button");
  await expect(opts).toHaveCount(3, { timeout: 30_000 });
  await expect(film).not.toHaveClass(/cn-playing/);
  await expect(film.locator(".cn-say")).toHaveText("Ең тиімді сұрақтармен неше сұрақ жеткілікті?");
  await opts.nth(1).click();
  await expect(opts.nth(0)).toHaveClass(/ok/);
  await expect(opts.nth(1)).toHaveClass(/no/);
  await expect(film.locator(".cn-why")).toContainText("2⁴ = 16");
  await film.locator("[data-a=cont]").click();
  await expect(film.locator(".cn-tabs button.on")).toContainText("Көр");
  await expect(film.locator('.cp[data-id="bit"]')).toHaveClass(/cn-in/);
  // Түйін тарауы: сахна тазарады, негізгі ой картасы
  await film.locator(".cn-tabs button").nth(4).click();
  await expect(film.locator('.cp[data-id="_key"]')).toHaveClass(/cn-in/);
  await expect(film.locator('.cp[data-id="c"]')).not.toHaveClass(/cn-in/);
  await film.locator("[data-a=next]").click();
  await expect(film.locator('.cp[data-id="_good"]')).toHaveClass(/cn-in/);
  await expect(film).toHaveClass(/cn-end/);
  // ← бір көрініс артқа
  await film.locator("[data-a=prev]").click();
  await expect(film.locator('.cp[data-id="_key"]')).toHaveClass(/cn-in/);
  // мәтін нұсқасы (JS-сіз де бар)
  await expect(page.locator(".cn-tr li")).not.toHaveCount(0);
  expect(errs).toEqual([]);
});

test("авто-фильм: қадамдар жолы барлық сабақта бар", async ({ page }) => {
  await blockFonts(page.context());
  const errs = collectErrors(page);
  await page.goto("academy/m02/l03.html");
  const film = page.locator("[data-cine]");
  await film.locator("[data-a=start]").click();
  await film.locator("[data-a=play]").click();
  await expect(film.locator(".cn-tabs button")).toHaveText([/Сұрақ/, /Жол/, /Тексер/, /Түйін/]);
  await film.locator(".cn-tabs button").nth(1).click();
  await expect(film.locator('.cp[data-id="n0"]')).toHaveClass(/cn-in/);
  await expect(film.locator(".cn-say")).toContainText("1-қадам.");
  await film.locator("[data-a=next]").click();
  await expect(film.locator(".cn-say")).toContainText("2-қадам.");
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`кино (${scheme}): телефонда жылжу жоқ, a11y`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    const problems = [];
    for (const url of ["academy/m01/l01.html", "academy/s02/l01.html"]) {
      await p.goto(url);
      await p.locator("[data-cine] [data-a=start]").click();
      for (let i = 0; i < 10 && !(await p.locator(".cn-opts button").count()); i++) await p.locator("[data-cine] [data-a=next]").click();
      await expect(p.locator(".cn-opts button").first()).toBeVisible();
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("[data-cine]"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
    await c.close();
  });
}
