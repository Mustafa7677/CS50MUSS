// Төзімділік: жадтағы бүлінген деректер (бұзылған JSON, null, басқа түрдегі мән) ешбір бетті құлатпауы керек.
const { test, expect } = require("@playwright/test");
const { PAGES, blockFonts, collectErrors } = require("../support/helpers");

const KEYS = ["cs50kz:progress", "cs50kz:days", "cs50kz:goal", "cs50kz:cloud", "cs50kz:profile", "cs50kz:exam", "cs50kz:daily",
  "cs50kz:cards", "cs50kz:week", "cs50kz:used", "cs50kz:prefs", "cs50kz:tclasses", "cs50kz:graded", "cs50kz:flask", "cs50kz:bugs",
  "cs50kz:trace", "cs50kz:exam-run", "cs50kz:mixed-best", "cs50kz:weeks-won", "check:/lectures/week-1.html:t1"];
const VALUES = { "бұзылған JSON": "{не JSON", null: "null", "жол": '"x"', "сан": "42", "тізім": "[1,2]", "қате пішін": '{"read":"x","quiz":[1],"last":5,"name":{"a":1},"qs":3}' };

for (const [kind, val] of Object.entries(VALUES)) {
  test(`бүлінген жад (${kind}): барлық беттер қатесіз ашылады`, async ({ browser }) => {
    test.setTimeout(180_000);
    const c = await browser.newContext();
    await blockFonts(c);
    await c.addInitScript(([keys, v]) => {
      try { if (!sessionStorage.getItem("seeded")) { keys.forEach((k) => localStorage.setItem(k, v)); sessionStorage.setItem("seeded", "1"); } } catch (e) { /* sandbox iframe */ }
    }, [KEYS, val]);
    const p = await c.newPage();
    const errs = collectErrors(p), bad = [];
    for (const url of PAGES) {
      errs.length = 0;
      await p.goto(url);
      await p.waitForTimeout(300);
      if (errs.length) bad.push(`${url}: ${[...new Set(errs)].join(" | ")}`);
    }
    expect(bad, bad.join("\n")).toEqual([]);
    await c.close();
  });
}
