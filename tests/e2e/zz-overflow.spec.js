const { test } = require("@playwright/test");
const fs = require("fs");
const { blockFonts } = require("../support/helpers");
const PAGES = (process.env.PAGES || "").split(",").filter(Boolean);
test("overflow", async ({ browser }) => {
  test.setTimeout(600000);
  const c = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await blockFonts(c);
  const lines = [];
  for (const pg of PAGES) {
    const p = await c.newPage();
    await p.goto(pg); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const W = document.documentElement.clientWidth, bad = [];
      document.querySelectorAll("body *").forEach((e) => {
        if (e.closest("pre, .sql-table, .table-wrap, svg, table, .hs-table, .toc, iframe, .ag-diff") ) return;
        const r = e.getBoundingClientRect();
        if (r.width && r.right > W + 2 && getComputedStyle(e).position !== "fixed" && getComputedStyle(e).position !== "absolute") bad.push(e.tagName + "." + (e.className || "").toString().slice(0, 30) + ":" + Math.round(r.right));
      });
      return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 5) };
    });
    if (r.sw > r.W + 1 || r.bad.length) lines.push(`${pg}: scrollWidth ${r.sw} > ${r.W}; ${r.bad.join(", ")}`);
    await p.close();
  }
  fs.writeFileSync(process.env.REPORT, lines.join("\n") || "OK");
});
