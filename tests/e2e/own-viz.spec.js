// © 2026 Sagid Mustafa. All Rights Reserved.
// Дербес курстардың интерактивті визуализаторлары (assets/js/own-viz.js): қадамдау, нәтиже, пернетақта, мобиль, қателіксіз консоль.
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const WIDGETS = [
  { id: "cpp-pointers", page: "cpp/lectures/week-3.html", result: /[Жж]ад ағуы жоқ/, variants: [/[Жж]ад ағуы жоқ/, /Жад ағуы|жад ағуы/, /use-after-free/] },
  { id: "cpp-vector", page: "cpp/lectures/week-2.html", result: /UB|анықталмаған/, variants: [/анықталмаған/, /10 шықты/] },
  { id: "cpp-vtable", page: "cpp/lectures/week-5.html", result: /Dombyra: тың-тың/, variants: [/Dombyra: тың-тың/, /Aspap: жалпы дыбыс/, /Slicing/] },
  { id: "java-refs", page: "java/lectures/week-3.html", result: /4200, true, false, true/, variants: [/4200, true, false, true/, /true, false, true/] },
  { id: "java-hashmap", page: "java/lectures/week-5.html", result: /1200/, variants: [/1200/] },
  { id: "java-threads", page: "java/lectures/week-7.html", result: /counter = 1/, variants: [/counter = 1/, /counter = 2/, /counter = 2/] },
];

const widget = (page, id) => page.locator(`.own-viz[data-viz="${id}"]`);

for (const w of WIDGETS) {
  test.describe(`own-viz: ${w.id}`, () => {
    test("іске қосылады, Алға күйді өзгертеді, соңғы қадамда нәтиже, Артқа/Бастапқы", async ({ page }) => {
      const errs = collectErrors(page);
      await blockFonts(page.context());
      await page.goto(w.page);
      const root = widget(page, w.id);
      await expect(root).toHaveClass(/\bov\b/);
      await root.scrollIntoViewIfNeeded();
      await expect(root.locator(".ov-code li").first()).toBeVisible();
      await expect(root.locator(".ov-result")).toBeHidden();
      const next = root.getByRole("button", { name: "Алға" });
      const stage = root.locator(".ov-stage");
      const desc = root.locator(".ov-desc");
      await expect(root.getByRole("button", { name: "Артқа" })).toBeDisabled();
      const a0 = await stage.getAttribute("aria-label");
      const d0 = await desc.textContent();
      await next.click();
      await expect(root).toHaveAttribute("data-step", "1");
      expect(await desc.textContent()).not.toBe(d0);
      await next.click();
      await expect(root.locator(".ov-code li.on")).toHaveCount(1);
      // соңына дейін
      for (let i = 0; i < 80 && (await next.isEnabled()); i++) await next.click();
      await expect(next).toBeDisabled();
      expect(await stage.getAttribute("aria-label")).not.toBe(a0);
      await expect(root.locator(".ov-result")).toBeVisible();
      await expect(root.locator(".ov-result")).toContainText(w.result);
      await expect(root.locator(".ov-result")).toContainText("Нәтиже:");
      // Артқа және Бастапқы
      const last = +(await root.getAttribute("data-step"));
      await root.getByRole("button", { name: "Артқа" }).click();
      await expect(root).toHaveAttribute("data-step", String(last - 1));
      await root.getByRole("button", { name: "Бастапқы" }).click();
      await expect(root).toHaveAttribute("data-step", "0");
      expect(errs, errs.join("\n")).toEqual([]);
    });

    test("пернетақта ←/→ және slider", async ({ page }) => {
      await blockFonts(page.context());
      await page.goto(w.page);
      const root = widget(page, w.id);
      await root.scrollIntoViewIfNeeded();
      await root.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect(root).toHaveAttribute("data-step", "2");
      await page.keyboard.press("ArrowLeft");
      await expect(root).toHaveAttribute("data-step", "1");
      await root.getByRole("button", { name: "Алға" }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(root).toHaveAttribute("data-step", "2");
      const rng = root.locator(".ov-range");
      const max = await rng.getAttribute("max");
      await rng.fill(max);
      await expect(root).toHaveAttribute("data-step", max);
      await expect(root.locator(".ov-result")).toBeVisible();
    });

    test("автоойнату соңына жетеді", async ({ page }) => {
      await blockFonts(page.context());
      await page.clock.install();
      await page.goto(w.page);
      const root = widget(page, w.id);
      await root.scrollIntoViewIfNeeded();
      await root.getByRole("button", { name: "Автоойнату" }).click();
      await expect(root.getByRole("button", { name: "Автоойнату" })).toHaveAttribute("aria-pressed", "true");
      await page.clock.runFor(1500 * 70);
      await expect(root.locator(".ov-result")).toBeVisible();
      await expect(root.getByRole("button", { name: "Автоойнату" })).toHaveAttribute("aria-pressed", "false");
    });

    test("нұсқалар: әрқайсысы соңына дейін жүреді", async ({ page }) => {
      const errs = collectErrors(page);
      await blockFonts(page.context());
      await page.goto(w.page);
      const root = widget(page, w.id);
      await root.scrollIntoViewIfNeeded();
      const vb = root.locator(".ov-vb");
      const n = await vb.count();
      const count = n || 1;
      for (let k = 0; k < count; k++) {
        if (n) await vb.nth(k).click();
        await expect(root).toHaveAttribute("data-step", "0");
        await root.locator(".ov-range").fill(await root.locator(".ov-range").getAttribute("max"));
        await expect(root.locator(".ov-result")).toContainText(w.variants[k]);
      }
      expect(errs, errs.join("\n")).toEqual([]);
    });

    test("390px: көлденең айналу жоқ, виджет сыяды", async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      await blockFonts(ctx);
      const page = await ctx.newPage();
      await page.goto(w.page);
      const root = widget(page, w.id);
      await root.scrollIntoViewIfNeeded();
      const max = await root.locator(".ov-range").getAttribute("max");
      for (const v of ["0", "3", max]) {
        await root.locator(".ov-range").fill(v);
        const m = await page.evaluate((id) => {
          const el = document.querySelector(`.own-viz[data-viz="${id}"]`);
          const r = el.getBoundingClientRect();
          return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, right: r.right, left: r.left, cw: el.scrollWidth, ow: el.clientWidth };
        }, w.id);
        expect(m.sw, JSON.stringify(m)).toBeLessThanOrEqual(m.iw);
        expect(m.right, JSON.stringify(m)).toBeLessThanOrEqual(m.iw);
        expect(m.cw, JSON.stringify(m)).toBeLessThanOrEqual(m.ow + 1);
      }
      await ctx.close();
    });
  });
}

test("own-viz: лекция беттерінде тек өз виджеті бар, id қайталанбайды", async ({ page }) => {
  await blockFonts(page.context());
  for (const w of WIDGETS) {
    await page.goto(w.page);
    await expect(page.locator(".own-viz")).toHaveCount(1);
    const dup = await page.evaluate(() => { const ids = [...document.querySelectorAll("[id]")].map((e) => e.id); return ids.filter((x, i) => ids.indexOf(x) !== i); });
    expect(dup, w.page).toEqual([]);
  }
});
