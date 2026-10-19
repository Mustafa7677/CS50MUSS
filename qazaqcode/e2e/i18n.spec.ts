import { test, expect, type Browser, type Page } from "@playwright/test";
import pg from "pg";

// Екі тілділік (kk негізгі, ru қосымша). Демо дерек пен DATABASE_URL (superuser) керек.
// Іске қосу: DATABASE_URL=... E2E_BASE_URL=http://127.0.0.1:3216 npx playwright test e2e/i18n.spec.ts
const PASS = "DemoPass123";
const STUDENT = "student6@demo.qazaqcode.kz"; // профильдегі тілді тексеру үшін бөлек оқушы
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const sql = async <T = any>(s: string, p: unknown[] = []) => (await db.query(s, p)).rows as T[];
const KK_ONLY = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;
// kk режимінде ru-ға аударылмайтын тұрақты жолдар: тіл ауыстырғыш және деректің өзі (демо ұйым/адам/тапсырма аттары)
const DATA = /\(демо\)|ДЕМО|Информатика мектебі|^\d{1,2}[АӘ]$|^10Ә|Айнымалылар|Python|JavaScript|SELECT|Тізімдер|Жоба: мектеп|Веб негіздері|type\(|^Қаз$|^Қазақша$|Орыс тілі бета|\d{4}, \d{2}:\d{2}$/;

test.afterAll(async () => {
  await sql("update public.profiles set locale = 'kk' where id = (select id from auth.users where email = $1)", [STUDENT]);
  await db.end();
});

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASS);
  await page.locator('form:not([data-testid="lang-switch"]) button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
const setLang = (page: Page, lang: "kk" | "ru") => page.context().addCookies([{ name: "qc_lang", value: lang, url: test.info().project.use.baseURL! }]);
const lang = (page: Page) => page.locator("html").getAttribute("lang");

/** Көрінетін мәтін мен атрибуттардағы қазақ-тек әріптері бар жолдар (дерек мазмұнынан басқа) */
async function leftovers(page: Page): Promise<string[]> {
  const lines = await page.evaluate(() => {
    const out: string[] = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      if (!el || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
      const t = (n.textContent ?? "").trim();
      if (t) out.push(t);
    }
    for (const el of Array.from(document.querySelectorAll("[placeholder],[aria-label],[title],[alt]")))
      for (const a of ["placeholder", "aria-label", "title", "alt"]) { const v = el.getAttribute(a); if (v) out.push(v); }
    return out;
  });
  return [...new Set(lines.filter((l) => KK_ONLY.test(l) && !DATA.test(l)))];
}
async function fresh(browser: Browser, opts: { locale?: string; width?: number } = {}) {
  const ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: opts.locale ?? "kk-KZ", viewport: opts.width ? { width: opts.width, height: 800 } : undefined });
  return { ctx, page: await ctx.newPage() };
}

test("kk әдепкі: lang=kk, қазақша мәтін, тіл ауыстырғышта бета белгісі", async ({ page }) => {
  await page.goto("/login");
  expect(await lang(page)).toBe("kk");
  await expect(page.getByRole("heading", { name: "Жүйеге кіру" })).toBeVisible();
  const sw = page.getByTestId("lang-switch");
  await expect(sw.getByRole("button", { name: "Қазақша" })).toHaveAttribute("aria-pressed", "true");
  await expect(sw).toContainText("бета");
});

test("ru ауыстыру: cookie qc_lang=ru, lang=ru, мәтін орысша, қайта жүктегенде сақталады, kk-ке қайту", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("lang-switch").getByRole("button", { name: "Русский" }).click();
  await expect(page.getByRole("heading", { name: "Вход в систему" })).toBeVisible();
  expect(await lang(page)).toBe("ru");
  const c = (await page.context().cookies()).find((x) => x.name === "qc_lang");
  expect(c?.value).toBe("ru");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Вход в систему" })).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
  await page.getByTestId("lang-switch").getByRole("button", { name: "Қазақша" }).click();
  await expect(page.getByRole("heading", { name: "Жүйеге кіру" })).toBeVisible();
  expect(await lang(page)).toBe("kk");
});

test("бастапқы тіл: Accept-Language ru -> ru; басқасы -> kk; cookie тек whitelist (kk|ru)", async ({ browser }) => {
  const a = await fresh(browser, { locale: "ru-RU" });
  await a.page.goto("/login");
  expect(await lang(a.page)).toBe("ru");
  await expect(a.page.getByRole("heading", { name: "Вход в систему" })).toBeVisible();
  await a.ctx.close();
  const b = await fresh(browser, { locale: "en-US" });
  await b.page.goto("/login");
  expect(await lang(b.page)).toBe("kk");
  for (const bad of ["en", "RU", "ru;kk", "<script>", "../ru", ""]) {
    await b.ctx.addCookies([{ name: "qc_lang", value: bad, url: test.info().project.use.baseURL! }]);
    await b.page.goto("/login");
    expect(await lang(b.page), `cookie=${bad}`).toBe("kk");
    await expect(b.page.getByRole("heading", { name: "Жүйеге кіру" })).toBeVisible();
  }
  await b.ctx.close();
});

test("жария беттер ru режимінде: қазақ-тек әріптері жоқ (/, /schools, /login, /join, /invite)", async ({ page }) => {
  await setLang(page, "ru");
  for (const url of ["/", "/schools", "/login", "/join", "/join?code=ZZZZZZZZ", "/invite/kemel-token"]) {
    await page.goto(url);
    expect(await lang(page), url).toBe("ru");
    expect(await leftovers(page), url).toEqual([]);
  }
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Учёба, задания, результат");
  await page.goto("/investors");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Где мы находимся");
});

