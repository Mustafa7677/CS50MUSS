// Екі деңгейлі сертификат: «Оқу сертификаты» және «Расталған білім сертификаты» (емтихан + тапсырма + тест)
const { test, expect } = require("@playwright/test");
const { blockFonts, collectErrors } = require("../support/helpers");

const COURSES = ["x", "python", "sql", "ai", "web", "cpp", "java"];
const HARVARD = ["x", "python", "sql", "ai", "web"];
const url = (c, tier = "verified") => `certificate.html?${[c === "x" ? "" : "course=" + c, tier ? "tier=" + tier : ""].filter(Boolean).join("&")}`;

// Бетте localStorage-ке курс прогресін қояды: opts = { read, exam, tasks, quiz }
async function seed(page, course, opts = {}) {
  const o = Object.assign({ read: "all", exam: 80, tasks: "all", quiz: 100 }, opts);
  await page.goto("index.html");
  await page.evaluate(({ course, o }) => {
    const K = window.CS50KZ;
    const ids = course === "x" ? K.ORDER : Array.from({ length: K.CERT_TASKS[course].length }, (_, i) => `${course}:week-${i}`);
    const per = K.CERT_TASKS[course];
    const prog = JSON.parse(localStorage.getItem("cs50kz:progress") || "{}");
    prog.read = prog.read || {}; prog.quiz = prog.quiz || {};
    const nRead = o.read === "all" ? ids.length : o.read;
    ids.slice(0, nRead).forEach((id) => (prog.read[id] = true));
    ids.forEach((id) => { if (o.quiz != null) prog.quiz[id] = { best: o.quiz, total: 100 }; });
    localStorage.setItem("cs50kz:progress", JSON.stringify(prog));
    if (o.exam != null) localStorage.setItem(course === "x" ? "cs50kz:exam" : "cs50kz:exam:" + course, JSON.stringify({ best: o.exam, tries: [] }));
    let left = o.tasks === "all" ? 1e9 : o.tasks;
    ids.forEach((id, i) => {
      for (let j = 0; j < per[i] && left > 0; j++, left--) {
        const path = course === "x" ? `/CS50MUSS/lectures/${id}.html` : `/CS50MUSS/${course}/lectures/${id.split(":")[1]}.html`;
        localStorage.setItem(`check:${path}:t${j}`, JSON.stringify([true, true]));
      }
    });
  }, { course, o });
}

test("таза профиль: расталған жүктелмейді, 4 критерий өлшенеді", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await page.goto(url("x"));
  await expect(page.locator(".cc-row")).toHaveCount(4);
  await expect(page.locator(".cc-count")).toHaveText("0 / 4 орындалды");
  await expect(page.locator(".cc-row.todo")).toHaveCount(4);
  await expect(page.locator(".cc-state").first()).toHaveText("қалды");
  await expect(page.locator(".cc-row").nth(0)).toContainText("лекциялар: 0/12, керек: 12");
  await expect(page.locator(".cc-row").nth(1)).toContainText("емтихан: тапсырылмаған, керек: 70%");
  await expect(page.locator(".cc-row").nth(2)).toContainText("тапсырма: 0/34, керек: 21");
  await expect(page.locator(".cc-row").nth(3)).toContainText("керек: 60%");
  await expect(page.locator(".cc-bar")).toHaveCount(4);
  await expect(page.locator(".vcert")).toBeHidden();
  await expect(page.locator(".cert-print")).toBeDisabled();
  await expect(page.locator(".cert-reason")).toContainText("жүктелмейді");
  await expect(page.locator(".cert-honest")).toContainText("Нәтижелер осы құрылғыда сақталады");
  await expect(page.locator(".cert-honest .share-progress")).toBeVisible();
  // оқу деңгейі де сақталған: әдепкі ашылатын бет
  await page.goto("certificate.html");
  await expect(page.locator(".certificate")).toBeVisible();
  await expect(page.locator(".cert-title")).toHaveText("Оқу сертификаты");
  await expect(page.locator(".cert-level")).toHaveText("Курс материалын оқып шыққанын растайды");
  await expect(page.locator(".cg-verify")).toContainText("0 / 4 шарт");
  await page.click(".cert-tier[data-tier=verified]");
  await expect(page.locator(".cert-criteria")).toBeVisible();
  await expect(page).toHaveURL(/tier=verified/);
  expect(await page.locator("main, #main").innerText()).not.toMatch(/ейресми/);
  expect(errs).toEqual([]);
});

