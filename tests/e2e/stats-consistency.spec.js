// Сандардың бір дерекқөзі: tools/build.py --stats (site_stats) ↔ беттердегі мәтін-сандар. Браузерсіз, файл жүйесінен оқиды.
const { test, expect } = require("@playwright/test");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const { site_stats: S, flat: F } = JSON.parse(execFileSync("python3", [path.join(ROOT, "tools/build.py"), "--stats"], { encoding: "utf8" }));

// Тексерілетін файлдар: түбірдегі *.html, <курс>/index.html, README.md, manifest. Лекция беттері, тесттер, vendor, деректер қосылмайды.
const SKIP_DIR = new Set(["node_modules", "tests", "sources", "qazaqcode", "test-results", "licensing", "supabase", "tools", "assets", "lectures"]);
function files() {
  const out = [];
  for (const f of fs.readdirSync(ROOT)) if (/\.(html|webmanifest)$/.test(f) || f === "README.md") out.push(f);
  for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || SKIP_DIR.has(d.name) || d.name.startsWith(".")) continue;
    if (fs.existsSync(path.join(ROOT, d.name, "index.html"))) out.push(d.name + "/index.html");
  }
  return out;
}
// Harvard бейімдеулері туралы тікелей тұжырымдар (45 = lect_harvard) - құқықтық беттерде қалады
const LEGAL = /^(copyright\.html|LICENSE.*\.md|COPYRIGHT\.md|THIRD-PARTY-LICENSES\.md|TAKEDOWN\.md|README\.md)$/;
const text = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/<(script|style)\b(?![^>]*ld\+json)[^>]*>[\s\S]*?<\/\1>/g, " ");
// «N <бірлік>»: CS50 курсы сияқты сөз ішіндегі санды ұстамау үшін алдында әріп/цифр болмауы керек
const re = (unit) => new RegExp(`(?<![\\w.])(\\d+)\\+?\\s*(?:${unit})`, "gu");
const nums = (s, unit) => [...s.matchAll(re(unit))].map((m) => +m[1]);

const by = S.by_course;
const LECT = new Set([S.lect, S.lect_harvard, S.lect_own, ...Object.values(by).map((c) => c.lect)]);
const QUIZ = new Set([S.quiz, S.exam_q, ...Object.values(by).map((c) => c.quiz)]);
const TERM = new Set([S.terms, ...Object.values(by).map((c) => c.terms)]);
const TASK = new Set([S.tasks, ...Object.values(by).map((c) => c.tasks)]);

