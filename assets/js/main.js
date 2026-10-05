// CS50 қазақша — интерактив элементтер

(function () {
  // Түнгі / күндізгі режим
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      const isDark = () =>
        root.dataset.theme === "dark" ||
        (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
      const render = () => (toggle.textContent = isDark() ? "☀" : "☾");
      render();
      toggle.addEventListener("click", () => {
        root.dataset.theme = isDark() ? "light" : "dark";
        try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
        render();
      });
    }

    addCopyButtons();
    buildToc();
    initQuizzes();
    initAnswerChecks();
    initChecklists();
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
      };
      boxes.forEach((b) => b.addEventListener("change", update));
      update();
    });
  }
})();
