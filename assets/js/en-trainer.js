/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
 * «Ағылшын тілі A0-C1»: сөздік жаттықтырғышы. Интервалды қайталау (Лейтнер, 5 қорап: 1, 3, 7, 14 күн), 4 режим:
 *   карточка, көп таңдау, жазып тексеру (spelling), дыбысталуы бойынша тап (speechSynthesis бар болса).
 * Сақтау: cs50kz:en:vocab = { id: { b, due, m, n?, x?, t? } } (en-course.js, формат өзгермейді),
 *         cs50kz:en:vstats = { goal, days: { "ЖЖЖЖ-АА-КК": { n, ok } } } (күнделікті мақсат, серия, статистика).
 * en-course.js-тен кейін жүктеледі; window.CS50KZ_EN.trainer ретінде ашылады. Дерек жоқ болса да қате бермейді.
 */
(function () {
  "use strict";
  var E = window.CS50KZ_EN;
  if (!E) return;
  var h = E.h, LS = E.LS, VS = E.VS, TTS = E.TTS, norm = E.norm, shuffle = E.shuffle;
  var SKEY = "cs50kz:en:vstats", DAY = 86400000;
  var MODES = [["card", "Карточка"], ["choice", "Таңдау"], ["spell", "Жазу"], ["listen", "Дыбыс"]];

  /* ---------- күнделікті статистика, мақсат, серия ---------- */
  function dkey(t) { var d = new Date(t == null ? Date.now() : t); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  var S = {
    all: function () { var v = LS.get(SKEY, {}); if (!v || typeof v !== "object" || Array.isArray(v)) v = {}; if (!v.days || typeof v.days !== "object") v.days = {}; if (!(v.goal > 0)) v.goal = 10; return v; },
    goal: function () { return this.all().goal; },
    setGoal: function (n) { var v = this.all(); v.goal = Math.max(1, Math.min(200, n | 0)); LS.set(SKEY, v); },
    today: function () { var d = this.all().days[dkey()]; return { n: d ? d.n || 0 : 0, ok: d ? d.ok || 0 : 0 }; },
    record: function (ok) {
      var v = this.all(), k = dkey(), d = v.days[k] || { n: 0, ok: 0 };
      d.n++; if (ok) d.ok++; v.days[k] = d;
      var keys = Object.keys(v.days).sort();            /* жадты шектеу: соңғы 120 күн */
      if (keys.length > 120) keys.slice(0, keys.length - 120).forEach(function (x) { delete v.days[x]; });
      LS.set(SKEY, v);
    },
    streak: function () {
      var days = this.all().days, t = Date.now(), n = 0;
      if (!(days[dkey(t)] && days[dkey(t)].n > 0)) t -= DAY;   /* бүгін әлі жасалмаса, кешегіден санаймыз */
      while (days[dkey(t)] && days[dkey(t)].n > 0 && n < 400) { n++; t -= DAY; }
      return n;
    },
    totals: function () { var d = this.all().days, n = 0, ok = 0; Object.keys(d).forEach(function (k) { n += d[k].n || 0; ok += d[k].ok || 0; }); return { n: n, ok: ok }; }
  };

  /* ---------- сессия кезегі: алдымен қайталауға келгендер, сосын жаңа сөздер, сосын жаттығу ---------- */
  function buildQueue(pool, size) {
    var v = VS.all(), now = Date.now(), due = [], fresh = [], rest = [];
    pool.forEach(function (w) {
      var e = v[w.id];
      if (!e) fresh.push(w); else if ((e.due || 0) <= now) due.push(w); else rest.push(w);
    });
    due.sort(function (a, b) { return (v[a.id].due || 0) - (v[b.id].due || 0); });
    var items = due.slice(0, size).map(function (w) { return { w: w, srs: true }; });
    if (items.length < size) items = items.concat(shuffle(fresh).slice(0, size - items.length).map(function (w) { return { w: w, srs: true }; }));
    var srsN = items.length;
    if (items.length < Math.min(size, 5)) items = items.concat(shuffle(rest).slice(0, Math.min(size, 5) - items.length).map(function (w) { return { w: w, srs: false }; }));
    return { items: shuffle(items), due: Math.min(due.length, size), fresh: srsN - Math.min(due.length, size), practice: items.length - srsN, dueAll: due.length };
  }
  function dueCount(pool) { var v = VS.all(), now = Date.now(); return pool.filter(function (w) { var e = v[w.id]; return e && (e.due || 0) <= now; }).length; }

  var shortKz = function (kz) { return String(kz).split(/[,;(]/)[0].trim() || String(kz); };
  function distractors(w, all, n, byKz) {
    var seen = {}, out = [], key = function (x) { return byKz ? shortKz(x.kz).toLowerCase() : x.w.toLowerCase(); };
    seen[key(w)] = 1;
    var same = shuffle(all.filter(function (x) { return x.id !== w.id && x.pos && x.pos === w.pos; })), other = shuffle(all.filter(function (x) { return x.id !== w.id; }));
    same.concat(other).forEach(function (x) { var k = key(x); if (out.length < n && !seen[k]) { seen[k] = 1; out.push(x); } });
    return out;
  }
  function maskExample(w) {
    if (!w.ex) return "";
    var re = new RegExp(w.w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    return re.test(w.ex) ? w.ex.replace(re, "_____") : "";
  }

  /* ---------- статистика панелі (сөздік беті) ---------- */
  function statsPanel(all) {
    var box = h("section", { class: "en-vstats", "aria-label": "Күнделікті мақсат және статистика" });
    var goalSel = h("select", { class: "en-sel", "aria-label": "Күнделікті мақсат (сөз саны)" }, [5, 10, 20, 30, 50].map(function (n) { return h("option", { value: String(n), text: n + " сөз" }); }));
    goalSel.value = String(S.goal());
    if (goalSel.value !== String(S.goal())) { goalSel.append(h("option", { value: String(S.goal()), text: S.goal() + " сөз" })); goalSel.value = String(S.goal()); }
    goalSel.addEventListener("change", function () { S.setGoal(+goalSel.value); draw(); });
    function draw() {
      var t = S.today(), goal = S.goal(), pct = Math.min(100, Math.round(t.n / goal * 100)), tot = S.totals(), v = VS.all(), boxes = [0, 0, 0, 0, 0, 0];
      all.forEach(function (w) { var e = v[w.id]; if (e) boxes[Math.max(1, Math.min(5, e.b || 1))]++; });
      var seen = boxes[1] + boxes[2] + boxes[3] + boxes[4] + boxes[5], maxB = Math.max(1, boxes[1], boxes[2], boxes[3], boxes[4], boxes[5]);
      box.replaceChildren(
        h("div", { class: "en-vs-top" },
          h("div", { class: "en-vs-goal" },
            h("p", { class: "en-vs-t" }, h("b", { text: "Бүгінгі мақсат: " + t.n + " / " + goal }), t.n >= goal ? h("span", { class: "en-vs-ok", text: " ✓ орындалды" }) : null),
            h("div", { class: "en-progress", role: "progressbar", "aria-label": "Бүгінгі мақсат", "aria-valuemin": "0", "aria-valuemax": String(goal), "aria-valuenow": String(Math.min(t.n, goal)) }, h("i", { style: "width:" + pct + "%" })),
            h("label", { class: "en-vs-sel" }, h("span", { text: "Мақсат: " }), goalSel)),
          h("ul", { class: "en-vs-num" },
            h("li", null, h("b", { text: "🔥 " + S.streak() }), h("span", { text: "күн қатарынан" })),
            h("li", null, h("b", { text: String(VS.count()) }), h("span", { text: "жатталған" })),
            h("li", null, h("b", { text: String(dueCount(all)) }), h("span", { text: "қайталауға келді" })),
            h("li", null, h("b", { text: tot.n ? Math.round(tot.ok / tot.n * 100) + "%" : "-" }), h("span", { text: "дәлдік (" + tot.n + " жауап)" })))),
        h("details", { class: "en-vs-boxes" }, h("summary", { text: "Қораптар бойынша: " + seen + " сөз қайталауда" }),
          h("ul", { class: "en-box-list" }, [1, 2, 3, 4, 5].map(function (b) {
            return h("li", null, h("span", { class: "en-lvl-name", text: b + "-қорап" }), h("span", { class: "en-bar-track", role: "img", "aria-label": b + "-қорапта " + boxes[b] + " сөз" }, h("i", { style: "width:" + Math.round(boxes[b] / maxB * 100) + "%" })), h("span", { text: " " + boxes[b] }));
          })), h("p", { class: "en-info", text: "1-қорап: ертең қайта шығады; 5-қорап: 14 күннен соң. «Білмедім» десеңіз, сөз 1-қорапқа оралады." })));
    }
    draw();
    box.refresh = draw;
    return box;
  }

  /* ---------- жаттықтырғыш ---------- */
  /* start(box, { pool, all, mode, dir, onExit }) */
  function start(box, o) {
    var pool = o.pool || [], all = o.all && o.all.length ? o.all : pool, mode = o.mode || "card", dir = o.dir || { v: "en" };
    var size = Math.max(5, Math.min(30, S.goal()));
    var q, i, st, stage = h("div", { class: "en-card-stage", "aria-live": "polite" }), head = h("div", { class: "en-tr-head" });
    var keyH;

    function newSession(items) {
      q = items ? { items: items.map(function (w) { return { w: w, srs: true }; }), due: 0, fresh: 0, practice: 0, dueAll: 0 } : buildQueue(pool, size);
      i = 0; st = { ok: 0, bad: 0, miss: [] };
      drawHead();
      next();
    }
    function drawHead() {
      var modeSeg = o.setMode ? null : h("div", { class: "seg en-chips en-modes", role: "group", "aria-label": "Жаттығу режимі" }, MODES.map(function (m) {
        var dis = m[0] === "listen" && !TTS.ok;
        var b = h("button", { type: "button", "data-mode": m[0], "aria-pressed": String(m[0] === mode), class: m[0] === mode ? "on" : "", disabled: dis, title: dis ? "Бұл браузерде дыбыстау жоқ" : false, text: m[1] });
        b.addEventListener("click", function () { if (m[0] !== mode) { cleanup(); start(box, { pool: pool, all: all, mode: m[0], dir: dir, onExit: o.onExit, onChange: o.onChange }); } });
        return b;
      }));
      var dirSel = null;
      if (mode === "card" || mode === "choice") {
        dirSel = h("select", { class: "en-sel", "aria-label": "Бағыты" }, h("option", { value: "en", text: "English → Қазақша" }), h("option", { value: "kz", text: "Қазақша → English" }));
        dirSel.value = dir.v;
        dirSel.addEventListener("change", function () { dir.v = dirSel.value; cleanup(); start(box, { pool: pool, all: all, mode: mode, dir: dir, onExit: o.onExit, onChange: o.onChange, setMode: o.setMode }); });
      }
      var info = q ? "Қайталауға келген: " + q.dueAll + " · жаңа: " + Math.max(0, q.fresh) + (q.practice ? " · жаттығу (қорапқа әсер етпейді): " + q.practice : "") + " · бұл сессия: " + q.items.length : "";
      head.replaceChildren(modeSeg, h("div", { class: "en-filters" }, dirSel), h("p", { class: "en-info", text: info }));
    }
    function cleanup() { if (keyH) { document.removeEventListener("keydown", keyH); keyH = null; } try { if (TTS.ok) speechSynthesis.cancel(); } catch (e) { /* ештеңе */ } }
    function keys(fn) {
      if (keyH) document.removeEventListener("keydown", keyH);
      keyH = function (e) {
        if (!stage.isConnected) { cleanup(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        fn(e);
      };
      document.addEventListener("keydown", keyH);
    }
    function record(item, grade) {
      var good = grade >= 1 && grade !== 0;
      if (item.srs) VS.grade(item.w.id, grade); else if (K().logDay) K().logDay();
      S.record(grade >= 1);
      if (grade >= 1) st.ok++; else { st.bad++; st.miss.push(item.w); }
      return good;
    }
    function K() { return window.CS50KZ || {}; }
    function counter() { return h("p", { class: "en-card-n", text: (i + 1) + " / " + q.items.length + (q.items[i].srs ? "" : " · жаттығу") }); }

    function next() {
      cleanup();
      if (!pool.length) return stage.replaceChildren(h("p", { text: "Қайталайтын сөз жоқ: сүзгіні өзгертіңіз." }));
      if (!q.items.length) {
        return stage.replaceChildren(h("div", { class: "en-empty", role: "status" }, h("p", { class: "en-empty-t", text: "Бүгін қайталайтын карточка жоқ ✓" }), h("p", { text: "Кейін оралыңыз немесе тізімнен жаңа сөздерді қарап шығыңыз." })));
      }
      if (i >= q.items.length) return summary();
      var item = q.items[i];
      ({ card: card, choice: choice, spell: spell, listen: listen }[mode] || card)(item);
    }
    function summary() {
      var tdy = S.today(), goal = S.goal(), total = st.ok + st.bad;
      var again = h("button", { type: "button", class: "btn", text: "Тағы бір сессия" });
      again.addEventListener("click", function () { newSession(); });
      var kids = [h("div", { class: "en-empty", role: "status" },
        h("p", { class: "en-empty-t", text: "Дайын! Дұрыс: " + st.ok + " / " + total }),
        h("p", { text: "Бүгін: " + tdy.n + " / " + goal + (tdy.n >= goal ? " ✓ мақсат орындалды" : "") + " · серия: 🔥 " + S.streak() + " күн" }),
        st.miss.length ? h("p", { class: "en-info", text: "Қайталайтын сөздер: " + st.miss.map(function (w) { return w.w; }).join(", ") + ". Олар 1-қорапқа оралды, ертең қайта шығады." }) : h("p", { text: "Қатесіз! Білмеген сөздер ертең қайта шығады." }))];
      var row = h("div", { class: "en-ex-ctrl" }, again);
      if (st.miss.length) { var re = h("button", { type: "button", class: "btn secondary", text: "Қателерді қайта жасау" }); re.addEventListener("click", function () { newSession(st.miss.slice()); }); row.append(re); }
      stage.replaceChildren(kids[0], row);
      if (o.onChange) o.onChange();
      again.focus();
    }
    function advance(delay) { setTimeout(function () { if (!stage.isConnected) return; i++; if (o.onChange) o.onChange(); next(); }, delay || 0); }

    /* --- карточка --- */
    function card(item) {
      var w = item.w, en = dir.v === "en", front = en ? w.w : w.kz, back = en ? w.kz : w.w;
      var c = h("div", { class: "en-card" }, counter(),
        h("p", { class: "en-card-f", lang: en ? "en" : "kk", text: front }),
        en ? E.sayButton(w.w) : null,
        h("div", { class: "en-card-b", hidden: true },
          h("p", { class: "en-card-t", lang: en ? "kk" : "en", text: back }),
          w.p ? h("p", { class: "en-p", text: "Оқылуы: " + w.p }) : null,
          w.ex ? h("p", { class: "en-s", lang: "en", text: w.ex }) : null,
          w.exkz ? h("p", { class: "en-s" }, h("small", { text: w.exkz })) : null));
      var flip = h("button", { type: "button", class: "btn", text: "Жауапты көрсету" });
      var no = h("button", { type: "button", class: "btn secondary en-no", text: "Білмедім", hidden: true }), hard = h("button", { type: "button", class: "btn secondary en-hard", text: "Қиын болды", hidden: true }), yes = h("button", { type: "button", class: "btn en-yes", text: "Білдім", hidden: true });
      var shown = false;
      function show() { if (shown) return; shown = true; c.querySelector(".en-card-b").hidden = false; flip.hidden = true; yes.hidden = no.hidden = hard.hidden = false; if (!en) TTS.say(w.w); yes.focus(); }
      function grade(g) { if (!shown) return; record(item, g); advance(0); }
      flip.addEventListener("click", show);
      no.addEventListener("click", function () { grade(0); }); hard.addEventListener("click", function () { grade(1); }); yes.addEventListener("click", function () { grade(2); });
      stage.replaceChildren(c, h("div", { class: "en-ex-ctrl" }, flip, no, hard, yes), h("p", { class: "en-keyhint", text: "Пернелер: Space - көрсету, 1 - білмедім, 2 - қиын, 3 - білдім" }));
      flip.focus();
      keys(function (e) { if (e.key === " " || e.key === "Enter") { if (e.target && e.target.tagName === "BUTTON") return; e.preventDefault(); show(); } else if (e.key === "1") grade(0); else if (e.key === "2") grade(1); else if (e.key === "3") grade(2); });
    }

    /* --- көп таңдау (және дыбыс бойынша тап) --- */
    function optionsQuiz(item, o2) {
      var w = item.w, byKz = !!o2.byKz;
      var opts = shuffle([w].concat(distractors(w, all, 3, byKz)));
      if (opts.length < 2) return stage.replaceChildren(h("div", { class: "en-empty", role: "status" }, h("p", { class: "en-empty-t", text: "Бұл режимге сөз аз" }), h("p", { text: "Көп таңдау үшін кемінде 2 сөз керек. Басқа деңгей таңдаңыз." })));
      var fb = h("p", { class: "en-ex-result", role: "status", "aria-live": "polite" }), locked = false;
      var group = h("div", { class: "en-quiz-opts", role: "group", "aria-label": "Жауап нұсқалары" });
      function pick(k) {
        if (locked) return; locked = true;
        var good = opts[k].id === w.id;
        group.querySelectorAll("button").forEach(function (b, n) { b.disabled = true; if (opts[n].id === w.id) b.classList.add("correct"); else if (n === k) b.classList.add("wrong"); });
        record(item, good ? 2 : 0);
        fb.className = "en-ex-result " + (good ? "ok" : "bad");
        fb.textContent = good ? "✓ Дұрыс!" : "Дұрыс жауап: " + w.w + " = " + shortKz(w.kz);
        var nb = h("button", { type: "button", class: "btn", text: "Келесі" }); nb.addEventListener("click", function () { advance(0); });
        fb.after(h("div", { class: "en-ex-ctrl" }, nb)); nb.focus();
        if (o.onChange) o.onChange();
      }
      opts.forEach(function (x, k) {
        var b = h("button", { type: "button", class: "btn secondary en-qopt", lang: byKz ? "kk" : "en" }, h("b", { class: "en-qk", "aria-hidden": "true", text: (k + 1) + "." }), h("span", { text: byKz ? shortKz(x.kz) : x.w }));
        b.addEventListener("click", function () { pick(k); }); group.append(b);
      });
      stage.replaceChildren(o2.prompt, group, fb);
      keys(function (e) { if (/^[1-4]$/.test(e.key) && +e.key <= opts.length) { e.preventDefault(); pick(+e.key - 1); } else if (e.key === "Enter") { var nb = stage.querySelector(".en-ex-ctrl .btn"); if (nb) { e.preventDefault(); nb.click(); } } });
    }
    function choice(item) {
      var w = item.w, en = dir.v === "en";
      optionsQuiz(item, { byKz: en, prompt: h("div", { class: "en-card" }, counter(), h("p", { class: "en-card-f", lang: en ? "en" : "kk", text: en ? w.w : w.kz }), en ? E.sayButton(w.w) : null, h("p", { class: "en-info", text: en ? "Қазақша мағынасын таңдаңыз:" : "Ағылшынша сөзді таңдаңыз:" })) });
    }
    function listen(item) {
      var w = item.w;
      var play = h("button", { type: "button", class: "btn en-play-big", "aria-label": "Сөзді тыңдау", text: "🔊 Тыңдау" }), slow = h("button", { type: "button", class: "btn secondary", "aria-label": "Баяу тыңдау", text: "🐢 Баяу" });
      play.addEventListener("click", function () { TTS.say(w.w, 1); }); slow.addEventListener("click", function () { TTS.say(w.w, 0.6); });
      optionsQuiz(item, { byKz: false, prompt: h("div", { class: "en-card" }, counter(), h("p", { class: "en-info", text: "Сөзді тыңдап, дұрыс жазылуын таңдаңыз:" }), h("div", { class: "en-ex-ctrl en-center" }, play, slow), h("p", { class: "en-p", text: "Мағынасы: " + shortKz(w.kz) + " (жауап бергенде ашылады)" })) });
      setTimeout(function () { if (stage.isConnected) TTS.say(w.w, 1); }, 200);
      var p = stage.querySelector(".en-card .en-p"); if (p) p.hidden = true;
      var nb = stage.querySelector(".en-quiz-opts"); if (nb) nb.addEventListener("click", function () { if (p) p.hidden = false; });
    }

    /* --- жазып тексеру --- */
    function spell(item) {
      var w = item.w, mask = maskExample(w), hinted = false, locked = false;
      var input = h("input", { type: "text", class: "en-blank wide en-spell-in", autocomplete: "off", autocapitalize: "none", spellcheck: "false", "aria-label": "Ағылшынша жазылуы" });
      var fb = h("p", { class: "en-ex-result", role: "status", "aria-live": "polite" });
      var chk = h("button", { type: "button", class: "btn", text: "Тексеру" }), hintB = h("button", { type: "button", class: "btn secondary", text: "💡 Бірінші әріп" });
      var ctrl = h("div", { class: "en-ex-ctrl" }, chk, hintB, TTS.ok ? E.sayButton(w.w) : null);
      function submit() {
        if (locked) return;
        var v = norm(input.value); if (!v) { fb.className = "en-ex-result bad"; fb.textContent = "Жауабыңызды жазыңыз."; input.focus(); return; }
        locked = true; var good = v === norm(w.w);
        input.disabled = true; input.classList.add(good ? "ok" : "bad");
        record(item, good ? (hinted ? 1 : 2) : 0);
        fb.className = "en-ex-result " + (good ? "ok" : "bad");
        fb.textContent = good ? "✓ Дұрыс!" + (hinted ? " (кеңеспен: қорап өзгермейді)" : "") : "Дұрыс жазылуы: " + w.w;
        var nb = h("button", { type: "button", class: "btn", text: "Келесі" }); nb.addEventListener("click", function () { advance(0); });
        ctrl.replaceChildren(nb); nb.focus();
        if (o.onChange) o.onChange();
      }
      chk.addEventListener("click", submit);
      hintB.addEventListener("click", function () { if (locked) return; hinted = true; fb.className = "en-ex-result"; fb.textContent = "Бірінші әріп: " + w.w[0] + " · әріп саны: " + w.w.length; input.focus(); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
      stage.replaceChildren(h("div", { class: "en-card" }, counter(), h("p", { class: "en-card-f", lang: "kk", text: w.kz }), w.p ? h("p", { class: "en-p", text: "Оқылуы: " + w.p }) : null, mask ? h("p", { class: "en-s", lang: "en", text: mask }) : null, h("p", { class: "en-info", text: "Ағылшынша жазыңыз:" }), input), ctrl, fb);
      input.focus({ preventScroll: true });
      keys(function (e) { if (e.key === "Enter") { var nb = ctrl.querySelector(".btn"); if (locked && nb) { e.preventDefault(); nb.click(); } } });
    }

    box.replaceChildren(head, stage);
    box._cleanup = cleanup;
    newSession();
  }

  E.trainer = { start: start, statsPanel: statsPanel, stats: S, buildQueue: buildQueue, dueCount: dueCount, modes: MODES };
})();
