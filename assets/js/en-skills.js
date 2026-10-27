/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/*
 * English Academy - дағдылар зертханасы (en/skills.html). Дерек: assets/data/en-skills.js (window.CS50KZ_EN_SKILLS).
 *   Тыңдау - диктант (TTS оқиды, оқушы жазады, сөз бойынша тексеру) және қысқа монолог + сұрақтар.
 *   Айту   - көлеңкелеу: үлгіні тыңдап, қайталау; SpeechRecognition бар браузерде сөздер салыстырылады, жоқта өзін-өзі бағалау.
 *   Оқу    - мәтін ([[сөз|аударма]] басқанда аудармасы) және түсіну сұрақтары.
 *   Жазу   - тапсырма, сөз саны, тексеру тізімі (тұрақты өрнектер), үлгі жауап; жоба жазба жадта сақталады.
 * Сақтау: cs50kz:en:skills = { A0: { dict: [индекстер], talk: ұпай, speak: [индекстер], read: ұпай, write: true } }, cs50kz:en:skills:lv,
 *         cs50kz:en:skills:draft:<деңгей>. Деңгей әдепкіде - деңгей тестінің ұсынысы (cs50kz:en:placement.rec).
 */
(function () {
  "use strict";
  const LV = ["A0", "A1", "A2", "B1", "B2", "C1"];
  const SKILLS = [["listen", "Тыңдау"], ["speak", "Айту"], ["read", "Оқу"], ["write", "Жазу"]];
  const KEY = "cs50kz:en:skills";
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* жеке режим */ } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const words = (s) => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean);
  const logDay = () => { try { window.CS50KZ && window.CS50KZ.logDay(); } catch (e) { /* міндетті емес */ } };

  // Сөздер бойынша ең ұзын ортақ тізбек: қай сөз дұрыс, қайсысы жетпейді
  function diff(target, said) {
    const a = words(target), b = words(said);
    const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const hit = new Array(a.length).fill(false);
    for (let i = 0, j = 0; i < a.length && j < b.length;) {
      if (a[i] === b[j]) { hit[i] = true; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
    }
    return { a, hit, score: a.length ? Math.round((hit.filter(Boolean).length / a.length) * 100) : 0 };
  }
  const marked = (d) => d.a.map((w, i) => `<span class="${d.hit[i] ? "sk-ok" : "sk-miss"}">${esc(w)}</span>`).join(" ");

  // Дыбыстау (en-course.js-тегідей): ағылшын дауысы болса - сол, әйтпесе en-US
  const TTS = {
    ok: !!(window.speechSynthesis && window.SpeechSynthesisUtterance), voice: null,
    pick() { if (!this.ok) return; const vs = speechSynthesis.getVoices() || []; this.voice = vs.find((v) => /^en-US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null; },
    say(text, rate) {
      if (!this.ok) return false;
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = this.voice ? this.voice.lang : "en-US"; if (this.voice) u.voice = this.voice; u.rate = rate || 1; speechSynthesis.speak(u); return true; } catch (e) { return false; }
    }
  };
  TTS.pick();
  if (TTS.ok && speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", () => TTS.pick());
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const playBtns = (text) => TTS.ok
    ? `<button type="button" class="sk-play" data-say="${esc(text)}">Тыңдау</button><button type="button" class="sk-play slow" data-say="${esc(text)}" data-rate="0.7">Баяу</button>`
    : `<span class="sk-note">Бұл браузерде дыбыстау жоқ: Chrome, Edge не Safari ашыңыз.</span>`;

  function app(root) {
    const D = window.CS50KZ_EN_SKILLS;
    if (!D) { root.innerHTML = '<p class="sk-note">Дерек жүктелмеді. Бетті жаңартыңыз.</p>'; return; }
    const st = get(KEY, {});
    const place = get("cs50kz:en:placement", null);
    let lv = get(KEY + ":lv", null) || (place && LV[place.rec]) || "A0";
    if (!D[lv]) lv = "A0";
    let sk = "listen";
    const S = (l) => (st[l] = st[l] || {});
    const save = () => set(KEY, st);

    // Деңгей x дағды бойынша орындалған үлес (0..1)
    function share(l, s) {
      const x = st[l] || {}, d = D[l];
      if (s === "listen") return ((x.dict || []).length + (x.talk === 100 ? 1 : 0)) / (d.listen.dictation.length + 1);
      if (s === "speak") return (x.speak || []).length / d.speak.length;
      if (s === "read") return (x.read || 0) / 100;
      return x.write ? 1 : 0;
    }

    root.innerHTML = `
      <section class="sk-matrix" aria-labelledby="sk-mx-h">
        <h2 id="sk-mx-h">Жеке прогресс</h2>
        <p class="sk-sub">Әр ұяшық - бір деңгейдің бір дағдысы. Ұяшықты бассаң, сол жаттығу ашылады.</p>
        <div class="sk-grid" role="grid" aria-label="Деңгейлер мен дағдылар бойынша прогресс"></div>
      </section>
      <div class="sk-levels" role="group" aria-label="Деңгей">${LV.map((l) => `<button type="button" class="sk-lv" data-lv="${l}" aria-pressed="false"><b>${l}</b><small>${esc(D[l].name)}</small></button>`).join("")}</div>
      <div class="sk-tabs" role="tablist" aria-label="Дағды">${SKILLS.map(([k, t]) => `<button type="button" role="tab" class="sk-tab" id="tab-${k}" data-sk="${k}" aria-controls="sk-panel" aria-selected="false" tabindex="-1">${t}</button>`).join("")}</div>
      <section class="sk-panel" id="sk-panel" role="tabpanel" tabindex="0"></section>`;
    const grid = root.querySelector(".sk-grid"), panel = root.querySelector(".sk-panel");

    function drawGrid() {
      grid.innerHTML = `<div class="sk-row sk-hd" role="row"><span role="columnheader"></span>${SKILLS.map(([, t]) => `<span role="columnheader">${t}</span>`).join("")}</div>` +
        LV.map((l) => `<div class="sk-row" role="row"><span class="sk-rl" role="rowheader">${l}</span>${SKILLS.map(([k, t]) => {
          const p = Math.round(share(l, k) * 100);
          return `<button type="button" role="gridcell" class="sk-cell${l === lv && k === sk ? " on" : ""}${p === 100 ? " full" : ""}" data-lv="${l}" data-sk="${k}" style="--p:${p}%" aria-label="${l}, ${t}: ${p}%"><i></i><em>${p}%</em></button>`;
        }).join("")}</div>`).join("");
    }
    grid.addEventListener("click", (e) => { const c = e.target.closest(".sk-cell"); if (c) { lv = c.dataset.lv; sk = c.dataset.sk; show(true); } });
    root.querySelectorAll(".sk-lv").forEach((b) => b.addEventListener("click", () => { lv = b.dataset.lv; show(); }));
    const tabs = [...root.querySelectorAll(".sk-tab")];
    tabs.forEach((b, i) => {
      b.addEventListener("click", () => { sk = b.dataset.sk; show(); });
      b.addEventListener("keydown", (e) => {
        const k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!k) return;
        e.preventDefault();
        const n = tabs[(i + k + tabs.length) % tabs.length];
        sk = n.dataset.sk; show(); n.focus();
      });
    });
    panel.addEventListener("click", (e) => {
      const b = e.target.closest(".sk-play");
      if (b) TTS.say(b.dataset.say, +b.dataset.rate || 1);
      const g = e.target.closest(".sk-gl");
      if (g) { const t = g.nextElementSibling; t.hidden = !t.hidden; g.setAttribute("aria-expanded", String(!t.hidden)); }
    });

    function show(scroll) {
      set(KEY + ":lv", lv);
      root.querySelectorAll(".sk-lv").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lv === lv)));
      tabs.forEach((b) => { const on = b.dataset.sk === sk; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
      panel.setAttribute("aria-labelledby", "tab-" + sk);
      drawGrid();
      ({ listen, speak, read, write })[sk](D[lv], S(lv));
      if (scroll) root.querySelector(".sk-levels").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const done = () => { save(); drawGrid(); logDay(); };

    // ---------- Тыңдау ----------
    function listen(d, x) {
      x.dict = x.dict || [];
      panel.innerHTML = `<h3>Диктант</h3><p class="sk-sub">Сөйлемді тыңда да, естігеніңді жаз. Тыныс белгілері мен бас әріп тексерілмейді.</p>
        ${d.listen.dictation.map((s, i) => `<div class="sk-item${x.dict.includes(i) ? " is-done" : ""}" data-i="${i}">
          <div class="sk-row-btns"><span class="sk-num">${i + 1}</span>${playBtns(s)}</div>
          <label class="sk-visually" for="dict-${lv}-${i}">${i + 1}-сөйлем</label>
          <input class="sk-in" id="dict-${lv}-${i}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Естігеніңді жаз...">
          <div class="sk-row-btns"><button type="button" class="btn sk-check">Тексеру</button><button type="button" class="sk-link sk-show">Мәтінді көрсету</button></div>
          <p class="sk-res" aria-live="polite"></p></div>`).join("")}
        <h3>Тыңдап түсіну: ${esc(d.listen.talk.title)}</h3>
        <p class="sk-sub">Мәтінді екі рет тыңда, сосын сұрақтарға жауап бер. Қиын болса, мәтінді ашып оқуға болады.</p>
        <div class="sk-row-btns">${playBtns(d.listen.talk.text)}<button type="button" class="sk-link sk-script">Мәтінді көрсету</button></div>
        <p class="sk-script-text" hidden>${esc(d.listen.talk.text)}</p>
        ${quiz(d.listen.talk.qs, "talk")}`;
      panel.querySelectorAll(".sk-item").forEach((it) => {
        const i = +it.dataset.i, s = d.listen.dictation[i], inp = it.querySelector(".sk-in"), res = it.querySelector(".sk-res");
        const check = () => {
          const r = diff(s, inp.value);
          res.innerHTML = `<b>${r.score}%</b> ${marked(r)}` + (r.score >= 90 ? " <span class=\"sk-good\">Жарайсың!</span>" : "");
          if (r.score >= 90 && !x.dict.includes(i)) { x.dict.push(i); it.classList.add("is-done"); done(); }
        };
        it.querySelector(".sk-check").addEventListener("click", check);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
        it.querySelector(".sk-show").addEventListener("click", () => { res.innerHTML = `<span class="sk-ans">${esc(s)}</span>`; });
      });
      panel.querySelector(".sk-script").addEventListener("click", (e) => { const p = panel.querySelector(".sk-script-text"); p.hidden = !p.hidden; e.target.textContent = p.hidden ? "Мәтінді көрсету" : "Мәтінді жасыру"; });
      bindQuiz(d.listen.talk.qs, "talk", (sc) => { if (sc > (x.talk || 0)) { x.talk = sc; done(); } });
    }

    // ---------- Айту ----------
    function speak(d, x) {
      x.speak = x.speak || [];
      panel.innerHTML = `<h3>Көлеңкелеу (shadowing)</h3>
        <p class="sk-sub">Үлгіні тыңда, дәл сол ырғақпен қайтала. ${SR ? "«Айту» батырмасын басып, сөйлемді микрофонға айт: сөздер салыстырылады." : "Бұл браузерде сөйлеуді тану жоқ (Chrome мен Edge-те бар): тыңда, дауыстап қайтала және өзіңді бағала."}</p>
        ${d.speak.map((p, i) => `<div class="sk-item${x.speak.includes(i) ? " is-done" : ""}" data-i="${i}">
          <p class="sk-phrase">${esc(p.en)}</p><p class="sk-kz">${esc(p.kz)}</p><p class="sk-tip">${esc(p.tip)}</p>
          <div class="sk-row-btns">${playBtns(p.en)}${SR ? '<button type="button" class="btn sk-rec">Айту</button>' : '<button type="button" class="btn sk-self">Қайталадым</button>'}</div>
          <p class="sk-res" aria-live="polite"></p></div>`).join("")}`;
      panel.querySelectorAll(".sk-item").forEach((it) => {
        const i = +it.dataset.i, p = d.speak[i], res = it.querySelector(".sk-res");
        const ok = () => { if (!x.speak.includes(i)) { x.speak.push(i); it.classList.add("is-done"); done(); } };
        const self = it.querySelector(".sk-self");
        if (self) self.addEventListener("click", () => { ok(); res.textContent = "Белгіленді. Тағы бір рет баяу нұсқамен салыстырып көр."; });
        const rec = it.querySelector(".sk-rec");
        if (!rec) return;
        rec.addEventListener("click", () => {
          let r;
          try { r = new SR(); } catch (e) { res.textContent = "Микрофон қолжетімсіз."; return; }
          r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 3;
          rec.disabled = true; rec.textContent = "Тыңдап тұрмын...";
          r.onresult = (ev) => {
            const alts = [...ev.results[0]].map((a) => a.transcript);
            const best = alts.map((t) => diff(p.en, t)).sort((a, b) => b.score - a.score)[0];
            res.innerHTML = `<b>${best.score}%</b> ${marked(best)}<br><small>Естілгені: «${esc(alts[0])}»</small>` + (best.score >= 80 ? ' <span class="sk-good">Өте жақсы!</span>' : "");
            if (best.score >= 80) ok();
          };
          r.onerror = (ev) => { res.textContent = ev.error === "not-allowed" ? "Микрофонға рұқсат берілмеді. Браузер баптауынан рұқсат беріңіз." : "Дыбыс танылмады, қайта көріңіз."; };
          r.onend = () => { rec.disabled = false; rec.textContent = "Айту"; };
          r.start();
        });
      });
    }

    // ---------- Оқу ----------
    function read(d, x) {
      const para = (t) => esc(t).replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (_, w, tr) => `<button type="button" class="sk-gl" aria-expanded="false">${w}</button><span class="sk-tr" hidden> (${tr})</span>`);
      panel.innerHTML = `<h3>${esc(d.read.title)}</h3>
        <p class="sk-sub">Мәтінді оқы. Астын сызылған сөзді бассаң, аудармасы шығады. Сосын сұрақтарға жауап бер.</p>
        <div class="sk-row-btns">${playBtns(d.read.text.map((t) => t.replace(/\[\[([^|\]]+)\|[^\]]+\]\]/g, "$1")).join(" "))}</div>
        <div class="sk-text" lang="en">${d.read.text.map((t) => `<p>${para(t)}</p>`).join("")}</div>
        ${x.read ? `<p class="sk-best">Ең жақсы нәтиже: ${x.read}%</p>` : ""}
        ${quiz(d.read.qs, "read")}`;
      bindQuiz(d.read.qs, "read", (sc) => { if (sc > (x.read || 0)) { x.read = sc; done(); } });
    }

    // ---------- Жазу ----------
    function write(d, x) {
      const w = d.write, dk = KEY + ":draft:" + lv;
      panel.innerHTML = `<h3>Жазу тапсырмасы</h3>
        <p class="sk-prompt" lang="en">${esc(w.prompt)}</p><p class="sk-sub">${esc(w.kz)} Көлемі: ${w.min}-${w.max} сөз.</p>
        <label class="sk-visually" for="sk-ta">Жауабың</label>
        <textarea id="sk-ta" class="sk-ta" lang="en" spellcheck="true" rows="9" placeholder="Осы жерге ағылшынша жаз..."></textarea>
        <div class="sk-wc" aria-live="polite"></div>
        <ul class="sk-checks">${w.must.map((m, i) => `<li data-i="${i}">${esc(m.label)}</li>`).join("")}</ul>
        <div class="sk-row-btns"><button type="button" class="btn gold sk-submit">Тексеру</button><button type="button" class="sk-link sk-model">Үлгі жауап</button></div>
        <p class="sk-res" aria-live="polite">${x.write ? "Бұл тапсырма орындалған ✓" : ""}</p>
        <pre class="sk-model-text" lang="en" hidden>${esc(w.model)}</pre>`;
      const ta = panel.querySelector(".sk-ta"), wc = panel.querySelector(".sk-wc"), res = panel.querySelector(".sk-res");
      ta.value = get(dk, "") || "";
      const state = () => {
        const n = words(ta.value).length;
        const hits = w.must.map((m) => new RegExp(m.re, "i").test(ta.value));
        panel.querySelectorAll(".sk-checks li").forEach((li, i) => li.classList.toggle("ok", hits[i]));
        wc.innerHTML = `<b>${n}</b> сөз` + (n < w.min ? ` (кемінде ${w.min})` : n > w.max ? ` (${w.max}-тен көп)` : " ✓");
        wc.classList.toggle("ok", n >= w.min && n <= w.max);
        return { n, hits };
      };
      let t = 0;
      ta.addEventListener("input", () => { state(); clearTimeout(t); t = setTimeout(() => set(dk, ta.value), 400); });
      state();
      panel.querySelector(".sk-submit").addEventListener("click", () => {
        const { n, hits } = state(), miss = w.must.filter((m, i) => !hits[i]).map((m) => m.label);
        if (n < w.min) { res.textContent = `Тағы ${w.min - n} сөз жаз.`; return; }
        if (miss.length) { res.innerHTML = "Жетпейтіні: " + miss.map(esc).join("; ") + "."; return; }
        res.textContent = n > w.max ? "Талаптар орындалды, бірақ мәтін ұзын: қысқартып көр. Тапсырма есептелді ✓" : "Барлық талап орындалды ✓ Енді үлгі жауаппен салыстыр.";
        if (!x.write) { x.write = true; done(); }
      });
      panel.querySelector(".sk-model").addEventListener("click", (e) => { const p = panel.querySelector(".sk-model-text"); p.hidden = !p.hidden; e.target.textContent = p.hidden ? "Үлгі жауап" : "Үлгіні жасыру"; });
    }

    // ---------- Сұрақтар (тыңдау мен оқуда ортақ) ----------
    function quiz(qs, id) {
      return `<form class="sk-quiz" data-q="${id}">${qs.map((q, i) => `<fieldset class="sk-q"><legend lang="en">${i + 1}. ${esc(q.q)}</legend>
        ${q.o.map((o, j) => `<label><input type="radio" name="${id}-${lv}-${i}" value="${j}"> <span lang="en">${esc(o)}</span></label>`).join("")}
        <p class="sk-why" hidden></p></fieldset>`).join("")}
        <button type="submit" class="btn">Жауаптарды тексеру</button><p class="sk-res" aria-live="polite"></p></form>`;
    }
    function bindQuiz(qs, id, onScore) {
      const f = panel.querySelector(`.sk-quiz[data-q="${id}"]`);
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = 0;
        qs.forEach((q, i) => {
          const fs = f.querySelectorAll(".sk-q")[i], v = f.querySelector(`input[name="${id}-${lv}-${i}"]:checked`), why = fs.querySelector(".sk-why");
          const right = v && +v.value === q.a;
          if (right) ok++;
          fs.classList.toggle("right", !!right); fs.classList.toggle("wrong", !right);
          why.hidden = false;
          why.textContent = (right ? "Дұрыс. " : v ? "Қате. " : "Жауап таңдалмады. ") + (q.e || "");
        });
        const sc = Math.round((ok / qs.length) * 100);
        f.querySelector(".sk-res").innerHTML = `<b>${ok}/${qs.length}</b> дұрыс (${sc}%)` + (sc === 100 ? ' <span class="sk-good">Тамаша!</span>' : "");
        onScore(sc);
      });
    }

    show();
  }

  const start = () => { const r = document.querySelector('#en-app[data-app="skills"]'); if (r) app(r); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
