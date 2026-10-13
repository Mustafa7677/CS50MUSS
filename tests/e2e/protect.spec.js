const { test, expect } = require("@playwright/test");
const { blockFonts } = require("../support/helpers");

// Көшірмеден қорғау: ресми емес доменде ескерту шығады, ресми/жергілікті жерде шықпайды.
test("көшірме доменінде түпнұсқаға сілтеме беретін ескерту шығады", async ({ page, baseURL }) => {
  await blockFonts(page.context());
  await page.route("http://clone.example/**", async (route) => {
    const u = new URL(route.request().url());
    const res = await route.fetch({ url: new URL(u.pathname + u.search, baseURL).href });
    await route.fulfill({ response: res });
  });
  await page.goto("http://clone.example/index.html");
  const n = page.locator("#clone-notice");
  await expect(n).toBeVisible();
  await expect(n).toContainText("mustafa7677.github.io/CS50MUSS");
  await expect(n).toContainText("Sagid Mustafa");
  // өшіріп көрсек те, қайта шығады
  await page.evaluate(() => document.getElementById("clone-notice").remove());
  await expect(n).toBeVisible();
});

test("ресми/жергілікті мекенжайда ескерту шықпайды; canonical, лицензия және автор метасы бар", async ({ page }) => {
  await page.goto("index.html");
  await expect(page.locator("#clone-notice")).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/mustafa7677\.github\.io\/CS50MUSS\//);
  await expect(page.locator('link[rel="license"]')).toHaveAttribute("href", /creativecommons\.org\/licenses\/by-nc-sa\/4\.0/);
  await expect(page.locator('meta[name="author"]')).toHaveAttribute("content", "Sagid Mustafa");
});
