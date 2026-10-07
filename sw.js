// CS50 қазақша — офлайн режим.
// Беттер желіден алынады, ал желі жоқ кезде кэштегі соңғы нұсқа көрсетіледі.
const CACHE = "cs50kz-v27";
const CORE = [
  "./", "index.html", "about.html", "glossary.html", "certificate.html", "playground.html", "practice.html", "flashcards.html", "viz.html", "teacher.html", "debug.html", "detective.html", "flask.html", "exam.html", "assets/js/exam.js", "profile.html", "assets/js/profile.js", "assets/js/cloud.js", "assets/js/feedback.js", "assets/js/flask.js", "assets/data/mystery.js", "assets/data/mystery2.js", "map.html", "cheatsheet.html", "assets/data/bugs.js", "assets/data/trace.js", "assets/data/checks.js", "assets/data/sqlchecks.js", "assets/img/bota.svg", "assets/img/bota-happy.svg", "assets/img/bota-think.svg", "assets/img/bota-wow.svg", "assets/vendor/qrcode/qrcode.js",
  "assets/css/style.css", "assets/js/main.js", "assets/js/labs.js",
  "assets/data/lectures.js", "assets/data/search-index.js", "assets/data/db.js", "assets/data/quiz.js", "assets/data/glossary.js",
  "assets/vendor/sqljs/sql-wasm.js", "assets/vendor/sqljs/sql-wasm.wasm",
  "assets/img/icon.svg", "manifest.webmanifest",
  "lectures/week-0.html", "lectures/week-1.html", "lectures/week-2.html", "lectures/week-3.html",
  "lectures/week-4.html", "lectures/week-5.html", "lectures/week-6.html", "lectures/week-7.html",
  "lectures/ai.html", "lectures/week-8.html", "lectures/week-9.html", "lectures/week-10.html",
];

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
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (new URL(req.url).origin === location.origin || /fonts|cdnjs|jsdelivr/.test(req.url))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