test("шарттар орындалса: әр курста расталған сертификат ашылады", async ({ page, context }) => {
  await blockFonts(context);
  for (const c of COURSES) {
    await seed(page, c, { exam: 83, tasks: "all", quiz: 90 });
    await page.goto(url(c));
    await expect(page.locator(".cc-row.ok")).toHaveCount(4);
    await expect(page.locator(".cc-count")).toHaveText("4 / 4 орындалды");
    await expect(page.locator(".vcert")).toBeVisible();
    await expect(page.locator(".cert-print")).toBeEnabled();
    await expect(page.locator(".vc-m-exam")).toHaveText("83%");
    await expect(page.locator(".vc-m-tasks")).toContainText("100%");
    await expect(page.locator(".vc-m-quiz")).toHaveText("90%");
    await expect(page.locator(".vc-claim")).toHaveText("Бұл сертификат платформадағы білім тексерісінің нәтижесін көрсетеді.");
    await expect(page.locator(".vcert svg.vc-seal")).toBeVisible();
    expect(await page.locator(".vc-id").innerText()).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/);
    await expect(page.locator(".cert-reason")).toBeHidden();
    // профильде және жетістікте
    const info = await page.evaluate(() => ({ v: window.CS50KZ.verifiedCourses(), a: window.CS50KZ.achievements().find((a) => a.id === "verified"), s: window.CS50KZ.summary("А") }));
    expect(info.v).toEqual([c]);
    expect(info.a.done).toBe(true);
    expect(info.s.w).toEqual([c]);
    await page.evaluate(() => localStorage.clear());
  }
});

test("бір шарт жетпесе расталған ашылмайды (әр критерий бөлек)", async ({ page, context }) => {
  await blockFonts(context);
  const cases = [
    ["лекция", { read: 11 }, "lectures"],
    ["емтихан 69%", { exam: 69 }, "exam"],
    ["емтихансыз", { exam: null }, "exam"],
    ["тапсырма 20/34", { tasks: 20 }, "tasks"],
    ["тест орта 59%", { quiz: 59 }, "quiz"],
  ];
  for (const [name, opts, k] of cases) {
    await seed(page, "x", opts);
    await page.goto(url("x"));
    await expect(page.locator(`.cc-row[data-k=${k}]`), name).toHaveClass(/todo/);
    await expect(page.locator(".cc-row.ok")).toHaveCount(3);
    await expect(page.locator(".vcert"), name).toBeHidden();
    await expect(page.locator(".cert-print"), name).toBeDisabled();
    await expect(page.locator(".cert-reason")).toBeVisible();
    await page.evaluate(() => localStorage.clear());
  }
  // межеде: 21/34 тапсырма, емтихан 70%, тест 60% - ашылады
  await seed(page, "x", { tasks: 21, exam: 70, quiz: 60 });
  await page.goto(url("x"));
  await expect(page.locator(".vcert")).toBeVisible();
  await expect(page.locator(".cc-row").nth(2)).toContainText("тапсырма: 21/34, керек: 21");
});

test("сертификат ID: детерминді, курс пен оқушыға бөлек", async ({ page, context }) => {
  await blockFonts(context);
  const idOf = async (c) => { await page.goto(url(c)); return page.locator(".vcert").getAttribute("data-cert-id"); };
  await seed(page, "x");
  const a1 = await idOf("x");
  await page.reload();
  expect(await page.locator(".vcert").getAttribute("data-cert-id")).toBe(a1);
  expect(a1).toMatch(/^[0-9A-Z]{10}$/);
  expect(await page.locator(".vcert").getAttribute("data-verify-code")).toMatch(/^[0-9A-Z]{6}$/);
  // басқа курс
  await seed(page, "python");
  const b = await idOf("python");
  expect(b).not.toBe(a1);
  // басқа оқушы (ID ауысады), күн сол
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("cs50kz:profile"));
    p.id = p.id === "KZ-AAAA-2222" ? "KZ-BBBB-3333" : "KZ-AAAA-2222";
    localStorage.setItem("cs50kz:profile", JSON.stringify(p));
  });
  const a2 = await idOf("x");
  expect(a2).not.toBe(a1);
  // таза функция: бірдей кіріс - бірдей нәтиже
  const same = await page.evaluate(() => { const K = window.CS50KZ; return [K.certId("KZ-AAAA-2222", "x", "2026-01-01"), K.certId("KZ-AAAA-2222", "x", "2026-01-01"), K.certId("KZ-AAAA-2222", "x", "2026-01-02")]; });
  expect(same[0]).toBe(same[1]);
  expect(same[2]).not.toBe(same[0]);
});

test("Harvard оговоркасы тек Harvard курстарында; cpp/java-да жоқ", async ({ page, context }) => {
  await blockFonts(context);
  for (const c of COURSES) {
    await seed(page, c);
    await page.goto(url(c));
    const vtxt = await page.locator(".vcert").innerText();
    const mtxt = await page.locator("#main").innerText();
    expect(vtxt + mtxt).not.toMatch(/ейресми/i);
    if (HARVARD.includes(c)) {
      expect(vtxt).toContain("Harvard University берген ресми сертификат емес");
    } else {
      expect(vtxt).not.toMatch(/Harvard|Гарвард|CS50 ?x|CS50P/i);
      expect(mtxt).not.toMatch(/Harvard|Гарвард/i);
      await page.goto(url(c, null));
      expect(await page.locator("#main").innerText()).not.toMatch(/Harvard|Гарвард|ейресми/i);
    }
    await page.evaluate(() => localStorage.clear());
  }
});

