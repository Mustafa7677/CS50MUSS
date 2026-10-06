// Әр бет: JS қатесі жоқ, көлденең жылжу жоқ, сілтемелер мен якорьлар бар, қолжетімділіктің негізі.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { ROOT, PAGES, blockFonts, collectErrors } = require("../support/helpers");

const idsCache = {};
const idsOf = (file) => (idsCache[file] ||= new Set([...fs.readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));

for (const [label, viewport, colorScheme] of [["desktop-light", { width: 1280, height: 900 }, "light"], ["mobile-dark", { width: 390, height: 844 }, "dark"]]) {
  test.describe(label, () => {
    test.use({ viewport, colorScheme });
    for (const f of PAGES) {
      test(f, async ({ page, context }) => {
        await blockFonts(context);
        const errs = collectErrors(page);
        await page.goto(f);
        await page.waitForTimeout(500);
        const r = await page.evaluate(() => {
          const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
          return {
            title: document.title,
            sw: document.documentElement.scrollWidth,
            noAlt: document.querySelectorAll("img:not([alt])").length,
            dupIds: ids.filter((x, i) => ids.indexOf(x) !== i),
            noName: [...document.querySelectorAll("button, a")].filter((e) => !e.textContent.trim() && !e.getAttribute("aria-label") && !e.querySelector('img[alt]:not([alt=""])') && e.offsetParent).map((e) => e.outerHTML.slice(0, 80)),
            noLabel: [...document.querySelectorAll("input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=file]), textarea, select")].filter((e) => !e.getAttribute("aria-label") && !e.closest("label") && !e.placeholder && !(e.id && document.querySelector(`label[for="${e.id}"]`))).length,
            links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => !/^(https?:|mailto:|javascript:)/.test(h)),
          };
        });
        expect(errs, "JS қателері: " + errs.join(" | ")).toEqual([]);
        expect(r.title.length, "title").toBeGreaterThan(3);
        expect(r.sw, "көлденең жылжу").toBeLessThanOrEqual(viewport.width);
        expect(r.noAlt, "alt-сыз суреттер").toBe(0);
        expect(r.dupIds, "қайталанған id").toEqual([]);
        expect(r.noName, "атаусыз батырма/сілтеме").toEqual([]);
        expect(r.noLabel, "белгісіз енгізу өрістері").toBe(0);
        if (label === "desktop-light" && f !== "404.html") {
          const broken = [];
          for (const h of new Set(r.links)) {
            const [file, hash] = h.split("#");
            const target = file ? path.normalize(path.join(path.dirname(path.join(ROOT, f)), file)) : path.join(ROOT, f);
            if (file && !fs.existsSync(target)) { broken.push("сілтеме " + h); continue; }
            if (hash && target.endsWith(".html") && !/^(add=|import=|login=|sql)/.test(hash) && !idsOf(target).has(hash)) broken.push("якорь " + h);
          }
          expect(broken, "сынған сілтемелер").toEqual([]);
        }
      });
    }
  });
}
