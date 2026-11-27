// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Мұғалімге сабақ жоспарлары (academy/teach/, tools/academy/teach.py, docs/AO17-CS-TEACH.md). Тексереміз:
//  * әр жоспар сабақ бетінің өз деректерімен (ac-data) сәйкес: мақсат саны, тұзақ, рефлексия, шығу билетінің сұрағы мен жауабы;
//  * сабақ барысының қосындысы 45 минут; КТЖ: 120 жол, аптасына сағат -> апта, CSV (BOM, «;», бос «Күні», формула инъекциясы жоқ);
//  * бір жоспарды басып шығару (тек сол жоспар және толтыру жолдары), кіру нүктелері, сілтемелер, 360px және axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const MODS = Array.from({ length: 12 }, (_, i) => `m${String(i + 1).padStart(2, "0")}`);
const SLUGS = Array.from({ length: 10 }, (_, i) => `l${String(i + 1).padStart(2, "0")}`);
const LETTERS = "ABCDEF";

function lessonData(mid, slug) {
  const s = fs.readFileSync(path.join(ROOT, `academy/${mid}/${slug}.html`), "utf8");
  return JSON.parse(s.match(/<script type="application\/json" id="ac-data">([\s\S]*?)<\/script>/)[1]);
}

function csvRows(text) {   // «;» бөлгіш, тырнақшадағы ұяшық
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ";") { row.push(cell); cell = ""; } else if (ch === "\r" && text[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// бетке қатысты сілтеме: файл бар, ал #якорь сол бетте бар
async function linksResolve(page, base) {
  for (const h of await page.locator("#main a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
    if (/^https?:/.test(h)) continue;   // JS қосатын нан қиқымы - толық мекенжай
    if (h.startsWith("#")) { await expect(page.locator(h), h).toHaveCount(1); continue; }
    const [file, anchor] = h.split("#");
    const fp = path.join(ROOT, base, file.split("?")[0]);
    expect(fs.existsSync(fp), h).toBe(true);
    if (anchor) expect(fs.readFileSync(fp, "utf8").includes(`id="${anchor}"`), h).toBe(true);
  }
}

test("мұғалімге: 12 апта, 120 жоспар, 240 шығу билеті; КТЖ аптасына сағатқа қарай; барлық сілтеме бар бетке апарады", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("academy/teach/index.html");
  await expect(page.locator("h1")).toHaveText("AO17 CS сабақ жоспарлары");
  await expect(page.locator(".tp-cards li")).toHaveCount(12);
  await expect(page.locator(".tp-stats b").nth(0)).toHaveText("12");
  await expect(page.locator(".tp-stats b").nth(1)).toHaveText("120");
  await expect(page.locator(".tp-stats b").nth(2)).toHaveText("240");
  await expect(page.locator(".tp-model-list li")).toHaveCount(6);
  const rows = page.locator(".tp-ktp-table tbody tr[data-i]");
  await expect(rows).toHaveCount(120);
  await expect(page.locator(".tp-ktp-table tr.tp-ktp-mod")).toHaveCount(12);
  await expect(rows.last().locator("[data-week]")).toHaveText("60");
  await page.locator('input[name="tp-pace"][value="3"]').check();
  await expect(rows.nth(3).locator("[data-week]")).toHaveText("2");
  await expect(rows.last().locator("[data-week]")).toHaveText("40");
  await expect(page.locator("[data-ktp-sum]")).toHaveText("120 сабақ, аптасына 3 сағат: 40 апта.");
  await page.locator('input[name="tp-pace"][value="1"]').check();
  await expect(rows.last().locator("[data-week]")).toHaveText("120");
  await linksResolve(page, "academy/teach");
  expect(errors).toEqual([]);
});

test("КТЖ: CSV - UTF-8 BOM, «;» бөлгіш, 120 сабақ, бос «Күні», сілтеме жоспарға апарады, формула ретінде орындалатын ұяшық жоқ", async ({ page }) => {
  await page.goto("academy/teach/index.html");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-ktp-csv]").click()]);
  expect(dl.suggestedFilename()).toBe("ao17cs-ktzh-2-sagat.csv");
  const buf = fs.readFileSync(await dl.path());
  expect([...buf.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const rows = csvRows(buf.toString("utf8").replace(/^﻿/, ""));
  expect(rows).toHaveLength(121);
  expect(rows[0]).toEqual(["№", "Апта", "Апта тақырыбы", "Сабақтың тақырыбы", "Оқу мақсаты (бағалау критерийі)", "Сағат", "Күні", "Сабақ жоспары (ҚМЖ)"]);
  expect(rows[1].slice(0, 4)).toEqual(["1", "1", "1-апта. Логика және пайымдау", "Пікір және ақиқат мәні"]);
  expect(rows[1][7]).toMatch(/\/academy\/teach\/m01\.html#l01$/);
  expect(rows[120].slice(0, 2)).toEqual(["120", "60"]);
  for (const r of rows.slice(1)) {
    expect(r, r[0]).toHaveLength(8);
    expect(r[5]).toBe("1");
    expect(r[6]).toBe("");
    for (const c of r) expect(c, `${r[0]}: ${c}`).not.toMatch(/^[=+\-@]/);
  }
});

test("апта беттері: әр жоспар сабақ бетінің деректерімен сәйкес (мақсат, тұзақ, рефлексия, шығу билеті мен кілті); 45 минут", async ({ page }) => {
  test.setTimeout(180000);
  const errors = collectErrors(page);
  for (const mid of MODS) {
    await page.goto(`academy/teach/${mid}.html`);
    const plans = await page.locator("[data-tp-plan]").evaluateAll((ps) => ps.map((p) => ({
      id: p.id,
      obj: p.querySelectorAll(".tp-obj li").length,
      mins: [...p.querySelectorAll(".tp-flow tbody tr")].map((r) => Number(r.dataset.min)),
      open: p.querySelector(".tp-flow tr.st-open td").textContent,
      exitRow: p.querySelector(".tp-flow tr.st-exit td").textContent,
      reflect: p.querySelector(".tp-flow tr.st-reflect td").textContent,
      lesson: p.querySelector(".tp-plan-acts a").getAttribute("href"),
      exit: [...p.querySelectorAll(".tp-exit > li")].map((li) => ({ type: li.dataset.type, q: li.querySelector(".tp-q").textContent, key: li.querySelector(".tp-key").textContent })),
    })));
    expect(plans.map((p) => p.id), mid).toEqual(SLUGS);
    for (const p of plans) {
      const d = lessonData(mid, p.id);
      const w = `${mid}/${p.id}`;
      expect(p.lesson, w).toBe(`../${mid}/${p.id}.html`);
      expect(p.obj, w).toBe(d.objectives);
      expect(p.mins.reduce((a, b) => a + b, 0), w).toBe(45);
      expect(p.open, w).toContain(d.cine.trap.wrong);
      expect(p.exitRow, w).toContain(d.cine.trap.right);
      expect(p.reflect, w).toContain(d.reflection[0]);
      expect(p.exit.map((x) => x.type), w).toEqual(d.assessment.map((a) => a.type));
      p.exit.forEach((x, i) => {
        const a = d.assessment[i];
        expect(x.q, w).toBe(a.q);
        if (a.type === "mc") expect(x.key, w).toContain(`${LETTERS[a.answer]} ${a.options[a.answer]}`);
        if (a.type === "number") expect(x.key, w).toContain(String(a.answer));
        if (a.type === "coutput") expect(x.key.replace(/\s+/g, " "), w).toContain(a.answer.replace(/\s+/g, " "));
      });
    }
  }
  await linksResolve(page, "academy/teach");
  expect(errors).toEqual([]);
});

test("басып шығару: бір жоспар - тек сол жоспар және толтыру жолдары; «барлығы» - аптаның 10 жоспары", async ({ page }) => {
  await page.goto("academy/teach/m03.html");
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
  const visible = () => page.locator("[data-tp-plan]").evaluateAll((ps) => ps.filter((p) => getComputedStyle(p).display !== "none").map((p) => p.id));
  await expect(page.locator("#l05 .tp-fill")).toBeHidden();
  await page.locator('#l05 [data-tp-print="l05"]').click();
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  await page.emulateMedia({ media: "print" });
  expect(await visible()).toEqual(["l05"]);
  await expect(page.locator("#l05 .tp-fill")).toBeVisible();
  await expect(page.locator(".topbar")).toBeHidden();
  await expect(page.locator(".tp-head")).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  expect(await visible()).toHaveLength(10);
  await page.emulateMedia({ media: "screen" });
  await page.locator('[data-tp-print="all"]').click();
  expect(await page.evaluate(() => window.__printed)).toBe(2);
  await page.emulateMedia({ media: "print" });
  expect(await visible()).toEqual(SLUGS);
  await expect(page.locator(".tp-head")).toBeVisible();
});

test("кіру нүктелері: курс беті, мектептерге және мұғалім беті жиынтыққа апарады; сан деректен", async ({ page }) => {
  await page.goto("academy/course.html");
  await expect(page.locator('a[href="teach/index.html"]').first()).toHaveText("Мұғалімге");
  await page.goto("schools.html");
  await expect(page.locator('#main a[href="academy/teach/index.html"]')).toHaveText("Сабақ жоспарлары");
  await expect(page.locator(".sch-grid")).toContainText("(120 ҚМЖ)");
  await page.goto("teacher.html");
  await expect(page.locator('#main a[href="academy/teach/index.html"]')).toHaveText("Мұғалімге");
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: мұғалімге беттері көлденең жылжымайды; axe таза`, async ({ browser }) => {
    test.setTimeout(120000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const u of ["academy/teach/index.html", "academy/teach/m01.html", "academy/teach/m10.html"]) {
      await p.goto(u);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), u).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.getElementById("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes.length} (${x.nodes[0].html.slice(0, 140)})`));
      expect(v, u).toEqual([]);
    }
    await c.close();
  });
}
