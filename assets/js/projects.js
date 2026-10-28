/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
// AO17 - Жобалар шеберханасы (projects.html): прогресс, «Жоба аяқталды» белгісі және браузердегі зертханалар.
// Прогресс localStorage-та: cs50kz:projects = { done: { "p1-s1": уақыт }, finished: { p1: уақыт, all: уақыт } }.
// Автотексерушілер (labs.js) өз нәтижесін cs50kz:graded кілтіне жазады: біз оны да оқимыз, сондықтан прогресс жоғалмайды.

(function () {
  const KEY = "cs50kz:projects";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const read = (key, def) => {
    try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === "object" ? v : def; } catch (e) { return def; }
  };
  const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} };

  let K = null;
  let state = { done: {}, finished: {} };
  const projects = () => $$(".pj");
  const stepsOf = (pj) => $$(".pj-step", pj);

  function load() {
    const s = read(KEY, {});
    state = { done: s.done && typeof s.done === "object" ? s.done : {}, finished: s.finished && typeof s.finished === "object" ? s.finished : {} };
    const graded = read("cs50kz:graded", {});
    $$(".pj-step").forEach((st) => {
      const k = st.dataset.check;
      if (k && graded[k] && !state.done[st.dataset.step]) state.done[st.dataset.step] = graded[k];
    });
  }
  const save = () => write(KEY, state);

  // ---------- Прогресс көрінісі ----------
  function paint(opts = {}) {
    let total = 0, done = 0, nextStep = null;
    projects().forEach((pj) => {
      const id = pj.dataset.project, steps = stepsOf(pj);
      const n = steps.length;
      const d = steps.filter((st) => state.done[st.dataset.step]).length;
      total += n; done += d;
      steps.forEach((st) => {
        const ok = !!state.done[st.dataset.step];
        st.classList.toggle("done", ok);
        const dot = $(".pj-dot", st), sr = $(".pj-sr", st);
        if (dot) dot.textContent = ok ? "✓" : st.dataset.n;
        if (sr) sr.textContent = ok ? " (орындалды)" : "";
        if (!ok && !nextStep) nextStep = st;
      });
      const full = d === n;
      const pct = Math.round((100 * d) / n);
      $$(`[data-ring="${id}"]`).forEach((r) => {
        r.style.setProperty("--p", pct);
        r.classList.toggle("full", full);
        const b = $("b", r); if (b) b.textContent = full ? "✓" : `${d}/${n}`;
      });
      $$(`[data-bar="${id}"]`).forEach((b) => b.style.setProperty("--p", pct + "%"));
      $$(`[data-card="${id}"]`).forEach((c) => {
        c.classList.toggle("ready", full);
        c.classList.toggle("wip", !full && d > 0);
        const go = $(".cx-go", c), stt = $(".cx-state", c), cnt = $(".pj-count", c);
        if (go) go.textContent = full ? "Қайта ашу →" : d ? "Жалғастыру →" : "Бастау →";
        if (stt) stt.textContent = full ? "Аяқталды ✓" : d ? "Жолда" : "Жаңа";
        if (cnt) cnt.textContent = `${d} / ${n} қадам`;
      });
      $$(`[data-road="${id}"]`).forEach((r) => {
        r.style.setProperty("--p", pct);
        r.classList.toggle("full", full);
        const dot = $(".road-dot b", r); if (dot) dot.textContent = full ? "✓" : r.dataset.n;
      });
      const banner = $(".pj-done", pj);
      if (banner) banner.hidden = !full;
      // жоба аяқталды: бір рет мерекелейміз
      if (full && !state.finished[id]) {
        state.finished[id] = Date.now();
        if (opts.celebrate && K) { K.celebrate && K.celebrate(); K.toast && K.toast(`${pj.dataset.title}: жоба аяқталды! 🎉`); K.mark && K.mark("projects"); }
      }
      if (!full && state.finished[id]) delete state.finished[id];
    });
    const allDone = total > 0 && done === total;
    const finale = $(".pj-finale");
    if (finale) finale.hidden = !allDone;
    if (allDone && !state.finished.all) {
      state.finished.all = Date.now();
      if (opts.celebrate && K) setTimeout(() => K.toast && K.toast("Капстоун толық аяқталды! Сіз Python → Web → AI жолын өттіңіз 🏆"), 600);
    }
    if (!allDone && state.finished.all) delete state.finished.all;
    const pct = total ? Math.round((100 * done) / total) : 0;
    $$("[data-total-ring]").forEach((r) => { r.style.setProperty("--p", pct); r.classList.toggle("full", allDone); const b = $("b", r); if (b) b.textContent = pct + "%"; });
    $$("[data-total-text]").forEach((t) => (t.textContent = `${done} / ${total}`));
    const resume = $("[data-resume]");
    if (resume) {
      if (allDone) { resume.textContent = "Жобаларды қайта қарау"; resume.setAttribute("href", "#projects"); }
      else if (nextStep) {
        const pj = nextStep.closest(".pj");
        resume.textContent = done ? `Жалғастыру: ${pj.dataset.short}, ${nextStep.dataset.n}-қадам` : "Бірінші жобадан бастау";
        resume.setAttribute("href", "#" + nextStep.id);
      }
    }
    save();
  }

  function markDone(step, celebrate) {
    if (state.done[step.dataset.step]) return;
    state.done[step.dataset.step] = Date.now();
    paint({ celebrate });
  }

  // ---------- Қадамдарды бақылау ----------
  function watchSteps() {
    $$(".pj-step").forEach((st) => {
      if (st.dataset.check) {
        // автотексеруші нәтижесі: «N / N тест өтті»
        const scan = () => {
          const sc = $(".ag-score", st);
          const m = sc && sc.textContent.match(/(\d+)\s*\/\s*(\d+)\s*тест өтті/);
          if (m && m[1] === m[2] && +m[1] > 0) markDone(st, true);
        };
        new MutationObserver(scan).observe(st, { subtree: true, childList: true, characterData: true });
      }
      const list = $(".checklist[data-id]", st);
      if (list) {
        const boxes = $$("input[type=checkbox]", list);
        const check = (fromUser) => {
          const all = boxes.length && boxes.every((b) => b.checked);
          if (all) markDone(st, fromUser);
          else if (state.done[st.dataset.step] && st.dataset.kind === "checklist") { delete state.done[st.dataset.step]; paint(); }
        };
        boxes.forEach((b) => b.addEventListener("change", () => check(true)));
        check(false);
      }
    });
  }

  // ---------- Зертханалар (.pj-lab) ----------
  // data-mode: py-text (print шығысы), py-html (print шығысы - HTML бет, iframe-де), page (HTML/JS беті, iframe-де)
  function initLabs() {
    $$(".pj-lab").forEach((lab, idx) => {
      const ta = $("textarea", lab);
      const orig = ta.value;
      const id = lab.dataset.id || "lab" + idx;
      const store = "cs50kz:pj-lab:" + id;
      try { const s = localStorage.getItem(store); if (s != null) ta.value = s; } catch (e) {}
      const mode = lab.dataset.mode;
      lab.insertAdjacentHTML("afterbegin", `<div class="pj-lab-bar"><span class="pj-lab-file">${esc(lab.dataset.file || "main.py")}</span><span class="pj-lab-live" role="status" aria-live="polite"></span><span class="pj-lab-btns"><button type="button" class="btn gold pj-run">▶ Іске қосу</button><button type="button" class="btn secondary pj-reset">↺ Бастапқы код</button></span></div>`);
      lab.insertAdjacentHTML("beforeend", `<div class="pj-lab-out" hidden></div>`);
      const live = $(".pj-lab-live", lab), out = $(".pj-lab-out", lab), run = $(".pj-run", lab);
      ta.addEventListener("input", () => { try { localStorage.setItem(store, ta.value); } catch (e) {} });
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ta.setRangeText(mode === "page" ? "  " : "    ", ta.selectionStart, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input")); }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go(); }
      });
      $(".pj-reset", lab).addEventListener("click", () => { ta.value = orig; try { localStorage.removeItem(store); } catch (e) {} live.textContent = "Бастапқы код қайтарылды"; });
      const frame = (html, sandbox, tall) => {
        out.hidden = false;
        out.className = "pj-lab-out web-preview";
        out.innerHTML = `<div class="wp-bar"><i></i><i></i><i></i><span>Нәтиже</span></div>`;
        const f = document.createElement("iframe");
        f.setAttribute("sandbox", sandbox);
        f.title = "Зертхана нәтижесі";
        if (tall) f.className = "tall";
        f.srcdoc = html;
        out.appendChild(f);
      };
      const text = (s, err) => {
        out.hidden = false;
        out.className = "pj-lab-out";
        out.innerHTML = `<pre class="run-output${err ? " err" : ""}"></pre>`;
        $("pre", out).textContent = s;
      };
      async function go() {
        run.disabled = true;
        try {
          if (mode === "page") {
            let code = ta.value;
            if (/__MODEL__/.test(code)) {
              await K.loadScript("projects/model.js");
              code = code.replace(/__MODEL__/g, JSON.stringify(window.CS50KZ_PJ.model));
            }
            frame(code, "allow-scripts allow-forms", true);
            live.textContent = "Бет жүктелді";
            K.mark && K.mark("web");
          } else {
            live.textContent = "Python жүктелуде (бірінші рет ~10 секунд)...";
            const py = await K.getPyodide();
            const files = (lab.dataset.files || "").split(",").filter(Boolean);
            if (files.length) {
              await K.loadScript("projects/model.js");
              files.forEach((f) => py.FS.writeFile(f, window.CS50KZ_PJ.files[f]));
              py.runPython("import importlib, sys\nsys.modules.pop('data', None)\nimportlib.invalidate_caches()");
            }
            let buf = "";
            py.setStdout({ batched: (s) => (buf += s + "\n") });
            py.setStderr({ batched: (s) => (buf += s + "\n") });
            const g = py.toPy({ __name__: "__main__" });
            let err = null;
            try { await py.runPythonAsync(ta.value, { globals: g }); } catch (e) { err = String(e.message || e).split("\n").filter((l) => !/File "\/lib|_pyodide|pyodide\./.test(l)).join("\n"); }
            g.destroy && g.destroy();
            if (err) text((buf ? buf + "\n" : "") + err, true);
            else if (mode === "py-html") frame(buf, "allow-scripts", false);
            else text(buf || "(шығыс жоқ)");
            live.textContent = err ? "Қате бар" : "Дайын";
            K.mark && K.mark("python");
          }
        } catch (e) {
          live.textContent = "Жүктелмеді";
          text("Қажетті файл не Python жүктелмеді. Интернет байланысын тексеріп, қайта көріңіз.", true);
        }
        run.disabled = false;
      }
      run.addEventListener("click", go);
    });
  }

  // ---------- Прогресті тазалау ----------
  function initReset() {
    const btn = $("[data-reset]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (!confirm("Жобалардағы барлық прогресс жойылсын ба? Кодтарыңыз бен автотексеруші нәтижелері тазаланады.")) return;
      const keys = $$(".pj-step[data-check]").map((st) => st.dataset.check);
      const graded = read("cs50kz:graded", {});
      keys.forEach((k) => { delete graded[k]; try { localStorage.removeItem("ag:" + k); localStorage.removeItem("jg:" + k); } catch (e) {} });
      write("cs50kz:graded", graded);
      $$(".checklist[data-id]", document).forEach((l) => { try { localStorage.removeItem("check:" + location.pathname + ":" + l.dataset.id); } catch (e) {} });
      try { Object.keys(localStorage).filter((k) => k.startsWith("cs50kz:pj-lab:")).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
      write(KEY, { done: {}, finished: {} });
      location.reload();
    });
  }

  function start() {
    K = window.CS50KZ;
    load();
    initLabs();
    watchSteps();
    paint();
    initReset();
  }
  function boot(tries) {
    if (window.CS50KZ || tries > 80) return start();
    setTimeout(() => boot(tries + 1), 50);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => boot(0));
  else boot(0);
})();
