// © 2026 Sagid Mustafa. Алаш дизайнының визуал регрессия тесті (эталон: git тег alash-design-baseline-2026-11).
// Мақсат: жаңа академиялар (IELTS, SAT) мен зертханалар қосылғанда бар беттердің көрінісі байқаусыз өзгермесін.
// Суреттер шрифт пен ОЖ-ге тәуелді, сондықтан тест тек VISUAL=1 болғанда жүреді (бір машинада салыстыру):
//   cd tests && VISUAL=1 npx playwright test visual-alash               # эталонмен салыстыру
//   cd tests && VISUAL=1 npx playwright test visual-alash --update-snapshots   # эталонды әдейі жаңарту (дизайн өзгерісі келісілгенде ғана)
const { test, expect } = require("@playwright/test");
const { blockFonts } = require("../support/helpers");

const PAGES = ["index.html", "academy/index.html", "academy/m01/l01.html", "academy/tracks/software.html", "alash.html", "en/index.html", "programming.html", "math/index.html"];
test.skip(!process.env.VISUAL, "визуал тест тек VISUAL=1 кезінде");

for (const scheme of ["light", "dark"]) {
  for (const [name, vp] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    for (const url of PAGES) {
      test(`${url} · ${scheme} · ${name}`, async ({ browser }) => {
        const c = await browser.newContext({ viewport: vp, colorScheme: scheme, reducedMotion: "reduce", deviceScaleFactor: 1 });
        await blockFonts(c);
        await c.route(/supabase\.co|cdn\.jsdelivr\.net|unpkg\.com/, (r) => r.abort());
        const p = await c.newPage();
        await p.goto(url);
        await p.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
        await p.waitForTimeout(400);
        await expect(p).toHaveScreenshot(`${url.replace(/\//g, "_")}-${scheme}-${name}.png`, { fullPage: false, maxDiffPixelRatio: 0.01, animations: "disabled" });
        await c.close();
      });
    }
  }
}
