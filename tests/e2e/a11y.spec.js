// Қолжетімділік (WCAG 2 A/AA): әр бет жарық және түнгі режимде axe-core-мен тексеріледі.
// Серьёзный/критикалық бұзушылық болса - тест құлайды (контраст, ARIA, айналатын аймақтар т.б.).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { PAGES, blockFonts } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

for (const scheme of ["light", "dark"]) {
  test(`a11y: барлық беттер (${scheme})`, async ({ browser }) => {
    test.setTimeout(240_000);
    const c = await browser.newContext({ colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    // Профильде күнтізбе толы болсын
    await p.goto("index.html");
    await p.evaluate(() => localStorage.setItem("cs50kz:days", JSON.stringify({ [CS50KZ.dayKey()]: 4 })));
    const problems = [];
    for (const url of PAGES) {
      await p.goto(url);
      await p.waitForTimeout(500);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () =>
        (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
          .filter((x) => x.impact === "serious" || x.impact === "critical")
          .map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
