// CS50 қазақша - Қорытынды емтихан: уақыты шектеулі, әр лекциядан сұрақ, апталар бойынша талдау.
// main.js .exam бар бетте ғана жүктейді.

(function () {
  const K = window.CS50KZ;
  const esc = K.escapeHtml;
  const store = {
    get(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch (e) { return def; } },
    set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} },
  };
  const PER_LECTURE = 2, MINUTES = 30, PASS = 70;
  const RUN = "cs50kz:exam-run", RES = "cs50kz:exam";
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  async function exam(el) {
    await K.loadScript("assets/data/quiz.js");
    await K.loadScript("assets/data/lectures.js");
    const pool = window.CS50KZ_QUIZ || [];
    const lecs = window.CS50KZ_LECTURES || [];
    const lecOf = (q) => lecs.find((l) => q.u.startsWith(l.url)) || { id: "?", num: q.l, title: q.l, url: q.u.split("#")[0] };
    let run = store.get(RUN, null), tick = null;

    function intro() {
      clearInterval(tick);
      const res = store.get(RES, { best: null, tries: [] });
      const n = lecs.length * PER_LECTURE;
      el.innerHTML = `
        <div class="ex-intro">
          <div class="ex-rules">
            <div><b>${n}</b><span>сұрақ</span></div>
            <div><b>${MINUTES}</b><span>минут</span></div>
            <div><b>${PASS}%</b><span>өту шегі</span></div>
            <div><b>${lecs.length}</b><span>лекция</span></div>
          </div>
          <ul class="ex-list">
            <li>Әр лекциядан ${PER_LECTURE} кездейсоқ сұрақ, ${pool.length} сұрақтың ішінен.</li>
            <li>Жауаптың дұрыс-бұрыстығы соңында ғана көрсетіледі, нағыз емтихандағыдай.</li>
            <li>Сұрақтар арасында еркін ауысуға және күмәнді сұрақты 🚩 белгілеуге болады.</li>
            <li>Бетті жауып қойсаңыз да емтихан сақталады, бірақ уақыт жүре береді.</li>
            <li>${PASS}% және одан жоғары жинасаңыз, нәтиже сертификатқа жазылады.</li>
          </ul>
          ${res.tries.length ? `<div class="ex-history"><b>Алдыңғы әрекеттер</b>${res.tries.slice(-6).reverse().map((t) => `<span class="${t.p >= PASS ? "ok" : ""}">${t.p}% <small>${esc(t.d)}</small></span>`).join("")}</div>` : ""}
          <button type="button" class="btn gold ex-start">${res.tries.length ? "Қайта тапсыру" : "Емтиханды бастау"} →</button>
          ${res.best != null ? `<p class="ex-best">Үздік нәтиже: <b>${res.best}%</b>${res.best >= PASS ? " · сертификатқа жазылды 🎓" : ""}</p>` : ""}
        </div>`;
      el.querySelector(".ex-start").addEventListener("click", start);
    }

    function start() {
      const byLec = {};
      pool.forEach((q) => (byLec[lecOf(q).id] ||= []).push(q));
      const qs = [];
      lecs.forEach((l) => qs.push(...shuffle((byLec[l.id] || []).slice()).slice(0, PER_LECTURE)));
      run = { qs: shuffle(qs), ans: Array(qs.length).fill(null), flag: Array(qs.length).fill(false), cur: 0, t0: Date.now() };
      store.set(RUN, run);
      play();
    }

    function play() {
      el.innerHTML = `
        <div class="ex-top">
          <div class="ex-timer" role="timer"><span class="ex-clock">⏱ <b></b></span><i><em></em></i></div>
          <button type="button" class="btn ex-finish">Аяқтау</button>
        </div>
        <div class="ex-grid" aria-label="Сұрақтар"></div>
        <div class="ex-card"></div>
        <div class="ex-nav">
          <button type="button" class="btn secondary ex-prev">← Алдыңғы</button>
          <button type="button" class="btn secondary ex-flag">🚩 Белгілеу</button>
          <button type="button" class="btn gold ex-next">Келесі →</button>
        </div>`;
      const grid = el.querySelector(".ex-grid"), card = el.querySelector(".ex-card");
      const save = () => store.set(RUN, run);
      const drawGrid = () => {
        grid.innerHTML = run.qs.map((q, i) => `<button type="button" data-i="${i}" class="${i === run.cur ? "cur" : ""} ${run.ans[i] != null ? "done" : ""} ${run.flag[i] ? "flag" : ""}" aria-label="${i + 1}-сұрақ">${i + 1}</button>`).join("");
      };
      const show = () => {
        const q = run.qs[run.cur], l = lecOf(q);
        card.innerHTML = `
          <div class="ex-meta"><span>Сұрақ ${run.cur + 1} / ${run.qs.length}</span><span>${esc(l.id === "ai" ? "AI" : l.num)}</span></div>
          <p class="mq-q">${q.q}</p>
          <div class="mq-opts ex-opts">${q.o.map((o, i) => `<button type="button" data-i="${i}" class="${run.ans[run.cur] === i ? "picked" : ""}"><span class="ex-letter">${"ABCDEF"[i]}</span>${o}</button>`).join("")}</div>`;
        el.querySelector(".ex-prev").disabled = run.cur === 0;
        el.querySelector(".ex-next").textContent = run.cur === run.qs.length - 1 ? "Тексеру →" : "Келесі →";
        el.querySelector(".ex-flag").classList.toggle("on", run.flag[run.cur]);
        drawGrid();
      };
      const go = (i) => { run.cur = Math.max(0, Math.min(run.qs.length - 1, i)); save(); show(); };
      card.addEventListener("click", (e) => {
        const b = e.target.closest(".ex-opts button");
        if (!b) return;
        run.ans[run.cur] = +b.dataset.i; save();
        card.querySelectorAll(".ex-opts button").forEach((x) => x.classList.toggle("picked", x === b));
        drawGrid();
      });
      grid.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) go(+b.dataset.i); });
      el.querySelector(".ex-prev").addEventListener("click", () => go(run.cur - 1));
      el.querySelector(".ex-next").addEventListener("click", () => (run.cur === run.qs.length - 1 ? finish(false) : go(run.cur + 1)));
      el.querySelector(".ex-flag").addEventListener("click", () => { run.flag[run.cur] = !run.flag[run.cur]; save(); show(); });
      el.querySelector(".ex-finish").addEventListener("click", () => finish(false));
      el.onkeydown = (e) => {
        if (e.target.closest("input, textarea")) return;
        if (e.key === "ArrowRight") go(run.cur + 1);
        else if (e.key === "ArrowLeft") go(run.cur - 1);
        else if (/^[1-6]$/.test(e.key) && +e.key <= run.qs[run.cur].o.length) card.querySelectorAll(".ex-opts button")[+e.key - 1].click();
      };
      el.tabIndex = -1;
      const clock = () => {
        const left = MINUTES * 60 - (Date.now() - run.t0) / 1000;
        if (left <= 0) return finish(true);
        el.querySelector(".ex-clock b").textContent = mmss(left);
        el.querySelector(".ex-timer em").style.width = (left / (MINUTES * 60)) * 100 + "%";
        el.querySelector(".ex-timer").classList.toggle("low", left < 300);
      };
      clearInterval(tick);
      tick = setInterval(clock, 1000);
      clock();
      if (run) show();
    }

    function finish(timeout) {
      if (!timeout) {
        const empty = run.ans.filter((a) => a == null).length;
        const flagged = run.flag.filter(Boolean).length;
        if ((empty || flagged) && !confirm(`${empty ? `${empty} сұраққа жауап берілмеген. ` : ""}${flagged ? `${flagged} сұрақ белгіленген. ` : ""}Емтиханды аяқтау керек пе?`)) return;
      }
      clearInterval(tick);
      const qs = run.qs, ans = run.ans;
      const secs = Math.min(MINUTES * 60, Math.round((Date.now() - run.t0) / 1000));
      const right = qs.filter((q, i) => ans[i] === q.a).length;
      const pct = Math.round((right / qs.length) * 100);
      const res = store.get(RES, { best: null, tries: [] });
      const d = new Date();
      res.tries.push({ p: pct, d: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`, s: secs });
      res.tries = res.tries.slice(-20);
      res.best = Math.max(res.best ?? 0, pct);
      store.set(RES, res);
      store.del(RUN);
      run = null;
      K.check && K.check();
      K.bump && K.bump("trainer");
      if (pct >= PASS) K.celebrate();
      result(qs, ans, pct, right, secs, timeout, res.best);
    }

    function result(qs, ans, pct, right, secs, timeout, best) {
      const per = lecs.map((l) => {
        const mine = qs.map((q, i) => [q, i]).filter(([q]) => lecOf(q).id === l.id);
        return { l, n: mine.length, ok: mine.filter(([q, i]) => ans[i] === q.a).length };
      }).filter((x) => x.n);
      const weak = per.filter((x) => x.ok < x.n);
      const R = 54, C = 2 * Math.PI * R;
      const pass = pct >= PASS;
      el.innerHTML = `
        <div class="ex-result ${pass ? "pass" : "fail"}">
          <div class="ex-ring">
            <svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="${R}" class="bg"/><circle cx="70" cy="70" r="${R}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--to:${C * (1 - pct / 100)}"/></svg>
            <div><b>${pct}%</b><span>${right} / ${qs.length}</span></div>
          </div>
          <div class="ex-verdict">
            <h3>${pass ? (pct >= 90 ? "Үздік нәтиже! 🏆" : "Емтихан тапсырылды! 🎉") : "Бұл жолы өтпеді"}</h3>
            <p>${timeout ? "Уақыт бітті. " : ""}${pass ? "Нәтижеңіз сертификатқа жазылды." : `Өту үшін кемінде ${PASS}% керек. Төмендегі әлсіз тақырыптарды қайталап, қайта көріңіз.`}</p>
            <div class="ex-stats"><span>⏱ ${mmss(secs)}</span><span>🏅 Үздігі: ${best}%</span></div>
            <div class="ex-actions">
              ${pass ? `<a class="btn gold" href="${K.ROOT_URL}certificate.html">Сертификатты ашу 🎓</a>` : ""}
              <button type="button" class="btn ${pass ? "secondary" : "gold"} ex-again">Қайта тапсыру</button>
            </div>
          </div>
        </div>
        <h3 class="ex-h">Лекциялар бойынша</h3>
        <div class="ex-bars">${per.map((x) => `<a class="ex-bar ${x.ok === x.n ? "full" : x.ok ? "half" : "zero"}" href="${K.ROOT_URL + x.l.url}#quiz" title="${esc(x.l.title)}"><span>${esc(x.l.id === "ai" ? "AI" : x.l.num)}</span><i><em style="--w:${(x.ok / x.n) * 100}%"></em></i><b>${x.ok}/${x.n}</b></a>`).join("")}</div>
        ${weak.length ? `<div class="callout tip"><span class="callout-title">Нені қайталау керек</span><p>${weak.map((x) => `<a href="${K.ROOT_URL + x.l.url}">${esc(x.l.num)}: ${esc(x.l.title)}</a>`).join(" · ")}</p></div>` : ""}
        <h3 class="ex-h">Жауаптарды талдау</h3>
        <div class="ex-review">${qs.map((q, i) => {
          const ok = ans[i] === q.a;
          return `<details class="ex-rv ${ok ? "ok" : "bad"}"${ok ? "" : " open"}>
            <summary><span class="ex-rv-ico">${ok ? "✓" : "✗"}</span><span class="ex-rv-n">${i + 1}.</span> <span class="ex-rv-q">${q.q}</span></summary>
            <div class="ex-rv-body">
              ${ans[i] == null ? `<p class="ex-rv-mine">Жауап берілмеген</p>` : ok ? "" : `<p class="ex-rv-mine">Сіздің жауабыңыз: ${q.o[ans[i]]}</p>`}
              <p class="ex-rv-right">Дұрыс жауап: ${q.o[q.a]}</p>
              <p>${q.e} <a href="${K.ROOT_URL + q.u}">${esc(q.l)} →</a></p>
            </div>
          </details>`;
        }).join("")}</div>`;
      el.querySelector(".ex-again").addEventListener("click", start);
      requestAnimationFrame(() => requestAnimationFrame(() => el.querySelector(".ex-ring .fg").classList.add("go")));
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (run && run.qs && run.qs.length) {
      if (Date.now() - run.t0 > MINUTES * 60 * 1000) finish(true);
      else play();
    } else intro();
  }

  document.querySelectorAll(".exam").forEach(exam);
})();