test("қате хабарлары ru: қате құпиясөз, жарамсыз сынып коды, жарамсыз шақыру", async ({ page }) => {
  await setLang(page, "ru");
  await page.goto("/login");
  await page.locator("#email").fill("student1@demo.qazaqcode.kz");
  await page.locator("#password").fill("QateParol123");
  await page.locator('form:not([data-testid="lang-switch"]) button[type="submit"]').click();
  await expect(page.getByRole("alert")).toContainText("E-mail или пароль неверны");
  await page.goto("/join");
  await page.locator("#code").fill("ZZZZZZZZ");
  await page.locator('form:not([data-testid="lang-switch"]) button[type="submit"]').click();
  await expect(page.getByText("Код класса неверен или присоединение закрыто.").first()).toBeVisible();
  await page.goto("/invite/kemel-token");
  await expect(page.getByRole("heading", { name: "Приглашение недействительно" })).toBeVisible();
  // kk-де сол қате қазақша
  await setLang(page, "kk");
  await page.goto("/login");
  await page.locator("#email").fill("student1@demo.qazaqcode.kz");
  await page.locator("#password").fill("QateParol123");
  await page.locator('form:not([data-testid="lang-switch"]) button[type="submit"]').click();
  await expect(page.getByRole("alert")).toContainText("E-mail немесе құпиясөз дұрыс емес");
});

const AREAS: Record<string, { email: string; urls: string[] }> = {
  student: { email: "student1@demo.qazaqcode.kz", urls: ["/student", "/student/assignments", "/student/grades", "/student/courses", "/student/projects", "/student/ai", "/notifications"] },
  teacher: { email: "teacher1@demo.qazaqcode.kz", urls: ["/teacher", "/teacher/assignments", "/teacher/assignments/new", "/teacher/review", "/teacher/courses"] },
  school: { email: "admin@demo.qazaqcode.kz", urls: ["/school", "/school/classes", "/school/teachers", "/school/students", "/school/settings", "/school/licence", "/school/export", "/school/ai", "/school/courses"] },
  admin: { email: "root@demo.qazaqcode.kz", urls: ["/admin", "/admin/leads", "/admin/audit"] },
};
for (const [area, cfg] of Object.entries(AREAS)) {
  test(`${area} аймағы ru режимінде: lang=ru, қазақ-тек әріптері жоқ (дерек мазмұнынан басқа)`, async ({ page }) => {
    await setLang(page, "ru");
    await login(page, cfg.email);
    for (const url of cfg.urls) {
      await page.goto(url);
      expect(await lang(page), url).toBe("ru");
      expect(await leftovers(page), url).toEqual([]);
    }
  });
}

test("ru: күн айлары орысша, навигация орысша", async ({ page }) => {
  await setLang(page, "ru");
  await login(page, "student1@demo.qazaqcode.kz");
  await page.goto("/student/assignments");
  const body = await page.locator("main").innerText();
  expect(body).toMatch(/\d{1,2} (января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря) 20\d\d/);
  expect(body).not.toMatch(/\d (қаңтар|ақпан|наурыз|сәуір|мамыр|маусым|шілде|тамыз|қыркүйек|қазан|қараша|желтоқсан)/);
  await expect(page.locator("aside nav").getByRole("link", { name: "Мои задания" })).toBeVisible();
});

test("тіл профильге сақталады (profiles.locale) және жаңа құрылғыда кіргенде қайтады", async ({ browser }) => {
  const a = await fresh(browser);
  await a.page.goto("/login");
  await a.page.getByTestId("lang-switch").getByRole("button", { name: "Русский" }).click();
  await expect(a.page.getByRole("heading", { name: "Вход в систему" })).toBeVisible();
  await login(a.page, STUDENT);
  await expect(a.page.locator("html")).toHaveAttribute("lang", "ru");
  expect((await sql("select p.locale from public.profiles p join auth.users u on u.id = p.id where u.email = $1", [STUDENT]))[0].locale).toBe("ru");
  await a.ctx.close();
  // cookie жоқ жаңа браузер: кіргеннен кейін профильдегі тіл қолданылады
  const b = await fresh(browser, { locale: "kk-KZ" });
  await login(b.page, STUDENT);
  await expect(b.page.locator("html")).toHaveAttribute("lang", "ru");
  // кірген қолданушы тілді ауыстырса, профиль жаңарады
  await b.page.getByTestId("lang-switch").first().getByRole("button", { name: "Қазақша" }).click();
  await expect(b.page.locator("html")).toHaveAttribute("lang", "kk");
  expect((await sql("select p.locale from public.profiles p join auth.users u on u.id = p.id where u.email = $1", [STUDENT]))[0].locale).toBe("kk");
  await b.ctx.close();
});

test("390px: ru режимінде көлденең айналдыру жоқ, тіл ауыстырғыш көрінеді", async ({ browser }) => {
  const { ctx, page } = await fresh(browser, { width: 390 });
  await setLang(page, "ru");
  for (const url of ["/", "/schools", "/login"]) {
    await page.goto(url);
    await expect(page.getByTestId("lang-switch")).toBeVisible();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, url).toBeLessThanOrEqual(0);
  }
  await login(page, "student1@demo.qazaqcode.kz");
  for (const url of ["/student", "/student/assignments"]) {
    await page.goto(url);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, url).toBeLessThanOrEqual(0);
  }
  await ctx.close();
});
