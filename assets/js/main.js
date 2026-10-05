// CS50 қазақша — интерактив элементтер

(function () {
  // Сайттың түбір мекенжайы (main.js-тің орнынан анықталады: file:// пен GitHub Pages-те де жұмыс істейді)
  const ROOT_URL = new URL("../../", document.currentScript.src).href;
  const PAGE = (location.pathname.match(/lectures\/([\w-]+)\.html$/) || [])[1] || null;

  // Түнгі / күндізгі режим
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", () => {
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
    initPythonRunner();
    initSqlRunner();
    initPlayground();
    initGlossary();
    initCertificate();
    initServiceWorker();
    window.CS50KZ = { ROOT_URL, loadScript, escapeHtml, celebrate, toast, mark, check: checkAchievements };
    if (document.querySelector(".viz, .flashcards, .daily-card, .mixed-quiz")) loadScript("assets/js/labs.js");
    initAchievements();
  });

  // Код блоктарына «Көшіру» батырмасы
  function addCopyButtons() {
    document.querySelectorAll("pre").forEach((pre) => {
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
      tocTitle.setAttribute("role", "button");
      tocTitle.tabIndex = 0;
      const flip = () => tocBox.classList.toggle("open");
      tocTitle.addEventListener("click", flip);
      tocTitle.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
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
          if (correct === questions.length) celebrate();
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
      let state = [];
      try { state = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
      boxes.forEach((b, i) => (b.checked = !!state[i]));

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
      boxes.forEach((b) => b.addEventListener("change", update));
      update();
    });
  }

  // ---------- Көмекші функциялар ----------
  function loadScript(rel) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = /^https?:/.test(rel) ? rel : ROOT_URL + rel;
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // Оқушының прогресі браузерде сақталады (тіркелусіз)
  const Progress = {
    key: "cs50kz:progress",
    load() {
      let p = {};
      try { p = JSON.parse(localStorage.getItem(this.key) || "{}"); } catch (e) {}
      return { read: p.read || {}, quiz: p.quiz || {}, last: p.last || null, name: p.name || "" };
    },
    save(p) {
      try { localStorage.setItem(this.key, JSON.stringify(p)); } catch (e) {}
    },
    tasksDone(id) {
      let done = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k.startsWith("check:") || !k.includes("/" + id + ".html:")) continue;
          const arr = JSON.parse(localStorage.getItem(k) || "[]");
          if (arr.length && arr.every(Boolean)) done++;
        }
      } catch (e) {}
      return done;
    },
  };

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
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    document.body.appendChild(t);
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
          <ul class="search-results"></ul>
          <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> таңдау</span><span><kbd>Enter</kbd> ашу</span></div>
        </div>`;
      document.body.appendChild(modal);
      input = modal.querySelector("input");
      list = modal.querySelector(".search-results");
      modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
      input.addEventListener("input", run);
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

    function run() {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { items = []; list.innerHTML = '<li class="search-hint">Іздеу үшін кемінде 2 әріп жазыңыз</li>'; return; }
      loaded.then(() => {
        const words = q.split(/\s+/);
        const scored = [];
        for (const s of window.CS50KZ_INDEX || []) {
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
    meta.innerHTML = `<span>⏱ ≈ ${Math.max(5, Math.round(words / 160))} мин оқу</span>` +
      `<span>📝 ${article.querySelectorAll(".question").length} сұрақ</span>` +
      `<span>🧩 ${article.querySelectorAll(".task").length} тапсырма</span>` +
      (p.read[PAGE] ? '<span class="done">✓ Оқылды</span>' : "");
    head.querySelector(".source-link").before(meta);

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
        const q = Progress.load();
        q.last = { id: PAGE, title: document.querySelector("h1").textContent, num: head.querySelector(".num").textContent, y: Math.round(ratio * 100) };
        Progress.save(q);
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
        else { q.read[PAGE] = Date.now(); celebrate(); toast("Лекция оқылды деп белгіленді 🎉"); }
        Progress.save(q);
        checkAchievements();
        render();
      });
    };
    render();
    if (pager) pager.before(done);

    // ← → пернелерімен лекциялар арасында жүру
    document.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      const links = pager ? pager.querySelectorAll("a") : [];
      if (e.key === "ArrowLeft" && links[0]) location.href = links[0].href;
      if (e.key === "ArrowRight" && links[1]) location.href = links[1].href;
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
          <h3>${read ? "Жарайсыз, жалғастырыңыз!" : "Курсты бастауға дайынсыз ба?"}</h3>
          <div class="dash-stats">
            <div><b>${read}<small>/${lectures.length}</small></b><span>лекция оқылды</span></div>
            <div><b>${qTotal ? Math.round((qBest / qTotal) * 100) + "%" : "—"}</b><span>тест нәтижесі</span></div>
            <div><b>${tasks}<small>/${totalTasks}</small></b><span>тапсырма тексерілді</span></div>
            <div><b>${Math.round(minutes / 60 * 10) / 10}</b><span>сағат оқу қалды</span></div>
          </div>
          <div class="dash-actions">
            ${cont ? `<a class="btn gold" href="${ROOT_URL + cont.url}">${read || last ? "Жалғастыру" : "Бастау"}: ${escapeHtml(cont.num)} →</a>` : `<a class="btn gold" href="${ROOT_URL}certificate.html">Сертификатты алу 🎓</a>`}
            <a class="btn ghost-dark" href="${ROOT_URL}certificate.html">Сертификат</a>
          </div>
        </div>`;

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
        }
      });
    });
  }

  // ---------- Python кодын браузерде іске қосу (Pyodide) ----------
  let pyodideReady = null;
  function initPythonRunner() {
    const blocks = [...document.querySelectorAll('pre[data-lang="python"]')].filter((pre) => {
      const code = pre.textContent;
      return !/flask|openai|from cs50 import SQL|sys\.argv|import csv|open\(|import requests|qrcode|cowsay|pyttsx3|face_recognition|PIL|speech_recognition|^\s*\.\.\./m.test(code);
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
        await loadScript("https://cdn.jsdelivr.net/npm/pyodide@0.26.4/full/pyodide.js");
        const py = await window.loadPyodide();
        // input() мен cs50 кітапханасын браузерге бейімдеу
        py.runPython(`
import builtins, sys, types
from js import prompt
def _input(p=""):
    v = prompt(str(p))
    if v is None:
        raise EOFError("енгізу тоқтатылды")
    print(str(p) + v)
    return v
builtins.input = _input
cs50 = types.ModuleType("cs50")
def get_string(p=""): return _input(p)
def get_int(p=""):
    while True:
        try: return int(_input(p))
        except ValueError: pass
def get_float(p=""):
    while True:
        try: return float(_input(p))
        except ValueError: pass
cs50.get_string, cs50.get_int, cs50.get_float = get_string, get_int, get_float
sys.modules["cs50"] = cs50
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
    const run = () => {
      const q = box.value.trim().toLowerCase();
      let n = 0;
      rows.forEach((r) => { const ok = !q || r.dataset.q.includes(q); r.hidden = !ok; if (ok) n++; });
      letters.forEach((h) => {
        let el = h.nextElementSibling, any = false;
        while (el && el.classList.contains("g-row")) { if (!el.hidden) any = true; el = el.nextElementSibling; }
        h.hidden = !any;
      });
      count.textContent = `${n} термин`;
    };
    box.addEventListener("input", run);
    run();
  }

  // ---------- Сертификат ----------
  function initCertificate() {
    const cert = document.querySelector(".certificate");
    if (!cert) return;
    loadScript("assets/data/lectures.js").then(() => {
      const lectures = window.CS50KZ_LECTURES || [];
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
      nameInput.addEventListener("input", sync);
      sync();
      if (left.length) {
        cert.classList.add("locked");
        gate.innerHTML = `<strong>Сертификат ашылу үшін тағы ${left.length} лекцияны оқу керек:</strong> ` +
          left.map((l) => `<a href="${ROOT_URL + l.url}">${escapeHtml(l.num)}</a>`).join(", ") +
          `. Әр лекцияның соңындағы «Оқыдым ✓» батырмасын басыңыз.`;
      } else {
        gate.innerHTML = "<strong>Құттықтаймыз! 🎉</strong> Барлық лекцияны оқыдыңыз. Атыңызды жазып, сертификатты басып шығарыңыз не PDF ретінде сақтаңыз.";
        document.querySelector(".cert-print").disabled = false;
      }
      document.querySelector(".cert-print").addEventListener("click", () => print());
    });
  }

  // ---------- Офлайн режим ----------
  function initServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register(ROOT_URL + "sw.js").catch(() => {});
    }
  }

  // ---------- SQL браузерде (sql.js — SQLite-тің WebAssembly нұсқасы) ----------
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

  async function getDb(name, fresh = false) {
    const SQL = await getSql();
    if (!window.CS50KZ_DB) await loadScript("assets/data/db.js");
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
      if (/CREATE TABLE|^\s*\.|\.\.\.|sqlite>/m.test(code)) return;
      const name = /favorites/i.test(code) ? "favorites"
        : /\b(shows|people|stars|ratings|genres)\b/i.test(code) ? "shows" : null;
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
          const db = await getDb(name);
          mark("sql");
          out.innerHTML = sqlResultHtml(db, db.exec(code)) +
            `<p class="sql-db">Дерекқор: <code>${name}.db</code> (демо үлгі) · <a href="${ROOT_URL}playground.html#sql">Сынақ алаңында ашу →</a></p>`;
        } catch (e) {
          out.innerHTML = `<p class="sql-msg err">Қате: ${escapeHtml(String(e.message || e))}</p>`;
        }
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
    let lang = location.hash === "#sql" ? "sql" : "python";

    const store = (k, v) => { try { v === undefined ? (v = localStorage.getItem(k)) : localStorage.setItem(k, v); } catch (e) {} return v; };
    const setLang = (l) => {
      if (editor.value) store("pg:" + lang, editor.value);
      lang = l;
      pg.dataset.lang = l;
      tabs.forEach((t) => t.classList.toggle("active", t.dataset.lang === l));
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
  function readJson(key, def) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch (e) { return def; }
  }
  function mark(flag) {
    const used = readJson("cs50kz:used", {});
    if (used[flag]) return;
    used[flag] = Date.now();
    try { localStorage.setItem("cs50kz:used", JSON.stringify(used)); } catch (e) {}
    checkAchievements();
  }

  function achievementList() {
    const p = Progress.load();
    const read = Object.keys(p.read).length;
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
        if (k.startsWith("check:")) { const a = JSON.parse(localStorage.getItem(k) || "[]"); if (a.length && a.every(Boolean)) tasks++; }
      }
    } catch (e) {}
    const A = (id, ico, name, desc, cur, goal) => ({ id, ico, name, desc, cur: Math.min(cur, goal), goal, done: cur >= goal });
    return [
      A("first-read", "📖", "Алғашқы қадам", "Бір лекцияны оқып шығу", read, 1),
      A("half", "🌗", "Жарты жол", "6 лекцияны оқу", read, 6),
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
      A("search", "🔍", "Іздеуші", "Сайт бойынша іздеуді қолдану", used.search ? 1 : 0, 1),
      A("owl", "🌙", "Түнгі үкі", "Түнгі режимді қосу", used.dark ? 1 : 0, 1),
    ];
  }

  function checkAchievements() {
    const list = achievementList();
    const seen = readJson("cs50kz:ach-seen", {});
    let changed = false;
    list.filter((a) => a.done && !seen[a.id]).forEach((a, i) => {
      seen[a.id] = Date.now(); changed = true;
      setTimeout(() => toast(`🏅 Жаңа жетістік: ${a.ico} ${a.name}`), 400 + i * 2800);
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
})();
