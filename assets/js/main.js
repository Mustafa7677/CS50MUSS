/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
// CS50 қазақша - интерактив элементтер

(function () {
  // Сайттың түбір мекенжайы (main.js-тің орнынан анықталады: file:// пен GitHub Pages-те де жұмыс істейді)
  const ROOT_URL = new URL("../../", document.currentScript.src).href;
  // Курс: CS50x - түбірде (lectures/), басқалары өз қалтасында (python/lectures/ т.б.).
  // CS50x-тің прогресс кілттері бұрынғыдай (week-0), басқа курстарда курс атымен (python:week-0) - шатаспайды.
  const COURSE = (location.pathname.match(/\/(python|sql|ai|web|cpp|java|en|math)\/(?:lectures\/[\w-]+\.html|index\.html)?$/) || location.pathname.match(/\/(en|math)\/[\w-]+\.html$/) || [])[1] || "x";
  const PAGE = (() => { const n = (location.pathname.match(/lectures\/([\w-]+)\.html$/) || [])[1]; return n ? (COURSE === "x" ? n : COURSE + ":" + n) : null; })();
  // Сабақ беті - тыныш: «кино» қабаты (кадр ауысуы, сахналар, ашылу) тек басқа беттерде.
  // Кадр ауысуын CSS өшіреді (style.css: :root.is-lesson::view-transition-*); skipTransition() қолданбаймыз - ол уәдені қабылдамай, консольге қате шығарады
  if (PAGE) document.documentElement.classList.add("is-lesson");

  // Көшірмеден қорғау: сайт ресми мекенжайдан тыс жерде ашылса, түпнұсқаға сілтеме беретін ескерту көрсетеді.
  // (Тек GitHub Pages-тегі түпнұсқа, жергілікті сервер және file:// үшін көрсетілмейді. Өз доменіңізді қоссаңыз - тізімге қосыңыз.)
  (function () {
    const OFFICIAL = ["mustafa7677.github.io", "localhost", "127.0.0.1", "[::1]", ""];
    if (OFFICIAL.indexOf(location.hostname) !== -1 || location.protocol === "file:") return;
    const show = () => {
      if (document.getElementById("clone-notice")) return;
      const d = document.createElement("div");
      d.id = "clone-notice"; d.setAttribute("role", "alert");
      d.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#7a1010;color:#fff;padding:12px 16px;font:600 15px/1.45 system-ui,sans-serif;text-align:center;box-shadow:0 -6px 24px rgba(0,0,0,.35)";
      d.innerHTML = 'Назар аударыңыз: бұл - «CS50 қазақша» сайтының <b>көшірмесі</b> болуы мүмкін. Түпнұсқа: <a href="https://mustafa7677.github.io/CS50MUSS/" style="color:#ffd75e">mustafa7677.github.io/CS50MUSS</a>. Автор: Sagid Mustafa. © 2026, барлық құқықтар қорғалған; Harvard CS50 аудармалары - CC BY-NC-SA 4.0. Лицензиялар: <a href="https://mustafa7677.github.io/CS50MUSS/copyright.html" style="color:#ffd75e">авторлық құқық беті</a>.';
      document.body.appendChild(d);
    };
    if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
    new MutationObserver(show).observe(document.documentElement, { childList: true, subtree: true });
  })();

  // Түнгі / күндізгі режим
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) {}

  // Оқу баптаулары (қаріп өлшемі, жол аралығы, ені, анимация)
  const PREF_KEY = "cs50kz:prefs";
  function applyPrefs(pr) {
    root.style.setProperty("--fs", pr.fs + "px");
    root.style.setProperty("--lh", pr.lh);
    root.style.setProperty("--cw", pr.cw + "px");
    root.classList.toggle("reduce-motion", !!pr.rm);
  }
  function loadPrefs() {
    const pr = readJson(PREF_KEY, {});
    return { fs: pr.fs || 17, lh: pr.lh || 1.7, cw: pr.cw || 760, rm: !!pr.rm };
  }
  applyPrefs(loadPrefs());
  // Басты беттегі оқиға сахналары тек қозғалыс азайтылмаған кезде ойналады (әйтпесе бәрі соңғы күйінде тұрады)
  if (!loadPrefs().rm && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) root.classList.add("st-js");

  document.addEventListener("DOMContentLoaded", () => {
    // Жылжыған кезде блоктардың біртіндеп көрінуі және баннердегі сандар
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches || root.classList.contains("reduce-motion");
    if (!still && "IntersectionObserver" in window) {
      const items = document.querySelectorAll(".week-card, .feature, .task, .question, .tool, .content h2, .callout, .ft-col");
      // Өлшемді өзіміз оқымаймыз (layout мәжбүрлемейміз): бірінші есепте экраннан тыс тұрғандарын ғана жасырамыз
      const seen = new WeakSet();
      const io = new IntersectionObserver((ents) => {
        ents.forEach((e) => {
          const el = e.target;
          if (!seen.has(el)) {
            seen.add(el);
            if (e.isIntersecting || e.boundingClientRect.top < 0) { io.unobserve(el); return; }
            el.classList.add("reveal");
            el.style.setProperty("--d", (Math.round(e.boundingClientRect.left / 300) % 3) * 70 + "ms");
            return;
          }
          // Экраннан жылдам өтіп кетсе де (жоғарыда қалса) жасырын қалмасын
          if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
          el.classList.add("in");
          io.unobserve(el);
          setTimeout(() => el.classList.remove("reveal", "in"), 900);
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      items.forEach((el) => io.observe(el));
      document.querySelectorAll(".hero-stats [data-count]").forEach((b) => {
        const n = +b.dataset.count, t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / 1100);
          b.textContent = Math.round(n * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }

    // Басты беттегі аударма прогресі
    const bar = document.querySelector(".progress-bar span");
    if (bar) {
      const cards = document.querySelectorAll(".week-card");
      const ready = document.querySelectorAll(".week-card .status.ready").length;
      const count = document.querySelector(".ready-count");
      if (count) count.textContent = `${ready} / ${cards.length}`;
      requestAnimationFrame(() => (bar.style.width = `${(ready / cards.length) * 100}%`));
    }

    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      const isDark = () =>
        root.dataset.theme === "dark" ||
        (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
      const render = () => (toggle.textContent = isDark() ? "☀" : "☾");
      render();
      toggle.addEventListener("click", () => {
        root.dataset.theme = isDark() ? "light" : "dark";
        if (root.dataset.theme === "dark") mark("dark");
        try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
        render();
      });
    }

    if (window.hljs) document.querySelectorAll("pre code").forEach((el) => window.hljs.highlightElement(el));
    addCopyButtons();
    buildToc();
    initQuizzes();
    initAnswerChecks();
    initChecklists();
    initSearch();
    initLecturePage();
    initDashboard();
    initQuote();
    initCourseHome();
    initWideTables();
    initCourseCards();
    initStory();
    initPortal();
    initFilm();
    initCinema();
    initAcademyCode();
    initBeginnerPath();
    initCourseMenu();
    initMathHelper();
    initCheatsheet();
    myCourses(document.querySelector(".my-courses"));
    if (PAGE || document.body.dataset.course) { try { localStorage.setItem("cs50kz:lastcourse", JSON.stringify(COURSE)); } catch (e) {} }
    initAlashPortraits();
    document.querySelectorAll(".qt-slot").forEach(miniQuote);
    initPythonRunner();
    initSqlRunner();
    initWebPreview();
    initPlayground();
    initGlossary();
    initCertificate();
    initServiceWorker();
    window.CS50KZ = { logDay, myCourses, botaSay, ROOT_URL, loadScript, escapeHtml, celebrate, toast, mark, check: checkAchievements, getPyodide, getDb, bump: weekBump, profile, achievements: () => achievementList(), totalLectures: () => COURSE_META.reduce((n, c) => n + c.total, 0), COURSE_META, summary: summaryData, certStatus, certId, certVerifyCode, verifiedCourses, CERT_TASKS, ORDER, dayKey, COURSE, readJson };
    if (document.querySelector(".viz, .flashcards, .daily-card, .mixed-quiz, .bug-hunt, .course-map, .trace-quiz, .autograder, .weekly, .sql-grader, .js-grader, .detective, .web-lab, .homepage-check")) loadScript("assets/js/labs.js");
    if (document.querySelector(".flask-lab")) loadScript("assets/js/flask.js");
    if (document.querySelector(".exam")) loadScript("assets/js/exam.js");
    if (document.querySelector(".profile")) loadScript("assets/js/profile.js");
    // Бұлттық синхрондау: қосылған болса әр бетте, профиль мен мұғалім бетінде әрқашан
    if (readJson("cs50kz:cloud", {}).on || document.querySelector(".profile, .teacher")) loadScript("assets/js/cloud.js").catch(() => {});
    // Кері байланыс: бет жүктеліп болған соң, асықпай
    (window.requestIdleCallback || ((f) => setTimeout(f, 800)))(() => loadScript("assets/js/feedback.js").catch(() => {}));
    initAchievements();
    initPrefs();
    initShare();
    initTeacher();
  });

  // Код блоктарына «Көшіру» батырмасы
  function addCopyButtons() {
    document.querySelectorAll("pre:not(.py-win-code):not(.axc-code)").forEach((pre) => {
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Көшіру";
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? pre.innerText);
          btn.textContent = "Көшірілді ✓";
        } catch (e) {
          btn.textContent = "Қате";
        }
        setTimeout(() => (btn.textContent = "Көшіру"), 1500);
      });
      pre.appendChild(btn);
    });
  }

  // Мазмұнды h2/h3 тақырыптарынан автоматты түрде құрастыру
  function buildToc() {
    const toc = document.querySelector(".toc ol");
    const content = document.querySelector(".content");
    if (!toc || !content) return;

    const headings = content.querySelectorAll("h2[id], h3[id]");
    headings.forEach((h) => {
      const li = document.createElement("li");
      if (h.tagName === "H3") li.className = "sub";
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
    });

    // Телефонда мазмұны жиналып тұрады
    const tocBox = toc.closest(".toc");
    const tocTitle = tocBox && tocBox.querySelector("h4");
    if (tocTitle) {
      const tb = document.createElement("button");
      tb.type = "button";
      tb.className = "toc-toggle";
      tb.textContent = tocTitle.textContent;
      tb.setAttribute("aria-expanded", "false");
      tocTitle.textContent = "";
      tocTitle.appendChild(tb);
      const flip = () => tb.setAttribute("aria-expanded", String(tocBox.classList.toggle("open")));
      tocTitle.addEventListener("click", flip);
      toc.addEventListener("click", (e) => { if (e.target.tagName === "A") tocBox.classList.remove("open"); });
    }

    const links = toc.querySelectorAll("a");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id));
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    headings.forEach((h) => observer.observe(h));
  }

  // Тест: <div class="question" data-answer="b"> ... <input type="radio" value="b"> ...
  function initQuizzes() {
    document.querySelectorAll(".quiz").forEach((quiz, qi) => {
      quiz.querySelectorAll(".question").forEach((q, i) => {
        q.querySelectorAll("input[type=radio]").forEach((r) => (r.name = `quiz${qi}-q${i}`));
      });

      const btn = quiz.querySelector(".quiz-check");
      const result = quiz.querySelector(".result");
      if (!btn) return;

      btn.addEventListener("click", () => {
        let correct = 0;
        const questions = quiz.querySelectorAll(".question");
        questions.forEach((q) => {
          q.classList.add("answered");
          q.querySelectorAll("label").forEach((l) => l.classList.remove("correct", "wrong"));
          const answer = q.dataset.answer;
          const chosen = q.querySelector("input:checked");
          q.querySelectorAll("input").forEach((input) => {
            if (input.value === answer) input.closest("label").classList.add("correct");
          });
          if (chosen && chosen.value === answer) correct++;
          else if (chosen) chosen.closest("label").classList.add("wrong");
        });
        result.textContent = `Нәтиже: ${correct} / ${questions.length}`;
        result.className = "result " + (correct === questions.length ? "ok" : "bad");
        if (PAGE) {
          const p = Progress.load();
          const prev = p.quiz[PAGE];
          if (!prev || correct >= prev.best) p.quiz[PAGE] = { best: correct, total: questions.length };
          Progress.save(p);
          logDay();
          if (correct === questions.length) { celebrate(); botaSay("Керемет! Тестті 100% өттіңіз. Сіз нағыз бағдарламашысыз! 🎉"); }
          checkAchievements();
        }
      });
    });
  }

  // Жауапты тексеру: <div class="answer-check" data-answer="42|қырық екі">
  function initAnswerChecks() {
    document.querySelectorAll(".answer-check").forEach((box) => {
      const input = box.querySelector("input");
      const btn = box.querySelector("button");
      const result = box.querySelector(".result");
      const answers = box.dataset.answer.split("|").map(normalize);
      const check = () => {
        const ok = answers.includes(normalize(input.value));
        result.textContent = ok ? "Дұрыс! ✓" : "Қайталап көріңіз";
        result.className = "result " + (ok ? "ok" : "bad");
      };
      btn.addEventListener("click", check);
      input.addEventListener("keydown", (e) => e.key === "Enter" && check());
    });
  }

  function normalize(s) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
  }

  // Тапсырманың чек-тізімі: белгіленгендері сақталады
  function initChecklists() {
    document.querySelectorAll(".checklist[data-id]").forEach((list) => {
      const key = "check:" + location.pathname + ":" + list.dataset.id;
      const boxes = [...list.querySelectorAll("input[type=checkbox]")];
      const progress = list.parentElement.querySelector(".progress");
      const state = readJson(key, []);
      boxes.forEach((b, i) => {
        b.checked = !!state[i];
        if (!b.closest("label") && !b.getAttribute("aria-label")) b.setAttribute("aria-label", (b.parentElement.textContent || "").trim().slice(0, 140));
      });

      const update = () => {
        const done = boxes.filter((b) => b.checked).length;
        if (progress) {
          progress.textContent = done === boxes.length
            ? "Барлық тексеруден өтті! 🎉"
            : `Орындалды: ${done} / ${boxes.length}`;
        }
        try { localStorage.setItem(key, JSON.stringify(boxes.map((b) => b.checked))); } catch (e) {}
        if (done === boxes.length) checkAchievements();
      };
      boxes.forEach((b) => b.addEventListener("change", () => {
        update();
        if (b.checked) logDay();
        if (b.checked && boxes.every((x) => x.checked)) quoteCheer("Тапсырма орындалды!"); // тапсырма соңы - ұлағатты сөз
      }));
      update();
    });
  }

  // ---------- Көмекші функциялар ----------
  const loaded = {};
  function loadScript(rel) {
    const src = /^https?:/.test(rel) ? rel : ROOT_URL + rel;
    if (!loaded[src]) {
      loaded[src] = new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = src;
        el.onload = resolve;
        el.onerror = () => { delete loaded[src]; reject(new Error("script: " + rel)); };
        document.head.appendChild(el);
      });
    }
    return loaded[src];
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // Оқушының прогресі браузерде сақталады (тіркелусіз)
  // Оқушының жеке ID-і: бір рет жасалады, басқа құрылғыға прогреспен бірге көшеді
  function profile() {
    let pr = readJson("cs50kz:profile", {});
    if ( !/^KZ-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(pr.id || "")) {
      const ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
      const r = new Uint8Array(8);
      (window.crypto || {}).getRandomValues ? crypto.getRandomValues(r) : r.forEach((_, i) => (r[i] = Math.random() * 256));
      const c = [...r].map((x) => ABC[x % ABC.length]).join("");
      pr = { id: `KZ-${c.slice(0, 4)}-${c.slice(4)}`, created: Date.now() };
      try { localStorage.setItem("cs50kz:profile", JSON.stringify(pr)); } catch (e) {}
    }
    return pr;
  }

  const Progress = {
    key: "cs50kz:progress",
    load() {
      const p = readJson(this.key, {});
      const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
      return { read: obj(p.read), quiz: obj(p.quiz), last: obj(p.last).id ? p.last : null, name: typeof p.name === "string" ? p.name : "" };
    },
    save(p) {
      try { localStorage.setItem(this.key, JSON.stringify(p)); } catch (e) {}
    },
    // Орындалған тапсырма (чек-тізім) саны: id = "week-3" (CS50x) не "python:week-3" (басқа курстар)
    tasksDone(id) { return taskMap()[id] || 0; },
  };

  // Барлық «check:<бет>:<тапсырма>» кілттерін бір рет оқып, лекция бойынша толық орындалған тапсырмаларды санайды.
  // Кілттегі бет жолы курсты көрсетеді: .../python/lectures/week-3.html (курс) не .../lectures/week-3.html (CS50x).
  function taskMap() {
    const m = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("check:")) continue;
        const h = k.match(/\/(python|sql|ai|web|cpp|java|en|math)\/lectures\/(week-\d+)\.html:/);
        const x = h ? null : k.match(/\/lectures\/(week-\d+|ai)\.html:/);
        const id = h ? h[1] + ":" + h[2] : x ? x[1] : null;
        if (!id) continue;
        const arr = readJson(k, []);
        if (Array.isArray(arr) && arr.length && arr.every(Boolean)) m[id] = (m[id] || 0) + 1;
      }
    } catch (e) {}
    return m;
  }

  function celebrate() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div");
    box.className = "confetti";
    const colors = ["#f2b705", "#00afca", "#0a4c7a", "#ffd75e", "#3cc8e2"];
    for (let i = 0; i < 80; i++) {
      const c = document.createElement("i");
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.6 + "s";
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  }

  function toast(text) {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    stack.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2600);
  }

  // ---------- Іздеу (Ctrl+K) ----------
  function initSearch() {
    const openers = document.querySelectorAll(".search-open");
    let modal, input, list, items = [], active = 0, loaded = null;

    const build = () => {
      modal = document.createElement("div");
      modal.className = "search-modal";
      modal.innerHTML = `
        <div class="search-box" role="dialog" aria-modal="true" aria-label="Іздеу">
          <div class="search-input"><span>⌕</span><input type="search" placeholder="Лекциялардан іздеу: рекурсия, malloc, SQL JOIN..." autocomplete="off"><kbd>Esc</kbd></div>
          <div class="search-scope" role="group" aria-label="Курс бойынша сүзу">${[["all", "Барлығы"], ["x", "CS50x"], ["python", "CS50P"], ["sql", "SQL"], ["ai", "AI"], ["web", "Web"], ["cpp", "C++"], ["java", "Java"], ["en", "English"], ["math", "Math"]].map(([c, n]) => `<button type="button" data-s="${c}" class="${c === "all" ? "on" : ""}">${n}</button>`).join("")}</div>
          <ul class="search-results"></ul>
          <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> таңдау</span><span><kbd>Enter</kbd> ашу</span></div>
        </div>`;
      document.body.appendChild(modal);
      input = modal.querySelector("input");
      list = modal.querySelector(".search-results");
      modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
      input.addEventListener("input", run);
      modal.querySelector(".search-scope").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-s]");
        if (!b) return;
        scope = b.dataset.s;
        modal.querySelectorAll(".search-scope button").forEach((x) => x.classList.toggle("on", x === b));
        run(); input.focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          active = Math.max(0, Math.min(items.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
          paint();
        } else if (e.key === "Enter" && items[active]) {
          location.href = ROOT_URL + items[active].u;
        } else if (e.key === "Escape") close();
      });
    };

    const open = () => {
      mark("search");
      if (!modal) build();
      modal.classList.add("open");
      document.body.classList.add("no-scroll");
      input.value = "";
      list.innerHTML = '<li class="search-hint">Іздеу үшін кемінде 2 әріп жазыңыз</li>';
      setTimeout(() => input.focus(), 30);
      loaded = loaded || loadScript("assets/data/search-index.js").catch(() => {});
    };
    const close = () => {
      modal.classList.remove("open");
      document.body.classList.remove("no-scroll");
    };

    const courseOfHit = (s) => (/^(python|sql|ai|web|cpp|java|en|math)\//.exec(s.u) || [])[1] || "x";
    let scope = "all";
    function run() {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { items = []; list.innerHTML = '<li class="search-hint">Іздеу үшін кемінде 2 әріп жазыңыз</li>'; return; }
      loaded.then(() => {
        const words = q.split(/\s+/);
        const scored = [];
        for (const s of window.CS50KZ_INDEX || []) {
          if (scope !== "all" && courseOfHit(s) !== scope) continue;
          const h = s.h.toLowerCase(), t = s.t.toLowerCase();
          if (!words.every((w) => h.includes(w) || t.includes(w))) continue;
          let score = 0;
          for (const w of words) score += (h.includes(w) ? 10 : 0) + Math.min(5, t.split(w).length - 1);
          scored.push([score, s]);
        }
        scored.sort((a, b) => b[0] - a[0]);
        items = scored.slice(0, 30).map((x) => x[1]);
        active = 0;
        paint(words);
      });
    }

    function snippet(t, words) {
      const low = t.toLowerCase();
      let i = Math.max(0, low.indexOf(words[0]));
      const start = Math.max(0, i - 50);
      let s = escapeHtml((start ? "…" : "") + t.slice(start, start + 170) + "…");
      for (const w of words) {
        if (w.length < 2) continue;
        s = s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark>${m}</mark>`);
      }
      return s;
    }

    function paint(words = input.value.trim().toLowerCase().split(/\s+/)) {
      if (!items.length) { list.innerHTML = '<li class="search-hint">Ештеңе табылмады 🤔</li>'; return; }
      list.innerHTML = items.map((s, i) => `
        <li class="${i === active ? "active" : ""}"><a href="${ROOT_URL + s.u}">
          <span class="sr-lec">${escapeHtml(s.l)}</span>
          <span class="sr-h">${escapeHtml(s.h)}</span>
          <span class="sr-t">${snippet(s.t, words)}</span>
        </a></li>`).join("");
      const el = list.querySelector(".active");
      if (el) el.scrollIntoView({ block: "nearest" });
    }

    openers.forEach((b) => b.addEventListener("click", open));
    // Код редакторларындағы Tab (шегініс) пернетақта тұзағы болмасын (WCAG 2.1.2): Esc басқан соң Tab фокусты шығарады
    document.addEventListener("keydown", (e) => {
      const t = e.target;
      if (!t || t.tagName !== "TEXTAREA" || !t.classList.contains("pg-editor") && !t.classList.contains("ag-code")) return;
      if (e.key === "Escape") t.dataset.tabfree = "1";
      else if (e.key === "Tab" && t.dataset.tabfree) e.stopImmediatePropagation();
      else if (e.key !== "Shift") delete t.dataset.tabfree;
    }, true);
    document.addEventListener("keydown", (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if ((e.key === "k" || e.key === "K" || e.key === "қ") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(); }
      else if (e.key === "/" && !typing) { e.preventDefault(); open(); }
    });
  }

  // ---------- Лекция беті: оқу жолағы, уақыт, «Оқыдым», пернетақта ----------
  function initLecturePage() {
    const article = document.querySelector("article.content");
    if (!PAGE || !article) return;
    const p = Progress.load();

    // Оқу уақыты
    const head = article.querySelector(".lecture-head");
    const words = article.innerText.split(/\s+/).length;
    const meta = document.createElement("div");
    meta.className = "lecture-meta";
    // математика сабағында ұзақтық нақты есептелген (.mx-meta, tools/math_pedagogy.py): жалпы бағаны қайталамаймыз
    meta.innerHTML = (head.querySelector(".mx-meta") ? "" : `<span>≈ ${Math.max(5, Math.round(words / 160))} мин оқу</span>`) +
      `<span>${article.querySelectorAll(".question").length} сұрақ</span>` +
      `<span>${article.querySelectorAll(".task").length} тапсырма</span>` +
      (p.read[PAGE] ? '<span class="done">✓ Оқылды</span>' : "") +
      '<span class="print-btn" role="button" tabindex="0">PDF / басып шығару</span>';
    const srcLink = head.querySelector(".source-link"); // дербес курстарда түпнұсқа сілтемесі жоқ
    if (srcLink) srcLink.before(meta); else head.append(meta);
    meta.querySelector(".print-btn").addEventListener("click", () => {
      document.querySelectorAll("details").forEach((d) => (d.open = true));
      print();
    });

    // Оқу прогресінің жолағы
    const bar = document.createElement("div");
    bar.className = "read-bar";
    document.body.appendChild(bar);
    const top = document.createElement("button");
    top.className = "to-top";
    top.type = "button";
    top.setAttribute("aria-label", "Жоғарыға");
    top.textContent = "↑";
    top.addEventListener("click", () => scrollTo({ top: 0 }));
    document.body.appendChild(top);
    let lastSaved = 0;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const ratio = max > 0 ? Math.min(1, scrollY / max) : 0;
      bar.style.transform = `scaleX(${ratio})`;
      top.classList.toggle("show", scrollY > 900);
      if (Date.now() - lastSaved > 2000) {
        lastSaved = Date.now();
        const last = { id: PAGE, title: document.querySelector("h1").textContent, num: head.querySelector(".num").textContent, y: Math.round(ratio * 100) };
        if (COURSE === "x") { const q = Progress.load(); q.last = last; Progress.save(q); }
        else try { localStorage.setItem("cs50kz:last:" + COURSE, JSON.stringify(last)); } catch (e) {} // басқа курс CS50x-тің «Жалғастыру»-ын бұзбайды
        if (!onScroll.logged && ratio > 0.1) { onScroll.logged = true; logDay(); }
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // «Оқыдым» батырмасы
    const pager = article.querySelector(".pager");
    const done = document.createElement("div");
    done.className = "mark-read";
    const render = () => {
      const read = !!Progress.load().read[PAGE];
      done.innerHTML = read
        ? `<div><strong>Бұл лекция оқылды ✓</strong><p>Керемет! Келесі лекцияға өтіңіз.</p></div><button type="button" class="btn secondary">Белгіні алып тастау</button>`
        : `<div><strong>Лекцияны оқып шықтыңыз ба?</strong><p>Белгілеп қойыңыз, прогресіңіз басты бетте көрінеді.</p></div><button type="button" class="btn gold">Оқыдым ✓</button>`;
      done.classList.toggle("is-read", read);
      done.querySelector("button").addEventListener("click", () => {
        const q = Progress.load();
        if (q.read[PAGE]) delete q.read[PAGE];
        else { q.read[PAGE] = Date.now(); celebrate(); toast("Лекция оқылды деп белгіленді 🎉"); weekBump("read"); quoteCheer(); }
        Progress.save(q);
        checkAchievements();
        render();
      });
    };
    render();
    if (pager) pager.before(done);
    if (pager && pager.querySelector("a.next")) {
      const nu = document.createElement("div");
      nu.className = "next-up-h";
      nu.textContent = "Келесі не?";
      pager.before(nu);
    }
    const mini = document.createElement("figure");
    mini.className = "qt-mini";
    done.after(mini);
    miniQuote(mini);
    if (COURSE === "math") return; // математика: «Ботаның кеңесі» өздігінен шықпайды (тек «Көмекші» батырмасы)
    const tip = document.createElement("div");
    tip.className = "bota-tip";
    tip.innerHTML = `<img src="${ROOT_URL}assets/img/bota-think.svg" alt="" width="64" height="64"><p><b>Ботаның кеңесі:</b> ${BOTA_TIPS[(PAGE.length * 7 + new Date().getDate()) % BOTA_TIPS.length]}</p>`;
    done.before(tip);

    // ← → пернелерімен лекциялар арасында жүру
    document.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      const links = pager ? pager.querySelectorAll("a") : [];
      if (e.key === "ArrowLeft" && links[0]) location.href = links[0].href;
      if (e.key === "ArrowRight" && links[1]) location.href = links[1].href;
    });
  }

  // ---------- Портреттер (Wikimedia Commons, tools/fetch_portraits.py) ----------
  let portraitsP = null;
  const portraits = () => (portraitsP = portraitsP || loadScript("assets/data/portraits.js").then(() => window.CS50KZ_PORTRAITS || {}).catch(() => ({})));
  // Портрет бар болса - сурет, жоқ болса - бас әріптер (монограмма)
  function faceHtml(name, P, cls) {
    const p = P[name];
    const ini = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
    return p
      ? `<span class="${cls} has-img"><img src="${ROOT_URL + p.img}" alt="${escapeHtml(name)}" width="320" height="400" loading="lazy" decoding="async"></span>`
      : `<span class="${cls}" aria-hidden="true">${escapeHtml(ini)}</span>`;
  }
  function initAlashPortraits() {
    if (!document.querySelector(".alash .al-card")) return;
    portraits().then((P) => {
      const used = [];
      document.querySelectorAll(".alash .al-card").forEach((card) => {
        const name = card.querySelector("h3").textContent.trim(), mono = card.querySelector(".al-mono");
        if (!P[name] || !mono) return;
        mono.outerHTML = faceHtml(name, P, "al-mono");
        card.classList.add("has-portrait");
        used.push(name);
      });
      if (!used.length) return;
      const box = document.createElement("details");
      box.className = "al-credits";
      box.innerHTML = `<summary>Суреттердің дерек көзі</summary><ul>${used.map((n) => `<li>${escapeHtml(n)} - ${escapeHtml(P[n].artist)}, ${escapeHtml(P[n].license)}${P[n].src ? `. <a href="${escapeHtml(P[n].src)}" target="_blank" rel="noopener">Wikimedia Commons</a>` : ""}</li>`).join("")}</ul>`;
      document.querySelector(".alash .al-note")?.after(box);
    });
  }

  // ---------- Күн сөзі: Алаш зиялылары мен ағартушылар ----------
  function initQuote() {
    const card = document.querySelector(".qt-card");
    if (!card) return;
    Promise.all([loadScript("assets/data/quotes.js"), portraits()]).then(([, P]) => {
      const Q = window.CS50KZ_QUOTES || [];
      if (!Q.length) return;
      const EVERY = 12_000; // әр сөз 12 секунд тұрады
      // Кезекпен емес, кездейсоқ ретпен: араластырылған тізім, соңына жеткенде қайта араласады
      const shuffle = (prevLast) => {
        const a = Q.map((_, k) => k);
        for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; }
        if (a.length > 1 && a[0] === prevLast) [a[0], a[1]] = [a[1], a[0]]; // қатарынан бір сөз қайталанбасын
        return a;
      };
      let order = shuffle(-1), pos = 0, i = order[0], timer = null, hover = false;
      let paused = matchMedia("(prefers-reduced-motion: reduce)").matches; // қозғалысты азайтқандарға өзі ауыспайды
      card.innerHTML = `
        <span class="qt-mark" aria-hidden="true">“</span>
        <div class="qt-top"><small class="qt-label">Ұлағатты сөз</small><span class="qt-count" aria-hidden="true"></span></div>
        <div class="qt-body" aria-live="polite"></div>
        <div class="qt-faces" role="group" aria-label="Тұлғаны таңдау"></div>
        <div class="qt-actions">
          <a class="qt-more" href="${ROOT_URL}alash.html">Тұлғалар туралы →</a>
          <button type="button" class="qt-prev" aria-label="Алдыңғы сөз">‹</button>
          <button type="button" class="qt-play" aria-label="Тоқтату"></button>
          <button type="button" class="qt-next" aria-label="Келесі сөз">›</button>
          <button type="button" class="qt-img">Сурет</button><button type="button" class="qt-copy">Көшіру</button>
        </div>
        <i class="qt-time" aria-hidden="true"></i>`;
      const body = card.querySelector(".qt-body"), bar = card.querySelector(".qt-time"), play = card.querySelector(".qt-play");
      // Тұлғалар жолағы: басқанда сол тұлғаның (келесі) сөзі шығады
      const faces = card.querySelector(".qt-faces");
      const authors = [...new Set(Q.map((q) => q.a))];
      faces.innerHTML = authors.map((a) => `<button type="button" data-a="${escapeHtml(a)}" title="${escapeHtml(a)}" aria-label="${escapeHtml(a)}">${faceHtml(a, P, "qt-face")}</button>`).join("");
      faces.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-a]");
        if (!b) return;
        const own = Q.map((q, k) => (q.a === b.dataset.a ? k : -1)).filter((k) => k >= 0);
        i = own.find((k) => k > i && Q[i].a === b.dataset.a) ?? own[0];
        pos = order.indexOf(i);
        draw();
      });
      const draw = () => {
        const q = Q[i];
        body.innerHTML = `
          <blockquote>${q.t.split(" / ").map(escapeHtml).join("<br>")}</blockquote>
          <figcaption>
            ${faceHtml(q.a, P, "qt-mono")}
            <span><b>${escapeHtml(q.a)}</b><small>${escapeHtml(q.y)}${q.src ? " · " + escapeHtml(q.src) : ""}</small></span>
          </figcaption>
          ${q.cs ? `<p class="qt-cs">${escapeHtml(q.cs)}</p>` : ""}`;
        card.querySelector(".qt-count").textContent = `${pos + 1} / ${Q.length}`;
        faces.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.a === q.a)));
        schedule();
      };
      const running = () => !paused && !hover && !card.querySelector(":focus-visible") && document.visibilityState === "visible";
      function schedule() {
        clearTimeout(timer);
        bar.classList.remove("run"); void bar.offsetWidth; // жолақ анимациясын басынан бастау
        play.innerHTML = paused
          ? '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>'
          : '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><rect x="3" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/></svg>';
        play.setAttribute("aria-label", paused ? "Өзі ауыссын" : "Тоқтату");
        card.classList.toggle("is-paused", !running());
        if (!running()) return;
        bar.style.animationDuration = EVERY + "ms";
        bar.classList.add("run");
        timer = setTimeout(() => go(1), EVERY);
      }
      function go(d) {
        pos += d;
        if (pos >= Q.length) { order = shuffle(i); pos = 0; }
        if (pos < 0) pos = Q.length - 1;
        i = order[pos];
        draw();
      }
      draw();
      card.addEventListener("mouseenter", () => { hover = true; schedule(); });
      card.addEventListener("mouseleave", () => { hover = false; schedule(); });
      card.addEventListener("focusout", () => setTimeout(schedule, 0));
      document.addEventListener("visibilitychange", schedule);
      card.addEventListener("click", async (e) => {
        if (e.target.closest(".qt-next")) go(1);
        if (e.target.closest(".qt-prev")) go(-1);
        if (e.target.closest(".qt-play")) { paused = !paused; schedule(); }
        if (e.target.closest(".qt-img")) quoteImage(Q[i]);
        if (e.target.closest(".qt-copy")) {
          const q = Q[i];
          try { await navigator.clipboard.writeText(`«${q.t.replace(/ \/ /g, "\n")}»\n- ${q.a}`); toast("Көшірілді ✓"); } catch (er) {}
        }
      });
      // Телефонда саусақпен солға/оңға сырғыту
      let x0 = null;
      card.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      card.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
    }).catch(() => {});
  }

  // Күн сөзін әлеуметтік желіге арналған суретке айналдыру (1080×1350 PNG)
  async function quoteImage(q) {
    const W = 1080, H = 1350, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0a4c7a"); bg.addColorStop(1, "#007f97");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // Алтын жиек пен оюлы бұрыштар
    g.strokeStyle = "rgba(242,183,5,.85)"; g.lineWidth = 6; g.strokeRect(48, 48, W - 96, H - 96);
    const horn = (x, y, s) => {
      g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = "rgba(242,183,5,.9)"; g.lineWidth = 3; g.lineCap = "round";
      g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(0, 0, -30, -14, -42, 2); g.bezierCurveTo(-52, 16, -36, 30, -26, 20); g.stroke();
      g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(0, 0, 30, -14, 42, 2); g.bezierCurveTo(52, 16, 36, 30, 26, 20); g.stroke();
      g.restore();
    };
    horn(W / 2, 92, 1.2); horn(W / 2, H - 190, 1.2);
    g.fillStyle = "rgba(242,183,5,.6)"; g.font = "bold 360px Georgia, serif"; g.fillText("“", 70, 420);
    // Мәтінді жолдарға бөлу
    const serif = (px) => `600 ${px}px Georgia, "Times New Roman", serif`;
    const wrap = (text, max) => {
      const out = [];
      text.split(" / ").forEach((part) => {
        let line = "";
        part.split(" ").forEach((w) => { const t = line ? line + " " + w : w; if (g.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; });
        out.push(line);
      });
      return out;
    };
    let size = 64, lines;
    do { g.font = serif(size); lines = wrap(q.t, W - 240); size -= 4; } while (lines.length * size * 1.45 > 640 && size > 36);
    size += 4;
    const lh = size * 1.45, top = 300 + (640 - lines.length * lh) / 2;
    g.fillStyle = "#ffffff"; g.font = serif(size);
    lines.forEach((l, k) => g.fillText(l, 120, top + k * lh + size));
    // Портрет (бар болса) - оң жақта, алтын рамкада
    const pr = (window.CS50KZ_PORTRAITS || {})[q.a];
    if (pr) {
      try {
        const im = new Image();
        im.src = ROOT_URL + pr.img;
        await im.decode();
        const px = W - 120 - 176, py = 940, pw = 176, ph = 220;
        g.save(); g.beginPath(); g.roundRect(px - 6, py - 6, pw + 12, ph + 12, 22); g.fillStyle = "#f2b705"; g.fill();
        g.beginPath(); g.roundRect(px, py, pw, ph, 18); g.clip(); g.drawImage(im, px, py, pw, ph); g.restore();
      } catch (e) { /* сурет жүктелмесе - онсыз */ }
    }
    g.fillStyle = "#f2b705"; g.fillRect(120, 1010, 90, 6);
    // Есім портретке тимесін: орын тар болса, қаріп кішірейеді
    const maxW = (pr ? W - 120 - 176 - 40 : W - 120) - 120;
    let fs = 46;
    do { g.font = `700 ${fs}px Unbounded, Inter, system-ui, sans-serif`; fs -= 2; } while (g.measureText(q.a).width > maxW && fs > 26);
    g.fillStyle = "#ffffff"; g.fillText(q.a, 120, 1080);
    g.fillStyle = "rgba(255,255,255,.75)"; g.font = "500 30px Inter, system-ui, sans-serif"; g.fillText(q.y + (q.src ? " · " + q.src : ""), 120, 1126);
    g.fillStyle = "rgba(255,255,255,.85)"; g.font = "700 28px Inter, system-ui, sans-serif"; g.textAlign = "center";
    g.fillText("CS50 қазақша · mustafa7677.github.io/CS50MUSS", W / 2, H - 70);
    const blob = await new Promise((r) => c.toBlob(r, "image/png"));
    if (!blob) return;
    const file = new File([blob], "cs50kz-soz.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: q.a }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
    toast("Сурет жүктелді 🖼");
  }
  // Шағын «Ұлағатты сөз» (лекция соңы, жаттығу беті): кездейсоқ сөз, «Тағы бір» батырмасы
  function miniQuote(box) {
    if (!box) return;
    Promise.all([loadScript("assets/data/quotes.js"), portraits()]).then(([, P]) => {
      const Q = window.CS50KZ_QUOTES || [];
      if (!Q.length) return;
      let i = Math.floor(Math.random() * Q.length);
      const draw = () => {
        const q = Q[i];
        box.innerHTML = `${faceHtml(q.a, P, "qt-mono")}
          <div class="qm-body"><small class="qt-label">Ұлағатты сөз</small>
            <blockquote>${q.t.split(" / ").map(escapeHtml).join("<br>")}</blockquote>
            <figcaption><b>${escapeHtml(q.a)}</b> <span>${escapeHtml(q.y)}</span></figcaption>
            <div class="qm-actions"><button type="button" class="qm-next">↻ Тағы бір сөз</button><a href="${ROOT_URL}alash.html">Тұлғалар туралы →</a></div>
          </div>`;
      };
      draw();
      box.addEventListener("click", (e) => {
        if (!e.target.closest(".qm-next")) return;
        let k = i;
        while (Q.length > 1 && k === i) k = Math.floor(Math.random() * Q.length);
        i = k; draw(); box.querySelector(".qm-next").focus();
      });
    }).catch(() => {});
  }

  // Лекция оқылғанда Бота ұлы сөзбен құттықтайды
  function quoteCheer(head = "Жарайсыз!") {
    loadScript("assets/data/quotes.js").then(() => {
      const Q = window.CS50KZ_QUOTES || [];
      if (!Q.length) return;
      const q = Q[Math.floor(Math.random() * Q.length)];
      botaSay(`${head} ${q.a}: «${q.t.replace(/ \/ /g, " ")}»`, "happy");
    }).catch(() => {});
  }

  // Басты беттегі «Бүгінгі мақсат» виджеті
  function drawGoal(box) {
    if (!box) return;
    const g = goalStats(), done = g.today >= g.goal;
    const r = 26, C = 2 * Math.PI * r, frac = Math.min(1, g.today / g.goal);
    box.classList.toggle("done", done);
    box.innerHTML = `
      <svg class="goal-ring" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Бүгін ${g.today} / ${g.goal} әрекет">
        <circle cx="32" cy="32" r="${r}" class="goal-bg"/>
        <circle cx="32" cy="32" r="${r}" class="goal-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/>
        <text x="32" y="37" text-anchor="middle">${done ? "✓" : `${Math.min(g.today, g.goal)}/${g.goal}`}</text>
      </svg>
      <div class="goal-txt">
        <b>Бүгінгі мақсат: ${g.goal} әрекет</b>
        <span>${done ? "Орындалды - керемет! 🎉" : g.today ? `Тағы ${g.goal - g.today} әрекет қалды` : "Лекция бөлімі, тест, карточка не тапсырма - бәрі саналады"}${g.streak ? ` · 🔥 ${g.streak} күн қатарынан` : ""}</span>
      </div>
      <div class="goal-pick" role="group" aria-label="Күнделікті мақсат">${goalChoices().map((n) => `<button type="button" data-g="${n}" aria-pressed="${n === g.goal}">${n}</button>`).join("")}</div>`;
    box.querySelectorAll(".goal-pick button").forEach((b) => b.addEventListener("click", () => {
      try { localStorage.setItem("cs50kz:goal", b.dataset.g); } catch (e) {}
      drawGoal(box);
      box.querySelector(`.goal-pick button[data-g="${b.dataset.g}"]`).focus();
    }));
  }

  // Көлденең айналатын кестелер пернетақтамен де айналсын (қолжетімділік: scrollable-region-focusable)
  function initWideTables() {
    const mark = () => document.querySelectorAll(".content table, .content div[style*='overflow-x']").forEach((t) => { if (t.scrollWidth > t.clientWidth + 1 && !t.hasAttribute("tabindex")) t.tabIndex = 0; });
    mark();
    addEventListener("load", mark);
    addEventListener("resize", mark);
  }

  // ---------- Курстың басты беті (python/index.html т.б.): карталарда прогресс ----------
  function initCourseHome() {
    const sw = document.querySelector(".cx-switch a.on");
    if (sw && sw.parentElement.scrollWidth > sw.parentElement.clientWidth) sw.parentElement.scrollLeft = Math.max(0, sw.offsetLeft - 40);
    const c = document.body.dataset.course;
    if (!c) return;
    const p = Progress.load();
    const cards = [...document.querySelectorAll(".week-card[data-id]")];
    let read = 0;
    cards.forEach((card) => {
      const id = c + ":" + card.dataset.id, st = card.querySelector(".status");
      if (card.classList.contains("soon") || !st) return;
      const q = p.quiz[id];
      if (q && !card.querySelector(".card-meta")) {
        const meta = document.createElement("div");
        meta.className = "card-meta";
        meta.innerHTML = `<span>📝 ${q.best}/${q.total}</span>`;
        st.before(meta);
      }
      if (p.read[id]) { read++; card.classList.add("is-read"); st.textContent = "Оқылды ✓"; }
    });
    const ready = cards.filter((x) => !x.classList.contains("soon")).length;
    const bar = document.querySelector(".course-progress");
    if (bar) {
      const pct = ready ? Math.round((read / ready) * 100) : 0;
      const last = readJson("cs50kz:last:" + c, null);
      bar.innerHTML = `<div class="cp2-ring" style="--pct:${pct}"><b>${read}<small>/${ready}</small></b></div>
        <div><b>${read ? "Жарайсыз, жалғастырыңыз!" : "Курсты бастаңыз"}</b><span>${ready} лекция дайын · ${read} оқылды</span></div>
        ${last && last.id && last.id.startsWith(c + ":") ? `<a class="btn gold" href="${ROOT_URL}${c}/lectures/${escapeHtml(last.id.split(":")[1])}.html">Жалғастыру: ${escapeHtml(last.num || "")} →</a>` : ""}`;
    }
  }

  // ---------- Курс таңдағыш (жоғарғы жолақ) және телефондағы мәзір ----------
  const COURSE_META = [
    { id: "x", name: "CS50x", title: "Информатикаға кіріспе", color: "#087a96", total: 12, href: "index.html" },
    { id: "python", name: "CS50P", title: "Python бағдарламалау", color: "#3776ab", total: 10, href: "python/index.html" },
    { id: "sql", name: "CS50 SQL", title: "Дерекқорлар", color: "#7c3aed", total: 7, href: "sql/index.html" },
    { id: "ai", name: "CS50 AI", title: "Жасанды интеллект", color: "#c42a68", total: 7, href: "ai/index.html" },
    { id: "web", name: "CS50 Web", title: "Веб-бағдарламалау", color: "#c2410c", total: 9, href: "web/index.html" },
    { id: "cpp", name: "C++", title: "C++ бағдарламалау", color: "#4f46e5", total: 8, href: "cpp/index.html", own: true },
    { id: "java", name: "Java", title: "Java бағдарламалау", color: "#d97706", total: 8, href: "java/index.html", own: true },
    { id: "en", name: "English", title: "Ағылшын тілі A0-C1", color: "#0f766e", total: 24, href: "en/index.html", own: true, nocert: true, unit: "сабақ" },
    { id: "math", name: "Math", title: "Математика", color: "#15803d", total: 162, href: "math/index.html", own: true, nocert: true, unit: "сабақ" },
  ];
  // Ағылшын курсы: лекция белгісі «A1 · 2-сабақ» (week-N -> деңгей мен сабақ)
  const EN_LV = ["A0", "A1", "A2", "B1", "B2", "C1"];
  // Математика: 25 пән, сабақ саны пәнде әртүрлі (жалғыз жоспар: tools/math_plan.py; тест MATH_COUNTS пен COURSE_META.total сәйкестігін тексереді)
  const MATH_COUNTS = [7, 8, 6, 8, 7, 7, 6, 6, 7, 5, 6, 6, 7, 6, 7, 6, 6, 7, 7, 6, 6, 5, 6, 6, 8];
  const MATH_NAMES = ["Precalculus", "Linear Algebra", "Analytic Geometry", "Differential Calculus", "Integral Calculus", "Multivariable Calculus", "Vector Calculus", "Sequences and Series", "Ordinary Differential Equations", "Partial Differential Equations", "Complex Analysis", "Fourier & Laplace Transforms", "Probability Theory", "Mathematical Statistics", "Discrete Mathematics", "Numerical Analysis", "Mathematical Optimization", "Real Analysis", "Abstract Algebra", "Number Theory", "Topology", "Differential Geometry", "Functional Analysis", "Stochastic Processes", "Arithmetic"]; // пән атаулары ТЕК ағылшынша (tools/math_plan.py)
  const mathLabel = (n) => { let i = 0; while (i < MATH_COUNTS.length - 1 && n >= MATH_COUNTS[i]) { n -= MATH_COUNTS[i]; i++; } return `${MATH_NAMES[i]} · ${n + 1}-сабақ`; };
  const unitLabel = (courseId, n) => (courseId === "en" ? `${EN_LV[Math.floor(n / 4)]} · ${(n % 4) + 1}-сабақ` : courseId === "math" ? mathLabel(n) : `${n}-апта`);
  function courseReadCount(p, id) {
    return Object.keys(p.read || {}).filter((k) => p.read[k] && (id === "x" ? ORDER.includes(k) : k.startsWith(id + ":"))).length;
  }
  function initCourseMenu() {
    const pill = document.querySelector(".course-pill");
    if (!pill) return;
    let menu = null;
    const close = () => { if (menu) menu.hidden = true; pill.setAttribute("aria-expanded", "false"); };
    const build = () => {
      const p = Progress.load();
      const cur = pill.dataset.course;
      menu = document.createElement("div");
      menu.className = "course-menu";
      menu.id = "course-menu";
      menu.setAttribute("role", "dialog");
      menu.setAttribute("aria-label", "Курстар");
      // үш академия: әр топтың басында академия бетіне сілтеме
      const ACAD = { x: ["Бағдарламалау академиясы", "programming.html"], en: ["English Academy", "en/"], math: ["Математика академиясы", "math/"] };
      const rows = COURSE_META.map((c) => {
        const read = courseReadCount(p, c.id), pct = Math.round((read / c.total) * 100);
        const sep = ACAD[c.id] ? `<a class="cm-sep" href="${ROOT_URL + ACAD[c.id][1]}">${ACAD[c.id][0]}</a>` : "";
        return sep + `<a class="cm-row${c.own ? " own" : ""}${c.id === cur ? " on" : ""}" href="${ROOT_URL + c.href}" style="--c:${c.color}"${c.id === cur ? ' aria-current="page"' : ""}>
          <span class="cm-dot" aria-hidden="true"></span>
          <span class="cm-txt"><b>${c.name}</b><small>${escapeHtml(c.title)}</small></span>
          <span class="cm-prog"><i style="width:${pct}%"></i></span><span class="cm-n">${read}/${c.total}</span></a>`;
      }).join("");
      menu.innerHTML = `<div class="cm-head">Академиялар</div>${rows}
        <a class="cm-all" href="${ROOT_URL}courses.html">Барлық курстар және оқу жолы →</a>
        <div class="cm-site"><a href="${ROOT_URL}practice.html">Жаттығу</a><a href="${ROOT_URL}playground.html">Сынақ алаңы</a><a href="${ROOT_URL}glossary.html">Сөздік</a><a href="${ROOT_URL}map.html">CS50x картасы</a><a href="${ROOT_URL}cheatsheet.html">Шпаргалка</a><a href="${ROOT_URL}profile.html">Профиль</a></div>`;
      document.body.appendChild(menu);
    };
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = !menu || menu.hidden;
      if (!menu) build();
      if (opening) {
        const r = pill.getBoundingClientRect();
        menu.style.top = Math.round(r.bottom + 8) + "px";
        menu.hidden = false;
        pill.setAttribute("aria-expanded", "true");
        menu.querySelector(".cm-row")?.focus();
      } else close();
    });
    document.addEventListener("click", (e) => { if (menu && !menu.hidden && !menu.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu && !menu.hidden) { close(); pill.focus(); } });
    window.addEventListener("resize", () => { if (menu && !menu.hidden) close(); });
  }

  // ---------- Әр беттің тақырып тақтасы: «Бота саяхаты» мультфильмі ----------
  // Басты беттегі оқиғаның жалғасы. Әр курс - бір күндік саяхат: 0-сабақ таң атқанда басталады, соңғы сабақ
  // түнде киіз үйге жетумен аяқталады. Бота жердегі жолақта тұрады, орны - курстағы орныңыз; аспанда курстың
  // шоқжұлдызы. Бет ашылғанда қысқа «кадр» ойналады: төбелер көтеріледі, күн/ай шығады, шоқжұлдыз сызылады,
  // Бота өз орнына жүріп келеді. Қозғалыс азайтылса - бәрі бірден соңғы күйінде (CSS: .fm, style.css).
    const FILM_CON = {
    code: [[[30, 20], [10, 50], [30, 80]], [[60, 14], [44, 86]], [[74, 20], [94, 50], [74, 80]]],
    python: [[[82, 18], [34, 16], [16, 36], [36, 52], [70, 54], [86, 72], [66, 88], [18, 86]]],
    math: [[[12, 24], [88, 24]], [[34, 24], [30, 86]], [[64, 24], [70, 86]]],
    en: [[[16, 88], [50, 12], [84, 88]], [[30, 58], [70, 58]]],
    sql: [[[14, 22], [86, 22], [86, 78], [14, 78], [14, 22]], [[14, 50], [86, 50]], [[50, 22], [50, 78]]],
    ai: [[[14, 28], [50, 16], [86, 50], [50, 84], [14, 72]], [[14, 28], [50, 84]], [[14, 72], [50, 16]]],
    // Жетіқарақшы (Үлкен аю): жалпы беттерге
    sky: [[[6, 34], [24, 26], [40, 36], [54, 44], [58, 74], [86, 80], [92, 50], [54, 44]]],
  };
  // Сахна лекция беттерінде жоқ (мәтінге назар); қалған беттерде Бота - сіздің нақты жолыңыз:
  // курс бетінде сол курстың оқылған сабақтары, жалпы беттерде барлық курстар бойынша.
  function filmInfo() {
    const path = location.pathname;
    const own = (path.match(/\/(python|sql|ai|web|cpp|java|en|math)\//) || [])[1];
    const p0 = Progress.load();
    const metas = own ? COURSE_META.filter((m) => m.id === own) : COURSE_META;
    const total = metas.reduce((a, m) => a + m.total, 0);
    const done = metas.reduce((a, m) => a + courseReadCount(p0, m.id), 0);
    const p = total ? Math.min(1, done / total) : 0;
    const con = { math: "math", en: "en", python: "python", sql: "sql", ai: "ai", web: "code", java: "code", cpp: "code" }[own] || (/\/(lectures|courses|programming)/.test(path) ? "code" : "sky");
    // Саяхат басталмаса - таң; жол жүрген сайын түс, кеш; соңына жақын - түн, киіз үйде от жанып тұр
    const phase = p < 0.2 ? "dawn" : p < 0.5 ? "day" : p < 0.8 ? "dusk" : "night";
    return { p, phase, con, done, total, seed: [...path].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) };
  }
  function filmRand(seed) { let s = seed || 1; return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); }
  const BOTA_SVG = '<g class="bota fm-walker"><ellipse class="b-shadow" cx="62" cy="110" rx="32" ry="4.5"/>' +
    '<g class="b-far"><rect class="b-leg l1" x="40" y="82" width="8" height="27" rx="4"/><rect class="b-leg l3" x="76" y="82" width="8" height="27" rx="4"/></g>' +
    '<g class="b-body"><path class="b-tail" d="M31 76q-8 2-6 12"/><path class="b-torso" d="M30 86C26 64 44 60 52 66C56 50 72 50 76 64C88 62 96 72 92 86Z"/>' +
    '<path class="b-rug" d="M40 74h44v10H40z"/><path class="b-rug-o" d="M44 79l4-3 4 3-4 3zM58 79l4-3 4 3-4 3zM72 79l4-3 4 3-4 3z"/>' +
    '<g class="b-head"><path class="b-neck" d="M84 70C90 54 88 40 92 32"/><ellipse class="b-skull" cx="98" cy="30" rx="15" ry="12"/><ellipse class="b-muzzle" cx="108" cy="34" rx="7" ry="6"/>' +
    '<ellipse class="b-ear" cx="88" cy="20" rx="3.5" ry="6" transform="rotate(-20 88 20)"/><path class="b-cap" d="M86 18q12-14 24 0z"/><circle class="b-cap-b" cx="98" cy="9" r="2.6"/>' +
    '<g class="b-eyes"><circle class="b-eye" cx="98" cy="27" r="4.2"/><circle class="b-glint" cx="99.3" cy="25.6" r="1.4"/></g><circle class="b-blush" cx="102" cy="33" r="2.4"/><path class="b-smile" d="M104 37q4 3 8 0"/></g></g>' +
    '<g class="b-near"><rect class="b-leg l2" x="45" y="83" width="8" height="27" rx="4"/><rect class="b-leg l4" x="81" y="83" width="8" height="27" rx="4"/></g></g>';
  function filmSky(info) {
    const r = filmRand(info.seed);
    let stars = "";
    for (let i = 0; i < 34; i++) stars += `<circle cx="${(r() * 1000).toFixed(0)}" cy="${(r() * 190).toFixed(0)}" r="${(0.7 + r() * 1.3).toFixed(1)}" style="--d:${(r() * 3).toFixed(2)}s"/>`;
    const lines = FILM_CON[info.con];
    const con = lines.map((l) => `<path d="M${l.map((q) => q.join(" ")).join("L")}" pathLength="1"/>`).join("");
    const dots = [...new Set(lines.flat().map((q) => q.join(",")))].map((q, i) => `<circle cx="${q.split(",")[0]}" cy="${q.split(",")[1]}" r="3" style="--i:${i}"/>`).join("");
    const night = info.phase === "night";
    const orb = night
      ? '<g class="fm-orb fm-moon"><circle class="fm-glow" r="46"/><path class="fm-disc" d="M8-22.6A24 24 0 1 0 22.6 8 18 18 0 0 1 8-22.6Z"/></g>'
      : '<g class="fm-orb fm-sun"><circle class="fm-glow" r="50"/><circle class="fm-disc" r="24"/><path class="fm-kuld" d="M-21-8H21M-21 8H21M-8-21V21M8-21V21"/><path class="fm-mid" d="M0-7 7 0 0 7-7 0Z"/><circle class="fm-ring" r="24"/></g>';
    // Жұлдыздар бүкіл тақтаға жайылады; шоқжұлдыз бен күн/ай - оң жақ жоғарғы бұрышта, өлшемі тұрақты (мәтінге түспейді)
    return `<svg class="fm-sky" viewBox="0 0 1000 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true" focusable="false">` +
      `<g class="fm-stars">${stars}</g><g class="fm-cloud"><path d="M640 92c-4-16 12-26 26-18 6-16 32-18 40-4 12-8 32-2 30 16 12 2 12 18-2 18h-90c-14 0-14-10-4-12z"/></g></svg>` +
      `<svg class="fm-corner" viewBox="0 0 200 96" aria-hidden="true" focusable="false">` +
      `<g class="fm-con" transform="translate(30 10) scale(.62)">${con}${dots}</g><g transform="translate(160 38)">${orb}</g></svg>`;
  }
  function filmGround(info, W) {
    const H = 96, r = filmRand(info.seed + 3);
    const wave = (base, amp, k, ph) => { let d = `M0 ${H}`; for (let x = 0; x <= W + 20; x += 20) d += `L${x} ${(base + amp * Math.sin(x / k + ph)).toFixed(1)}`; return d + `L${W} ${H}Z`; };
    let tufts = "";
    for (let x = 30 + r() * 40; x < W - 20; x += 70 + r() * 90) tufts += `<path d="M${x.toFixed(0)} 88c-1-8-3-13-7-18M${x.toFixed(0)} 88c0-10 0-16 2-24M${x.toFixed(0)} 88c2-7 4-12 9-16"/>`;
    const yurtX = W - 92, botaX = 14 + info.p * Math.max(0, yurtX - 122);
    const yurt = `<g transform="translate(${yurtX} 40)"><g class="fm-yurt"><path class="y-dome" d="M4 22C10 4 54 4 60 22Z"/><rect class="y-wall" x="4" y="22" width="56" height="24"/>` +
      `<path class="y-band" d="M4 22h56v4H4z"/><path class="y-lat" d="M8 30l8 12M16 30l8 12M24 30l8 12M40 30l8 12M48 30l8 12M16 30l-8 12M24 30l-8 12M48 30l-8 12M56 30l-8 12"/>` +
      `<path class="y-door" d="M28 46V31h9v15z"/><circle class="y-top" cx="32" cy="7" r="3.5"/></g></g>`;
    return `<svg class="fm-ground" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">` +
      `<path class="fm-far" d="${wave(54, 9, 150, info.seed % 7)}"/><path class="fm-near" d="${wave(74, 5, 95, (info.seed >> 3) % 7)}"/>` +
      `<g class="fm-tufts">${tufts}</g>${yurt}` +
      `<g class="fm-bota" style="--bx:${botaX.toFixed(1)}px"><g transform="translate(0 22) scale(.62)">${BOTA_SVG}</g>` +
      (info.done ? `<g class="fm-tag" transform="translate(40 4)"><rect x="-26" y="-11" width="52" height="20" rx="10"/><text y="4" text-anchor="middle">${info.done}/${info.total}</text></g>` : "") + `</g></svg>`;
  }
  function initFilm() {
    if (PAGE) return;  // лекция беті: мультфильм жоқ
    const cards = document.querySelectorAll(".content .lecture-head, .cx-hero, .py-hero");
    if (!cards.length) return;
    const info = filmInfo();
    const still = root.classList.contains("reduce-motion") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    cards.forEach((card) => {
      if (card.querySelector(".fm")) return;
      const box = document.createElement("div");
      box.className = "fm";
      box.setAttribute("aria-hidden", "true");
      box.innerHTML = filmSky(info) + '<div class="fm-floor"></div>';
      card.classList.add("has-film");
      card.dataset.phase = info.phase;
      card.prepend(box);
      const floor = box.querySelector(".fm-floor");
      let w = 0;
      const draw = () => {
        const nw = Math.round(card.clientWidth);
        if (!nw || nw === w) return;
        w = nw;
        floor.innerHTML = filmGround(info, w);
      };
      draw();
      if (window.ResizeObserver) new ResizeObserver(draw).observe(card);
      if (still || !("IntersectionObserver" in window)) return;
      card.classList.add("fm-anim");
      // Кадр бір рет ойналады (экранға кіргенде); фондық қозғалыс тек тақта көрініп тұрғанда жүреді
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        card.classList.toggle("fm-vis", e.isIntersecting);
        if (e.isIntersecting) card.classList.add("fm-play");
      }));
      io.observe(card);
    });
  }

  // ---------- «Кино» қабаты: сабақтан басқа беттің бәрі бір фильм сияқты ашылады ----------
  // 1) Бөлім тақырыбы экранға кіргенде астында алтын керуен ізі сызылады.
  // 2) Карточкалар керуендей бірінен соң бірі келеді (бір қатардағылар кезекпен).
  // 3) Беттің соңы - финал сахнасы: түн, киіз үйде от жанады, Бота жолдан үйге жетеді.
  // Тек экраннан төмен тұрғандар жасырылады (бірінші экран жыпылықтамайды); JS кейін салған карточкалар да қамтылады.
  function initCinema() {
    if (PAGE || document.querySelector(".st-scene")) return;  // сабақ пен басты бет (өз оқиғасы бар)
    const still = root.classList.contains("reduce-motion") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    filmFinale(still);
    if (still || !("IntersectionObserver" in window)) return;
    const CARD = /(^|-)(card|tile|step|feature|tool)$/;
    // Ойын алаңы, тест, форма - интерактивті: олар ешқашан «ашылмайды», бірден тұрады
    const skip = ".topbar, .footer, .has-film, .fm-finale, .toc, nav, dialog, .course-menu, .bota-pop, .game-stage, .gx-play, .quiz, form, [data-math-app] .mx-loading";
    const seen = new WeakSet();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const el = e.target;
      if (!seen.has(el)) {
        seen.add(el);
        if (e.isIntersecting || e.boundingClientRect.top < 0) { io.unobserve(el); return; }
        el.classList.add("cine-wait");
        return;
      }
      if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
      el.classList.add("cine-in");
      io.unobserve(el);
      setTimeout(() => el.classList.remove("cine-wait", "cine-in"), 1600);
    }), { rootMargin: "0px 0px -6% 0px" });
    const take = (scope) => {
      if (!scope.isConnected || scope.closest(skip)) return;
      [scope, ...scope.querySelectorAll("h2, [class]")].forEach((el) => {
        if (seen.has(el) || el.closest(skip)) return;
        const isHead = el.tagName === "H2";
        if (!isHead && !(el.classList && [...el.classList].some((c) => CARD.test(c)))) return;
        if (!isHead && el.parentElement && el.parentElement.closest("[class*='card'], [class*='tile']")) return;  // карточка ішіндегі ұсақ бөлік емес
        if (isHead) el.classList.add("cine-h");
        else {
          // бір қатардағы бауырларымен кезек: керуен
          const sibs = [...el.parentElement.children];
          el.style.setProperty("--cd", (Math.min(sibs.indexOf(el), 40) % 6) * 75 + "ms");
          el.classList.add("cine-c");
        }
        io.observe(el);
      });
    };
    take(document.body);
    // Ойындар, курс карточкалары т.б. JS-пен кейін салынады: тек жаңа түйіндерді, кадрына бір рет қараймыз
    // Тек бет ашылғандағы алғашқы көрсетілім (курс тізімі, ойындар каталогы); кейінгі өзгерістер - пайдаланушы әрекеті, оларды анимацияламаймыз
    const fresh = new Set();
    let tick = 0;
    const mo = new MutationObserver((ms) => {
      ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && !n.closest(".fm")) fresh.add(n); }));
      if (fresh.size && !tick) tick = requestAnimationFrame(() => { tick = 0; fresh.forEach(take); fresh.clear(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 2000);
  }
  function filmFinale(still) {
    const foot = document.querySelector(".footer");
    if (!foot || document.querySelector(".fm-finale")) return;
    const box = document.createElement("div");
    box.className = "fm-finale has-film";
    box.dataset.phase = "night";
    box.setAttribute("aria-hidden", "true");
    const info = { p: 1, phase: "night", con: "sky", done: 0, total: 0, seed: 4242 };
    box.innerHTML = '<div class="fm">' + filmSky(info) + '<div class="fm-floor"></div></div>';
    foot.before(box);
    const floor = box.querySelector(".fm-floor");
    let w = 0;
    const draw = () => {
      const nw = Math.round(box.clientWidth);
      if (!nw || nw === w) return;
      w = nw;
      // Бота киіз үйдің алдында; оттың жалыны - үйдің сол жағында
      floor.innerHTML = filmGround(info, w).replace("</svg>", `<g transform="translate(${w - 104} 78)"><g class="fm-fire"><path class="f-log" d="M-10 8h20M-8 4l16 6M8 4l-16 6"/><path class="f-out" d="M0 6C-9 0-6-10 0-18 6-10 9 0 0 6Z"/><path class="f-in" d="M0 6C-4 2-3-4 0-9 3-4 4 2 0 6Z"/></g></g></svg>`);
    };
    draw();
    if (window.ResizeObserver) new ResizeObserver(draw).observe(box);
    if (still || !("IntersectionObserver" in window)) return;
    box.classList.add("fm-anim");
    new IntersectionObserver((es) => es.forEach((e) => {
      box.classList.toggle("fm-vis", e.isIntersecting);
      if (e.isIntersecting) box.classList.add("fm-play");
    }), { rootMargin: "0px 0px -10% 0px" }).observe(box);
  }

  // ---------- Басты бет: шаңырақ арқылы өту ----------
  // Компьютерде скролл кадрды басқарады: шаңырақ үлкейеді (--pz), «камера» ішінен өтеді (--sa), үш қақпа
  // шығып (--ga, --gs) ашылады (.is-open); кері скролласа - кадр да кері жүреді. Телефонда сахна экранға
  // кіргенде шаңырақ өзі үлкейіп жоғалады, әр қақпа экранға жеткенде ашылады (CSS: .pt).
  function initPortal() {
    const pt = document.querySelector(".pt");
    if (!pt || !root.classList.contains("st-js")) return;
    const cards = [...pt.querySelectorAll(".ac-card")];
    const wide = matchMedia("(min-width: 900px) and (min-height: 620px)");
    const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    let raf = 0;
    const paint = () => {
      raf = 0;
      const r = pt.getBoundingClientRect(), span = r.height - innerHeight;
      const p = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 1;
      const z = Math.min(1, p / 0.55), g = smooth(0.4, 0.62, p);
      pt.style.setProperty("--pz", (z * z * z).toFixed(4));
      pt.style.setProperty("--sa", (1 - smooth(0.36, 0.56, p)).toFixed(3));
      pt.style.setProperty("--ga", g.toFixed(3));
      pt.style.setProperty("--gs", (1.25 - 0.25 * g).toFixed(4));
      pt.classList.toggle("pt-hide", g < 0.01);
      cards.forEach((c) => c.classList.toggle("is-open", p > 0.6));
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting || wide.matches) return;
      setTimeout(() => e.target.classList.add("is-open"), pt.dataset.opened ? 300 : 2100);
      pt.dataset.opened = "1";
      io.unobserve(e.target);
    }), { threshold: 0.4 });
    const setup = () => {
      if (wide.matches) {
        pt.classList.add("pt-scroll");
        window.addEventListener("scroll", ask, { passive: true });
        window.addEventListener("resize", ask);
        ask();
      } else {
        pt.classList.remove("pt-scroll");
        window.removeEventListener("scroll", ask);
        cards.forEach((c) => { if (!c.classList.contains("is-open")) io.observe(c); });
      }
    };
    if (wide.addEventListener) wide.addEventListener("change", setup);
    setup();
  }

  // ---------- Басты бет: «Білім көші» оқиғасы ----------
  // 1-сахна бірден ойналады; келесі сахналар экранға кіргенде бір рет іске қосылады (.is-on), ал фондық қозғалыс
  // (бұлт, шөп, бүркіт) тек сахна экранда тұрғанда жүреді (.is-vis). Скролл анимацияны басқармайды, тек бастайды.
  function initStory() {
    const scenes = document.querySelectorAll(".st-scene");
    if (!scenes.length) return;
    if (!("IntersectionObserver" in window)) { scenes.forEach((s) => s.classList.add("is-on", "is-vis")); return; }
    scenes[0].classList.add("is-on");
    // Логотип кадры: кез келген әрекет (скролл, басу, перне) оны өткізіп, мәтінді бірден көрсетеді
    const skipIntro = () => scenes[0].classList.add("st-skip");
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, skipIntro, { once: true, passive: true }));
    const vis = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("is-vis", e.isIntersecting)));
    const on = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-on"); on.unobserve(e.target); }
    }), { rootMargin: "0px 0px -22% 0px" });
    scenes.forEach((s) => { vis.observe(s); on.observe(s); });
    // 1-сахнаның тереңдігі: скролл мен тінтуір қабаттарды әртүрлі жылдамдықпен жылжытады
    const s1 = scenes[0];
    if (!root.classList.contains("st-js")) return;
    let raf = 0, px = 0;
    const paint = () => {
      raf = 0;
      const r = s1.getBoundingClientRect();
      s1.style.setProperty("--sy", Math.min(1, Math.max(0, -r.top / r.height)).toFixed(3));
      s1.style.setProperty("--px", px.toFixed(3));
    };
    const ask = () => { if (!raf && s1.classList.contains("is-vis")) raf = requestAnimationFrame(paint); };
    window.addEventListener("scroll", ask, { passive: true });
    if (window.matchMedia && matchMedia("(pointer: fine)").matches) {
      s1.addEventListener("pointermove", (e) => { px = (e.clientX / window.innerWidth - 0.5) * 2; ask(); });
    }
  }

  // ---------- Бағдарламалау академиясы (programming.html): маршруттардағы прогресс және мақсат бойынша жол ----------
  function initAcademyCode() {
    const tracks = document.querySelectorAll(".pa-track");
    if (!tracks.length) return;
    const p = Progress.load();
    tracks.forEach((t) => {
      const items = [...t.querySelectorAll(".pa-line li")];
      let read = 0, next = null;
      items.forEach((li) => {
        const done = !!p.read[li.dataset.id];
        li.classList.toggle("done", done);
        if (done) read++;
        else if (!next) next = li;
      });
      if (next) { next.classList.add("cur"); next.querySelector("a").setAttribute("aria-current", "step"); }
      const total = items.length, pct = total ? Math.round((read / total) * 100) : 0;
      t.querySelector(".pa-bar i").style.width = pct + "%";
      t.querySelector(".pa-stat").textContent = read ? `${read}/${total} оқылды` : `${total} лекция`;
      const go = t.querySelector(".pa-next");
      if (!read) return;
      if (next) {
        go.href = next.querySelector("a").getAttribute("href");
        go.textContent = "Жалғастыру: " + next.querySelector(".pa-t").textContent;
      } else {
        go.href = t.querySelector(".pa-home").getAttribute("href");
        go.textContent = "Аяқталды ✓";
      }
    });
    const data = JSON.parse(document.getElementById("pa-goals-data")?.textContent || "{}");
    const plan = document.querySelector(".pa-plan");
    const buttons = document.querySelectorAll(".pa-goal");
    const pick = (goal, save) => {
      const g = data[goal];
      if (!g || !plan) return;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.goal === goal)));
      tracks.forEach((t) => t.classList.toggle("pa-pick", g.path.includes(t.dataset.course)));
      const steps = g.path.map((id) => {
        const t = document.getElementById("t-" + id), c = COURSE_META.find((m) => m.id === id);
        return `<li style="--c:${c ? c.color : "#087a96"}"><a href="#t-${id}">${escapeHtml(t ? t.querySelector("h3").textContent : id)}</a></li>`;
      }).join("");
      plan.innerHTML = `<ol class="pa-steps">${steps}</ol><p>${escapeHtml(g.note)}</p>`;
      if (save) { try { localStorage.setItem("cs50kz:acad:goal", goal); } catch (e) {} }
    };
    buttons.forEach((b) => b.addEventListener("click", () => pick(b.dataset.goal, true)));
    try { const saved = localStorage.getItem("cs50kz:acad:goal"); if (saved) pick(saved, false); } catch (e) {}
  }

  // ---------- «Менің курстарым»: барлық курс бойынша прогресс және жалғастыру ----------
  function myCourses(box, opts = {}) {
    if (!box) return;
    const p = Progress.load();
    const rows = COURSE_META.map((c) => {
      const read = courseReadCount(p, c.id);
      const ids = c.id === "x" ? ORDER : Array.from({ length: c.total }, (_, i) => c.id + ":week-" + i);
      const nextId = ids.find((id) => !p.read[id]);
      const lastRaw = c.id === "x" ? p.last : readJson("cs50kz:last:" + c.id, null);
      const lastId = lastRaw && lastRaw.id && !p.read[lastRaw.id] && ids.includes(lastRaw.id) ? lastRaw.id : null;
      const goId = lastId || nextId;
      const href = goId ? (c.id === "x" ? `lectures/${goId}.html` : `${c.id}/lectures/${goId.split(":")[1]}.html`) : null;
      const label = goId ? (goId.split(":").pop() === "ai" ? "AI" : unitLabel(c.id, +goId.split(":").pop().replace("week-", ""))) : "";
      const ex = readJson(c.id === "x" ? "cs50kz:exam" : "cs50kz:exam:" + c.id, {}).best;
      return { c, read, pct: Math.round((read / c.total) * 100), href, label, started: read > 0 || !!lastRaw, done: read === c.total, ex: typeof ex === "number" ? ex : null };
    });
    const active = rows.filter((r) => r.started);
    if (!active.length && !opts.always) { box.hidden = true; return; }
    box.hidden = false;
    const show = active.length ? active : rows.slice(0, 2);
    box.innerHTML = `<div class="mc-head"><h2>${opts.title || "Менің курстарым"}</h2><a href="${ROOT_URL}courses.html">Барлық курстар →</a></div>
      <div class="mc-grid">${show.map((r) => `
        <article class="mc-card${r.done ? " done" : ""}" style="--c:${r.c.color}">
          <div class="mc-ring" style="--pct:${r.pct}"><b>${r.pct}%</b></div>
          <div class="mc-body">
            <h3>${r.c.name}</h3>
            <p>${escapeHtml(r.c.title)} · ${r.read}/${r.c.total} ${r.c.unit || "лекция"}</p>
            ${r.done && r.c.nocert ? `<a class="mc-btn" href="${ROOT_URL + r.c.href}">Курс аяқталды \u2713: қайталау</a>` : r.done ? `<a class="mc-btn" href="${ROOT_URL}certificate.html${r.c.id === "x" ? "" : "?course=" + r.c.id}">Сертификатты алу 🎓</a>`
              : r.href ? `<a class="mc-btn" href="${ROOT_URL + r.href}">${r.read ? "Жалғастыру" : "Бастау"}: ${r.label} →</a>` : ""}
            ${r.c.nocert ? "" : r.ex != null || r.done ? `<a class="mc-exam" href="${ROOT_URL}exam.html${r.c.id === "x" ? "" : "?course=" + r.c.id}">${r.ex != null ? `📝 Емтихан: ${r.ex}%${r.ex >= 70 ? " ✓" : ""}` : "📝 Қорытынды емтихан"}</a>` : ""}
          </div>
        </article>`).join("")}</div>`;
  }

  // ---------- Курс витринасы: әр курстағы өз прогресі ----------
  function initCourseCards() {
    const p = Progress.load();
    const readOf = (c) => Object.keys(p.read).filter((k) => p.read[k] && (c === "x" ? ORDER.includes(k) : k.startsWith(c + ":"))).length;
    // үш академия карточкасы: академиядағы барлық курс бойынша оқылғаны
    document.querySelectorAll(".ac-card[data-courses]").forEach((card) => {
      const ids = card.dataset.courses.split(",");
      const read = ids.reduce((n, id) => n + readOf(id), 0);
      const total = COURSE_META.filter((c) => ids.includes(c.id)).reduce((n, c) => n + c.total, 0);
      const box = card.querySelector(".ac-prog");
      if (!read || !total || !box) return;
      box.hidden = false;
      box.querySelector("i").style.setProperty("--p", Math.min(100, Math.round((read / total) * 100)) + "%");
      box.querySelector("em").textContent = `${read}/${total} оқылды`;
    });
    // басты беттегі «шаңырақ» тақтайшалары: оқылған үлес жолақпен және мәтінмен
    document.querySelectorAll(".kh-tile[data-total]").forEach((t) => {
      const read = readOf(t.dataset.course), total = +t.dataset.total || 0;
      if (!read || !total) return;
      const pct = Math.min(100, Math.round((read / total) * 100));
      t.classList.add("kh-on");
      t.style.setProperty("--p", pct + "%");
      const meta = t.querySelector(".kh-meta");
      if (meta) meta.textContent = pct === 100 ? `${total}/${total} - аяқталды ✓` : `${read}/${total} оқылды`;
    });
    const cards = document.querySelectorAll(".cx-card[data-total]");
    if (!cards.length) return;
    cards.forEach((card) => {
      const c = card.dataset.course, total = +card.dataset.total || 0;
      const read = readOf(c);
      if (!read || !total) return;
      const pct = Math.min(100, Math.round((read / total) * 100));
      const bar = card.querySelector(".cx-bar"), go = card.querySelector(".cx-go");
      if (bar) { bar.hidden = false; bar.style.setProperty("--p", pct + "%"); bar.title = `${read}/${total} лекция оқылды`; }
      if (go) go.innerHTML = `${pct === 100 ? "Аяқталды ✓" : "Жалғастыру"} <span aria-hidden="true">→</span>`;
      const meta = card.querySelector(".cx-foot > span:first-child");
      if (meta) meta.textContent = `${read}/${total} лекция оқылды`;
    });
  }

  // ---------- «Бір негізгі маршрут»: CS50x/курс → лекция → тапсырма → нәтиже → келесі лекция ----------
  // Статикалық нұсқа build.py-да (route_block); мұнда оқушының прогресі бойынша ағымдағы қадам белгіленеді.
  // Ағымдағы лекция - курстағы бірінші оқылмаған лекция. Қадамдар: 1 курс, 2 лекция ашылды, 3 тапсырма, 4 тест, 5 келесі лекция.
  function routeState(c, list, p) {
    const key = (l) => (c === "x" ? l.id : c + ":" + l.id);
    const readN = list.filter((l) => p.read[key(l)]).length;
    const lastRaw = c === "x" ? p.last : readJson("cs50kz:last:" + c, null);
    const lastId = lastRaw && lastRaw.id;
    const L = list.find((l) => !p.read[key(l)]) || null;
    const next = L ? list[list.indexOf(L) + 1] || null : null;
    const state = { readN, L, next, started: false, done: [false, false, false, false, false], current: 1 };
    if (!L) { state.done = [true, true, true, true, true]; state.current = 0; state.started = true; return state; }
    const tasks = Progress.tasksDone(key(L)), quiz = p.quiz[key(L)];
    const act = lastId === key(L) || tasks > 0 || !!quiz;
    state.started = readN > 0 || act || (!!lastId && (c === "x" ? ORDER.includes(lastId) : lastId.startsWith(c + ":")));
    const d1 = state.started, d2 = d1 && act;
    const d3 = d2 && (tasks > 0 || !L.tasks), d4 = d3 && (!!quiz || !L.quiz);
    state.done = [d1, d2, d3, d4, false];
    state.current = [d1, d2, d3, d4].indexOf(false) + 1 || 5;
    return state;
  }

  function renderRoute(box, c, list) {
    const p = Progress.load();
    const st = routeState(c, list, p), { L, next } = st;
    const steps = [...box.querySelectorAll(".route-step")];
    const certHref = c === "en" || c === "math" ? ROOT_URL + c + "/index.html" : ROOT_URL + "certificate.html" + (c === "x" ? "" : "?course=" + c);
    const setStep = (i, href, title, small) => {
      const li = steps[i - 1];
      if (!li) return;
      const a = li.querySelector("a");
      if (href) a.setAttribute("href", href);
      if (title != null) a.querySelector("b").textContent = title;
      if (small != null) a.querySelector("small").textContent = small;
    };
    const url = (l, hash) => ROOT_URL + l.url + (hash ? "#" + hash : "");
    if (L) {
      setStep(2, url(L), L.num + " лекциясы", L.title);
      setStep(3, url(L, L.task || ""), null, L.tasks ? "Өзің орында" : "Бұл лекцияда тапсырма жоқ");
      setStep(4, url(L, L.quiz ? "quiz" : ""), null, null);
      setStep(5, next ? url(next) : certHref, next ? (c === "en" || c === "math" ? "Келесі сабақ" : "Келесі лекция") : (c === "en" || c === "math" ? "Курс беті" : "Сертификат"), next ? next.num + ": " + next.title : "Курс аяқталады");
    }
    steps.forEach((li, i) => {
      const done = st.done[i], cur = st.current === i + 1;
      li.classList.toggle("is-done", done);
      li.classList.toggle("is-current", cur);
      if (cur) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      const old = li.querySelector(".route-sr");
      if (old) old.remove();
      const mark = document.createElement("span");
      mark.className = "route-sr";
      mark.textContent = done ? " (орындалды)" : cur ? " (қазір осы қадам)" : "";
      li.querySelector(".route-txt b").after(mark);
      const dot = li.querySelector(".route-dot");
      dot.textContent = done ? "✓" : String(i + 1);
    });
    const go = box.querySelector(".route-go"), note = box.querySelector(".route-note");
    box.dataset.state = !L ? "complete" : st.started ? "progress" : "fresh";
    box.dataset.current = String(st.current);
    if (!L) {
      go.setAttribute("href", certHref);
      go.innerHTML = c === "en" || c === "math" ? 'Курс бетіне оралу <span aria-hidden="true">→</span>' : 'Сертификатты алу <span aria-hidden="true">→</span>';
      note.textContent = c === "math" ? "Курс толық оқылды. Жаттықтырғышта қайталап, формулалар анықтамалығын пайдаланыңыз." : c === "en" ? "Курс толық оқылды. Сөздік карточкаларымен қайталап, жобаңызды аяқтаңыз." : "Курс толық оқылды. Қорытынды емтиханнан өтіп, сертификат алыңыз.";
      return;
    }
    const target = [url(L), url(L), url(L, L.task || ""), url(L, L.quiz ? "quiz" : ""), next ? url(next) : certHref][st.current - 1];
    go.setAttribute("href", target);
    const lab = st.current === 5 && next ? next.num : L.num;
    go.innerHTML = `${st.started ? "Жалғастыру" : "Бастау"}: ${escapeHtml(lab)} <span aria-hidden="true">→</span>`;
    if (st.started) {
      const names = ["Курсты таңдау", "Лекцияны оқу", "Бірінші тапсырма", "Тест пен тексеру нәтижесі", "Келесі лекцияға өту"];
      note.textContent = `${st.current}-қадам: ${names[st.current - 1]}. ${st.readN}/${list.length} лекция оқылды.` +
        (st.current === 5 ? ` «${L.num}» дайын: лекция соңында «Оқыдым» деп белгілеңіз.` : "");
    }
  }

  function initBeginnerPath() {
    document.querySelectorAll(".route[data-route]").forEach((box) => {
      const c = box.dataset.route;
      loadScript(c === "x" ? "assets/data/lectures.js" : c + "/data/lectures.js").then(() => {
        const list = c === "x" ? window.CS50KZ_LECTURES : (window.CS50KZ_COURSE_LECTURES || {})[c];
        if (list && list.length) renderRoute(box, c, list);
      }).catch(() => {});
    });
  }

  // ---------- Басты бет: жеке прогресс панелі ----------
  function initDashboard() {
    const panel = document.querySelector(".dashboard");
    if (!panel) return;
    loadScript("assets/data/lectures.js").then(() => {
      const lectures = window.CS50KZ_LECTURES || [];
      const p = Progress.load();
      const read = lectures.filter((l) => p.read[l.id]).length;
      let qBest = 0, qTotal = 0;
      lectures.forEach((l) => { const q = p.quiz[l.id]; if (q) { qBest += q.best; qTotal += q.total; } });
      const tasks = lectures.reduce((n, l) => n + Progress.tasksDone(l.id), 0);
      const totalTasks = lectures.reduce((n, l) => n + l.tasks, 0);
      const minutes = lectures.filter((l) => !p.read[l.id]).reduce((n, l) => n + l.minutes, 0);
      const pct = lectures.length ? Math.round((read / lectures.length) * 100) : 0;
      const next = lectures.find((l) => !p.read[l.id]);
      const last = p.last && lectures.find((l) => l.id === p.last.id);
      const cont = last && !p.read[last.id] ? last : next;

      panel.innerHTML = `
        <div class="dash-ring" style="--pct:${pct}"><div><b>${pct}%</b><span>курс</span></div></div>
        <div class="dash-main">
          <div class="bota-greet"><img src="${ROOT_URL}assets/img/${read ? "bota-happy" : "bota"}.svg" alt="" width="54" height="54"><div><small>Бота:</small><h3>${greeting(read, lectures.length, p.name)}</h3></div></div>
          <div class="dash-stats">
            <div><b>${read}<small>/${lectures.length}</small></b><span>лекция оқылды</span></div>
            <div><b>${qTotal ? Math.round((qBest / qTotal) * 100) + "%" : "-"}</b><span>тест нәтижесі</span></div>
            <div><b>${tasks}<small>/${totalTasks}</small></b><span>тапсырма тексерілді</span></div>
            <div><b>${Math.round(minutes / 60 * 10) / 10}</b><span>сағат оқу қалды</span></div>
          </div>
          <div class="dash-goal"></div>
          <div class="dash-actions">
            ${cont ? `<a class="btn gold" href="${ROOT_URL + cont.url}">${read || last ? "Жалғастыру" : "Бастау"}: ${escapeHtml(cont.num)} →</a>` : `<a class="btn gold" href="${ROOT_URL}certificate.html">Сертификатты алу 🎓</a>`}
            <a class="btn ghost-dark" href="${ROOT_URL}certificate.html">Сертификат</a>
            <button type="button" class="btn ghost-dark share-progress">Мұғалімге жіберу</button>
          </div>
        </div>`;

      drawGoal(panel.querySelector(".dash-goal"));
      document.addEventListener("cs50kz:day", () => drawGoal(panel.querySelector(".dash-goal")));

      // Әр картаға белгі
      document.querySelectorAll(".week-card").forEach((card) => {
        const id = (card.getAttribute("href").match(/([\w-]+)\.html$/) || [])[1];
        const l = lectures.find((x) => x.id === id);
        if (!l || card.classList.contains("soon")) return;
        const meta = document.createElement("div");
        meta.className = "card-meta";
        const q = p.quiz[id];
        meta.innerHTML = `<span>⏱ ${l.minutes} мин</span>` + (q ? `<span>📝 ${q.best}/${q.total}</span>` : "");
        card.querySelector(".status").before(meta);
        if (p.read[id]) {
          card.classList.add("is-read");
          card.querySelector(".status").textContent = "Оқылды ✓";
        } else {
          card.querySelector(".status").textContent = p.last && p.last.id === id ? "Жалғастыру →" : "Оқу →";
          card.querySelector(".status").classList.remove("ready");
        }
      });
    });
  }

  // ---------- Python кодын браузерде іске қосу (Pyodide) ----------
  let pyodideReady = null;
  function initPythonRunner() {
    const blocks = [...document.querySelectorAll('pre[data-lang="python"]')].filter((pre) => {
      const code = pre.textContent;
      if (pre.hasAttribute("data-norun")) return false;
      return !/numpy|tensorflow|sklearn|nltk|torch|pygame|cv2|django|import (pandas|matplotlib|transformers)|flask|openai|from cs50 import SQL|sys\.argv|import csv|open\(|import requests|qrcode|cowsay|pyttsx3|face_recognition|PIL|speech_recognition|^\s*\.\.\./m.test(code);
    });
    blocks.forEach((pre) => {
      const btn = document.createElement("button");
      btn.className = "run-btn";
      btn.type = "button";
      btn.textContent = "▶ Іске қосу";
      pre.appendChild(btn);
      btn.addEventListener("click", async () => {
        let out = pre.nextElementSibling;
        if (!out || !out.classList.contains("run-output")) {
          out = document.createElement("pre");
          out.className = "run-output";
          pre.after(out);
        }
        out.textContent = pyodideReady ? "Орындалып жатыр..." : "Python жүктелуде (бірінші рет ~10 секунд)...";
        mark("python");
        btn.disabled = true;
        try {
          out.textContent = (await runPython(pre.querySelector("code").innerText)) || "(шығыс жоқ)";
          out.classList.remove("err");
        } catch (e) {
          if (e instanceof Event || !pyodideReady) {
            pyodideReady = null;
            out.textContent = "Python жүктелмеді. Интернет байланысын тексеріп, қайта басып көріңіз.";
            out.classList.add("err");
            btn.disabled = false;
            return;
          }
          out.textContent = String(e.message || e).split("\n").filter((l) => !/File "\/lib|_pyodide|pyodide\./.test(l)).join("\n");
          out.classList.add("err");
        }
        btn.disabled = false;
      });
    });
  }

  async function runPython(code) {
    const py = await getPyodide();
    let buf = "";
    py.setStdout({ batched: (s) => (buf += s + "\n") });
    py.setStderr({ batched: (s) => (buf += s + "\n") });
    try {
      if (/^\s*(import|from)\s+sqlite3\b/m.test(code)) { try { await py.loadPackage("sqlite3"); } catch (_) {} }
      await py.runPythonAsync(code);
    } catch (e) {
      e.partial = buf;
      throw e;
    }
    return buf;
  }

  function pythonError(e) {
    return String(e.message || e).split("\n").filter((l) => !/File "\/lib|_pyodide|pyodide\./.test(l)).join("\n");
  }

  async function getPyodide() {
    if (!pyodideReady) {
      const loading = (async () => {
        // Pyodide-ті бірнеше көзден кезекпен жүктейміз: біреуі қолжетімсіз болса (желі, аймақ), келесісіне көшеміз.
        // 1) ресми CDN (барлық пакеттермен, мысалы sqlite3); 2-3) npm бумасы (негізгі Python ғана).
        const SOURCES = ["https://cdn.jsdelivr.net/pyodide/v0.26.4/full/", "https://cdn.jsdelivr.net/npm/pyodide@0.26.4/", "https://unpkg.com/pyodide@0.26.4/"];
        let py = null, lastErr = null;
        for (const base of SOURCES) {
          try {
            await loadScript(base + "pyodide.js");
            py = await window.loadPyodide({ indexURL: base });
            break;
          } catch (e) { lastErr = e; delete window.loadPyodide; }
        }
        if (!py) throw lastErr || new Error("Pyodide жүктелмеді");
        // input() мен cs50 кітапханасын браузерге бейімдеу; __cs50kz_run - автотексеруші қабығы
        py.runPython(`
import builtins
from js import prompt
def _prompt_input(p=""):
    v = prompt(str(p))
    if v is None:
        raise EOFError("енгізу тоқтатылды")
    print(str(p) + v)
    return v
builtins.input = _prompt_input
import builtins, sys, types, io, contextlib

def _cs50_input(p=""):
    return builtins.input(p)

cs50 = types.ModuleType("cs50")
def get_string(p=""): return _cs50_input(p)
def get_int(p=""):
    while True:
        try: return int(_cs50_input(p))
        except ValueError: pass
def get_float(p=""):
    while True:
        try: return float(_cs50_input(p))
        except ValueError: pass
cs50.get_string, cs50.get_int, cs50.get_float = get_string, get_int, get_float
sys.modules["cs50"] = cs50

def __cs50kz_run(src, inputs, argv=None, files=None, limit=2000000, seed=None):
    import os, random
    q = list(inputs)
    if seed is not None:
        random.seed(seed)
    if files:
        for name, text in dict(files).items():
            d = os.path.dirname(name)
            if d:
                os.makedirs(d, exist_ok=True)
            with open(name, "w") as f:
                f.write(text)
            if name.endswith(".py"):  # алдыңғы тесттің модулі кэште қалмасын
                sys.modules.pop(name[:-3].replace("/", "."), None)
    old_argv = sys.argv
    sys.argv = list(argv) if argv else ["student.py"]
    def _inp(p=""):
        if not q:
            raise EOFError("кіріс таусылды: бағдарлама тағы кіріс күтті")
        return q.pop(0)
    count = [0]
    def tracer(frame, event, arg):
        count[0] += 1
        if count[0] > limit:
            raise TimeoutError("бағдарлама тым ұзақ орындалды (шексіз цикл?)")
        return tracer
    buf = io.StringIO()
    old = builtins.input
    builtins.input = _inp
    err = None
    sys.settrace(tracer)
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(src, "student.py", "exec"), {"__name__": "__main__"})
    except SystemExit as e:
        # sys.exit("хабар") - Python мұны stderr-ге жазады; тесттер үшін шығысқа қосамыз
        if e.code is not None and not isinstance(e.code, int):
            buf.write(str(e.code) + "\\n")
    except BaseException as e:
        err = f"{type(e).__name__}: {e}"
    finally:
        sys.settrace(None)
        builtins.input = old
        sys.argv = old_argv
    return [buf.getvalue(), err]
`);
        return py;
      })();
      pyodideReady = loading;
      loading.catch(() => { if (pyodideReady === loading) pyodideReady = null; });
    }
    return pyodideReady;
  }

  // ---------- Сөздік: сүзгі ----------
  function initGlossary() {
    const box = document.querySelector(".g-search input");
    if (!box) return;
    const rows = [...document.querySelectorAll(".g-row")];
    const letters = [...document.querySelectorAll(".g-letter")];
    const count = document.querySelector(".g-count");
    let course = "all";
    // Әр жолдың курсы: сілтемесінен (python/, sql/, ai/, web/ не CS50x)
    const inCourse = (r, c) => (r.dataset.c || "x").split(" ").includes(c);
    const names = { all: "Барлығы", x: "CS50x", python: "CS50P", sql: "SQL", ai: "AI", web: "Web", cpp: "C++", java: "Java", en: "English", math: "Math" };
    const present = new Set(rows.flatMap((r) => (r.dataset.c || "x").split(" ")));
    const chips = document.createElement("div");
    chips.className = "seg g-courses";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Курс");
    chips.innerHTML = Object.keys(names).filter((c) => c === "all" || present.has(c)).map((c) => `<button type="button" data-c="${c}" class="${c === "all" ? "on" : ""}">${names[c]}</button>`).join("");
    document.querySelector(".g-search").after(chips);
    const run = () => {
      const q = box.value.trim().toLowerCase();
      let n = 0;
      rows.forEach((r) => { const ok = (!q || r.dataset.q.includes(q)) && (course === "all" || inCourse(r, course)); r.hidden = !ok; if (ok) n++; });
      letters.forEach((h) => {
        let el = h.nextElementSibling, any = false;
        while (el && el.classList.contains("g-row")) { if (!el.hidden) any = true; el = el.nextElementSibling; }
        h.hidden = !any;
        const a = document.querySelector(`.g-letters a[href="#${h.id}"]`);
        if (a) { if (any) a.removeAttribute("aria-disabled"); else a.setAttribute("aria-disabled", "true"); }
      });
      count.textContent = `${n} термин`;
    };
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-c]");
      if (!b) return;
      course = b.dataset.c;
      chips.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      run();
    });
    box.addEventListener("input", run);
    run();
  }

  // ---------- Шпаргалка: курс бойынша сүзу ----------
  function initCheatsheet() {
    const bar = document.querySelector(".cs-courses");
    if (!bar) return;
    const cards = [...document.querySelectorAll(".cs-card[data-c]")];
    const show = (c) => {
      cards.forEach((x) => { x.hidden = c !== "all" && x.dataset.c !== c; });
      bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.c === c));
    };
    bar.addEventListener("click", (e) => { const b = e.target.closest("button[data-c]"); if (b) show(b.dataset.c); });
    const fromHash = () => (location.hash.match(/^#(python|sql|ai|web|cpp|java)-/) || [])[1];
    show(fromHash() || "x");
    window.addEventListener("hashchange", () => { const c = fromHash(); if (c) show(c); });
  }

  // ---------- Сертификат ----------
  function initCertificate() {
    const cert = document.querySelector(".certificate");
    if (!cert) return;
    // Әр курстың өз сертификаты: certificate.html?course=python|sql|ai|web|cpp|java
    const q = new URLSearchParams(location.search).get("course");
    const course = ["python", "sql", "ai", "web", "cpp", "java"].includes(q) ? q : "x";
    const note = (c) => `Оқу сертификаты. Түпнұсқа курс: ${c}, Гарвард университеті, David J. Malan (CC BY-NC-SA 4.0). Гарвард университеті берген ресми сертификат емес.`;
    const COURSE_CERT = {
      python: { code: "CS50P", total: 10, what: "«Python бағдарламалау» (CS50P)", topics: "функциялар, шарттар, циклдер, ерекше жағдайлар, кітапханалар, модульдік тесттер, файлдармен жұмыс, тұрақты өрнектер және объектіге бағытталған бағдарламалау" },
      sql: { code: "CS50 SQL", total: 7, what: "«Дерекқорлар» (CS50 SQL)", topics: "SQL сұраулары, кестелерді байланыстыру, дерекқорды жобалау, деректерді жазу, көріністер, индекстер және масштабтау" },
      ai: { code: "CS50 AI", total: 7, what: "«Жасанды интеллект» (CS50 AI)", topics: "іздеу, білім, ықтималдық, оңтайландыру, машиналық оқыту, нейрон желілер және тіл" },
      web: { code: "CS50 Web", total: 9, what: "«Веб-бағдарламалау» (CS50 Web)", topics: "HTML, CSS, Git, Python, Django, SQL, JavaScript, пайдаланушы интерфейстері, тестілеу, CI/CD, масштабтау және қауіпсіздік" },
      // Дербес авторлық курстар: Harvard аудармасы емес, сондықтан Harvard туралы оговорка жоқ
      cpp: { code: "C++", total: 8, own: true, what: "«C++ бағдарламалау»", topics: "жад пен көрсеткіштер, нысандар мен кластар, мұрагерлік, STL контейнерлері, шаблондар, файлдармен жұмыс және өз жобасы" },
      java: { code: "Java", total: 8, own: true, what: "«Java бағдарламалау»", topics: "нысандар мен кластар, интерфейстер, Collections, Stream API, ерекше жағдайлар, көп ағын және өз жобасы" },
    };
    const CC = COURSE_CERT[course];
    const CERT = course === "x"
      ? { src: "assets/data/lectures.js", list: () => window.CS50KZ_LECTURES || [], exam: true }
      : {
          src: `${course}/data/lectures.js`, total: CC.total, exam: true, code: CC.code,
          list: () => ((window.CS50KZ_COURSE_LECTURES || {})[course] || []).map((l) => ({ ...l, id: course + ":" + l.id })),
          intro: `Барлық ${CC.total} лекцияны оқып шыққан соң, атыңыз жазылған ${CC.code} сертификатын басып шығарыңыз не PDF ретінде сақтаңыз.`,
          text: CC.own
            ? `${CC.what} курсының барлық ${CC.total} лекциясын оқып шыққанын растайды: ${CC.topics}.`
            : `${CC.what} курсының қазақ тіліндегі нұсқасының барлық ${CC.total} лекциясын оқып шыққанын растайды: ${CC.topics}.`,
          note: CC.own ? "Бұл сертификат платформа ішіндегі оқу прогресін растайды." : note(CC.code),
        };
    document.querySelectorAll(".cert-switch a").forEach((a) => { const on = a.dataset.c === course; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); });
    if (course !== "x") {
      cert.dataset.course = course;
      const set = (sel, t) => { const e = document.querySelector(sel); if (e) e.textContent = t; };
      set(".cert-code", CERT.code); set(".cert-intro", CERT.intro); set(".cert-text", CERT.text); set(".cert-note", CERT.note);
      if (CC.own) { const sg = document.querySelector(".cert-sign + small"); if (sg) sg.textContent = "Курс авторы"; }
      document.title = CERT.code + " сертификаты - CS50 қазақша";
    }
    loadScript(CERT.src).then(() => {
      const lectures = CERT.list();
      const p = Progress.load();
      const left = lectures.filter((l) => !p.read[l.id]);
      const gate = document.querySelector(".cert-gate");
      const nameInput = document.querySelector(".cert-name-input");
      const nameOut = cert.querySelector(".cert-name");
      const date = cert.querySelector(".cert-date");
      const months = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
      const d = new Date();
      date.textContent = `${d.getFullYear()} ж. ${d.getDate()} ${months[d.getMonth()]}`;
      nameInput.value = p.name;
      const sync = () => {
        nameOut.textContent = nameInput.value.trim() || "Сіздің атыңыз";
        const q = Progress.load(); q.name = nameInput.value.trim(); Progress.save(q);
      };
      const examKey = course === "x" ? "cs50kz:exam" : "cs50kz:exam:" + course;
      const ex = readJson(examKey, {});
      const exOut = cert.querySelector(".cert-exam");
      if (exOut && CERT.exam && ex.best >= 70) {
        exOut.hidden = false;
        exOut.innerHTML = `Қорытынды емтихан нәтижесі: <b>${ex.best}%</b>${ex.best >= 90 ? " · <b>үздік</b>" : ""}`;
      }
      nameInput.addEventListener("input", sync);
      sync();
      const done = lectures.length - left.length;
      const steps = lectures.map((l) => `<a href="${ROOT_URL + l.url}" class="cg-step ${p.read[l.id] ? "on" : ""}" title="${escapeHtml(l.num + ": " + l.title)}">${p.read[l.id] ? "✓" : escapeHtml(l.id === "ai" ? "AI" : l.id.replace(/^(\w+:)?week-/, ""))}</a>`).join("");
      const exBest = readJson(examKey, {}).best;
      const exam = !CERT.exam ? "" : exBest >= 70 ? `<span class="cg-exam ok">🎓 Емтихан: ${exBest}%</span>` : `<a class="cg-exam" href="${ROOT_URL}exam.html${course === "x" ? "" : "?course=" + course}">📝 Емтихан ${exBest != null ? `(${exBest}%) - қайта тапсыру` : "- тапсыру"} →</a>`;
      if (left.length || lectures.length < (CERT.total || 0)) {
        cert.classList.add("locked");
        const all = Math.max(lectures.length, CERT.total || 0);
        const more = lectures.length < all ? ` Қалған ${all - lectures.length} лекция ${CC && CC.own ? "жазылып" : "аударылып"} жатыр.` : "";
        gate.innerHTML = `<div class="cg-head"><b>${done} / ${all} лекция оқылды</b>${exam}</div>
          <div class="cg-bar"><span style="width:${(done / all) * 100}%"></span></div>
          <div class="cg-steps">${steps}</div>
          <p>Сертификат ашылу үшін әр лекцияның соңындағы «Оқыдым ✓» батырмасын басыңыз.${left.length ? ` Келесісі: <a href="${ROOT_URL + left[0].url}">${escapeHtml(left[0].num + ": " + left[0].title)} →</a>` : ""}${more}</p>`;
      } else {
        gate.classList.add("open");
        gate.innerHTML = `<div class="cg-head"><b>Құттықтаймыз! 🎉 Барлық ${lectures.length} лекция оқылды</b>${exam}</div><div class="cg-bar"><span style="width:100%"></span></div><p>Атыңызды жазып, сертификатты басып шығарыңыз не PDF ретінде сақтаңыз.</p>`;
        document.querySelector(".cert-print").disabled = false;
      }
      document.querySelector(".cert-print").addEventListener("click", () => print());
      initVerifiedCert({ course, CC, cert, nameInput, learningOk: !(left.length || lectures.length < (CERT.total || 0)), months, note });
    });
  }

  // «Расталған білім сертификаты»: шарт-карточка (4 критерий) + алтын мөрлі сертификат
  function initVerifiedCert({ course, CC, cert, nameInput, learningOk, months, note }) {
    const $ = (sel) => document.querySelector(sel);
    const vc = $(".vcert"), crit = $(".cert-criteria"), reason = $(".cert-reason"), honest = $(".cert-honest"), btn = $(".cert-print"), gate = $(".cert-gate");
    if (!vc) return;
    const meta = COURSE_META.find((m) => m.id === course);
    const st = certStatus(course);
    const c = st.crit;
    const code = course === "x" ? "CS50x" : CC.code;
    const what = course === "x" ? "«Информатикаға кіріспе» (CS50x)" : CC.what;
    const examHref = `${ROOT_URL}exam.html${course === "x" ? "" : "?course=" + course}`;
    const lecHref = `${ROOT_URL}${meta.href}`;
    const rows = [
      { k: "lectures", t: "Лекциялар", num: `лекциялар: ${c.lectures.cur}/${c.lectures.goal}, керек: ${c.lectures.goal}`, frac: c.lectures.cur / (c.lectures.goal || 1), hint: `<a href="${lecHref}">Лекцияларға өту →</a>`, short: "лекциялар" },
      { k: "exam", t: "Қорытынды емтихан", num: `емтихан: ${c.exam.cur == null ? "тапсырылмаған" : c.exam.cur + "%"}, керек: ${c.exam.goal}%`, frac: (c.exam.cur || 0) / c.exam.goal, hint: `<a href="${examHref}">${c.exam.cur == null ? "Емтихан тапсыру" : "Қайта тапсыру"} →</a>`, short: "емтихан" },
      { k: "tasks", t: "Практикалық тапсырмалар", num: `тапсырма: ${c.tasks.cur}/${c.tasks.total}, керек: ${c.tasks.goal} (${Math.round(CERT_RULE.tasks * 100)}%)`, frac: c.tasks.cur / (c.tasks.goal || 1), hint: "Лекция соңындағы тапсырмалардың тексеру тізімін толық белгілеңіз.", short: "тапсырмалар" },
      { k: "quiz", t: "Лекция тесттері", num: `тест: орта ${c.quiz.cur}%, керек: ${c.quiz.goal}% (${c.quiz.taken}/${c.quiz.total} тест тапсырылған)`, frac: c.quiz.cur / c.quiz.goal, hint: "Әр лекцияның соңындағы тестті тапсырыңыз: тапсырылмаған тест 0% болып есептеледі.", short: "тест" },
    ];
    const missing = rows.filter((r) => !c[r.k].ok);
    const okN = rows.length - missing.length;
    crit.innerHTML = `<div class="cc-head"><h2>Расталған сертификат шарттары</h2><span class="cc-count ${st.verified ? "ok" : ""}">${okN} / 4 орындалды</span></div>
      <ul class="cc-list">${rows.map((r) => `<li class="cc-row ${c[r.k].ok ? "ok" : "todo"}" data-k="${r.k}">
        <div class="cc-top"><span class="cc-mark" aria-hidden="true">${c[r.k].ok ? "✓" : "○"}</span><b>${r.t}</b><span class="cc-state">${c[r.k].ok ? "орындалды ✓" : "қалды"}</span></div>
        <div class="cc-num">${escapeHtml(r.num)}</div>
        <div class="cc-bar" role="progressbar" aria-label="${r.t}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.round(r.frac * 100))}"><i style="width:${Math.min(100, Math.round(r.frac * 100))}%"></i></div>
        ${c[r.k].ok ? "" : `<p class="cc-hint">${r.hint}</p>`}</li>`).join("")}</ul>`;

    // Тек шарттар орындалғанда ғана жеке сертификат толтырылады (және берілген күн сақталады)
    let issued = null;
    if (st.verified) {
      const certs = readJson("cs50kz:certs", {});
      if (!certs[course] || !/^\d{4}-\d{2}-\d{2}$/.test(certs[course].d || "")) {
        certs[course] = { d: dayKey() };
        try { localStorage.setItem("cs50kz:certs", JSON.stringify(certs)); } catch (e) {}
      }
      issued = certs[course].d;
      const id = certId(profile().id, course, issued);
      const q = (c.quiz.cur), t = c.tasks.pct, e = c.exam.cur;
      const set = (sel, v) => { const el = vc.querySelector(sel); if (el) el.textContent = v; };
      const dd = new Date(issued + "T12:00:00");
      set(".vc-code", code);
      set(".vc-text", `${what} курсының барлық ${c.lectures.goal} лекциясын оқып, қорытынды емтиханнан, практикалық тапсырмалардан және лекция тесттерінен белгіленген межеден өткенін растайды.`);
      set(".vc-m-exam", e + "%"); set(".vc-m-tasks", `${t}% (${c.tasks.cur}/${c.tasks.total})`); set(".vc-m-quiz", q + "%");
      set(".vc-date", `${dd.getFullYear()} ж. ${dd.getDate()} ${months[dd.getMonth()]}`);
      set(".vc-id", id.slice(0, 5) + "-" + id.slice(5));
      vc.dataset.certId = id;
      const vcode = certVerifyCode(id, e, t, q);
      set(".vc-vcode", vcode.slice(0, 3) + "-" + vcode.slice(3));
      vc.dataset.verifyCode = vcode;
      set(".vc-note", CC && CC.own ? "Авторлық курс: Sagid Mustafa." : `Түпнұсқа курс: ${code}, Harvard University, David J. Malan (CC BY-NC-SA 4.0). Harvard University берген ресми сертификат емес.`);
      if (CC && CC.own) { const r = vc.querySelector(".vc-sign-role"); if (r) r.textContent = "Курс авторы"; }
    }
    vc.dataset.course = course;
    vc.classList.toggle("is-locked", !st.verified);
    const syncName = () => { const n = vc.querySelector(".vc-name"); if (n) n.textContent = nameInput.value.trim() || "Сіздің атыңыз"; };
    nameInput.addEventListener("input", syncName); syncName();

    // Оқу сертификаты бетінде расталған түрге сілтеме
    const hrefFor = (tier) => `certificate.html?${[course !== "x" ? "course=" + course : "", tier === "verified" ? "tier=verified" : ""].filter(Boolean).join("&")}`.replace(/\?$/, "");
    gate.insertAdjacentHTML("beforeend", `<p class="cg-verify">🏅 <a href="${hrefFor("verified")}" data-tier-link="verified">Расталған білім сертификаты</a>: ${okN} / 4 шарт орындалды${st.verified ? " ✓" : ""}</p>`);

    const learnOnly = [cert, gate, $(".cert-intro")], verOnly = [crit, honest];
    const apply = (tier) => {
      const v = tier === "verified";
      learnOnly.forEach((el) => el && (el.hidden = v));
      verOnly.forEach((el) => el && (el.hidden = !v));
      vc.hidden = !(v && st.verified); // шарт орындалмаса сертификат жасалмайды
      document.querySelectorAll(".cert-tier").forEach((a) => { const on = a.dataset.tier === (v ? "verified" : "learn"); a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); a.href = ROOT_URL + hrefFor(a.dataset.tier); });
      document.querySelectorAll(".cert-switch a").forEach((a) => { const cc = a.dataset.c; a.href = ROOT_URL + "certificate.html?" + [cc !== "x" ? "course=" + cc : "", v ? "tier=verified" : ""].filter(Boolean).join("&"); a.href = a.href.replace(/\?$/, ""); });
      const can = v ? st.verified : learningOk;
      btn.disabled = !can;
      btn.textContent = v ? "Басып шығару / PDF (расталған)" : "Басып шығару / PDF";
      reason.hidden = !(v && !st.verified);
      if (v && !st.verified) reason.textContent = `Расталған сертификат әзірге жүктелмейді: орындалмаған шарттар - ${missing.map((r) => r.short).join(", ")}. Жоғарыдағы карточкадан әрқайсысына қанша қалғанын көре аласыз.`;
      document.title = (v ? "Расталған сертификат - " : "") + (course === "x" ? "Сертификат - CS50 қазақша" : code + " сертификаты - CS50 қазақша");
    };
    document.querySelector(".cert-tiers").addEventListener("click", (ev) => {
      const a = ev.target.closest(".cert-tier");
      if (!a) return;
      ev.preventDefault();
      apply(a.dataset.tier);
      try { history.replaceState(null, "", hrefFor(a.dataset.tier)); } catch (e) {}
    });
    gate.addEventListener("click", (ev) => {
      const a = ev.target.closest("[data-tier-link]");
      if (!a) return;
      ev.preventDefault(); apply("verified");
      try { history.replaceState(null, "", hrefFor("verified")); } catch (e) {}
    });
    apply(new URLSearchParams(location.search).get("tier") === "verified" ? "verified" : "learn");
  }

  // ---------- Офлайн режим ----------
  function initServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register(ROOT_URL + "sw.js").catch(() => {});
    }
  }

  // ---------- SQL браузерде (sql.js - SQLite-тің WebAssembly нұсқасы) ----------
  let sqlReady = null;
  const dbs = {};
  function getSql() {
    if (!sqlReady) {
      const wasm = /^https?:/.test(location.protocol) && typeof WebAssembly === "object";
      sqlReady = loadScript("assets/vendor/sqljs/" + (wasm ? "sql-wasm.js" : "sql-asm.js"))
        .then(() => window.initSqlJs({ locateFile: (f) => ROOT_URL + "assets/vendor/sqljs/" + f }))
        .catch((e) => { sqlReady = null; throw e; });
    }
    return sqlReady;
  }

  async function getDb(name, fresh = false, src = null) {
    const SQL = await getSql();
    if (src) await loadScript(src);
    if (!window.CS50KZ_DB || !window.CS50KZ_DB.favorites) await loadScript("assets/data/db.js");
    if (!window.CS50KZ_DB[name]) throw new Error("дерекқор табылмады: " + name);
    if (fresh || !dbs[name]) {
      if (dbs[name]) dbs[name].close();
      dbs[name] = new SQL.Database();
      dbs[name].run(window.CS50KZ_DB[name]);
    }
    return dbs[name];
  }

  function sqlResultHtml(db, results) {
    if (!results.length) {
      const n = db.getRowsModified();
      return `<p class="sql-msg">✓ Сұрау орындалды${n ? `: ${n} жол өзгерді` : ""}.</p>`;
    }
    return results.map((r) => {
      const rows = r.values.slice(0, 200);
      return `<div class="sql-table"><table><thead><tr>${r.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>` +
        `<tbody>${rows.map((row) => `<tr>${row.map((v) => `<td>${v === null ? '<span class="null">NULL</span>' : escapeHtml(String(v))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` +
        `<p class="sql-msg">${r.values.length} жол${r.values.length > 200 ? " (алғашқы 200-і көрсетілді)" : ""}</p>`;
    }).join("");
  }

  function initSqlRunner() {
    document.querySelectorAll('pre[data-lang="sql"]').forEach((pre) => {
      const code = pre.querySelector("code").innerText;
      if (pre.hasAttribute("data-norun")) return;
      // data-db="атауы" (+ data-dbsrc="sql/data/db-week-1.js"): курстың өз демо дерекқоры; әр іске қосу жаңа дерекқорда
      const own = pre.dataset.db || null;
      if (!own && /CREATE TABLE|^\s*\.|\.\.\.|sqlite>/m.test(code)) return;
      const name = own || (/favorites/i.test(code) ? "favorites"
        : /\b(shows|people|stars|ratings|genres)\b/i.test(code) ? "shows" : null);
      if (!name) return;
      const btn = document.createElement("button");
      btn.className = "run-btn";
      btn.type = "button";
      btn.textContent = "▶ Іске қосу";
      pre.appendChild(btn);
      btn.addEventListener("click", async () => {
        let out = pre.nextElementSibling;
        if (!out || !out.classList.contains("sql-output")) {
          out = document.createElement("div");
          out.className = "sql-output";
          pre.after(out);
        }
        out.innerHTML = '<p class="sql-msg">SQLite жүктелуде...</p>';
        try {
          const db = await getDb(name, !!own, pre.dataset.dbsrc || null);
          mark("sql");
          out.innerHTML = sqlResultHtml(db, db.exec(code)) +
            `<p class="sql-db">Дерекқор: <code>${name}.db</code> (демо үлгі)${own ? "" : ` · <a href="${ROOT_URL}playground.html#sql">Сынақ алаңында ашу →</a>`}</p>`;
        } catch (e) {
          out.innerHTML = `<p class="sql-msg err">Қате: ${escapeHtml(String(e.message || e))}</p>`;
        }
      });
    });
  }

  // ---------- HTML/CSS/JS мысалдарын лекцияда көрсету (CS50 Web): қорғалған iframe ----------
  // <pre data-lang="html" data-preview> - беттің өзін көрсетеді; <pre data-lang="javascript" data-run> - console.log шығысын көрсетеді
  function initWebPreview() {
    const mk = (pre, label, build) => {
      const btn = document.createElement("button");
      btn.className = "run-btn";
      btn.type = "button";
      btn.textContent = label;
      pre.appendChild(btn);
      btn.addEventListener("click", () => build(pre.querySelector("code").innerText, btn));
    };
    document.querySelectorAll('pre[data-lang="html"][data-preview], pre[data-lang="css"][data-preview]').forEach((pre) => {
      mk(pre, "▶ Көрсету", (code) => {
        let box = pre.nextElementSibling;
        if (!box || !box.classList.contains("web-preview")) { box = document.createElement("div"); box.className = "web-preview"; pre.after(box); }
        const base = pre.dataset.lang === "css" ? `<div class="demo"><h1>Тақырып</h1><p>Абзац мәтіні, <a href="#">сілтеме</a> және <strong>қою</strong> сөз.</p><ul><li>Бірінші</li><li>Екінші</li></ul></div>` : "";
        const doc = pre.dataset.lang === "css" ? `<!doctype html><meta charset="utf-8"><style>${code}</style>${base}` : code;
        box.innerHTML = '<div class="wp-bar"><i></i><i></i><i></i><span>Нәтиже</span></div>';
        const f = document.createElement("iframe");
        f.setAttribute("sandbox", "allow-scripts");
        f.title = "Мысалдың нәтижесі";
        f.srcdoc = doc;
        box.appendChild(f);
        mark("web");
      });
    });
    document.querySelectorAll('pre[data-lang="javascript"][data-run]').forEach((pre) => {
      mk(pre, "▶ Іске қосу", (code) => {
        let out = pre.nextElementSibling;
        if (!out || !out.classList.contains("run-output")) { out = document.createElement("pre"); out.className = "run-output"; pre.after(out); }
        out.textContent = "";
        const f = document.createElement("iframe");
        f.setAttribute("sandbox", "allow-scripts");
        f.hidden = true;
        const tag = "cs50kz-" + Math.random().toString(36).slice(2);
        const onMsg = (e) => { if (e.source !== f.contentWindow || !e.data || e.data.tag !== tag) return; out.textContent += e.data.line + "\n"; };
        window.addEventListener("message", onMsg);
        setTimeout(() => { window.removeEventListener("message", onMsg); f.remove(); if (!out.textContent) out.textContent = "(шығыс жоқ)"; }, 2500);
        f.srcdoc = `<!doctype html><meta charset="utf-8"><body><script>const __s=(l)=>parent.postMessage({tag:${JSON.stringify(tag)},line:l},"*");
const __f=(a)=>a.map(x=>typeof x==="string"?x:(()=>{try{return JSON.stringify(x)}catch(e){return String(x)}})()).join(" ");
console.log=(...a)=>__s(__f(a));console.error=(...a)=>__s("Қате: "+__f(a));
addEventListener("error",e=>__s("Қате: "+e.message));
try{\n${code.replace(/<\/script/gi, "<\\/script")}\n}catch(e){__s("Қате: "+e.message)}<\/script>`;
        document.body.appendChild(f);
        mark("web");
      });
    });
  }

  // ---------- Сынақ алаңы ----------
  function initPlayground() {
    const pg = document.querySelector(".playground");
    if (!pg) return;
    const EXAMPLES = {
      python: {
        "Сәлем": 'name = input("What\'s your name? ")\nprint(f"hello, {name}")',
        "Марио": 'n = int(input("Height: "))\nfor i in range(1, n + 1):\n    print(" " * (n - i) + "#" * i)',
        "Тиындар": 'cents = int(input("Change owed: "))\ncoins = 0\nfor coin in [25, 10, 5, 1]:\n    coins += cents // coin\n    cents %= coin\nprint(coins)',
        "Фибоначчи": 'def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint([fib(i) for i in range(15)])',
        "Сөздік": 'phonebook = {"Carter": "+1-617-495-1000", "David": "+1-949-468-2750"}\nname = input("Name: ")\nif name in phonebook:\n    print(f"Number: {phonebook[name]}")\nelse:\n    print("Not found")',
      },
      sql: {
        "Тілдер": "SELECT language, COUNT(*) AS n\nFROM favorites\nGROUP BY language\nORDER BY n DESC;",
        "Ең танымал есеп": "SELECT problem, COUNT(*) AS n\nFROM favorites\nGROUP BY problem\nORDER BY n DESC\nLIMIT 5;",
        "The Office актерлері": "SELECT name FROM people WHERE id IN (\n    SELECT person_id FROM stars WHERE show_id = (\n        SELECT id FROM shows WHERE title = 'The Office' AND year = 2005\n    )\n);",
        "JOIN: рейтинг": "SELECT title, year, rating\nFROM shows\nJOIN ratings ON shows.id = ratings.show_id\nORDER BY rating DESC\nLIMIT 10;",
        "Комедиялар": "SELECT title FROM shows\nJOIN genres ON shows.id = genres.show_id\nWHERE genre = 'Comedy'\nORDER BY title;",
      },
    };
    const tabs = pg.querySelectorAll(".pg-tab");
    const editor = pg.querySelector(".pg-editor");
    const out = pg.querySelector(".pg-output");
    const chips = pg.querySelector(".pg-examples");
    const dbSelect = pg.querySelector(".pg-db");
    const schema = pg.querySelector(".pg-schema");
    let lang = location.hash === "#sql" ? "sql" : location.hash === "#web" ? "web" : "python";

    const store = (k, v) => { try { v === undefined ? (v = localStorage.getItem(k)) : localStorage.setItem(k, v); } catch (e) {} return v; };
    const setLang = (l) => {
      if (editor.value && lang !== "web") store("pg:" + lang, editor.value);
      lang = l;
      pg.dataset.lang = l;
      tabs.forEach((t) => { t.classList.toggle("active", t.dataset.lang === l); t.setAttribute("aria-pressed", String(t.dataset.lang === l)); });
      if (l === "web") { history.replaceState(null, "", "#web"); mark("web"); return; }
      editor.value = store("pg:" + l) || Object.values(EXAMPLES[l])[0];
      chips.innerHTML = Object.keys(EXAMPLES[l]).map((k) => `<button type="button">${escapeHtml(k)}</button>`).join("");
      out.innerHTML = `<p class="sql-msg">${l === "python" ? "Python кодын жазып, «Іске қосу» басыңыз (Ctrl+Enter)." : "SQL сұрауын жазып, «Іске қосу» басыңыз (Ctrl+Enter)."}</p>`;
      if (l === "sql") showSchema();
      history.replaceState(null, "", "#" + l);
    };

    async function showSchema() {
      schema.innerHTML = '<p class="sql-msg">Кестелер жүктелуде...</p>';
      try {
        const db = await getDb(dbSelect.value);
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")[0]?.values.map((r) => r[0]) || [];
        schema.innerHTML = tables.map((t) => {
          const cols = db.exec(`PRAGMA table_info(${t})`)[0].values.map((c) => `<span>${escapeHtml(c[1])} <small>${escapeHtml(c[2])}</small></span>`).join("");
          const n = db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0];
          return `<div class="pg-table"><b>${escapeHtml(t)}</b> <small>${n} жол</small><div>${cols}</div></div>`;
        }).join("");
      } catch (e) {
        schema.innerHTML = `<p class="sql-msg err">SQLite жүктелмеді.</p>`;
      }
    }

    async function run() {
      const code = editor.value;
      store("pg:" + lang, code);
      mark(lang);
      if (lang === "python") {
        out.innerHTML = `<pre class="run-output">${pyodideReady ? "Орындалып жатыр..." : "Python жүктелуде (бірінші рет ~10 секунд)..."}</pre>`;
        const box = out.firstChild;
        try {
          box.textContent = (await runPython(code)) || "(шығыс жоқ)";
        } catch (e) {
          box.classList.add("err");
          box.textContent = e instanceof Event || !pyodideReady
            ? "Python жүктелмеді. Интернет байланысын тексеріп, қайта көріңіз."
            : (e.partial || "") + pythonError(e);
          if (e instanceof Event) pyodideReady = null;
        }
      } else {
        out.innerHTML = '<p class="sql-msg">Орындалып жатыр...</p>';
        try {
          const db = await getDb(dbSelect.value);
          out.innerHTML = sqlResultHtml(db, db.exec(code));
          if (/\b(CREATE|DROP|ALTER)\b/i.test(code)) showSchema();
        } catch (e) {
          out.innerHTML = `<p class="sql-msg err">Қате: ${escapeHtml(String(e.message || e))}</p>`;
        }
      }
    }

    tabs.forEach((t) => t.addEventListener("click", () => setLang(t.dataset.lang)));
    chips.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      editor.value = EXAMPLES[lang][e.target.textContent];
      if (lang === "sql") dbSelect.value = /favorites/.test(editor.value) ? "favorites" : "shows", showSchema();
      run();
    });
    dbSelect.addEventListener("change", showSchema);
    pg.querySelector(".pg-run").addEventListener("click", run);
    pg.querySelector(".pg-reset").addEventListener("click", async () => {
      if (lang === "sql") { await getDb(dbSelect.value, true); showSchema(); toast("Дерекқор бастапқы күйіне келтірілді"); }
      else { editor.value = Object.values(EXAMPLES.python)[0]; store("pg:python", editor.value); }
    });
    editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
      else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const { selectionStart: a, selectionEnd: b } = editor;
        editor.setRangeText("    ", a, b, "end");
      }
    });
    setLang(lang);
  }

  // ---------- Жетістіктер ----------
  // Жадтан оқу: бүлінген JSON, null не басқа түрдегі мән (мысалы, тізім орнына жол) әдепкі мәнге ауысады
  function readJson(key, def) {
    let v;
    try { v = JSON.parse(localStorage.getItem(key)); } catch (e) { return def; }
    return v != null && (def == null || (Array.isArray(def) ? Array.isArray(v) : typeof def === "object" ? typeof v === "object" && !Array.isArray(v) : typeof v === typeof def)) ? v : def;
  }
  function mark(flag) {
    const used = readJson("cs50kz:used", {});
    if (used[flag]) return;
    used[flag] = Date.now();
    try { localStorage.setItem("cs50kz:used", JSON.stringify(used)); } catch (e) {}
    checkAchievements();
  }

  // ---------- «Расталған білім сертификаты»: курс бойынша өлшенетін шарттар ----------
  // Әр лекциядағы тапсырма (чек-тізім) саны (assets/data/lectures.js, <курс>/data/lectures.js-тағы "tasks"; тест тексереді)
  const CERT_TASKS = {
    x: [1, 5, 4, 4, 4, 2, 5, 3, 1, 2, 2, 1], // ORDER реті бойынша
    python: [5, 5, 5, 4, 6, 4, 4, 5, 3, 3], sql: [4, 3, 3, 2, 3, 1, 2], ai: [2, 2, 2, 1, 2, 3, 4],
    web: [1, 4, 4, 3, 1, 1, 1, 4, 3], cpp: [3, 3, 3, 3, 3, 3, 3, 4], java: [3, 4, 4, 5, 3, 3, 3, 4],
  };
  const CERT_RULE = { exam: 70, tasks: 0.6, quiz: 60 };
  const courseIds = (c) => (c === "x" ? ORDER : Array.from({ length: (COURSE_META.find((m) => m.id === c) || {}).total || 0 }, (_, i) => c + ":week-" + i));
  // Бір курстың күйі: 4 критерий (лекциялар, емтихан, тапсырмалар, лекция тесттері)
  function certStatus(course, p = Progress.load(), tm = taskMap()) {
    const meta = COURSE_META.find((m) => m.id === course);
    const ids = courseIds(course), per = CERT_TASKS[course] || [];
    const read = ids.filter((id) => p.read[id]).length;
    const ex = readJson(course === "x" ? "cs50kz:exam" : "cs50kz:exam:" + course, {}).best;
    const exam = typeof ex === "number" && Number.isFinite(ex) ? ex : null;
    const totalT = per.reduce((n, x) => n + x, 0);
    const doneT = ids.reduce((n, id, i) => n + Math.min(tm[id] || 0, per[i] || 0), 0);
    const needT = Math.ceil(totalT * CERT_RULE.tasks - 1e-9);
    let sum = 0, taken = 0;
    ids.forEach((id) => { const q = p.quiz[id]; if (q && +q.total > 0) { sum += Math.min(1, Math.max(0, +q.best / +q.total)); taken++; } });
    const quizAvg = ids.length ? (sum / ids.length) * 100 : 0;
    const crit = {
      lectures: { cur: read, goal: ids.length, ok: ids.length > 0 && read >= ids.length },
      exam: { cur: exam, goal: CERT_RULE.exam, ok: exam != null && exam >= CERT_RULE.exam },
      tasks: { cur: doneT, goal: needT, total: totalT, pct: totalT ? Math.floor((doneT / totalT) * 100) : 0, ok: totalT > 0 && doneT >= needT },
      quiz: { cur: Math.floor(quizAvg + 1e-9), goal: CERT_RULE.quiz, taken, total: ids.length, ok: ids.length > 0 && quizAvg >= CERT_RULE.quiz - 1e-9 },
    };
    return { course, meta, crit, learning: crit.lectures.ok, verified: Object.values(crit).every((x) => x.ok) };
  }
  const verifiedCourses = () => { const p = Progress.load(), tm = taskMap(); return COURSE_META.filter((c) => !c.nocert && certStatus(c.id, p, tm).verified).map((c) => c.id); };
  // Детерминді қысқа хэш (cyrb53) -> 31 таңбалы әліпби (ұқсас таңбасыз)
  function shortHash(str, len) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    let n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
    const ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    let out = "";
    for (let i = 0; i < len; i++) { out += ABC[n % ABC.length]; n = Math.floor(n / ABC.length); }
    return out;
  }
  const certId = (studentId, course, date) => shortHash(`${studentId}|${course}|${date}`, 10);
  const certVerifyCode = (id, e, t, q) => shortHash(`${id}|${e}|${t}|${q}`, 6);

  function achievementList() {
    const p = Progress.load();
    const read = Object.keys(p.read).filter((k) => ORDER.includes(k)).length; // CS50x лекциялары
    const readAll = Object.keys(p.read).filter((k) => p.read[k]).length;
    const readC = (id) => Object.keys(p.read).filter((k) => p.read[k] && k.startsWith(id + ":")).length;
    const perfect = Object.values(p.quiz).filter((q) => q.best === q.total).length;
    const daily = readJson("cs50kz:daily", {});
    const streak = Math.max(daily.best || 0, daily.streak || 0);
    const cards = Object.values(readJson("cs50kz:cards", {})).filter((b) => b >= 3).length;
    const mixed = readJson("cs50kz:mixed-best", 0);
    const used = readJson("cs50kz:used", {});
    const viz = Object.keys(used).filter((k) => k.startsWith("viz-")).length;
    let tasks = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith("check:")) { const a = readJson(k, []); if (a.length && a.every(Boolean)) tasks++; }
      }
    } catch (e) {}
    const A = (id, ico, name, desc, cur, goal) => ({ id, ico, name, desc, cur: Math.min(cur, goal), goal, done: cur >= goal });
    return [
      A("first-read", "📖", "Алғашқы қадам", "Бір лекцияны оқып шығу", readAll, 1),
      A("half", "🌗", "Жарты жол", "6 лекцияны оқу", readAll, 6),
      A("graduate", "🎓", "Курс бітті", "Барлық 12 лекцияны оқу", read, 12),
      A("perfect", "💯", "Мінсіз тест", "Бір лекция тестінен 100%", perfect, 1),
      A("scholar", "🧠", "Білгір", "5 лекция тестінен 100%", perfect, 5),
      A("streak-3", "🔥", "Үш күн қатарынан", "Күннің сұрағына 3 күн қатарынан жауап беру", streak, 3),
      A("streak-7", "🌋", "Бір апта", "7 күн қатарынан", streak, 7),
      A("cards", "🃏", "Сөз шебері", "50 терминді меңгеру", cards, 50),
      A("sniper", "🎯", "Мерген", "Аралас тестте 10/10", mixed, 10),
      A("task", "✅", "Тапсырма орындалды", "Бір тапсырманың барлық тексеруінен өту", tasks, 1),
      A("python", "🐍", "Питонист", "Python кодын іске қосу", used.python ? 1 : 0, 1),
      A("sql", "🗄", "Дерекқор шебері", "SQL сұрауын іске қосу", used.sql ? 1 : 0, 1),
      A("explorer", "📊", "Зерттеуші", "5 түрлі визуализацияны қолдану", viz, 5),
      A("debugger", "🐞", "Қате аңшысы", "«Қатені тап» тренажерінде 20 қатені табу", Object.keys(readJson("cs50kz:bugs", {})).length, 20),
      A("tracer", "🔎", "Компьютер-ми", "«Не шығарады?» тренажерінде 10 жаттығу", Object.keys(readJson("cs50kz:trace", {})).length, 10),
      A("weekly", "🏆", "Апта чемпионы", "Апталық челленджді орындау", readJson("cs50kz:weeks-won", 0), 1),
      A("check50", "✅", "check50 өтті", "Автотексерушіде бір тапсырманың барлық тестінен өту", Object.keys(readJson("cs50kz:graded", {})).length, 1),
      A("detective", "🕵️", "SQL детектив", "«Алтын домбыраның құпиясын» ашу", readJson("cs50kz:used", {}).detective ? 1 : 0, 1),
      A("exam", "📝", "Емтихан тапсырылды", "Қорытынды емтиханнан 70% жинау", (readJson("cs50kz:exam", {}).best || 0) >= 70 ? 1 : 0, 1),
      A("exam-top", "🏆", "Үздік түлек", "Қорытынды емтиханнан 90% жинау", (readJson("cs50kz:exam", {}).best || 0) >= 90 ? 1 : 0, 1),
      A("flask", "🧪", "Flask шебері", "Flask зертханасының 4 тапсырмасынан өту", Object.keys(readJson("cs50kz:flask", {})).length, 4),
      A("detective2", "🚀", "Байқоңыр детективі", "«Байқоңыр құпиясын» ашу", readJson("cs50kz:used", {}).detective2 ? 1 : 0, 1),
      A("nomad", "🐎", "Көшпенді", "Прогресті басқа құрылғыға көшіру кодын жасау", used.sync ? 1 : 0, 1),
      A("helper", "🤝", "Серіктес", "Сайтқа пікір не тапқан қатені жіберу", used.feedback ? 1 : 0, 1),
      A("webdev", "🌐", "Веб-әзірлеуші", "Homepage тексерушісінен барлық талаппен өту", readJson("cs50kz:graded", {}).homepage ? 1 : 0, 1),
      A("search", "🔍", "Іздеуші", "Сайт бойынша іздеуді қолдану", used.search ? 1 : 0, 1),
      A("owl", "🌙", "Түнгі үкі", "Түнгі режимді қосу", used.dark ? 1 : 0, 1),
      A("goal7", "🎯", "Мақсатшыл", "Күнделікті мақсатты 7 күн қатарынан орындау", goalStats().best, 7),
      A("course-python", "🐍", "CS50P түлегі", "CS50P курсының барлық 10 лекциясын оқу", readC("python"), 10),
      A("course-sql", "🗃", "CS50 SQL түлегі", "CS50 SQL курсының барлық 7 лекциясын оқу", readC("sql"), 7),
      A("course-ai", "🤖", "CS50 AI түлегі", "CS50 AI курсының барлық 7 лекциясын оқу", readC("ai"), 7),
      A("course-web", "🕸", "CS50 Web түлегі", "CS50 Web курсының барлық 9 лекциясын оқу", readC("web"), 9),
      A("course-cpp", "⚙️", "C++ түлегі", "C++ курсының барлық 8 лекциясын оқу", readC("cpp"), 8),
      A("course-java", "☕", "Java түлегі", "Java курсының барлық 8 лекциясын оқу", readC("java"), 8),
      A("course-math", "📐", "Математик", "Математика курсының барлық 154 сабағын оқу", readC("math"), 154),
      A("course-en", "🔤", "Ағылшын курсын аяқтады", "Ағылшын тілі курсының барлық 24 сабағын оқу", readC("en"), 24),
      A("builder", "🛠", "Жасаушы", "«Жобалар шеберханасында» бір жобаны аяқтау", Math.min(1, Object.keys((readJson("cs50kz:projects", {}).finished || {})).filter((k) => k !== "all").length), 1),
      A("capstone", "🏗", "Капстоун шебері", "«Жобалар шеберханасының» барлық 4 жобасын аяқтау", Object.keys((readJson("cs50kz:projects", {}).finished || {})).filter((k) => k !== "all").length, 4),
      A("verified", "🏅", "Расталған түлек", "Бірінші «Расталған білім сертификатын» алу (емтихан, тапсырмалар, тест)", verifiedCourses().length, 1),
      A("polyglot", "🌍", "Көпқырлы", "Кемінде 3 түрлі курстан лекция оқу", COURSE_META.filter((c) => (c.id === "x" ? read : readC(c.id)) > 0).length, 3),
    ];
  }

  function checkAchievements() {
    const list = achievementList();
    const seen = readJson("cs50kz:ach-seen", {});
    let changed = false;
    list.filter((a) => a.done && !seen[a.id]).forEach((a, i) => {
      seen[a.id] = Date.now(); changed = true;
      setTimeout(() => toast(`🏅 Жаңа жетістік: ${a.ico} ${a.name}`), 400 + i * 700);
    });
    if (changed) {
      try { localStorage.setItem("cs50kz:ach-seen", JSON.stringify(seen)); } catch (e) {}
      renderAchievements();
    }
  }

  function renderAchievements() {
    document.querySelectorAll(".achievements").forEach((box) => {
      const list = achievementList();
      const done = list.filter((a) => a.done).length;
      if (box.classList.contains("compact")) {
        // Басты бетте ықшам: алынғандар, сосын ең жақын 3 мақсат
        const got = list.filter((a) => a.done);
        const near = list.filter((a) => !a.done).sort((a, b) => b.cur / b.goal - a.cur / a.goal).slice(0, Math.max(3, 8 - got.length));
        box.innerHTML = `<div class="ach-head"><b>Жетістіктер</b><span>${done} / ${list.length}</span></div><div class="ach-row">` +
          got.concat(near).slice(0, 8).map((a) => `<div class="ach-chip ${a.done ? "done" : ""}" title="${escapeHtml(a.name + ": " + a.desc)}"><span>${a.ico}</span><small>${escapeHtml(a.name)}</small>${a.done ? "" : `<i style="width:${(a.cur / a.goal) * 100}%"></i>`}</div>`).join("") +
          `<a class="ach-all" href="${ROOT_URL}practice.html#achievements">Барлығы →</a></div>`;
        return;
      }
      box.innerHTML = `<div class="ach-head"><b>Жетістіктер</b><span>${done} / ${list.length}</span></div><div class="ach-grid">` +
        list.map((a) => `<div class="ach ${a.done ? "done" : ""}" title="${escapeHtml(a.desc)}">
          <span class="ach-ico">${a.ico}</span><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.desc)}</small>
          ${a.done ? "" : `<span class="ach-bar"><i style="width:${(a.cur / a.goal) * 100}%"></i></span>`}</div>`).join("") + "</div>";
    });
  }

  function initAchievements() {
    // Бұрын-соңды жиналғандары үшін хабарлама шығармаймыз: тек бүгінгі жаңалары
    if (localStorage.getItem("cs50kz:ach-seen") === null) {
      const seen = {};
      achievementList().filter((a) => a.done).forEach((a) => (seen[a.id] = Date.now()));
      try { localStorage.setItem("cs50kz:ach-seen", JSON.stringify(seen)); } catch (e) {}
    }
    renderAchievements();
  }

  // ---------- Оқу баптаулары панелі ----------
  function initPrefs() {
    const btn = document.querySelector(".prefs-open");
    if (!btn) return;
    let panel;
    const render = () => {
      const pr = loadPrefs();
      panel.innerHTML = `
        <div class="pp-row"><span>Қаріп өлшемі</span><div class="pp-ctl"><button type="button" data-a="fs-">A−</button><b>${pr.fs}</b><button type="button" data-a="fs+">A+</button></div></div>
        <div class="pp-row"><span>Жол аралығы</span><div class="seg"><button type="button" data-lh="1.6" class="${pr.lh == 1.6 ? "on" : ""}">Тығыз</button><button type="button" data-lh="1.7" class="${pr.lh == 1.7 ? "on" : ""}">Қалыпты</button><button type="button" data-lh="1.95" class="${pr.lh == 1.95 ? "on" : ""}">Кең</button></div></div>
        <div class="pp-row"><span>Мәтін ені</span><div class="seg"><button type="button" data-cw="680" class="${pr.cw == 680 ? "on" : ""}">Тар</button><button type="button" data-cw="760" class="${pr.cw == 760 ? "on" : ""}">Қалыпты</button><button type="button" data-cw="900" class="${pr.cw == 900 ? "on" : ""}">Кең</button></div></div>
        <div class="pp-row"><span>Түс</span><div class="seg">${(() => { const d = root.dataset.theme === "dark" || (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches); return `<button type="button" data-th="light" class="${d ? "" : "on"}">☀ Жарық</button><button type="button" data-th="dark" class="${d ? "on" : ""}">☾ Қараңғы</button>`; })()}</div></div>
        <label class="pp-row pp-check"><span>Анимацияны азайту</span><input type="checkbox" ${pr.rm ? "checked" : ""}></label>
        <button type="button" class="pp-reset">Әдепкі баптаулар</button>`;
    };
    const save = (pr) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(pr)); } catch (e) {} applyPrefs(pr); render(); };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!panel) {
        panel = document.createElement("div");
        panel.className = "prefs-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "Оқу баптаулары");
        document.body.appendChild(panel);
        panel.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const t = ev.target, pr = loadPrefs();
          if (t.dataset.a === "fs-") pr.fs = Math.max(14, pr.fs - 1);
          else if (t.dataset.a === "fs+") pr.fs = Math.min(23, pr.fs + 1);
          else if (t.dataset.lh) pr.lh = +t.dataset.lh;
          else if (t.dataset.cw) pr.cw = +t.dataset.cw;
          else if (t.dataset.th) {
            root.dataset.theme = t.dataset.th;
            if (t.dataset.th === "dark") mark("dark");
            try { localStorage.setItem("theme", t.dataset.th); } catch (e) {}
            const tg = document.querySelector(".theme-toggle");
            if (tg) tg.textContent = t.dataset.th === "dark" ? "☀" : "☾";
            render();
            return;
          }
          else if (t.classList.contains("pp-reset")) { save({ fs: 17, lh: 1.7, cw: 760, rm: false }); return; }
          else if (t.type === "checkbox") pr.rm = t.checked;
          else return;
          save(pr);
        });
        document.addEventListener("click", () => panel.classList.remove("open"));
        document.addEventListener("keydown", (ev) => ev.key === "Escape" && panel.classList.remove("open"));
      }
      render();
      panel.classList.toggle("open");
    });
  }

  // ---------- Прогресті мұғалімге жіберу ----------
  const ORDER = ["week-0", "week-1", "week-2", "week-3", "week-4", "week-5", "week-6", "week-7", "ai", "week-8", "week-9", "week-10"];
  function b64url(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64url(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); return decodeURIComponent(escape(atob(s + "===".slice((s.length + 3) % 4)))); }
  function summaryData(name) {
    const p = Progress.load();
    const daily = readJson("cs50kz:daily", {});
    // Басқа курстар: {sql: {r: "1100000", q: "5/8,,..."}}: тек қатысқан курстар (мұғалім кестесі курсты таңдап көреді)
    const cs = {};
    COURSE_META.filter((c) => c.id !== "x").forEach((c) => {
      const ids = Array.from({ length: c.total }, (_, i) => c.id + ":week-" + i);
      if (ids.some((id) => p.read[id] || p.quiz[id])) {
        cs[c.id] = { r: ids.map((id) => (p.read[id] ? 1 : 0)).join(""), q: ids.map((id) => (p.quiz[id] ? `${p.quiz[id].best}/${p.quiz[id].total}` : "")).join(",") };
      }
    });
    return {
      v: 1, n: name ?? p.name ?? "", i: profile().id,
      r: ORDER.map((id) => (p.read[id] ? 1 : 0)).join(""),
      q: ORDER.map((id) => (p.quiz[id] ? `${p.quiz[id].best}/${p.quiz[id].total}` : "")).join(","),
      t: ORDER.reduce((n, id) => n + Progress.tasksDone(id), 0),
      s: Math.max(daily.streak || 0, daily.best || 0),
      a: achievementList().filter((a) => a.done).length,
      e: readJson("cs50kz:exam", {}).best ?? null,
      d: new Date().toISOString().slice(0, 10),
      ...(Object.keys(cs).length ? { c: cs } : {}),
      // w: «Расталған білім сертификаты» алынған курстар (v - код нұсқасы, сондықтан басқа әріп)
      ...(verifiedCourses().length ? { w: verifiedCourses() } : {}),
    };
  }
  function progressCode(name) {
    return "KZ1." + b64url(JSON.stringify(summaryData(name)));
  }
  function parseCode(code) {
    const m = String(code).trim().match(/KZ1\.([A-Za-z0-9_-]+)/);
    if (!m) return null;
    try {
      const d = JSON.parse(unb64url(m[1]));
      if (!d || d.v !== 1 || typeof d.n !== "string") return null;
      // Код оқушыдан келеді: сандар мен жолдарды қатаң тексереміз
      const num = (x) => (Number.isFinite(+x) ? Math.max(0, Math.round(+x)) : 0);
      return {
        v: 1, n: d.n.slice(0, 60),
        i: /^KZ-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(d.i || "") ? d.i : null,
        r: /^[01]{0,12}$/.test(d.r) ? d.r.padEnd(12, "0") : "0".repeat(12),
        q: /^[\d/,]*$/.test(d.q || "") ? d.q : "",
        t: num(d.t), s: num(d.s), a: num(d.a),
        e: d.e == null || !Number.isFinite(+d.e) ? null : Math.min(100, num(d.e)),
        d: String(d.d || "").slice(0, 10),
        w: Array.isArray(d.w) ? COURSE_META.map((c) => c.id).filter((id) => d.w.includes(id)) : [],
      };
    } catch (e) { return null; }
  }

  function initShare() {
    document.addEventListener("click", async (e) => {
      if (!e.target.closest(".share-progress")) return;
      const p = Progress.load();
      const modal = document.createElement("div");
      modal.className = "search-modal open";
      modal.innerHTML = `<div class="search-box share-box" role="dialog" aria-modal="true" aria-label="Прогресті жіберу">
        <h3>Прогресті мұғалімге жіберу</h3>
        <p class="sql-msg">Мұғалім QR-кодты телефон камерасымен сканерлейді не кодты өзінің <a href="${ROOT_URL}teacher.html">мұғалім бетіне</a> қояды. Ешқандай тіркелу жоқ, деректер тек кодтың ішінде.</p>
        <input class="share-name" type="text" maxlength="40" placeholder="Аты-жөніңіз" value="${escapeHtml(p.name || "")}" aria-label="Аты-жөніңіз">
        <div class="share-qr"></div>
        <div class="share-code"><code></code><button type="button" class="btn gold share-copy">Көшіру</button></div>
        <button type="button" class="btn secondary share-close">Жабу</button>
      </div>`;
      document.body.appendChild(modal);
      const nameIn = modal.querySelector(".share-name");
      if (!window.qrcode) await loadScript("assets/vendor/qrcode/qrcode.js").catch(() => {});
      const update = () => {
        const name = nameIn.value.trim() || "Аты жоқ";
        const q = Progress.load(); q.name = nameIn.value.trim(); Progress.save(q);
        const code = progressCode(name);
        modal.querySelector(".share-code code").textContent = code;
        if (window.qrcode) {
          const qr = window.qrcode(0, "M");
          qr.addData(ROOT_URL + "teacher.html#add=" + code);
          qr.make();
          modal.querySelector(".share-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
        }
      };
      nameIn.addEventListener("input", update);
      update();
      modal.querySelector(".share-copy").addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(modal.querySelector(".share-code code").textContent); toast("Код көшірілді ✓"); } catch (err) { toast("Көшіру мүмкін болмады"); }
      });
      const close = () => modal.remove();
      modal.querySelector(".share-close").addEventListener("click", close);
      modal.addEventListener("click", (ev) => ev.target === modal && close());
    });
  }

  // ---------- Мұғалім беті ----------
  function initTeacher() {
    const box = document.querySelector(".teacher");
    if (!box) return;
    const KEY = "cs50kz:class";
    let cls = readJson(KEY, []);
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cls)); } catch (e) {} render(); };
    const add = (text) => {
      let added = 0, bad = 0;
      String(text).split(/\s+/).filter(Boolean).forEach((tok) => {
        const d = parseCode(tok);
        if (!d) { if (/KZ1\./.test(tok)) bad++; return; }
        // Бір оқушы - бір жол: алдымен ID бойынша, ID жоқ ескі кодтарда аты бойынша
        const i = cls.findIndex((x) => (d.i && x.i) ? x.i === d.i : x.n.toLowerCase() === d.n.toLowerCase());
        if (i >= 0) cls[i] = d; else cls.push(d);
        added++;
      });
      save();
      toast(added ? `${added} оқушы қосылды/жаңартылды` : bad ? "Код қате" : "Код табылмады");
    };
    const render = () => {
      const tbody = box.querySelector("tbody");
      box.querySelector(".t-count").textContent = `${cls.length} оқушы`;
      if (!cls.length) { tbody.innerHTML = `<tr><td colspan="8" class="t-empty">Әзірге оқушы жоқ. Оқушының кодын жоғарыға қойыңыз не QR-кодын сканерлеңіз.</td></tr>`; return; }
      const rows = cls.slice().sort((a, b) => b.r.split("1").length - a.r.split("1").length);
      tbody.innerHTML = rows.map((d) => {
        const read = (d.r.match(/1/g) || []).length;
        const qs = d.q.split(",").filter(Boolean).map((x) => x.split("/").map(Number));
        const qpct = qs.length ? Math.round((qs.reduce((n, x) => n + x[0], 0) / qs.reduce((n, x) => n + x[1], 0)) * 100) + "%" : "-";
        return `<tr><td><b>${escapeHtml(d.n)}</b>${d.i ? `<small class="t-id">${d.i}</small>` : ""}</td>
          <td><div class="t-cells">${d.r.split("").map((c, i) => `<i class="${c === "1" ? "on" : ""}" title="${ORDER[i]}"></i>`).join("")}</div><small>${read}/12</small></td>
          <td>${qpct}</td><td>${d.t}</td><td>🔥 ${d.s}</td><td>🏅 ${d.a}</td><td>${d.e != null ? `<b class="${d.e >= 70 ? "t-pass" : ""}">${d.e}%</b>` : "-"}${(d.w || []).length ? `<small class="t-verified" title="Расталған білім сертификаты">🏅 Расталған: ${d.w.map((id) => escapeHtml((COURSE_META.find((c) => c.id === id) || {}).name || id)).join(", ")}</small>` : ""}</td><td><small>${escapeHtml(d.d)}</small> <button type="button" class="t-del" data-n="${escapeHtml(d.n)}" data-i="${d.i || ""}" aria-label="Өшіру">✕</button></td></tr>`;
      }).join("");
    };
    box.querySelector(".t-add").addEventListener("click", () => { add(box.querySelector(".t-input").value); box.querySelector(".t-input").value = ""; });
    box.addEventListener("click", (e) => {
      if (e.target.classList.contains("t-del")) {
        const { n, i } = e.target.dataset;
        cls = cls.filter((x) => (i ? x.i !== i : x.n !== n)); save();
      }
    });
    box.querySelector(".t-csv").addEventListener("click", () => {
      const head = ["Аты", "ID", ...ORDER, "Тест", "Тапсырма", "Стрик", "Жетістік", "Емтихан", "Расталған", "Күні"];
      const lines = [head.join(",")].concat(cls.map((d) => [JSON.stringify(d.n), d.i || "", ...d.r.split(""), JSON.stringify(d.q), d.t, d.s, d.a, d.e ?? "", (d.w || []).join(" "), d.d].join(",")));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" }));
      a.download = "cs50kz-synyp.csv";
      a.click();
    });
    box.querySelector(".t-clear").addEventListener("click", () => { if (confirm("Бүкіл сынып тізімін өшіру керек пе?")) { cls = []; save(); } });
    const m = location.hash.match(/add=(KZ1\.[A-Za-z0-9_-]+)/);
    if (m) { add(m[1]); history.replaceState(null, "", location.pathname); }
    render();
  }

  // ---------- Бота ----------
  function greeting(read, total, name) {
    const h = new Date().getHours();
    const hi = h < 5 ? "Түн жарымы болды" : h < 12 ? "Қайырлы таң" : h < 18 ? "Қайырлы күн" : "Қайырлы кеш";
    const who = name ? ", " + escapeHtml(name.split(" ")[0]) : "";
    if (!read) return `${hi}${who}! Курсты бірге бастайық па?`;
    if (read === total) return `${hi}${who}! Сіз бүкіл курсты бітірдіңіз! 🎓`;
    if (read >= total / 2) return `${hi}${who}! Жартысынан астын өттіңіз, тоқтамаңыз!`;
    return `${hi}${who}! Жақсы бастадыңыз, жалғастырайық!`;
  }

  const BOTA_TIPS = [
    "Тапсырманы бастамас бұрын, оны қағазға псевдокод ретінде жазып көріңіз.",
    "Код жұмыс істемесе, резеңке үйрекке (не маған!) түсіндіріп көріңіз: қате көбіне сөйлеп тұрғанда табылады.",
    "Компилятордың бірінші қате хабарламасынан бастаңыз: қалғандары көбіне соның салдары.",
    "printf пен print - ең қарапайым әрі ең күшті дебаггер. Айнымалының мәнін басып шығарыңыз!",
    "Шешімді көшірмеңіз: 30 минут өзіңіз ойлансаңыз, ол 3 сағат оқығаннан пайдалы.",
    "Әр функция бір ғана іс істесін. Функция ұзын болса, оны бөліңіз.",
    "Шаршасаңыз, демалыңыз. Миыңыз мәселені ұйықтап жатқанда да шешеді.",
    "Айнымалыға түсінікті ат беріңіз: x емес, height немесе coins.",
    "check50-ге дейін өзіңіз тексеріңіз: шеткі жағдайларды (0, теріс сан, бос жол) ұмытпаңыз.",
    "Флэш-карточкалармен күніне 10 минут терминдерді қайталаңыз: аз-аздан, бірақ күнде.",
    "Қиналсаңыз, «Кеңес» бөлімін ашыңыз, шешімді тек соңында қараңыз.",
    "Код - адамдарға арналған мәтін, компьютер оны тек орындайды. Әдемі жазыңыз!",
  ];

  function botaSay(text, mood = "happy", opts) {
    // Математика беттерінде көмекші ӨЗІ шықпайды: тек «Көмекші» батырмасын басқанда (opts.manual)
    if (COURSE === "math" && !(opts && opts.manual)) return;
    const old = document.querySelector(".bota-pop");
    if (old) old.remove();
    const b = document.createElement("div");
    b.className = "bota-pop" + (opts && opts.manual ? " math-help-pop" : "");
    if (opts && opts.manual) b.setAttribute("role", "status");
    b.innerHTML = `<img src="${ROOT_URL}assets/img/bota-${mood}.svg" alt="Бота" width="72" height="72"><p>${escapeHtml(text)}</p><button type="button" aria-label="Жабу">✕</button>`;
    document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add("show"));
    const close = () => { b.classList.remove("show"); setTimeout(() => b.remove(), 300); };
    b.querySelector("button").addEventListener("click", close);
    setTimeout(close, opts && opts.manual ? 20000 : 6500);
  }

  // ---------- Математика: «Көмекші» батырмасы (көмекші өзі шықпайды, тек басқанда) ----------
  const MATH_HELP = {
    lesson: ["Осы сабақта: «{h}». Алдымен интуицияны оқыңыз, қорытып шығаруды жауып қойып өзіңіз қайталап көріңіз.",
      "Есептерде алдымен өзіңіз шешіп көріңіз. Қиын болса, «Кеңес» және «Келесі қадам» батырмаларын біртіндеп ашыңыз.",
      "Формуланы жаттамаңыз: оның шартын және қайдан шыққанын түсініңіз. Жиі қателер бөлімін міндетті оқыңыз.",
      "Қажет ұғым ұмыт болса, «Қысқаша еске салу» бөліміне оралыңыз: ол сабақтың өзінде жазылған."],
    index: ["Пәнді таңдаңыз: пәндер бір-біріне байланбайды, кез келгенін ашып оқи беруге болады.",
      "Жоғарыдағы мазмұннан пәнге тез өтуге болады. Әр пәнде сабақтарды 1, 2, 3 ретімен оқыған ыңғайлы."],
    formulas: ["Пәнді таңдап немесе іздеу жолына сөз жазып, керек формуланы табыңыз. Әр формуланың шарты мен сабағына сілтеме бар."],
    glossary: ["Терминді іздеңіз: қазақша да, ағылшынша да жұмыс істейді. Анықтаманың жанында қай сабақта түсіндірілгені көрсетілген."],
    practice: ["Пәнді және қиындықты таңдап, «Серияны бастау» батырмасын басыңыз. Әр сайын сандар өзгереді.", "Қате болса, жауабын көрмей тұрып қайта ойланыңыз: кеңес пен қадамдық шешім өз қалауыңызбен ашылады."],
  };
  function initMathHelper() {
    if (COURSE !== "math" || document.querySelector(".math-help-btn")) return;
    const kind = PAGE ? "lesson" : (location.pathname.match(/\/(formulas|glossary|practice)\.html$/) || [])[1] || "index";
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "math-help-btn";
    btn.setAttribute("aria-label", "Көмекші");
    btn.innerHTML = '<span aria-hidden="true">💡</span><b>Көмекші</b>';
    let n = 0;
    btn.addEventListener("click", () => {
      const open = document.querySelector(".math-help-pop");
      const list = MATH_HELP[kind];
      if (open && n >= list.length) { open.remove(); n = 0; return; }
      const h1 = (document.querySelector("h1") || {}).textContent || "";
      botaSay(list[n % list.length].replace("{h}", h1.trim()), "think", { manual: true });
      n++;
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const o = document.querySelector(".math-help-pop"); if (o) o.remove(); } });
    document.body.appendChild(btn);
  }

  // ---------- Апталық челлендж: санағыштар ----------
  function weekId(d = new Date()) {
    // ISO апта нөмірі
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + "-W" + Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }
  // Белсенділік күнтізбесі: күн сайын неше әрекет жасалды (лекция, тест, тапсырма, жаттықтырушы…)
  function dayKey(d = new Date()) { return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
  function logDay(n = 1) {
    const days = readJson("cs50kz:days", {});
    const t = dayKey();
    const before = days[t] || 0;
    days[t] = before + n;
    const keys = Object.keys(days).sort();
    while (keys.length > 400) delete days[keys.shift()];
    try { localStorage.setItem("cs50kz:days", JSON.stringify(days)); } catch (e) {}
    const goal = goalOf();
    if (before < goal && days[t] >= goal) {
      // Бота басқа нәрсе айтып тұрса (мысалы, тапсырма сөзі), соны жаппай күтеміз
      const say = (tries = 0) => {
        if (document.querySelector(".bota-pop") && tries < 6) return setTimeout(() => say(tries + 1), 2500);
        celebrate();
        const g = goalStats();
        botaSay(`🎯 Бүгінгі мақсат орындалды! ${g.streak > 1 ? g.streak + " күн қатарынан - " : ""}Ертең де келіңіз, жалғастырамыз.`, "wow");
        checkAchievements();
      };
      setTimeout(say, 900);
    }
    document.dispatchEvent(new CustomEvent("cs50kz:day"));
  }
  // Күнделікті мақсат: күніне неше әрекет (әдепкі 3)
  // (функция - const болса, бет ерте жүктелгенде TDZ қатесі шығуы мүмкін)
  function goalChoices() { return [1, 3, 5, 10]; }
  function goalOf() { const g = +readJson("cs50kz:goal", 3); return goalChoices().includes(g) ? g : 3; }
  function goalStats() {
    const days = readJson("cs50kz:days", {}), goal = goalOf();
    const ok = (k) => (+days[k] || 0) >= goal;
    const d = new Date();
    const today = +days[dayKey(d)] || 0;
    let streak = 0;
    if (!ok(dayKey(d))) d.setDate(d.getDate() - 1);
    while (ok(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    let best = 0, run = 0, prev = null;
    Object.keys(days).sort().forEach((k) => {
      const t = new Date(k + "T12:00:00");
      run = ok(k) ? (prev && Math.round((t - prev) / 86_400_000) === 1 && run ? run + 1 : 1) : 0;
      best = Math.max(best, run); prev = t;
    });
    return { goal, today, streak, best: Math.max(best, streak) };
  }
  function weekBump(key, n = 1) {
    logDay(n);
    const w = readJson("cs50kz:week", {});
    const id = weekId();
    const cur = w.id === id ? w : { id, read: 0, cards: 0, trainer: 0, daily: 0, done: false };
    cur[key] = (cur[key] || 0) + n;
    try { localStorage.setItem("cs50kz:week", JSON.stringify(cur)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("cs50kz:week"));
  }
  window.CS50KZ_weekId = weekId;
})();
