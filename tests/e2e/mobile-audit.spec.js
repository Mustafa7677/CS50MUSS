// Мобильді аудит: құрылғы матрицасы (320..1024), жарық/қараңғы, touch. Іске қосу:
//   cd tests && npx playwright test e2e/mobile-audit.spec.js
// Ескерту: бұл эмуляция (Chromium). Нақты құрылғы, iOS Safari, экран пернетақтасы, шынайы желі - MOBILE-TESTING.md.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { ROOT, routePyodide, blockFonts, collectErrors } = require("../support/helpers");

const DEVICES = [
  { n: "320x568", w: 320, h: 568 }, { n: "360x640", w: 360, h: 640 }, { n: "390x844", w: 390, h: 844 },
  { n: "412x915", w: 412, h: 915 }, { n: "768x1024", w: 768, h: 1024 }, { n: "1024x768", w: 1024, h: 768 },
];
const SMALL = DEVICES.slice(0, 2);
const SCHEMES = ["light", "dark"];
const use = (d, scheme) => ({ viewport: { width: d.w, height: d.h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, colorScheme: scheme });

test.beforeEach(async ({ context }) => { await blockFonts(context); });

// ---- ортақ тексеру: көлденең айналу, қиылған мәтін/батырма, ≥12px мәтін ----
async function audit(page, rootSel = "body") {
  return page.evaluate((rootSel) => {
    const vw = document.documentElement.clientWidth, root = document.querySelector(rootSel) || document.body;
    const clipped = [], tiny = {};
    const scroller = (e) => { for (let a = e.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "scroll") return true; } return false; };
    for (const e of root.querySelectorAll("*")) {
      if (e.closest("svg, [aria-hidden='true'], .certificate, .cert-sheet, [hidden]")) continue;
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!r.width || !r.height || cs.visibility === "hidden" || cs.position === "fixed" || cs.display === "none") continue;
      const txt = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if ((txt || /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(e.tagName)) && (r.right > vw + 1 || r.left < -1) && !scroller(e))
        clipped.push(e.tagName + "." + String(e.className).slice(0, 30) + " " + Math.round(r.left) + ".." + Math.round(r.right));
      if (txt && parseFloat(cs.fontSize) < 12) tiny[e.tagName + "." + String(e.className).slice(0, 24) + "=" + cs.fontSize] = 1;
    }
    return { sw: document.documentElement.scrollWidth, cw: vw, clipped: clipped.slice(0, 8), tiny: Object.keys(tiny).slice(0, 8) };
  }, rootSel);
}
async function expectClean(page, what, rootSel) {
  const r = await audit(page, rootSel);
  expect(r.sw, `${what}: көлденең айналу`).toBeLessThanOrEqual(r.cw);
  expect(r.clipped, `${what}: қиылған элементтер`).toEqual([]);
  expect(r.tiny, `${what}: <12px мәтін`).toEqual([]);
}
const sizeOf = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
async function expectTarget(loc, what) { const s = await sizeOf(loc); expect(Math.min(s.w, s.h), `${what} touch target ${s.w}x${s.h}`).toBeGreaterThanOrEqual(44); }
// WCAG контраст (тек түссіз/бір түсті фон)
async function lowContrast(page, sel) {
  return page.evaluate((sel) => {
    const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
    const bgOf = (e) => { for (let a = e; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.backgroundImage !== "none") return null; const p = parse(cs.backgroundColor); if (p && p.a > 0.9) return p.c; } return [255, 255, 255]; };
    const bad = [];
    for (const e of [...document.querySelectorAll(sel)].slice(0, 80)) {
      if (!e.getBoundingClientRect().width || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const fg = parse(getComputedStyle(e).color), bg = bgOf(e); if (!fg || !bg) continue;
      const a = lum(fg.c), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < 4.5) bad.push(e.tagName + "." + String(e.className).slice(0, 20) + " " + ratio.toFixed(2));
    }
    return [...new Set(bad)].slice(0, 6);
  }, sel);
}

// ================= e) Жалпы: құрылғы матрицасы + барлық бет типі =================
for (const d of DEVICES) for (const scheme of SCHEMES) {
  test.describe(`матрица ${d.n} ${scheme}`, () => {
    test.use(use(d, scheme));
    for (const f of ["index.html", "python/lectures/week-3.html", "playground.html", "games.html"]) {
      test(f, async ({ page }) => {
        const errs = collectErrors(page);
        await page.goto(f); await page.waitForTimeout(500);
        await expectClean(page, `${f} @${d.n}`);
        expect(errs).toEqual([]);
      });
    }
  });
}