test("site_stats өз-өзімен келісімді және нақты файлдармен сәйкес", () => {
  expect(S.courses).toBe(Object.keys(by).length);
  expect(S.lect).toBe(S.lect_harvard + S.lect_own);
  expect(S.lect).toBe(Object.values(by).reduce((n, c) => n + c.lect, 0));
  expect(S.quiz).toBe(Object.values(by).reduce((n, c) => n + c.quiz, 0));
  expect(S.tasks).toBe(Object.values(by).reduce((n, c) => n + c.tasks, 0));
  expect(S.exam_q).toBe(by.x.lect * 2);
  for (const [code, d] of Object.entries(by)) {
    const dir = path.join(ROOT, code === "x" ? "lectures" : code + "/lectures");
    expect(fs.readdirSync(dir).filter((f) => /^(week-\d+|ai)\.html$/.test(f)).length, code).toBe(d.lect);
  }
  // main.js COURSE_META (JS жағындағы тұрақты) build-тің lect_<курс> мәнімен бірдей
  const js = fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8");
  const meta = [...js.matchAll(/\{ id: "(\w+)", name: "[^"]*", title: "[^"]*", color: "#\w+", total: (\d+)/g)];
  expect(meta.length).toBe(S.courses);
  for (const [, id, total] of meta) expect(+total, "COURSE_META " + id).toBe(by[id].lect);
});

test("белгілер <!--n:КІЛТ--> мәні site_stats-пен бірдей (барлық бет және README)", () => {
  let found = 0;
  for (const rel of files()) {
    const s = fs.readFileSync(path.join(ROOT, rel), "utf8");
    for (const m of s.matchAll(/<!--n:(\w+)-->(.*?)<!--\/n-->/g)) {
      found++;
      expect(F[m[1]], `${rel}: белгісіз кілт ${m[1]}`).toBeDefined();
      expect(m[2], `${rel}: ${m[1]}`).toBe(F[m[1]]);
    }
    for (const m of s.matchAll(/data-count="(\d+)"><!--n:(\w+)-->/g)) expect(m[1], `${rel} data-count ${m[2]}`).toBe(F[m[2]]);
  }
  expect(found).toBeGreaterThan(25);
});

test("мәтіндегі «N курс / лекция / тест сұрағы / термин / тапсырма» сандары site_stats мәндерінің бірі", () => {
  for (const rel of files()) {
    const t = text(rel);
    for (const n of nums(t, "курс(?!ты|та|т)")) expect([S.courses].includes(n), `${rel}: «${n} курс»`).toBeTruthy();
    for (const n of nums(t, "лекция(?!лар)")) expect(LECT.has(n), `${rel}: «${n} лекция»`).toBeTruthy();
    for (const n of nums(t, "тест\\s+сұрағ|сұрақ(?!тық)")) expect(QUIZ.has(n) || n === 10, `${rel}: «${n} сұрақ»`).toBeTruthy(); // 10 - аралас тест ұзындығы
    for (const n of nums(t, "термин")) expect(TERM.has(n), `${rel}: «${n} термин»`).toBeTruthy();
    for (const n of nums(t, "(?:автотексерілетін\\s+)?тапсырма(?!лар)")) expect(TASK.has(n) || n <= 5, `${rel}: «${n} тапсырма»`).toBeTruthy();
  }
});

test("ескі сандар қалмаған: «5 курс», «356», бүкіл сайт үшін «45 лекция»", () => {
  for (const rel of files()) {
    const t = text(rel);
    expect(nums(t, "курс(?!ты|та|т)").includes(5), `${rel}: «5 курс»`).toBeFalsy();
    expect(/(?<![\w.])356(?![\w])/.test(t), `${rel}: 356`).toBeFalsy();
    if (!LEGAL.test(rel)) expect(nums(t, "лекция(?!лар)").includes(45), `${rel}: «45 лекция» тек құқықтық беттерде (Harvard)`).toBeFalsy();
  }
});

test("мета-сипаттамалар (description, og:description, JSON-LD) жаңа сандармен", () => {
  const idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const want = `${S.courses} курс, ${S.lect} лекция, ${S.quiz} тест сұрағы`;
  expect(idx).toContain(`<meta name="description" content="${want}`);
  expect(idx).toContain(`<meta property="og:description" content="${want}`);
  expect(idx).toContain(`CS50x курсы қазақ тілінде: ${by.x.lect} лекция`);
  expect(idx).toContain(`<!--n:site-->${F.site}<!--/n-->`);
  const ex = fs.readFileSync(path.join(ROOT, "exam.html"), "utf8");
  expect(ex).toContain(`емтиханы: ${S.exam_q} сұрақ, ${S.exam_min} минут, барлық ${by.x.lect} лекция`);
  const ld = JSON.parse(idx.match(/<script type="application\/ld\+json">\s*(\{"@context": "https:\/\/schema\.org", "@type": "Course"[\s\S]*?\})\s*<\/script>/)[1]);
  expect(ld.description).toContain(`${by.x.lect} лекция`);
});

test("курстар витринасындағы «N лекция · M тапсырма» build-тен", () => {
  const s = fs.readFileSync(path.join(ROOT, "courses.html"), "utf8");
  for (const [code, d] of Object.entries(by)) {
    const m = s.match(new RegExp(`data-course="${code}"[\\s\\S]*?<div class="cx-foot"><span>([^<]*)</span>`));
    expect(m, code).toBeTruthy();
    expect(m[1]).toContain(`${d.lect} лекция`);
    expect(m[1]).toContain(d.tasks ? `${d.tasks} тапсырма` : `${d.projects} жоба`);
  }
});
