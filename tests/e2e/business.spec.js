// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// Бизнес платформаға дайындық (docs/BUSINESS-PLAN.md): мектептерге ұсыныс (schools.html), құпиялылық саясаты (privacy.html)
// және пайдалану шарттары (terms.html). Тексереміз: сандар compute_stats-тан (2-бөлімнің сабақтары деректен), ұсыныс, пилот, тарифтер,
// жиі сұрақтар; өтінім мен деректер туралы сұрау дұрыс бетпен және түрімен жіберіледі (Supabase сұранысы ұсталады, желіге шықпайды);
// құқықтық беттер «заңгер тексеретін жоба» деп белгіленген және платформаның нақты деректер ағымын сипаттайды; футерде сілтемелер; 360px, axe.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = path.resolve(__dirname, "../..");
const LESSONS = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/academy/data/inside_lessons.json"), "utf8")).lessons;
const RPC = /supabase\.co\/rest\/v1\/rpc\/cs50kz_feedback_send/;

async function capture(page) {
  const sent = [];
  await page.route(RPC, async (route) => { sent.push(JSON.parse(route.request().postData())); await route.fulfill({ status: 200, contentType: "application/json", body: "null" }); });
  return sent;
}

test("мектептерге: ұсыныс, сандар деректен, пилоттың төрт қадамы, тарифтер, жиі сұрақтар, барлық сілтеме бар бетке апарады", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("schools.html");
  await expect(page.locator("h1")).toHaveText("Информатика сабағы қазақ тілінде: курс, тәжірибе, тексеру");
  await expect(page.locator(".inv-stats b").nth(1)).toHaveText(String(LESSONS.length));
  await expect(page.locator(".sch-grid section")).toHaveCount(6);
  await expect(page.locator(".sch-steps li")).toHaveCount(4);
  await expect(page.locator(".sch-plans tbody tr")).toHaveCount(6);
  await expect(page.locator(".sch-plans tbody tr").last()).toContainText("Оқушы санына қарай, өтінім бойынша");
  await expect(page.locator(".sch-faq details")).toHaveCount(6);
  for (const h of await page.locator("#main a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
    if (/^https?:/.test(h)) continue;   // JS қосатын нан қиқымы - толық мекенжай
    if (h.startsWith("#")) { await expect(page.locator(h), h).toHaveCount(1); continue; }
    expect(fs.existsSync(path.join(ROOT, h.split("#")[0])), h).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("мектептерге: өтінім - бос өріс тексеріледі; schools.html бетінен, «Мектеп не колледж» түрімен жіберіледі", async ({ page }) => {
  const sent = await capture(page);
  await page.goto("schools.html");
  const f = page.locator("#apply .inv-form");
  await f.locator('button[type="submit"]').click();
  await expect(f.locator(".inv-result")).toHaveText("Ұйым атауы мен байланысты толтырыңыз.");
  await expect(f.locator('input[name="org"]')).toHaveAttribute("aria-invalid", "true");
  await f.locator('input[name="org"]').fill("№ 1 мектеп-лицей");
  await f.locator('input[name="contact"]').fill("+7 700 000 00 00");
  await f.locator('textarea[name="note"]').fill("9-10 сынып, 60 оқушы");
  await f.locator('button[type="submit"]').click();
  await expect(f.locator(".inv-result")).toHaveText("Өтінім жіберілді. Жақын арада хабарласамыз.");
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ p_kind: "pilot", p_page: "schools.html", p_section: "Мектеп не колледж", p_quote: "№ 1 мектеп-лицей", p_student: null });
  expect(sent[0].p_message).toBe("Байланыс: +7 700 000 00 00\n9-10 сынып, 60 оқушы");
});

test("құпиялылық: жоба деп белгіленген; деректердің бес түрі, үшінші тараптар; деректер туралы сұрау бөлек түрмен жіберіледі", async ({ page }) => {
  const sent = await capture(page);
  await page.goto("privacy.html");
  await expect(page.locator(".legal-status")).toContainText("Құжаттың күйі: жоба");
  await expect(page.locator(".legal-status")).toContainText("заңгер тексеруінен әлі өткен жоқ");
  await expect(page.locator(".legal-table tbody tr")).toHaveCount(5);
  for (const t of ["Supabase", "GitHub Pages", "jsDelivr", "cdnjs"]) await expect(page.locator("#third + ul")).toContainText(t);
  await expect(page.locator("#main")).not.toContainText("cookie қолданамыз");
  const f = page.locator("#request .inv-form");
  await f.locator('input[name="org"]').fill("Айгүл");
  await f.locator('input[name="contact"]').fill("aigul@example.kz");
  await f.locator('textarea[name="note"]').fill("Бұлттағы прогресімді өшіріңіз");
  await f.locator('button[type="submit"]').click();
  await expect(f.locator(".inv-result")).toHaveText("Өтінім жіберілді. Жақын арада хабарласамыз.");
  expect(sent[0]).toMatchObject({ p_page: "privacy.html", p_section: "Деректер туралы сұрау", p_quote: "Айгүл" });
});

test("пайдалану шарттары: жоба деп белгіленген; құқықтар, сертификат, қолданылатын құқық; сілтемелер бар бетке апарады", async ({ page }) => {
  await page.goto("terms.html");
  await expect(page.locator(".legal-status")).toContainText("Құжаттың күйі: жоба");
  for (const id of ["service", "use", "rules", "ip", "yours", "cert", "warranty", "law", "contact"]) await expect(page.locator("#" + id)).toHaveCount(1);
  await expect(page.locator("#cert + p")).toContainText("мемлекеттік үлгідегі білім туралы құжат емес");
  for (const h of await page.locator("#main a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href"))).then((hs) => hs.filter((x) => !/^https?:/.test(x))))
    expect(fs.existsSync(path.join(ROOT, h.split("#")[0])), h).toBe(true);
});

test("футер: әр бетте құпиялылық, пайдалану шарттары және мектептерге сілтеме; серіктестер беті мектептерге апарады", async ({ page }) => {
  for (const [u, pre] of [["index.html", ""], ["academy/course.html", "../"], ["lectures/week-0.html", "../"], ["academy/3d/arch/arch-1-binary.html", "../../../"]]) {
    await page.goto(u);
    await expect(page.locator(`footer a[href="${pre}privacy.html"]`), u).toHaveText("Құпиялылық");
    await expect(page.locator(`footer a[href="${pre}terms.html"]`), u).toHaveText("Пайдалану шарттары");
    await expect(page.locator(`footer a[href="${pre}schools.html"]`), u).toHaveText("Мектептерге");
  }
  await page.goto("partners.html");
  await expect(page.locator('#main a[href="schools.html"]').first()).toBeVisible();
});

for (const scheme of ["light", "dark"]) {
  test(`360px, ${scheme}: мектептерге, құпиялылық және шарттар көлденең жылжымайды; axe таза`, async ({ browser }) => {
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage();
    for (const u of ["schools.html", "privacy.html", "terms.html"]) {
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