const PAGE_TYPES = ["index.html", "courses.html", "python/index.html", "lectures/week-0.html", "practice.html", "exam.html", "certificate.html", "glossary.html", "flashcards.html", "map.html", "profile.html", "copyright.html"];
for (const d of SMALL) for (const scheme of SCHEMES) {
  test.describe(`бет типтері ${d.n} ${scheme}`, () => {
    test.use(use(d, scheme));
    for (const f of PAGE_TYPES) {
      test(f, async ({ page }) => {
        await page.goto(f); await page.waitForTimeout(600);
        await expectClean(page, `${f} @${d.n}`);
      });
    }
  });
}

for (const d of SMALL) {
  test.describe(`nav/topbar/footer ${d.n}`, () => {
    test.use(use(d, "light"));
    test(`topbar сыяды, қабаттаспайды, 44px; Aa панелі экранда; footer оқылады`, async ({ page }) => {
      await page.goto("lectures/week-0.html"); await page.waitForTimeout(500);
      const boxes = await page.evaluate(() => [".brand", ".course-pill", ".search-open", ".prefs-open", ".profile-open"].map((s) => { const e = document.querySelector(".topbar " + s); const r = e.getBoundingClientRect(); return { s, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; }));
      for (const b of boxes) { expect(b.l, b.s).toBeGreaterThanOrEqual(0); expect(b.r, b.s).toBeLessThanOrEqual(d.w); expect(Math.min(b.w, b.h), `${b.s} ${b.w}x${b.h}`).toBeGreaterThanOrEqual(44); }
      const sorted = [...boxes].sort((a, b) => a.l - b.l);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i].l, `${sorted[i - 1].s} мен ${sorted[i].s} қабаттаспасын`).toBeGreaterThanOrEqual(sorted[i - 1].r - 0.5);
      expect(await page.evaluate(() => document.querySelector(".topbar").getBoundingClientRect().height)).toBeLessThanOrEqual(64);
      await page.locator(".prefs-open").tap();
      const pb = await page.locator(".prefs-panel").boundingBox();
      expect(pb.x).toBeGreaterThanOrEqual(0); expect(pb.x + pb.width).toBeLessThanOrEqual(d.w + 0.5);
      await expect(page.locator('.prefs-panel [data-th="dark"]')).toBeVisible(); // қараңғы тақырып (theme-toggle ≤480px жасырын)
      const bottom = pb.y + pb.height; expect(bottom, "Aa панелі биіктікке сыяды (ішінде айналса да)").toBeLessThanOrEqual(d.h + 400);
      await page.keyboard.press("Escape");
      const legal = page.locator(".ft-legal").first(); await legal.scrollIntoViewIfNeeded();
      const fs = await legal.evaluate((e) => [...e.querySelectorAll("p")].map((p) => parseFloat(getComputedStyle(p).fontSize)));
      for (const f of fs) expect(f).toBeGreaterThanOrEqual(12);
      expect(await lowContrast(page, ".ft-legal p, .ft-legal a, .ft-col a")).toEqual([]);
    });
    test("ұзын сөз/URL бетті кеңейтпейді", async ({ page }) => {
      await page.goto("lectures/week-0.html");
      await page.evaluate(() => { const p = document.querySelector(".content p"); p.insertAdjacentHTML("afterend", '<p id="lw">https://example.com/' + "a".repeat(220) + "-" + "суперұзынсөз".repeat(15) + '</p>'); });
      const r = await audit(page);
      expect(r.sw).toBeLessThanOrEqual(r.cw);
    });
  });
}
for (const scheme of SCHEMES) {
  test(`контраст: лекция мәтіні ${scheme}`, async ({ browser }) => {
    const ctx = await browser.newContext(use(DEVICES[0], scheme)); await blockFonts(ctx);
    const page = await ctx.newPage(); await page.goto("lectures/week-0.html");
    expect(await lowContrast(page, ".content p, .content li, .content h2, .content h3, .toc a, .nav a, .lecture-head p")).toEqual([]);
    await ctx.close();
  });
}

