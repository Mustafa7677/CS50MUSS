import { test, expect, type Page } from "@playwright/test";
import pg from "pg";

// Курс конструкторы E2E. Демо дерек және DATABASE_URL керек. Тест курстарының атауы "QT " деп басталады.
const T1 = "teacher1@demo.qazaqcode.kz";
const ADMIN = "admin@demo.qazaqcode.kz";
const PASS = "DemoPass123";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const uniq = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
const clean = async () => { await db.query("delete from public.courses where title like 'QT %'"); };

async function login(page: Page, email: string, area: RegExp) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Құпиясөз").fill(PASS);
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(area);
}
const noHScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

test.beforeAll(clean);
test.afterAll(async () => { await clean(); await db.end(); });

test.describe.configure({ mode: "serial" });
const name = `QT Курс ${uniq()}`;
let courseUrl = "";

test("мұғалім курс жасайды, құрылымды құрады, реттейді, сақтайды", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await login(page, T1, /\/teacher/);
  await page.getByRole("link", { name: "Курстар" }).first().click().catch(() => page.goto("/teacher/courses"));
  await page.goto("/teacher/courses");
  await expect(page.getByRole("heading", { name: "Курстар", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Жаңа курс" }).first().click();
  await page.getByLabel("Курс атауы").fill(name);
  await page.getByLabel("Сипаттамасы").fill("Автотест курсы");
  await page.getByRole("button", { name: "Курс жасау" }).click();
  await page.waitForURL(/\/teacher\/courses\/[0-9a-f-]{36}/);
  courseUrl = new URL(page.url()).pathname;

  // 2 модуль, 1-ші модульде 2 сабақ
  await page.getByTestId("add-module").click();
  await page.getByLabel("1-модульдің атауы").fill("Кіріспе");
  await page.getByTestId("add-lesson").first().click();
  await page.getByLabel("1-сабақтың атауы").fill("Алғашқы сабақ");
  const les1 = page.getByTestId("lesson").first();
  await les1.getByTestId("add-text").click();
  await les1.getByLabel(/1-блок \(Мәтін\): мазмұны/).fill("Сәлем, әлем!");
  await les1.getByTestId("add-code").click();
  await les1.getByLabel(/2-блок \(Код\): бағдарламалау тілі/).selectOption("javascript");
  await les1.getByLabel(/2-блок \(Код\): код/).fill("console.log(1)");
  await les1.getByTestId("add-image").click();
  await les1.getByLabel(/3-блок \(Сурет\): https сілтемесі/).fill("https://example.com/a.png");
  await les1.getByLabel(/3-блок \(Сурет\): атауы/).fill("Үлгі сурет");
  await expect(les1.getByTestId("img-preview")).toHaveAttribute("alt", "Үлгі сурет");
  await les1.getByTestId("add-video").click();
  await les1.getByLabel(/4-блок \(Видео\): https сілтемесі/).fill("https://example.com/v.mp4");
  await les1.getByTestId("add-note").click();
  await les1.getByLabel(/5-блок \(Ескерту\): мазмұны/).fill("Назар аударыңыз");
  // блок реттеу: ескертуді жоғары
  await les1.getByRole("button", { name: /5-блок \(Ескерту\): жоғары жылжыту/ }).click();
  await expect(les1.getByTestId("block").nth(3)).toHaveAttribute("data-block-type", "note");
  // видео блогын өшіру
  await les1.getByRole("button", { name: /5-блок \(Видео\): өшіру/ }).click();
  await expect(les1.getByTestId("block")).toHaveCount(4);

  await page.getByTestId("add-lesson").first().click();
  await page.getByLabel("2-сабақтың атауы").fill("Екінші сабақ");
  await page.getByTestId("add-module").click();
  await page.getByLabel("2-модульдің атауы").fill("Қорытынды");
  await page.getByTestId("add-lesson").nth(1).click();
  await page.getByLabel("1-сабақтың атауы").nth(1).fill("Соңғы сабақ");

  // reorder: 2-сабақты жоғары (пернетақта батырмасы)
  await page.getByRole("button", { name: "Екінші сабақ: жоғары жылжыту" }).click();
  await expect(page.getByTestId("lesson").first().getByLabel("1-сабақтың атауы")).toHaveValue("Екінші сабақ");
  // drag-and-drop: 2-модульді 1-ші орынға
  await page.getByTestId("drag-module").nth(1).dragTo(page.getByTestId("module").first().locator("input").first());
  await expect(page.getByLabel("1-модульдің атауы")).toHaveValue("Қорытынды");
  // кері: батырмамен
  await page.getByRole("button", { name: "Қорытынды: төмен жылжыту" }).click();
  await expect(page.getByLabel("1-модульдің атауы")).toHaveValue("Кіріспе");

  await page.getByTestId("save-structure").click();
  await expect(page.getByRole("status").filter({ hasText: "Курс құрылымы сақталды." }).first()).toBeVisible();
  // қайта сақтау (жаңартылған id-лармен) қате бермейді
  await page.getByTestId("save-structure").click();
  await expect(page.getByRole("status").filter({ hasText: "Курс құрылымы сақталды." }).first()).toBeVisible();

  // бетті жаңартқанда сақталған
  await page.reload();
  await expect(page.getByLabel("1-модульдің атауы")).toHaveValue("Кіріспе");
  await expect(page.getByLabel("2-модульдің атауы")).toHaveValue("Қорытынды");
  await expect(page.getByTestId("lesson")).toHaveCount(3);
  await expect(page.getByTestId("lesson").first().getByLabel("1-сабақтың атауы")).toHaveValue("Екінші сабақ");
  await page.getByRole("button", { name: "Алғашқы сабақ: ашу" }).click();
  await expect(page.getByTestId("block")).toHaveCount(4);
  await expect(page.getByLabel(/2-блок \(Код\): код/)).toHaveValue("console.log(1)");
  await expect(page.getByTestId("block").nth(3)).toHaveAttribute("data-block-type", "note");
});

test("қате: https емес сурет сілтемесі қазақша қатемен қайтарылады", async ({ page }) => {
  await login(page, T1, /\/teacher/);
  await page.goto(courseUrl);
  await page.getByRole("button", { name: "Алғашқы сабақ: ашу" }).click();
  await page.getByLabel(/3-блок \(Сурет\): https сілтемесі/).fill("http://example.com/a.png");
  await page.getByTestId("save-structure").click();
  await expect(page.getByRole("alert").filter({ hasText: "https://" }).first()).toBeVisible();
});

test("баптаулар, жариялау, алдын ала қарау, прогресс", async ({ page }) => {
  await login(page, T1, /\/teacher/);
  await page.goto(`${courseUrl}?tab=settings`);
  // сыныпсыз жариялау мүмкін емес
  await page.getByRole("button", { name: "Жариялау", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Жариялау" }).click();
  await expect(page.getByText("кемінде бір сыныпқа бекітіңіз")).toBeVisible();
  // сыныпқа бекіту
  await page.getByLabel(/9А/).check();
  await page.getByRole("button", { name: "Бекітуді сақтау" }).click();
  await expect(page.getByRole("status").filter({ hasText: "бекітілді" }).first()).toBeVisible();
  await page.getByLabel("Курс атауы").fill(`${name} (ред.)`);
  await page.getByRole("button", { name: "Сақтау", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "баптаулары сақталды" }).first()).toBeVisible();
  await page.goto(`${courseUrl}?tab=settings`);
  await page.getByRole("button", { name: "Жариялау", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Жариялау" }).click();
  await expect(page.getByText("Курс жарияланды")).toBeVisible();

  // алдын ала қарау
  await page.goto(`${courseUrl}?tab=preview`);
  const pv = page.getByTestId("course-preview");
  await expect(pv.getByText("Сәлем, әлем!")).toBeVisible();
  await expect(pv.locator("pre code").first()).toHaveText("console.log(1)");
  await expect(pv.getByRole("button", { name: "Көшіру" }).first()).toBeVisible();
  await expect(pv.locator("img[alt='Үлгі сурет']")).toHaveCount(1);
  await expect(pv.getByText("Назар аударыңыз")).toBeVisible();

  // прогресс: 9А оқушылары
  await page.goto(`${courseUrl}?tab=progress`);
  await expect(page.getByTestId("progress-table").getByRole("progressbar").first()).toBeVisible();

  // тізім: көшірме және архивтеу
  await page.goto("/teacher/courses");
  const row = page.getByTestId("course-row").filter({ hasText: name });
  await expect(row).toContainText("Жарияланған");
  await expect(row).toContainText("9А");
  await expect(row).toContainText("3");
  await row.getByRole("button", { name: "Көшірме жасау" }).click();
  await page.waitForURL(/\/teacher\/courses\/[0-9a-f-]{36}/);
  await expect(page.getByText("Көшірме жоба ретінде жасалды")).toBeVisible();
  await page.goto("/teacher/courses");
  const orig = page.getByTestId("course-row").filter({ hasText: `${name} (ред.)` }).filter({ hasNotText: "көшірме" });
  await orig.getByRole("button", { name: "Архивтеу" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Архивтеу" }).click();
  await expect(page.getByText("Курс мұрағатқа жіберілді")).toBeVisible();
  await expect(page.getByTestId("course-row").filter({ hasText: "(ред.)" }).filter({ hasNotText: "көшірме" })).toContainText("Мұрағат");
  await page.getByTestId("course-row").filter({ hasText: "(ред.)" }).filter({ hasNotText: "көшірме" }).getByRole("button", { name: "Қайта жариялау" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Жариялау" }).click();
  await expect(page.getByText("Курс жарияланды")).toBeVisible();
});

test("мектеп әкімшісі ұйымның барлық курсын көреді және басқарады", async ({ page, browser }) => {
  await login(page, ADMIN, /\/school/);
  await page.goto("/school/courses");
  await expect(page.getByTestId("course-row").filter({ hasText: name }).first()).toBeVisible();
  await page.getByTestId("course-row").filter({ hasText: name }).first().getByRole("link", { name: "Ашу" }).click();
  await page.waitForURL(/\/school\/courses\/[0-9a-f-]{36}/);
  await expect(page.getByTestId("course-builder")).toBeVisible();
  await expect(page.getByTestId("module")).toHaveCount(2);
  // басқа мұғалім курсын өз бөлімінде көрмейді
  const t2 = await browser.newContext({ locale: "kk-KZ" });
  const p2 = await t2.newPage();
  await login(p2, "teacher2@demo.qazaqcode.kz", /\/teacher/);
  await p2.goto("/teacher/courses");
  await expect(p2.getByTestId("course-row").filter({ hasText: name })).toHaveCount(0);
  expect((await p2.goto(courseUrl))?.status()).toBe(404);
  await t2.close();
});

test("390px экранда бет көлденең айналмайды", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "kk-KZ" });
  const page = await c.newPage();
  await login(page, T1, /\/teacher/);
  await page.goto("/teacher/courses");
  await noHScroll(page);
  await page.goto(courseUrl);
  await page.getByRole("button", { name: "Алғашқы сабақ: ашу" }).click();
  await expect(page.getByTestId("block").first()).toBeVisible();
  await noHScroll(page);
  await page.goto(`${courseUrl}?tab=settings`);
  await noHScroll(page);
  await page.goto(`${courseUrl}?tab=preview`);
  await noHScroll(page);
  await c.close();
  const a = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "kk-KZ" });
  const ap = await a.newPage();
  await login(ap, ADMIN, /\/school/);
  await ap.goto("/school/courses");
  await noHScroll(ap);
  await a.close();
});