test("мобиль 390px: көлденең айналу жоқ; қараңғы режим", async ({ page, context }) => {
  await blockFonts(context);
  await page.setViewportSize({ width: 390, height: 800 });
  const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  for (const c of ["x", "java"]) {
    await page.goto(url(c));
    expect(await noScroll(), c + " құлыпталған").toBe(true);
    await page.goto(url(c, null));
    expect(await noScroll(), c + " оқу").toBe(true);
    await seed(page, c);
    await page.goto(url(c));
    await expect(page.locator(".vcert")).toBeVisible();
    expect(await noScroll(), c + " расталған").toBe(true);
    const box = await page.locator(".vcert").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(391);
    await page.evaluate(() => localStorage.clear());
  }
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(url("x"));
  const lum = (css) => { const m = css.match(/\d+(\.\d+)?/g).map(Number); return (m[0] + m[1] + m[2]) / 3; };
  expect(lum(await page.locator("body").evaluate((e) => getComputedStyle(e).backgroundColor))).toBeLessThan(80);
  expect(lum(await page.locator(".cert-criteria").evaluate((e) => getComputedStyle(e).backgroundColor))).toBeLessThan(110);
  expect(lum(await page.locator(".cc-num").first().evaluate((e) => getComputedStyle(e).color))).toBeGreaterThan(150);
  await seed(page, "x");
  await page.goto(url("x"));
  await expect(page.locator(".vcert")).toBeVisible();
});

test("кабинет: «Менің сертификаттарым»; мұғалім коды; merge", async ({ page, context }) => {
  await blockFonts(context);
  const errs = collectErrors(page);
  await seed(page, "python");
  await page.goto("profile.html");
  await expect(page.locator(".pfc-row")).toHaveCount(7);
  await expect(page.locator('.pfc-row[data-course=python] .pfc-tier[data-tier=verified]')).toContainText("алынды");
  await expect(page.locator('.pfc-row[data-course=python] .pfc-tier[data-tier=learn]')).toContainText("алынды");
  await expect(page.locator('.pfc-row[data-course=sql] .pfc-tier[data-tier=verified]')).toContainText("0/4");
  // профиль merge: курс емтихан best кішісі үлкенін басып өтпейді, certs ең ерте күн
  const merged = await page.evaluate(() => {
    const m = window.CS50KZ_SYNC.mergeKey;
    return [m("cs50kz:exam:python", { best: 60, tries: [] }, { best: 88, tries: [] }), m("cs50kz:certs", { python: { d: "2026-05-02" } }, { python: { d: "2026-04-01" }, sql: { d: "2026-06-01" } })];
  });
  {
    expect(merged[0].best).toBe(88);
    expect(merged[1].python.d).toBe("2026-04-01");
    expect(merged[1].sql.d).toBe("2026-06-01");
  }
  // мұғалім: код w өрісін сақтайды
  const code = await page.evaluate(() => {
    const d = JSON.stringify(window.CS50KZ.summary("Аружан"));
    return "KZ1." + btoa(unescape(encodeURIComponent(d))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  });
  await page.goto("teacher.html");
  await page.fill(".t-input", code);
  await page.click(".t-add");
  await expect(page.locator(".t-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".t-verified")).toContainText("CS50P");
  expect(errs).toEqual([]);
});

test("CERT_TASKS деректермен сәйкес; тапсырма санағы курс бойынша бөлек", async ({ page, context }) => {
  await blockFonts(context);
  await page.goto("index.html");
  const diff = await page.evaluate(async () => {
    const K = window.CS50KZ, out = {};
    await K.loadScript("assets/data/lectures.js");
    out.x = window.CS50KZ_LECTURES.map((l) => l.tasks);
    for (const c of ["python", "sql", "ai", "web", "cpp", "java"]) {
      await K.loadScript(`${c}/data/lectures.js`);
      out[c] = window.CS50KZ_COURSE_LECTURES[c].map((l) => l.tasks);
    }
    return Object.keys(out).filter((c) => JSON.stringify(out[c]) !== JSON.stringify(K.CERT_TASKS[c]));
  });
  expect(diff).toEqual([]);
  // python/week-0 тапсырмасы CS50x week-0-ге есептелмейді
  await page.evaluate(() => localStorage.setItem("check:/CS50MUSS/python/lectures/week-0.html:a", "[true]"));
  const n = await page.evaluate(() => [JSON.stringify(window.CS50KZ.certStatus("x").crit.tasks.cur), JSON.stringify(window.CS50KZ.certStatus("python").crit.tasks.cur)]);
  expect(n).toEqual(["0", "1"]);
});