// ================= a) Код редакторы =================
for (const d of SMALL) {
  test.describe(`редактор ${d.n}`, () => {
    test.use(use(d, "light"));
    test("playground: Python/SQL/Web табтары, фокус, Run батырмасы, шығыс", async ({ page, context }) => {
      await routePyodide(context);
      await page.goto("playground.html"); await page.waitForTimeout(500);
      const ed = page.locator("textarea.pg-editor");
      await ed.tap();
      expect(await ed.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)), "iOS фокуста масштабтамас үшін ≥16px").toBeGreaterThanOrEqual(16);
      await expectTarget(page.locator(".pg-run"), "Іске қосу (Ctrl+Enter баламасы)");
      await expectTarget(page.locator(".pg-tab").first(), "таб");
      // экран пернетақтасы ~40% экранды алады: редактор басына айналдырғанда Run көрінуі керек
      await ed.evaluate((e) => e.scrollIntoView({ block: "start" })); await page.evaluate(() => scrollBy(0, -64));
      const runBottom = await page.locator(".pg-run").evaluate((e) => e.getBoundingClientRect().bottom);
      expect(runBottom, "Run батырмасы пернетақта ашық кезде көрінетін аймақта").toBeLessThanOrEqual(d.h * 0.62);
      // Ұзын жол: бет айналмайды
      await ed.fill('print("' + "x".repeat(400) + '")\n' + "y = 1 + " + "2 + ".repeat(120) + "3");
      let r = await audit(page); expect(r.sw).toBeLessThanOrEqual(r.cw);
      // Tab тұзағы: Esc басқаннан кейін Tab фокусты шығарады
      await ed.focus(); await page.keyboard.press("Escape"); await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement.tagName), "Esc → Tab фокусты редактордан шығарады").not.toBe("TEXTAREA");
      await ed.fill('print("сәлем")'); await page.locator(".pg-run").tap();
      await expect(page.locator(".pg-output .run-output")).toContainText("сәлем", { timeout: 80_000 });
      await ed.fill('print("' + "z".repeat(500) + '")'); await page.locator(".pg-run").tap();
      await expect(page.locator(".pg-output .run-output")).toContainText("zzzz", { timeout: 30_000 });
      r = await audit(page); expect(r.sw, "ұзын шығыс бетті айналдырмасын").toBeLessThanOrEqual(r.cw);
      expect(await page.locator(".pg-output .run-output").evaluate((e) => getComputedStyle(e).overflowX)).toMatch(/auto|scroll/);
      // SQL табы: схема тізімі
      await page.locator(".pg-tab").nth(1).tap();
      await expect(page.locator(".pg-schema .pg-table").first()).toBeVisible({ timeout: 30_000 });
      await ed.fill("SELECT * FROM " + (await page.locator(".pg-schema .pg-table b, .pg-schema .pg-table strong").first().textContent().catch(() => "sqlite_master")) + ";");
      await page.locator(".pg-run").tap();
      await expect(page.locator(".pg-output .sql-table").first()).toBeVisible({ timeout: 30_000 });
      await expectClean(page, "playground SQL");
      // Web табы
      await page.locator(".pg-tab").nth(2).tap();
      await expect(page.locator(".web-lab")).toBeVisible();
      await expectClean(page, "playground Web");
    });
    test("лекция: код блогы батырмалары ≥44px, ұзын жол тек код ішінде айналады; autograder", async ({ page, context }) => {
      await routePyodide(context);
      await page.goto("python/lectures/week-3.html"); await page.waitForTimeout(600);
      const pre = page.locator('pre[data-lang="python"]').first();
      await pre.scrollIntoViewIfNeeded();
      await expectTarget(pre.locator(".run-btn"), "«Іске қос»"); await expectTarget(pre.locator(".copy-btn"), "«Көшіру»");
      const rb = await pre.locator(".run-btn").boundingBox(), cb = await pre.locator(".copy-btn").boundingBox();
      expect(rb.x + rb.width, "Іске қос/Көшіру қабаттаспасын").toBeLessThanOrEqual(cb.x + 1);
      await pre.evaluate((e) => { const c = e.querySelector("code") || e; c.textContent += "\n# " + "ұзынжол".repeat(60); });
      const m = await pre.evaluate((e) => ({ sc: e.scrollWidth, cl: e.clientWidth, ox: getComputedStyle(e).overflowX }));
      expect(m.sc).toBeGreaterThan(m.cl); expect(m.ox).toMatch(/auto|scroll/);
      const r = await audit(page); expect(r.sw, "бет айналмасын").toBeLessThanOrEqual(r.cw);
      await pre.locator(".run-btn").tap();
      const out = page.locator("pre.run-output").first();
      await expect(out).toBeVisible({ timeout: 80_000 });
      await expect(out).toBeInViewport({ ratio: 0.2 });
      // autograder
      const ag = page.locator(".autograder").first(); await ag.scrollIntoViewIfNeeded();
      const code = ag.locator("textarea");
      expect(await code.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
      await expectTarget(ag.locator(".ag-run"), "Тексеру");
      await code.fill("print('x')"); await ag.locator(".ag-run").tap();
      await expect(ag.locator(".ag-results li:not(.wait)").first()).toBeVisible({ timeout: 80_000 });
      await expectClean(page, "autograder нәтижесі");
    });
  });
}

