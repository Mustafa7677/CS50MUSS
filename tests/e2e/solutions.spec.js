// Курстардағы барлық автотексерушілерді эталон шешімдермен нағыз браузерде тексереді (регрессия қорғанысы): әр шешім бәрін өтуі тиіс; SQL - эталон сұраулармен.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, routePyodide } = require("../support/helpers");
const SOLS = JSON.parse(fs.readFileSync(require("path").join(__dirname, "../support/solutions.json"), "utf8"));
const PAGES = Object.keys(SOLS).concat(["sql/lectures/week-0.html"].filter((p) => !SOLS[p]));
for (const page of PAGES) {
  test(`эталон шешімдер: ${page}`, async ({ page: p }) => {
    test.setTimeout(600_000);
    await routePyodide(p.context());
    await blockFonts(p.context());
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(page);
    const fails = [];
    const sols = SOLS[page] || { py: {}, js: {} };
    for (const [key, code] of Object.entries(sols.py)) {
      const ag = p.locator(`.autograder[data-check="${key}"]`);
      if (!(await ag.count())) { fails.push(`${key}: бетте жоқ`); continue; }
      await ag.scrollIntoViewIfNeeded();
      await ag.locator(".ag-code").fill(code);
      await ag.locator(".ag-run").click();
      await expect(ag.locator(".ag-score")).toContainText(/\d+ \/ \d+ тест өтті/, { timeout: 120_000 });
      const s = await ag.locator(".ag-score").innerText();
      const [a, b] = s.match(/(\d+) \/ (\d+)/).slice(1);
      if (a !== b) fails.push(`${key}: ${s} :: ` + (await ag.locator(".ag-results li.bad").allInnerTexts()).join(" | ").slice(0, 500));
    }
    for (const [key, code] of Object.entries(sols.js)) {
      const ag = p.locator(`.js-grader[data-check="${key}"]`);
      if (!(await ag.count())) { fails.push(`${key}: бетте жоқ (js)`); continue; }
      await ag.scrollIntoViewIfNeeded();
      await ag.locator(".ag-code").fill(code);
      await ag.locator(".ag-run").click();
      await expect(ag.locator(".ag-score")).toContainText(/\d+ \/ \d+ тест өтті/, { timeout: 30_000 });
      const s = await ag.locator(".ag-score").innerText();
      const [a, b] = s.match(/(\d+) \/ (\d+)/).slice(1);
      if (a !== b) fails.push(`${key}: ${s} :: ` + (await ag.locator(".ag-results li.bad").allInnerTexts()).join(" | ").slice(0, 500));
    }
    // SQL: әр тапсырма үшін эталон сұраудың өзін енгізіп тексереміз
    const sqlN = await p.locator(".sql-grader").count();
    for (let g = 0; g < sqlN; g++) {
      const el = p.locator(".sql-grader").nth(g);
      await el.scrollIntoViewIfNeeded();
      const src = await el.getAttribute("data-src"), set = await el.getAttribute("data-set");
      const refs = await p.evaluate(async ({ src, set }) => {
        await window.CS50KZ.loadScript(src);
        return window.CS50KZ_SQLCHECKS[set].tasks.map((t) => t.ref);
      }, { src, set });
      for (let i = 0; i < refs.length; i++) {
        await el.locator(`.sg-tabs button[data-k="${i}"]`).click();
        await el.locator(".sg-code").fill(refs[i]);
        await el.locator(".sg-run").click();
        await expect(el.locator(".sg-msg")).toContainText(/Дұрыс|✗/, { timeout: 60_000 });
        const m = await el.locator(".sg-msg").innerText();
        if (!/Дұрыс/.test(m)) fails.push(`${set}#${i}: ${m} (${refs[i].slice(0, 80)})`);
      }
    }
    expect(errs).toEqual([]);
    expect(fails).toEqual([]);
  });
}
