/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
// CS50 қазақша — офлайн режим.
// Беттер желіден алынады, ал желі жоқ кезде кэштегі соңғы нұсқа көрсетіледі.
const CACHE = "cs50kz-v60";
const CORE = [
  "./", "index.html", "about.html", "glossary.html", "certificate.html", "playground.html", "practice.html", "flashcards.html", "viz.html", "teacher.html", "debug.html", "detective.html", "flask.html", "projects.html", "assets/js/projects.js", "projects/model.js", "projects/checks/p1.js", "projects/checks/p2.js", "projects/checks/p3.js", "projects/checks/p4.js", "exam.html", "assets/js/exam.js", "profile.html", "assets/js/profile.js", "assets/js/cabinet.js", "games.html", "copyright.html", "assets/js/games-core.js", "assets/js/games-a.js", "assets/js/games-b.js", "assets/css/games-ui.css", "assets/css/games-ui2.css", "assets/js/cloud.js", "assets/js/feedback.js", "assets/js/flask.js", "assets/data/mystery.js", "assets/data/mystery2.js", "assets/data/quotes.js", "assets/data/portraits.js", "alash.html", "courses.html", "python/index.html", "sql/index.html", "ai/index.html", "web/index.html", "sql/data/lectures.js", "ai/data/lectures.js", "web/data/lectures.js", "sql/lectures/week-0.html", "ai/lectures/week-0.html", "web/lectures/week-0.html", "python/lectures/week-0.html", "python/lectures/week-1.html", "python/lectures/week-2.html", "python/lectures/week-3.html", "python/lectures/week-4.html", "python/lectures/week-5.html", "python/lectures/week-6.html", "python/lectures/week-7.html", "python/lectures/week-8.html", "python/lectures/week-9.html", "python/checks/week-0.js", "python/checks/week-1.js", "python/checks/week-2.js", "python/checks/week-3.js", "python/checks/week-4.js", "python/checks/week-5.js", "python/checks/week-6.js", "python/checks/week-7.js", "python/checks/week-8.js", "python/checks/week-9.js", "python/data/lectures.js", "map.html", "cheatsheet.html", "assets/data/bugs.js", "assets/data/trace.js", "assets/data/checks.js", "assets/data/sqlchecks.js", "assets/img/bota.svg", "assets/img/bota-happy.svg", "assets/img/bota-think.svg", "assets/img/bota-wow.svg", "assets/vendor/qrcode/qrcode.js",
  "assets/css/style.css", "assets/js/main.js", "assets/js/labs.js",
  "assets/data/lectures.js", "assets/data/search-index.js", "assets/data/db.js", "assets/data/quiz.js", "assets/data/glossary.js",
  "assets/vendor/sqljs/sql-wasm.js", "assets/vendor/sqljs/sql-wasm.wasm",
  "assets/img/icon.svg", "manifest.webmanifest",
  "lectures/week-0.html", "lectures/week-1.html", "lectures/week-2.html", "lectures/week-3.html",
  "lectures/week-4.html", "lectures/week-5.html", "lectures/week-6.html", "lectures/week-7.html",
  "lectures/ai.html", "lectures/week-8.html", "lectures/week-9.html", "lectures/week-10.html",
];
// Дербес курстар (cpp, java): тізімді tools/build.py тек бар файлдармен толтырады (жоқ файл addAll-ды құлатпасын)
CORE.push(.../*own-courses:begin*/["cpp/index.html", "cpp/data/lectures.js", "cpp/lectures/week-0.html", "cpp/lectures/week-1.html", "cpp/lectures/week-2.html", "cpp/lectures/week-3.html", "cpp/lectures/week-4.html", "cpp/lectures/week-5.html", "cpp/lectures/week-6.html", "cpp/lectures/week-7.html", "java/index.html", "java/data/lectures.js", "java/lectures/week-0.html", "java/lectures/week-1.html", "java/lectures/week-2.html", "java/lectures/week-3.html", "java/lectures/week-4.html", "java/lectures/week-5.html", "java/lectures/week-6.html", "java/lectures/week-7.html", "en/index.html", "en/data/lectures.js", "en/lectures/week-0.html", "en/lectures/week-1.html", "en/lectures/week-10.html", "en/lectures/week-11.html", "en/lectures/week-12.html", "en/lectures/week-13.html", "en/lectures/week-14.html", "en/lectures/week-15.html", "en/lectures/week-16.html", "en/lectures/week-17.html", "en/lectures/week-18.html", "en/lectures/week-19.html", "en/lectures/week-2.html", "en/lectures/week-20.html", "en/lectures/week-21.html", "en/lectures/week-22.html", "en/lectures/week-23.html", "en/lectures/week-3.html", "en/lectures/week-4.html", "en/lectures/week-5.html", "en/lectures/week-6.html", "en/lectures/week-7.html", "en/lectures/week-8.html", "en/lectures/week-9.html", "en/grammar.html", "en/phrasebank.html", "en/placement.html", "en/vocab.html", "assets/js/own-viz.js", "assets/css/own-viz.css", "assets/js/en-course.js", "assets/js/en-tools.js", "assets/css/en-course.css", "assets/js/games-en.js", "assets/css/en-games.css", "assets/js/en-trainer.js", "assets/js/en-home.js", "assets/data/en-grammar-a0.js", "assets/data/en-grammar-a1.js", "assets/data/en-grammar-a2.js", "assets/data/en-grammar-b1.js", "assets/data/en-grammar-b2.js", "assets/data/en-grammar-c1.js", "assets/data/en-phrases.js", "assets/data/en-placement.js", "assets/data/en-vocab-a0.js", "assets/data/en-vocab-a1.js", "assets/data/en-vocab-a2.js", "assets/data/en-vocab-b1.js", "assets/data/en-vocab-b2.js", "assets/data/en-vocab-c1.js"]/*own-courses:end*/);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Желі бірінші, сосын кэш: сайт жаңарғанда оқушы бірден жаңа нұсқаны көреді
  // Сайттың өз файлдары (JS, деректер, суреттер) серверден тексеріліп алынады: браузердің 10 минуттық
  // HTTP кэші ескі нұсқаны бермесін. Бет навигациясын өзгертпейміз (redirect-пен қате бермесін).
  const own = new URL(req.url).origin === location.origin;
  const net = own && req.mode !== "navigate" ? new Request(req, { cache: "no-cache" }) : req;
  e.respondWith(
    fetch(net)
      .then((res) => {
        if (res.status === 200 && (new URL(req.url).origin === location.origin || /fonts|cdnjs|jsdelivr/.test(req.url))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      // Желі жоқ: кэштегі нұсқа. Басты бетке тек бет навигациясы қайтады - скрипт/сурет/CSS орнына HTML
      // берсек, браузер оны JS деп оқып «Unexpected token '<'» қатесін шығарады (мысалы, CDN-нен highlight.js)
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