// ================= b) Ұзын лекциялар =================
const longest = (c) => { const dir = path.join(ROOT, c, "lectures"); return fs.readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => [f, fs.statSync(path.join(dir, f)).size]).sort((a, b) => b[1] - a[1])[0]; };
for (const c of ["python", "ai", "sql", "web", "cpp", "java"]) {
  const [file, size] = longest(c);
  for (const d of SMALL) {
    test.describe(`ұзын лекция ${c}/${file} ${d.n}`, () => {
      test.use(use(d, "dark"));
      test("көлденең айналусыз, toc, sticky, кесте/диаграмма, Оқыдым, pager", async ({ page }) => {
        const errs = collectErrors(page);
        const t0 = Date.now();
        await page.goto(`${c}/lectures/${file}`, { waitUntil: "load" }); await page.waitForTimeout(600);
        const loadMs = Date.now() - t0;
        test.info().annotations.push({ type: "ескерту: өлшем/жүктелу", description: `${(size / 1024).toFixed(0)} KB HTML, load ${loadMs} ms` });
        if (size > 600 * 1024) test.info().annotations.push({ type: "ЕСКЕРТУ", description: `HTML ${(size / 1024).toFixed(0)} KB: баяу 3G-де ауыр` });
        await expectClean(page, `${c}/${file}`);
        // toc
        const toggle = page.locator(".toc-toggle");
        if (await toggle.count()) {
          await toggle.tap(); await expect(page.locator(".toc")).toHaveClass(/open/);
          await expect(page.locator(".toc ol").first()).toBeVisible(); await expectTarget(toggle, "toc ашу");
          const link = page.locator(".toc ol a").nth(3); const href = await link.getAttribute("href");
          await link.tap(); await page.waitForTimeout(600);
          // sticky topbar тақырыпты жаппауы керек
          const g = await page.evaluate((h) => { const t = document.querySelector(h); return { top: t ? t.getBoundingClientRect().top : 999, bar: document.querySelector(".topbar").getBoundingClientRect().bottom }; }, href);
          expect(g.top, "якорь тақырыбы topbar астында").toBeGreaterThanOrEqual(g.bar - 2);
        }
        // sticky/fixed элементтер экранның көп бөлігін алмайды
        const fixedFrac = await page.evaluate(() => { let a = 0; for (const e of document.querySelectorAll("body *")) { const cs = getComputedStyle(e); if ((cs.position === "sticky" || cs.position === "fixed") && cs.display !== "none" && cs.visibility !== "hidden" && !e.closest(".prefs-panel,.search-modal,.course-menu,dialog") && e.getBoundingClientRect().width > innerWidth * 0.5) { const r = e.getBoundingClientRect(); if (r.top < 100 && r.height) a += r.height; } } return a / innerHeight; });
        expect(fixedFrac, "жоғарғы sticky қабаттар").toBeLessThan(0.25);
        // кестелер, диаграммалар, суреттер
        const media = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth, bad = [];
          for (const t of document.querySelectorAll(".content table")) { const o = getComputedStyle(t).overflowX; const w = t.closest(".sql-table,.tablewrap,[style*=overflow]"); if (t.getBoundingClientRect().right > vw + 1 && !/auto|scroll/.test(o) && !w) bad.push("table"); }
          for (const e of document.querySelectorAll(".content img, .content svg, .content canvas, .content video, .content iframe")) { if (e.closest("pre, [aria-hidden='true']")) continue; const r = e.getBoundingClientRect(); if (r.width && r.right > vw + 1) { let sc = false; for (let a = e.parentElement; a; a = a.parentElement) if (/auto|scroll/.test(getComputedStyle(a).overflowX)) sc = true; if (!sc) bad.push(e.tagName + " " + Math.round(r.right)); } }
          return bad.slice(0, 6);
        });
        expect(media, "кесте/сурет/диаграмма").toEqual([]);
        // SVG ішіндегі жазулар viewBox-тан шықпасын (ескерту ретінде)
        const svgClip = await page.evaluate(() => { let n = 0; for (const s of document.querySelectorAll(".content svg")) { const vb = s.viewBox && s.viewBox.baseVal; if (!vb || !vb.width) continue; for (const t of s.querySelectorAll("text")) { try { const b = t.getBBox(); if (b.x < vb.x - 4 || b.x + b.width > vb.x + vb.width + 4) n++; } catch (e) {} } } return n; });
        if (svgClip) test.info().annotations.push({ type: "ЕСКЕРТУ", description: `${svgClip} SVG жазуы viewBox-тан шығады (${c}/${file})` });
        // «Оқыдым» және pager
        const mark = page.locator(".mark-read button, .mark-read .btn, button.mark-read").first();
        if (await mark.count()) { await mark.scrollIntoViewIfNeeded(); await expectTarget(mark, "Оқыдым"); await mark.tap(); }
        const pager = page.locator(".pager a").first(); await pager.scrollIntoViewIfNeeded(); await expect(pager).toBeInViewport();
        await expectTarget(pager, "pager");
        expect(errs).toEqual([]);
      });
    });
  }
}

// ================= c) SQL =================
for (const d of SMALL) {
  test.describe(`SQL ${d.n}`, () => {
    test.use(use(d, "light"));
    test("лекция: нәтиже кестесі көлденең айналады, тапсырма textarea/Run", async ({ page }) => {
      await page.goto("sql/lectures/week-1.html"); await page.waitForTimeout(600);
      const run = page.locator('pre[data-lang="sql"][data-db] .run-btn').first();
      await run.scrollIntoViewIfNeeded(); await expectTarget(run, "SQL Іске қос"); await run.tap();
      const tbl = page.locator(".sql-output .sql-table").first(); await expect(tbl).toBeVisible({ timeout: 60_000 });
      expect(await tbl.evaluate((e) => getComputedStyle(e).overflowX)).toMatch(/auto|scroll/);
      const th = await tbl.locator("th").first().evaluate((e) => ({ fs: parseFloat(getComputedStyle(e).fontSize), ws: getComputedStyle(e).whiteSpace }));
      expect(th.fs).toBeGreaterThanOrEqual(12); expect(th.ws).toBe("nowrap");
      await expectClean(page, "SQL нәтижесі");
      const sg = page.locator(".sql-grader").first(); await sg.scrollIntoViewIfNeeded();
      const ta = sg.locator("textarea");
      expect(await ta.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
      await expectTarget(sg.locator(".sg-run"), "SQL Тексеру");
      await ta.fill("SELECT 'a' AS " + "c".repeat(5) + ", " + "'x', ".repeat(80) + "1;"); await sg.locator(".sg-run").tap();
      await page.waitForTimeout(800);
      await expectClean(page, "ұзын SQL сұрау");
    });
    test("detective.html", async ({ page }) => {
      await page.goto("detective.html#baikonur"); await page.waitForTimeout(800);
      const code = page.locator(".dt-code"); await code.scrollIntoViewIfNeeded();
      expect(await code.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
      await expectTarget(page.locator(".dt-run"), "dt-run");
      await code.fill("SELECT * FROM " + "x".repeat(300)); await page.locator(".dt-run").tap(); await page.waitForTimeout(500);
      await code.fill("SELECT 1 AS " + "a".repeat(10) + ";"); await page.locator(".dt-run").tap();
      await expectClean(page, "detective");
    });
    test("games#sqlescape: нәтиже кестесі", async ({ page }) => {
      await page.goto("games.html#sqlescape"); await expect(page.locator(".gb-sql")).toBeVisible();
      await page.locator(".gb-sql").fill("SELECT * FROM books"); await expectTarget(page.locator(".gb-run"), "gb-run");
      await page.locator(".gb-run").tap(); await expect(page.locator(".gb-tablewrap").first()).toBeVisible({ timeout: 30_000 });
      expect(await page.locator(".gb-tablewrap").first().evaluate((e) => getComputedStyle(e).overflowX)).toMatch(/auto|scroll/);
      await expectClean(page, "sqlescape");
    });
  });
}

// ================= d) Ойындар =================
const GAMES = ["runner", "bughunt", "battle", "algo", "sqlescape", "memory", "webbuilder", "binary", "oracle"];
for (const d of SMALL) for (const scheme of SCHEMES) {
  test.describe(`ойындар ${d.n} ${scheme}`, () => {
    test.use(use(d, scheme));
    test("hub", async ({ page }) => {
      await page.goto("games.html?fast"); await expect(page.locator(".game-card").first()).toBeVisible();
      await expectClean(page, "hub", ".games-root");
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow + getComputedStyle(document.documentElement).overflow)).not.toMatch(/hidden/);
    });
    for (const id of GAMES) {
      test(id, async ({ page }) => {
        const errs = collectErrors(page);
        await page.goto("games.html?fast#" + id); await expect(page.locator(".game-shell")).toBeVisible(); await page.waitForTimeout(500);
        await expectClean(page, id + " бастау", ".games-root");
        const small = async () => page.evaluate(() => [...document.querySelectorAll(".games-root button, .games-root .g-opt, .games-root input:not([type=hidden]), .games-root textarea, .games-root select")].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width && cs.visibility !== "hidden" && !e.closest("[aria-hidden='true']") && !e.disabled && (r.height < 44 || r.width < 44) && !/checkbox|radio|range/.test(e.type || ""); }).map((e) => e.tagName + "." + String(e.className).slice(0, 20) + " " + Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().height)).slice(0, 6));
        expect(await small(), id + " бастау: <44px батырмалар").toEqual([]);
        const go = page.locator(".ga-go"); if (await go.count()) await go.first().tap();
        await page.waitForTimeout(400);
        // сенсорлық ойнау: пернетақтасыз
        for (let i = 0; i < 40 && !(await page.locator(".game-result").count()); i++) {
          const sel = page.locator(".ga-ok:not([disabled]), .ga-next, .gb-next, .ga-nx, .gb-send").first();
          if (id === "runner") await page.locator(".ga-lane").nth(i % 3).tap({ timeout: 2000 }).catch(() => {});
          else if (id === "sqlescape") { await page.locator(".gb-sql").fill("SELECT * FROM books").catch(() => {}); await page.locator(".gb-run").tap({ timeout: 2000 }).catch(() => {}); }
          else if (id === "webbuilder") { await page.locator(".gb-pal").nth(i % 4).tap({ timeout: 2000 }).catch(() => {}); if (i > 3) break; }
          else if (id === "binary") { await page.locator(".gb-bit, .gb-bits button").first().tap({ timeout: 1000 }).catch(() => {}); await page.locator(".gb-send").tap({ timeout: 1000 }).catch(() => {}); }
          else { await page.locator(".g-opt, .ga-line, .gy-or-opt, .ga-step .ga-dn").first().tap({ timeout: 1500 }).catch(() => {}); }
          if (await sel.count()) await sel.tap({ timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(250);
          if (i === 2) { await expectClean(page, id + " ойын ішінде", ".games-root"); expect(await small(), id + " ойын ішінде: <44px").toEqual([]); }
        }
        if (await page.locator(".game-result").count()) {
          await expectClean(page, id + " нәтиже", ".games-root");
          await expect(page.locator(".game-result")).toBeVisible();
          const xp = page.locator(".game-result [class*=xp], .game-result .g-xp, .game-result progress, .game-result [role=progressbar]");
          if (await xp.count()) { const b = await xp.first().boundingBox(); expect(b.x + b.width).toBeLessThanOrEqual(d.w + 0.5); }
        }
        const after = await page.evaluate(() => ({ b: getComputedStyle(document.body).overflow, h: getComputedStyle(document.documentElement).overflow }));
        expect(after.b + after.h, "scroll lock жоқ").not.toMatch(/hidden/);
        expect(errs).toEqual([]);
      });
    }
  });
}
